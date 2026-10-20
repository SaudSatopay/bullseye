#!/usr/bin/env node
// Missile sense: one evidence pass for the guidance loop, in one command.
// Usage: node sense.mjs <baseUrl> <outDir> [route ...] [--widths 390,1440] [--schemes light,dark]
//                       [--keyboard] [--tabs 40] [--perf] [--wait 1200] [--idle] [--check]
// Routes are names without a leading slash ("home" means "/", "pricing" means "/pricing"), because Git Bash on
// Windows rewrites a bare "/" into a path. For every route x width x scheme it saves a full-page screenshot
// (<route>-<width>-<scheme>.png), the horizontal overflow in pixels and the console errors.
//   --keyboard  tabs through the first route at the widest width and records focus visibility and traps.
//   --perf      throttles the CPU 4x on the first route at 390 px and records LCP, CLS, long tasks and frame times.
//   --idle      waits for network idle instead of the load event (avoid on pages with streaming connections).
//   --check     only reports which Playwright module would be used, then exits (0 found, 1 missing).
// Playwright is resolved from the project first (playwright, @playwright/test, playwright-core), then from the
// PLAYWRIGHT_MODULE environment variable, then from global npm installs (including @playwright/cli's bundle).
// Writes <outDir>/sense.json (and keyboard.txt / perf.json when asked) and prints a Markdown summary.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';

const VALUE_FLAGS = new Set(['widths', 'schemes', 'wait', 'tabs', 'height']);
const argv = process.argv.slice(2);
const flags = {};
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const key = a.slice(2);
    if (VALUE_FLAGS.has(key) && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) { flags[key] = argv[++i]; }
    else flags[key] = true;
  } else positional.push(a);
}

const USAGE = 'usage: node sense.mjs <baseUrl> <outDir> [route ...] [--widths 390,1440] [--schemes light,dark] [--keyboard] [--tabs 40] [--perf] [--wait 1200] [--idle] [--check]';
if (flags.help) { console.log(USAGE); process.exit(0); }

async function loadPlaywright() {
  const candidates = [];
  const fromProject = createRequire(path.join(process.cwd(), 'noop.js'));
  for (const name of ['playwright', '@playwright/test', 'playwright-core']) {
    try { candidates.push({ where: 'project', path: fromProject.resolve(name) }); } catch { /* not installed here */ }
  }
  if (process.env.PLAYWRIGHT_MODULE) candidates.push({ where: 'PLAYWRIGHT_MODULE', path: process.env.PLAYWRIGHT_MODULE });
  if (!candidates.length) {
    let root = null;
    try { root = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'], timeout: 20000, windowsHide: true, shell: true }).toString().trim(); } catch { /* npm missing */ }
    if (root) {
      for (const rel of ['playwright', '@playwright/test', 'playwright-core', '@playwright/cli/node_modules/playwright', '@playwright/cli/node_modules/playwright-core']) {
        const dir = path.join(root, rel);
        if (fs.existsSync(path.join(dir, 'package.json'))) candidates.push({ where: 'global', path: dir });
      }
    }
  }
  for (const c of candidates) {
    try {
      const entry = createRequire(import.meta.url).resolve(c.path);
      const mod = await import(pathToFileURL(entry).href);
      const pw = mod.chromium ? mod : mod.default;
      if (pw?.chromium) return { pw, from: `${c.where}: ${c.path}` };
    } catch { /* try the next candidate */ }
  }
  return null;
}

const loaded = await loadPlaywright();
if (flags.check) {
  console.log(loaded ? `playwright: ${loaded.from}` : 'playwright: not found');
  process.exit(loaded ? 0 : 1);
}

const [baseUrl, outDirArg, ...routeArgs] = positional;
if (!baseUrl || !outDirArg) { console.error(USAGE); process.exit(2); }
if (!loaded) {
  console.error('Playwright not found. In the project run: npm i -D playwright (or pnpm add -D playwright), then npx playwright install chromium.');
  console.error('Fallback without Playwright: node shots.mjs <url> <outDir> home (screenshots only).');
  process.exit(1);
}

const norm = (r) => (/^[a-z]:[\\/]/i.test(r) || r === '' || r === 'home' || r === '/' ? '/' : r.startsWith('/') ? r : '/' + r);
const routes = (routeArgs.length ? routeArgs : ['home']).map(norm);
const slugOf = (route) => (route === '/' ? 'home' : route.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/-+$/, '') || 'home');
const widths = String(flags.widths || '390,1440').split(',').map((w) => Number(w.trim())).filter((w) => w > 0);
const schemes = String(flags.schemes || 'light,dark').split(',').map((s) => s.trim()).filter((s) => s === 'light' || s === 'dark');
const wait = Number(flags.wait || 1200);
const waitUntil = flags.idle ? 'networkidle' : 'load';
const outDir = path.resolve(outDirArg);
fs.mkdirSync(outDir, { recursive: true });
const relOut = (p) => path.relative(process.cwd(), p).split(path.sep).join('/');

