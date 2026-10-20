#!/usr/bin/env node
// Missile fallback screenshot sensor: full-page captures at 390 and 1440 for each route.
// Usage: node shots.mjs <baseUrl> <outDir> [route ...] [--install]
// Routes are names without a leading slash ("home" or "" means "/"; "pricing" means "/pricing"), because
// Git Bash on Windows rewrites a bare "/" argument into a Windows path. A leading slash still works elsewhere.
// Uses `npx playwright screenshot`. If Chromium is missing, run once with --install (downloads it).

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const [, , baseUrl, outDirArg, ...rest] = process.argv;
if (!baseUrl || !outDirArg) { console.error('usage: node shots.mjs <baseUrl> <outDir> [route ...] [--install]'); process.exit(2); }
const isWin = process.platform === 'win32';
const install = rest.includes('--install');
const norm = (r) => (/^[a-z]:[\\/]/i.test(r) || r === '' || r === 'home' || r === '/' ? '/' : r.startsWith('/') ? r : '/' + r);
const routeArgs = rest.filter((a) => !a.startsWith('--')).map(norm);
const routes = routeArgs.length ? routeArgs : ['/'];
const outDir = path.resolve(outDirArg);
fs.mkdirSync(outDir, { recursive: true });
const viewports = [[390, 844], [1440, 900]];
const results = [];
let failed = 0;

if (install) {
  console.log('installing Chromium for Playwright (one-time download)...');
  const i = isWin ? spawnSync('npx -y playwright install chromium', { shell: true, stdio: 'inherit', timeout: 600000 }) : spawnSync('npx', ['-y', 'playwright', 'install', 'chromium'], { stdio: 'inherit', timeout: 600000 });
  if (i.status !== 0) { console.log('Chromium install failed; see output above'); process.exit(1); }
}

for (const route of routes) {
  const url = new URL(route, baseUrl).toString();
  const slug = route === '/' ? 'home' : route.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/-+$/, '') || 'home';
  for (const [w, h] of viewports) {
    const file = path.join(outDir, `${slug}-${w}.png`);
    const args = ['-y', 'playwright', 'screenshot', `--viewport-size=${w},${h}`, '--full-page', '--wait-for-timeout=1500', url, file];
    const q = (s) => (/\s/.test(s) ? `"${s}"` : s);
    const opts = { stdio: ['ignore', 'pipe', 'pipe'], timeout: 90000 };
    const r = isWin ? spawnSync(['npx', ...args].map(q).join(' '), { ...opts, shell: true }) : spawnSync('npx', args, opts);
    if (r.status === 0 && fs.existsSync(file)) { results.push(file); console.log(`captured ${path.relative(process.cwd(), file)}`); }
    else {
      failed++;
      const err = (r.stderr?.toString() || '') + '\n' + (r.stdout?.toString() || '');
      const tail = err.trim().split('\n').filter((l) => /\S/.test(l) && !/^[║╔╚═╗╝\s]+$/.test(l)).slice(-2).join(' ');
      console.log(`FAILED ${url} at ${w}px: ${tail}`);
      if (/Executable doesn't exist|browserType\.launch|playwright install|just installed or updated/i.test(err)) console.log('hint: Chromium is missing. Run this script once with --install, then retry.');
      if (/ECONNREFUSED|net::ERR_CONNECTION/i.test(err)) console.log('hint: the dev server is not reachable at that URL. Start it first.');
    }
  }
}
console.log(`\n${results.length} screenshots in ${outDir}${failed ? `, ${failed} failed` : ''}`);
process.exit(failed && !results.length ? 1 : 0);
