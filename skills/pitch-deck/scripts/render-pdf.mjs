#!/usr/bin/env node
// render-pdf.mjs · HTML to PDF with headless Chrome, Edge or Chromium, with the print gotchas baked in.
//
// Usage:
//   node render-pdf.mjs <input.html> [--out <file.pdf>] [--budget <ms>] [--browser <path>]
//                       [--expect-pages <n>] [--facts <facts.json>] [--qa] [--strict] [--timeout <ms>]
//   node render-pdf.mjs --which        print the browser this script would use and exit (1 if none)
//   node render-pdf.mjs --help
//
// Why each step exists (every one is a failure a real deck hit):
//   - a full file:/// URL is passed (a bare filename skips web fonts; spaces must be %20)
//   - Chrome prints into a fresh, space-free temp folder and the PDF is then copied to --out
//     (Chrome refused to write to a second drive and mangled output paths that contain spaces)
//   - a fresh --user-data-dir per run (an open Chrome window otherwise swallows the job)
//   - --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=<ms> (fonts settle)
//   - the script waits for the browser to exit, checks the PDF is real, counts its pages and compares
//     them with the number of .page elements in the HTML (an extra page means a page spilled)
//   - {{placeholders}} left in the HTML are listed; --strict makes them a failure (final render)
//   - --facts replaces {{fact:path.to.value}} tokens from a JSON file, so numbers come from data
//   - --qa opens the file with ?qa=1 so the starter's in-page probe outlines clipped or colliding
//     elements in red and stamps a list on the page (look at the PNGs from qa-pdf.py)
//
// Browser search order: --browser, env CHROME_PATH, installed Chrome / Edge / Chromium, browsers on
// PATH (google-chrome, chromium, chromium-browser, microsoft-edge), then Playwright's Chromium cache.
// Exit codes: 0 ok · 1 render or check failed · 2 bad usage.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const HELP = `render-pdf.mjs · HTML to PDF with headless Chrome / Edge / Chromium

  node render-pdf.mjs <input.html> [options]

  --out <file.pdf>       output path (default: next to the input, same name, .pdf)
  --budget <ms>          --virtual-time-budget for fonts and images (default 25000)
  --browser <path>       browser executable (default: auto-detect; env CHROME_PATH also works)
  --expect-pages <n>     fail unless the PDF has exactly n pages
  --facts <json>         replace {{fact:a.b.c}} tokens with values from this JSON before printing
  --qa                   open with ?qa=1 so the in-page probe flags clipped / colliding elements
  --strict               fail when {{placeholders}} are left in the HTML (use for the final render)
  --timeout <ms>         kill the browser after this long (default: budget + 90000)
  --which                print the browser that would be used, then exit
  --help                 this text

