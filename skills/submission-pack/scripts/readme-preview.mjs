#!/usr/bin/env node
// readme-preview.mjs: shows a README exactly as GitHub renders it, in the light and the dark theme, with every
// Mermaid diagram drawn and every image counted, so a broken diagram or a missing image is caught before a judge
// opens the repository. Part of the submission-pack skill. Zero npm dependencies; the render comes from GitHub's
// own Markdown API through the GitHub CLI (gh), and Playwright is used only by --shoot.
//
// Usage
//   node readme-preview.mjs [README.md] [options]
//
//   README.md        the Markdown file (default: ./README.md); relative images resolve from its folder
//   --repo o/name    repository context for GitHub's renderer (default: read from the origin remote)
//   --html <file>    skip the renderer and wrap this GitHub-rendered HTML instead (works offline)
//   --out <dir>      where the two preview pages go (default: a folder in the system temp directory)
//   --shoot          screenshot both pages in 1000 px slices with Playwright, then print the Mermaid errors, broken
//                    images and sideways-scrolling blocks (exit 1 if any)
//   --width <px>     viewport width for --shoot (default 1280)
//   --help           this text
//
// --shoot finds Playwright in the project first ("playwright", then "@playwright/test"), then at the path in the
// PLAYWRIGHT_MODULE environment variable, then in the global npm folder (playwright, @playwright/test, or the copy
// bundled inside @playwright/cli). It launches Playwright's own Chromium, then an installed Chrome, then Edge.
//
// Without --shoot, open the two printed file:// pages in any browser (the Claude Code Browser pane, playwright-cli
// or a normal browser). A bar at the top of each page reports Mermaid errors and broken images.
// The pages load github-markdown-css 5.5.1 from cdnjs and Mermaid 11.4.1 from jsDelivr, so they need a network.
// Exit code: 0 when the pages are written (and, with --shoot, nothing is broken), 1 on a render problem, 2 on bad usage.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HELP = `readme-preview: show a README as GitHub renders it, light and dark, with Mermaid drawn.

Usage
  node readme-preview.mjs [README.md] [--repo owner/name] [--html body.html] [--out dir] [--shoot] [--width 1280]

  README.md        the Markdown file (default: ./README.md)
  --repo o/name    context for GitHub's renderer (default: the origin remote)
  --html <file>    wrap this GitHub-rendered HTML instead of calling the renderer (offline)
  --out <dir>      output folder (default: a temp folder)
  --shoot          screenshot both pages with Playwright and report problems (exit 1 if any)
  --width <px>     viewport width for --shoot (default 1280)

