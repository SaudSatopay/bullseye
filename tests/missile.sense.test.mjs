import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(root, 'skills', 'missile', 'scripts', 'sense.mjs');

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,">
<style>body{margin:0;padding:16px;font-family:system-ui}.wide{width:640px;height:30px;background:#ccd}</style></head>
<body><a href="#one">One</a> <a href="#two">Two</a><div class="wide"></div><script>console.error('planted error')</script></body></html>`;

test('sense captures overflow, console errors and a keyboard walk', async (t) => {
  const check = spawnSync(process.execPath, [script, '--check'], { encoding: 'utf8', timeout: 60000 });
  if (check.status !== 0) { t.skip('Playwright is not resolvable on this machine'); return; }

  const server = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(PAGE); });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'sense-'));
  try {
    const run = await new Promise((resolve) => {
      import('node:child_process').then(({ spawn }) => {
        const child = spawn(process.execPath, [script, `http://127.0.0.1:${port}`, out, 'home', '--widths', '390,1440', '--schemes', 'light', '--keyboard', '--tabs', '3', '--wait', '200'], { stdio: ['ignore', 'pipe', 'pipe'] });
        let stdout = ''; let stderr = '';
        child.stdout.on('data', (d) => { stdout += d; });
        child.stderr.on('data', (d) => { stderr += d; });
        child.on('close', (status) => resolve({ status, stdout, stderr }));
      });
    });
    if (run.status !== 0 && /Could not launch/.test(run.stderr)) { t.skip('No Chromium browser available'); return; }
    assert.equal(run.status, 0, run.stderr);
    const summary = JSON.parse(fs.readFileSync(path.join(out, 'sense.json'), 'utf8'));
    const mobile = summary.captures.find((c) => c.width === 390);
    const desktop = summary.captures.find((c) => c.width === 1440);
    assert.ok(mobile.overflow > 0, 'a 640 px block must overflow a 390 px viewport');
    assert.equal(desktop.overflow, 0);
    assert.ok(mobile.consoleErrors.some((e) => e.includes('planted error')));
    assert.ok(fs.existsSync(path.join(out, 'home-390-light.png')));
    assert.ok(fs.existsSync(path.join(out, 'keyboard.txt')));
    assert.equal(summary.keyboard.presses, 3);
  } finally {
    server.close();
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test('sense explains usage when arguments are missing', () => {
  const run = spawnSync(process.execPath, [script], { encoding: 'utf8', timeout: 60000 });
  assert.notEqual(run.status, 0);
});