Next steps after a render: finalize-pdf.py (subset fonts, size gate), then qa-pdf.py (look at pages).`;

// ---------------------------------------------------------------- arguments
function parseArgs(argv) {
  const opts = { budget: 25000, strict: false, qa: false, which: false };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) usage(`missing value for ${a}`);
      return v;
    };
    switch (a) {
      case '--help': case '-h': console.log(HELP); process.exit(0); break;
      case '--out': case '-o': opts.out = val(); break;
      case '--budget': opts.budget = int(val(), a); break;
      case '--browser': opts.browser = val(); break;
      case '--expect-pages': opts.expectPages = int(val(), a); break;
      case '--facts': opts.facts = val(); break;
      case '--timeout': opts.timeout = int(val(), a); break;
      case '--qa': opts.qa = true; break;
      case '--strict': opts.strict = true; break;
      case '--which': opts.which = true; break;
      default:
        if (a.startsWith('--')) usage(`unknown option ${a}`);
        rest.push(a);
    }
  }
  if (rest.length > 1) usage(`one input file expected, got ${rest.length}: ${rest.join(', ')}`);
  opts.input = rest[0];
  return opts;
}
function int(v, flag) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) usage(`${flag} needs a whole number, got "${v}"`);
  return n;
}
function usage(msg) {
  console.error(`render-pdf: ${msg}\nRun with --help for usage.`);
  process.exit(2);
}
function fail(msg, hint) {
  console.error(`render-pdf: FAILED · ${msg}`);
  if (hint) console.error(`render-pdf: hint · ${hint}`);
  process.exit(1);
}

// ---------------------------------------------------------------- browser discovery
function isFile(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}
function onPath(name) {
  const exts = process.platform === 'win32' ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';') : [''];
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      const full = path.join(dir.replace(/^"|"$/g, ''), name + ext.toLowerCase());
      if (isFile(full)) return full;
      const upper = path.join(dir.replace(/^"|"$/g, ''), name + ext);
      if (isFile(upper)) return upper;
    }
  }
  return null;
}
function playwrightRoots() {
  const roots = [];
  const env = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (env && env !== '0') roots.push(env);
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) roots.push(path.join(process.env.LOCALAPPDATA, 'ms-playwright'));
  else if (process.platform === 'darwin') roots.push(path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright'));
  else roots.push(path.join(os.homedir(), '.cache', 'ms-playwright'));
  return roots;
}
function playwrightChromes() {
  const rel = {
    win32: ['chrome-win64/chrome.exe', 'chrome-win/chrome.exe'],
    darwin: [
      'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
      'chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
      'chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
      'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
    ],
  }[process.platform] || ['chrome-linux64/chrome', 'chrome-linux/chrome'];
  const found = [];
  for (const root of playwrightRoots()) {
    let dirs = [];
    try { dirs = fs.readdirSync(root).filter((d) => /^chromium-\d+$/.test(d)); } catch { continue; }
    dirs.sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));   // newest first
    for (const d of dirs) for (const r of rel) found.push(path.join(root, d, ...r.split('/')));
  }
  return found;
}
function candidates() {
  const list = [];
  const add = (p, label) => { if (p) list.push({ path: p, label }); };
  if (process.env.CHROME_PATH) add(process.env.CHROME_PATH, 'CHROME_PATH');
  const e = process.env;
  if (process.platform === 'win32') {
    const roots = [...new Set([e.PROGRAMFILES, e['PROGRAMFILES(X86)'], e.ProgramW6432, e.LOCALAPPDATA].filter(Boolean))];
    for (const r of roots) add(path.join(r, 'Google', 'Chrome', 'Application', 'chrome.exe'), 'Chrome');
    for (const r of roots) add(path.join(r, 'Microsoft', 'Edge', 'Application', 'msedge.exe'), 'Edge');
    for (const r of roots) add(path.join(r, 'Chromium', 'Application', 'chrome.exe'), 'Chromium');
  } else if (process.platform === 'darwin') {
    for (const base of ['/Applications', path.join(os.homedir(), 'Applications')]) {
      add(path.join(base, 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome'), 'Chrome');
      add(path.join(base, 'Chromium.app', 'Contents', 'MacOS', 'Chromium'), 'Chromium');
      add(path.join(base, 'Microsoft Edge.app', 'Contents', 'MacOS', 'Microsoft Edge'), 'Edge');
    }
  }
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge', 'microsoft-edge-stable']) {
    add(onPath(name), name);
  }
  if (process.platform === 'linux') add('/snap/bin/chromium', 'chromium (snap)');
  for (const p of playwrightChromes()) add(p, 'Playwright Chromium');
  return list;
}
function findBrowser(explicit) {
  if (explicit) {
    if (!isFile(explicit)) fail(`--browser ${explicit} does not exist`);
    return { path: path.resolve(explicit), label: '--browser' };
  }
  for (const c of candidates()) {
    if (isFile(c.path)) return c;
    if (c.label === 'CHROME_PATH') console.error(`render-pdf: warn · CHROME_PATH=${c.path} does not exist, searching on`);
  }
  return null;
}

// ---------------------------------------------------------------- HTML checks
function stripNonVisible(html) {
  // CSS stays in: footer text can live in custom properties (--event: "...") and must be swept too
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
}
function countPageElements(html) {
  let n = 0;
  const re = /<([a-z][\w-]*)\b([^>]*)>/gi;
  let m;
  while ((m = re.exec(html))) {
    if (/^(html|body|head)$/i.test(m[1])) continue;
    const cls = m[2].match(/\bclass\s*=\s*("([^"]*)"|'([^']*)')/i);
    if (!cls) continue;
    const names = (cls[2] ?? cls[3] ?? '').split(/\s+/);
    if (names.includes('page')) n++;
  }
  return n;
}
function placeholders(html) {
  const found = new Set();
  for (const m of stripNonVisible(html).matchAll(/\{\{[^{}\n]{1,80}\}\}/g)) found.add(m[0]);
  return [...found];
}
function lookup(obj, dotted) {
  let cur = obj;
  for (const key of dotted.split('.')) {
    if (cur === null || typeof cur !== 'object' || !(key in cur)) return undefined;
    cur = cur[key];
  }
  return cur;
}
function applyFacts(html, factsPath) {
  let facts;
  try { facts = JSON.parse(fs.readFileSync(factsPath, 'utf8')); } catch (e) { fail(`cannot read --facts ${factsPath}: ${e.message}`); }
  const missing = new Set();
  let replaced = 0;
  const out = html.replace(/\{\{\s*fact:([\w.-]+)\s*\}\}/g, (tok, key) => {
    const v = lookup(facts, key);
    if (v === undefined || v === null || typeof v === 'object') { missing.add(key); return tok; }
    replaced++;
    return String(v);
  });
  if (missing.size) fail(`--facts: no scalar value for ${[...missing].join(', ')} in ${factsPath}`, 'every {{fact:key}} must exist in the facts file; fix the key or the file, never type the number by hand');
  return { html: out, replaced };
}

// ---------------------------------------------------------------- temp folder without spaces
function spaceFreeTemp() {
  const tries = [os.tmpdir(), process.env.TEMP, process.env.TMP];
  if (process.platform === 'win32') tries.push(path.join(process.env.SystemDrive || 'C:', '\\', 'Temp'), process.env.PUBLIC);
  else tries.push('/tmp');
  for (const t of tries) {
    if (!t || /\s/.test(t)) continue;
    try { fs.mkdirSync(t, { recursive: true }); fs.accessSync(t, fs.constants.W_OK); return t; } catch { /* next */ }
  }
  console.error('render-pdf: warn · no space-free temp folder found; set TEMP to one if Chrome fails to write the PDF');
  return os.tmpdir();
}

function pdfPageCount(buf) {
  return (buf.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g) || []).length;
}
function killTree(pid) {
  if (!pid) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
  else { try { process.kill(-pid, 'SIGKILL'); } catch { try { process.kill(pid, 'SIGKILL'); } catch { /* gone */ } } }
}

// ---------------------------------------------------------------- main
const opts = parseArgs(process.argv.slice(2));
const browser = findBrowser(opts.browser);
if (opts.which) {
  if (!browser) { console.error('render-pdf: no Chrome, Edge or Chromium found'); process.exit(1); }
  console.log(`${browser.label}\t${browser.path}`);
  process.exit(0);
}
if (!opts.input) usage('no input file');
const input = path.resolve(opts.input);
if (!isFile(input)) fail(`input not found: ${input}`);
if (!/\.html?$/i.test(input)) console.error(`render-pdf: warn · ${path.basename(input)} does not end in .html`);
if (!browser) {
  fail('no Chrome, Edge or Chromium found',
    'install Google Chrome or Microsoft Edge, set CHROME_PATH to the executable, or run `npx playwright install chromium`');
}
const out = path.resolve(opts.out || input.replace(/\.html?$/i, '') + '.pdf');
if (path.resolve(out) === input) usage('--out must not be the input file');

const sourceHtml = fs.readFileSync(input, 'utf8');
const pageElements = countPageElements(stripNonVisible(sourceHtml));
const tmpRoot = spaceFreeTemp();
const work = fs.mkdtempSync(path.join(tmpRoot, 'bullseye-pdf-'));
const cleanup = () => { try { fs.rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* best effort */ } };

let renderFile = input;
let html = sourceHtml;
if (opts.facts) {
  const r = applyFacts(sourceHtml, path.resolve(opts.facts));
  html = r.html;
  // the filled copy lives in the temp folder; <base> keeps relative assets pointing at the source folder
  const baseHref = pathToFileURL(path.dirname(input) + path.sep).href;
  const withBase = /<head[^>]*>/i.test(html)
    ? html.replace(/<head[^>]*>/i, (h) => `${h}\n<base href="${baseHref}">`)
    : `<base href="${baseHref}">\n${html}`;
  renderFile = path.join(work, 'filled.html');
  fs.writeFileSync(renderFile, withBase, 'utf8');
  console.log(`render-pdf · facts:   ${r.replaced} {{fact:...}} token(s) filled from ${path.resolve(opts.facts)}`);
}
const left = placeholders(html);   // after --facts every {{fact:...}} is gone, so what is left is real
if (left.length) {
  const shown = left.slice(0, 12).join('  ');
  const msg = `${left.length} placeholder(s) left in the HTML: ${shown}${left.length > 12 ? '  ...' : ''}`;
  if (opts.strict) { cleanup(); fail(msg, 'replace every {{...}} before the final render (or drop --strict while drafting)'); }
  console.error(`render-pdf: warn · ${msg}`);
}

let url = pathToFileURL(renderFile).href;
if (opts.qa) url += '?qa=1';
const outTmp = path.join(work, 'out.pdf');
const args = [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--hide-scrollbars',
  '--mute-audio',
  '--no-pdf-header-footer',
  '--print-to-pdf-no-header',
  '--run-all-compositor-stages-before-draw',
  `--virtual-time-budget=${opts.budget}`,
  `--user-data-dir=${path.join(work, 'profile')}`,
  `--print-to-pdf=${outTmp}`,
];
if (process.platform === 'linux' && typeof process.getuid === 'function' && process.getuid() === 0) args.push('--no-sandbox');
args.push(url);

console.log(`render-pdf · browser: ${browser.label} (${browser.path})`);
console.log(`render-pdf · input:   ${input}${opts.qa ? '  [qa probe on]' : ''}`);
const timeout = opts.timeout || opts.budget + 90000;
const t0 = Date.now();
const res = spawnSync(browser.path, args, { encoding: 'utf8', timeout, windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
const secs = ((Date.now() - t0) / 1000).toFixed(1);
const stderrTail = (res.stderr || '').trim().split(/\r?\n/).slice(-6).join('\n    ');
if (res.error) {
  if (res.error.code === 'ETIMEDOUT') { killTree(res.pid); cleanup(); fail(`browser still running after ${timeout} ms, killed`, 'raise --timeout, lower --budget, or look for a page that never stops loading (a remote font or image that hangs)'); }
  cleanup();
  fail(`could not start ${browser.path}: ${res.error.message}`);
}
let buf = null;
try { buf = fs.readFileSync(outTmp); } catch { /* handled below */ }
if (!buf || buf.length === 0 || buf.subarray(0, 5).toString('latin1') !== '%PDF-') {
  cleanup();
  fail(`the browser exited (code ${res.status}) without writing a PDF${stderrTail ? `\n    ${stderrTail}` : ''}`,
    'close stray headless browser processes, check the input opens in a normal browser window, try --browser with Edge or Chromium');
}
fs.mkdirSync(path.dirname(out), { recursive: true });
try { fs.copyFileSync(outTmp, out); } catch (e) { cleanup(); fail(`could not copy the PDF to ${out}: ${e.message}`, 'is the PDF open in a viewer that locks it?'); }
cleanup();

const pages = pdfPageCount(buf);
console.log(`render-pdf · wrote:   ${out} · ${pages} page(s) · ${Math.round(buf.length / 1024).toLocaleString('en-US')} KB · ${secs} s`);
let problems = 0;
if (pageElements > 0 && pages > pageElements) {
  console.error(`render-pdf: warn · the PDF has ${pages} pages but the HTML has ${pageElements} .page elements: a page spilled onto an extra sheet (content taller than the page box, or a height that rounds up; use 296mm for A4)`);
}
if (pageElements > 0 && pages < pageElements) {
  console.error(`render-pdf: warn · the PDF has ${pages} pages but the HTML has ${pageElements} .page elements (hidden pages, or a missing page-break-after)`);
}
if (opts.expectPages !== undefined && pages !== opts.expectPages) {
  console.error(`render-pdf: FAILED · expected ${opts.expectPages} page(s), got ${pages}`);
  problems++;
}
if (!problems) console.log(`render-pdf · next:    python finalize-pdf.py "${out}" --max-mb <limit>   then   python qa-pdf.py "${out}"`);
process.exit(problems ? 1 : 0);