The renderer is: gh api markdown -F text=@README.md -f mode=gfm -f context=<owner/name>
--shoot finds Playwright in the project, then at PLAYWRIGHT_MODULE, then in the global npm folder, and launches
Playwright's Chromium, then an installed Chrome, then Edge.
`;

const CSS_VERSION = '5.5.1';
const MERMAID_VERSION = '11.4.1';

class UsageError extends Error {}

function parseArgs(argv) {
  const o = { file: null, repo: null, html: null, out: null, shoot: false, width: 1280, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => {
      if (i + 1 >= argv.length) throw new UsageError(`${a} needs a value`);
      return argv[++i];
    };
    if (a === '--help' || a === '-h') o.help = true;
    else if (a === '--repo') o.repo = value();
    else if (a === '--html') o.html = value();
    else if (a === '--out') o.out = value();
    else if (a === '--shoot') o.shoot = true;
    else if (a === '--width') {
      o.width = Number(value());
      if (!Number.isInteger(o.width) || o.width < 320) throw new UsageError('--width needs a whole number of at least 320');
    } else if (a.startsWith('-')) throw new UsageError(`unknown option ${a} (see --help)`);
    else if (o.file === null) o.file = a;
    else throw new UsageError(`unexpected argument ${a}`);
  }
  if (o.repo !== null && !/^[\w.-]+\/[\w.-]+$/.test(o.repo)) throw new UsageError('--repo must look like owner/name');
  o.file = o.file || 'README.md';
  return o;
}

/** owner/name from the origin remote of the repository that holds dir, or null. */
export function repoFromRemote(dir) {
  const r = spawnSync('git', ['remote', 'get-url', 'origin'], { cwd: dir, encoding: 'utf8', windowsHide: true });
  if (r.status !== 0) return null;
  const m = /github\.com[:/]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i.exec(r.stdout.trim());
  return m ? `${m[1]}/${m[2]}` : null;
}

function renderWithGitHub(file, repo) {
  const args = ['api', 'markdown', '-F', `text=@${file}`, '-f', 'mode=gfm'];
  if (repo) args.push('-f', `context=${repo}`);
  const r = spawnSync('gh', args, { encoding: 'utf8', maxBuffer: 1 << 26, windowsHide: true });
  if (r.error && r.error.code === 'ENOENT') {
    throw new Error('the GitHub CLI (gh) is not installed: get it from https://cli.github.com and run gh auth login, or pass --html with GitHub-rendered HTML');
  }
  if (r.status !== 0) {
    const why = (r.stderr || '').trim().split('\n').slice(-2).join(' ');
    throw new Error(`gh api markdown failed (${why || `exit ${r.status}`})${/auth|login|401/i.test(why) ? ': run gh auth login' : ''}`);
  }
  return r.stdout;
}

const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** One preview page: GitHub's HTML inside github-markdown-css, Mermaid drawn, a status bar on top. */
export function previewPage(body, theme, baseHref, title) {
  const dark = theme === 'dark';
  const css = `https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/${CSS_VERSION}/github-markdown-${dark ? 'dark' : 'light'}.min.css`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} (${theme})</title>
<base href="${escapeHtml(baseHref)}">
<link rel="stylesheet" href="${css}">
<style>
  body { background: ${dark ? '#0d1117' : '#ffffff'}; margin: 0; }
  #preview-bar { position: sticky; top: 0; z-index: 9; padding: 8px 16px; font: 13px/1.45 ui-monospace, Consolas, monospace; background: #fff8c5; color: #3b2300; border-bottom: 1px solid #d4a72c; }
  #preview-bar.ok { background: #dafbe1; color: #0f3d1e; border-color: #4ac26b; }
  #preview-bar.bad { background: #ffebe9; color: #4c0010; border-color: #ff8182; }
  .markdown-body { box-sizing: border-box; max-width: 1012px; margin: 24px auto; padding: 32px; border: 1px solid ${dark ? '#30363d' : '#d0d7de'}; border-radius: 6px; }
  .mermaid-out { display: flex; justify-content: center; margin: 16px 0; overflow-x: auto; }
  .mermaid-err { color: #cf222e; white-space: pre-wrap; font: 12px/1.45 ui-monospace, Consolas, monospace; }
</style>
</head>
<body>
<div id="preview-bar">README preview (${theme}): rendering...</div>
<article class="markdown-body">
${body}
</article>
<script src="https://cdn.jsdelivr.net/npm/mermaid@${MERMAID_VERSION}/dist/mermaid.min.js"></script>
<script>
(async function () {
  var report = { theme: '${theme}', mermaid: { rendered: 0, errors: [] }, images: { loaded: 0, broken: [] }, wide: [] };
  window.previewReport = report;
  var blocks = Array.prototype.slice.call(document.querySelectorAll('pre[lang="mermaid"], pre > code.language-mermaid'));
  if (blocks.length && !window.mermaid) report.mermaid.errors.push('mermaid.js did not load (no network?)');
  if (blocks.length && window.mermaid) {
    window.mermaid.initialize({ startOnLoad: false, theme: '${dark ? 'dark' : 'default'}', securityLevel: 'strict' });
    for (var i = 0; i < blocks.length; i++) {
      var pre = blocks[i].tagName === 'CODE' ? blocks[i].parentElement : blocks[i];
      var host = pre.closest('section[data-type="mermaid"]') || pre;
      var out = document.createElement('div');
      out.className = 'mermaid-out';
      host.parentNode.insertBefore(out, host.nextSibling);
      host.style.display = 'none';
      try {
        var result = await window.mermaid.render('mermaid-preview-' + i, pre.textContent);
        out.innerHTML = result.svg;
        report.mermaid.rendered++;
      } catch (e) {
        var message = String((e && e.message) || e);
        report.mermaid.errors.push('diagram ' + (i + 1) + ': ' + message.split('\\n')[0]);
        var err = document.createElement('div');
        err.className = 'mermaid-err';
        err.textContent = 'Mermaid error in diagram ' + (i + 1) + ': ' + message;
        out.appendChild(err);
      }
    }
  }
  var images = Array.prototype.slice.call(document.querySelectorAll('.markdown-body img'));
  images.forEach(function (img) { img.loading = 'eager'; });
  await Promise.all(images.map(function (img) {
    if (img.complete) return null;
    return new Promise(function (done) {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
      setTimeout(done, 15000);
    });
  }));
  images.forEach(function (img) {
    if (img.naturalWidth > 0) report.images.loaded++;
    else report.images.broken.push(img.getAttribute('data-canonical-src') || img.getAttribute('src'));
  });
  document.querySelectorAll('.markdown-body table, .markdown-body pre').forEach(function (el) {
    if (el.offsetParent !== null && el.scrollWidth > el.clientWidth + 1) report.wide.push(el.tagName.toLowerCase() + ': ' + (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 60));
  });
  var bad = report.mermaid.errors.length + report.images.broken.length;
  var bar = document.getElementById('preview-bar');
  bar.className = bad ? 'bad' : 'ok';
  bar.textContent = 'README preview (' + report.theme + '): Mermaid ' + report.mermaid.rendered + ' drawn, ' + report.mermaid.errors.length + ' errors; images ' + report.images.loaded + ' loaded, ' + report.images.broken.length + ' broken' + (report.images.broken.length ? ' (' + report.images.broken.join(', ') + ')' : '') + '; ' + report.wide.length + ' tables or code blocks scroll sideways';
  window.previewDone = true;
})();
</script>
</body>
</html>
`;
}