// Launch: Playwright's own build first, then installed Chrome or Edge, then any Chromium in Playwright's cache.
function cachedChromiums() {
  const home = process.env.LOCALAPPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library', 'Caches') : path.join(process.env.HOME || '', '.cache'));
  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(home, 'ms-playwright');
  if (!fs.existsSync(cache)) return [];
  const rels = process.platform === 'win32' ? ['chrome-win64/chrome.exe', 'chrome-win/chrome.exe']
    : process.platform === 'darwin' ? ['chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']
    : ['chrome-linux/chrome', 'chrome-linux64/chrome'];
  return fs.readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))
    .flatMap((d) => rels.map((r) => path.join(cache, d, r))).filter((p) => fs.existsSync(p));
}
const attempts = [{ label: 'bundled' }, { label: 'chrome', channel: 'chrome' }, { label: 'msedge', channel: 'msedge' }, ...cachedChromiums().map((p) => ({ label: p, executablePath: p }))];
let browser;
let summaryBrowser = '';
let launchError = '';
for (const a of attempts) {
  try { const { label, ...opts } = a; browser = await loaded.pw.chromium.launch(opts); summaryBrowser = label; break; }
  catch (e) { launchError = String(e.message).split('\n')[0]; }
}
if (!browser) {
  console.error(`Could not launch a Chromium browser (${launchError}).`);
  console.error('Install the browser once: npx playwright install chromium');
  process.exit(1);
}

const captures = [];
for (const route of routes) {
  for (const width of widths) {
    for (const scheme of schemes) {
      const height = width <= 480 ? 844 : Number(flags.height || 900);
      const context = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, deviceScaleFactor: 1 });
      const page = await context.newPage();
      const consoleErrors = [];
      // A failed resource load names no URL in its text, so append the console location's URL.
      page.on('console', (m) => {
        if (m.type() !== 'error') return;
        const text = m.text();
        const at = m.location()?.url;
        consoleErrors.push((at && !text.includes(at) ? `${text} (${at})` : text).slice(0, 300));
      });
      page.on('pageerror', (e) => consoleErrors.push(`uncaught: ${String(e.message).slice(0, 280)}`));
      const url = new URL(route, baseUrl).toString();
      const record = { route, url, width, scheme, status: null, overflow: null, consoleErrors, screenshot: null, note: '' };
      try {
        const response = await page.goto(url, { waitUntil, timeout: 45000 });
        record.status = response ? response.status() : null;
        await page.waitForTimeout(wait);
        record.overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        const file = path.join(outDir, `${slugOf(route)}-${width}-${scheme}.png`);
        await page.screenshot({ path: file, fullPage: true });
        record.screenshot = relOut(file);
      } catch (e) {
        record.note = String(e.message).split('\n')[0];
        if (/ECONNREFUSED|ERR_CONNECTION/i.test(record.note)) record.note += ' (is the server running?)';
      }
      captures.push(record);
      await context.close();
    }
  }
}

let keyboard = null;
if (flags.keyboard) {
  const width = Math.max(...widths);
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  const steps = [];
  try {
    await page.goto(new URL(routes[0], baseUrl).toString(), { waitUntil, timeout: 45000 });
    await page.waitForTimeout(wait);
    const presses = Number(flags.tabs || 40);
    for (let i = 1; i <= presses; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body || el === document.documentElement) return null;
        const cs = getComputedStyle(el);
        const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
        const shadow = !!cs.boxShadow && cs.boxShadow !== 'none';
        const raw = el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('alt') || el.textContent || el.getAttribute('name') || '';
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute('role'),
          name: raw.trim().replace(/\s+/g, ' ').slice(0, 60),
          id: el.id || null,
          focusVisible: outline || shadow,
          onScreen: rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0,
        };
      });
      steps.push({ press: i, ...(info || { tag: 'body', name: '', focusVisible: false, onScreen: true }) });
    }
  } catch (e) { steps.push({ press: 0, tag: 'error', name: String(e.message).split('\n')[0], focusVisible: false, onScreen: false }); }
  await context.close();
  const key = (s) => `${s.tag}#${s.id || ''}:${s.name}`;
  let trap = false;
  for (let i = 3; i < steps.length; i++) if (key(steps[i]) === key(steps[i - 1]) && key(steps[i]) === key(steps[i - 2])) trap = true;
  const invisible = steps.filter((s) => s.tag !== 'body' && !s.focusVisible);
  const lines = steps.map((s) => `${String(s.press).padStart(3)}  ${s.tag.padEnd(8)} ${JSON.stringify(s.name).padEnd(40)} focus ring: ${s.focusVisible ? 'yes' : 'NO'}${s.onScreen ? '' : ' (off-screen)'}`);
  lines.push('', `presses: ${steps.length}, without visible focus: ${invisible.length}, possible trap: ${trap ? 'YES' : 'no'}`);
  const file = path.join(outDir, 'keyboard.txt');
  fs.writeFileSync(file, lines.join('\n') + '\n');
  keyboard = { file: relOut(file), presses: steps.length, invisibleFocus: invisible.length, possibleTrap: trap };
}