// The project first, then PLAYWRIGHT_MODULE, then a global npm install (including the copy bundled with
// @playwright/cli), so an agent that already has Playwright globally can shoot without a new dependency.
// The same order as the other BULLSEYE scripts that drive a browser; copied, never imported across skills.
function loadPlaywright() {
  const candidates = [];
  const fromProject = createRequire(path.join(process.cwd(), 'noop.js'));
  for (const name of ['playwright', '@playwright/test']) {
    try {
      candidates.push({ name, path: fromProject.resolve(name) });
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND') throw e;
    }
  }
  if (process.env.PLAYWRIGHT_MODULE) candidates.push({ name: `PLAYWRIGHT_MODULE ${process.env.PLAYWRIGHT_MODULE}`, path: process.env.PLAYWRIGHT_MODULE });
  if (!candidates.length) {
    let root = null;
    try {
      root = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'], timeout: 20000, windowsHide: true }).toString().trim();
    } catch {
      // npm is not on PATH
    }
    for (const sub of root ? ['playwright', '@playwright/test', '@playwright/cli/node_modules/playwright'] : []) {
      const dir = path.join(root, sub);
      if (fs.existsSync(path.join(dir, 'package.json'))) candidates.push({ name: `global ${sub}`, path: dir });
    }
  }
  const load = createRequire(import.meta.url);
  for (const c of candidates) {
    try {
      const mod = load(c.path);
      if (mod && mod.chromium) return { mod, name: c.name };
    } catch {
      // try the next candidate
    }
  }
  return null;
}

function installHint() {
  return [
    `Playwright was not found (looked in the project at ${process.cwd()}, PLAYWRIGHT_MODULE and the global npm folder).`,
    'Install it here, then run again:',
    '  npm i -D playwright && npx playwright install chromium',
    'With pnpm: pnpm add -D playwright && pnpm exec playwright install chromium',
    'Or skip --shoot and open the two preview pages in any browser.',
  ].join('\n');
}

const firstLine = (m) => (String(m || 'unknown error').split('\n').find((l) => l.trim()) || 'unknown error').trim().replace(/\.+$/, '');

// Playwright's own Chromium first, then an installed Chrome, then Edge.
async function launch(chromium) {
  let last;
  for (const channel of [null, 'chrome', 'msedge']) {
    try {
      const browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
      return { browser, label: channel ? `${channel} ${browser.version()}` : `chromium ${browser.version()}` };
    } catch (e) {
      last = e;
      const missing = /Executable doesn't exist|not found at|playwright install|is not installed|Failed to launch .*(chrome|msedge)/i.test(String(e.message));
      if (!missing) break;
      if (channel === null) process.stdout.write("Playwright's Chromium is missing here; trying an installed Chrome, then Edge\n");
    }
  }
  throw new Error(`no browser would start: ${firstLine(last && last.message)}`);
}

async function shoot(pages, outDir, width) {
  const pw = loadPlaywright();
  if (!pw) throw new Error(installHint());
  const { browser, label } = await launch(pw.mod.chromium);
  process.stdout.write(`shooting with ${label} (Playwright from ${pw.name})\n`);
  const results = [];
  try {
    for (const { theme, file } of pages) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, colorScheme: theme });
      await page.goto(pathToFileURL(file).href);
      await page.waitForFunction(() => window.previewDone === true, null, { timeout: 60000 });
      const report = await page.evaluate(() => window.previewReport);
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      const slices = [];
      for (let y = 0, i = 0; y < height; y += 1000, i++) {
        const out = path.join(outDir, `${theme}-${width}-${String(i).padStart(2, '0')}.png`);
        await page.screenshot({ path: out, fullPage: true, clip: { x: 0, y, width, height: Math.min(1000, height - y) } });
        slices.push(out);
      }
      results.push({ ...report, height, slices });
      await page.close();
    }
  } finally {
    await browser.close();
  }
  return results;
}

async function main(argv) {
  const o = parseArgs(argv);
  if (o.help) {
    process.stdout.write(HELP);
    return 0;
  }
  const file = path.resolve(o.file);
  if (!fs.existsSync(file)) throw new UsageError(`no Markdown file at ${o.file}`);
  const dir = path.dirname(file);
  let body;
  let source;
  if (o.html) {
    if (!fs.existsSync(o.html)) throw new UsageError(`no HTML file at ${o.html}`);
    body = fs.readFileSync(o.html, 'utf8');
    source = `the HTML in ${o.html}`;
  } else {
    const repo = o.repo || repoFromRemote(dir);
    body = renderWithGitHub(file, repo);
    source = `GitHub's renderer${repo ? ` (context ${repo})` : ''}`;
  }
  const outDir = path.resolve(o.out || path.join(os.tmpdir(), `readme-preview-${path.basename(dir).replace(/[^\w.-]+/g, '-')}`));
  fs.mkdirSync(outDir, { recursive: true });
  const baseHref = pathToFileURL(dir + path.sep).href;
  const pages = ['light', 'dark'].map((theme) => {
    const out = path.join(outDir, `readme-preview-${theme}.html`);
    fs.writeFileSync(out, previewPage(body, theme, baseHref, path.basename(file)));
    return { theme, file: out };
  });
  process.stdout.write(`rendered ${path.basename(file)} with ${source}\n`);
  for (const p of pages) process.stdout.write(`${p.theme}: ${pathToFileURL(p.file).href}\n`);
  if (!o.shoot) {
    process.stdout.write('open both pages; the bar at the top lists Mermaid errors and broken images (or rerun with --shoot)\n');
    return 0;
  }
  const results = await shoot(pages, outDir, o.width);
  let problems = 0;
  for (const r of results) {
    problems += r.mermaid.errors.length + r.images.broken.length;
    process.stdout.write(`\n${r.theme}: ${r.slices.length} slices of ${o.width} px (page ${r.height} px tall) in ${outDir}\n`);
    process.stdout.write(`  mermaid: ${r.mermaid.rendered} drawn, ${r.mermaid.errors.length} errors\n`);
    for (const e of r.mermaid.errors) process.stdout.write(`    ERROR ${e}\n`);
    process.stdout.write(`  images: ${r.images.loaded} loaded, ${r.images.broken.length} broken\n`);
    for (const b of r.images.broken) process.stdout.write(`    ERROR broken image ${b}\n`);
    for (const w of r.wide) process.stdout.write(`  scrolls sideways: ${w}\n`);
  }
  process.stdout.write(`\nreadme-preview: ${problems ? `${problems} problems` : 'no Mermaid errors, no broken images'}; look at every slice in both themes before you submit\n`);
  return problems ? 1 : 0;
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : '';
const self = fileURLToPath(import.meta.url);
if (invoked && (process.platform === 'win32' ? invoked.toLowerCase() === self.toLowerCase() : invoked === self)) {
  main(process.argv.slice(2)).then(
    (code) => { process.exitCode = code; },
    (e) => {
      process.stderr.write(`readme-preview: ${e && e.message ? e.message : e}\n`);
      process.exitCode = e instanceof UsageError ? 2 : 1;
    },
  );
}