let perf = null;
if (flags.perf) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await context.addInitScript(() => {
    window.__sense = { longtasks: [], lcp: 0, cls: 0 };
    const observe = (type, fn) => { try { new PerformanceObserver((list) => list.getEntries().forEach(fn)).observe({ type, buffered: true }); } catch { /* unsupported */ } };
    observe('longtask', (e) => window.__sense.longtasks.push(Math.round(e.duration)));
    observe('largest-contentful-paint', (e) => { window.__sense.lcp = Math.round(e.startTime); });
    observe('layout-shift', (e) => { if (!e.hadRecentInput) window.__sense.cls += e.value; });
  });
  const page = await context.newPage();
  try {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.goto(new URL(routes[0], baseUrl).toString(), { waitUntil, timeout: 60000 });
    await page.waitForTimeout(Math.max(wait, 2000));
    const frames = await page.evaluate(() => new Promise((resolve) => {
      const gaps = [];
      let last = performance.now();
      const end = last + 2000;
      const tick = (t) => { gaps.push(t - last); last = t; if (t < end) requestAnimationFrame(tick); else resolve(gaps.slice(1)); };
      requestAnimationFrame(tick);
      window.scrollBy({ top: 600, behavior: 'smooth' });
    }));
    const s = await page.evaluate(() => window.__sense);
    const sorted = [...frames].sort((a, b) => a - b);
    const pick = (q) => (sorted.length ? Math.round(sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]) : null);
    perf = {
      cpuThrottle: 4,
      lcpMs: s.lcp || null,
      cls: Math.round(s.cls * 1000) / 1000,
      longTasks: s.longtasks.length,
      longestTaskMs: s.longtasks.length ? Math.max(...s.longtasks) : 0,
      frameMedianMs: pick(0.5),
      frameP95Ms: pick(0.95),
      frameMaxMs: sorted.length ? Math.round(sorted[sorted.length - 1]) : null,
      framesOver50Ms: frames.filter((f) => f > 50).length,
    };
    fs.writeFileSync(path.join(outDir, 'perf.json'), JSON.stringify(perf, null, 2));
  } catch (e) { perf = { error: String(e.message).split('\n')[0] }; }
  await context.close();
}

await browser.close();

const summary = { baseUrl, generated: new Date().toISOString(), playwright: loaded.from, browser: summaryBrowser, captures, keyboard, perf };
fs.writeFileSync(path.join(outDir, 'sense.json'), JSON.stringify(summary, null, 2));

const ok = captures.filter((c) => c.screenshot).length;
console.log(`## Sense · ${baseUrl} · ${ok} of ${captures.length} captures`);
console.log('| screen | width | scheme | status | overflow px | console errors | screenshot |');
console.log('|---|---|---|---|---|---|---|');
for (const c of captures) {
  console.log(`| ${c.route} | ${c.width} | ${c.scheme} | ${c.status ?? 'n/a'} | ${c.overflow ?? 'n/a'}${c.overflow > 0 ? ' OVERFLOW' : ''} | ${c.consoleErrors.length} | ${c.screenshot || 'FAILED: ' + c.note} |`);
}
const errs = captures.flatMap((c) => c.consoleErrors.map((e) => `${c.route} @${c.width}/${c.scheme}: ${e}`));
if (errs.length) { console.log('\nConsole errors:'); for (const e of [...new Set(errs)].slice(0, 20)) console.log(`- ${e}`); }
if (keyboard) console.log(`\nKeyboard: ${keyboard.presses} presses, ${keyboard.invisibleFocus} without a visible focus ring, possible trap: ${keyboard.possibleTrap ? 'YES' : 'no'} (${keyboard.file})`);
if (perf) console.log(perf.error ? `\nPerf: failed (${perf.error})` : `\nPerf (4x CPU, 390 px): LCP ${perf.lcpMs ?? 'n/a'} ms · CLS ${perf.cls} · long tasks ${perf.longTasks} (longest ${perf.longestTaskMs} ms) · frames median ${perf.frameMedianMs} ms, p95 ${perf.frameP95Ms} ms, max ${perf.frameMaxMs} ms, over 50 ms: ${perf.framesOver50Ms}`);
console.log(`\nSaved ${relOut(path.join(outDir, 'sense.json'))}`);
process.exit(ok ? 0 : 1);
