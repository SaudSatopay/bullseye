// Tests for skills/build-sprint/assets/run-demo.sh and run-demo.bat. Each launcher is copied into a throwaway
// project with a tiny Node app and must: start it in demo mode, wait for health, print the deep links and stop it
// (--check); fail clearly when health never answers; replace a stale node server on its port; and refuse to kill a
// program that is not an old demo. No network: everything listens on 127.0.0.1.
// run-demo.sh needs bash (Git Bash on Windows); run-demo.bat runs on Windows only. Missing tools skip with a reason.
// Run: node --test tests/build-sprint.run-demo.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ASSETS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'skills', 'build-sprint', 'assets');
const WIN = process.platform === 'win32';

const SERVER_JS = `const http = require('node:http');
const port = Number(process.env.PORT || 3000);
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/api/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, mode: process.env.DEMO === '0' ? 'live' : 'demo' }));
  }
  if (u.pathname === '/') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end('<p>fixture</p>'); }
  res.writeHead(404); res.end();
}).listen(port, '127.0.0.1', () => console.log('fixture listening on ' + port + ' (DEMO=' + process.env.DEMO + ')'));
`;

function makeProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'run-demo-'));
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'fixture', private: true, scripts: { start: 'node server.js' } }));
  fs.writeFileSync(path.join(dir, 'server.js'), SERVER_JS);
  fs.mkdirSync(path.join(dir, 'node_modules')); // present, so the launcher skips the install
  for (const f of ['run-demo.sh', 'run-demo.bat']) fs.copyFileSync(path.join(ASSETS, f), path.join(dir, f));
  return dir;
}

const freePort = () => new Promise((resolve) => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
});
const listening = (port) => new Promise((resolve) => {
  const c = net.connect(port, '127.0.0.1');
  c.on('connect', () => { c.destroy(); resolve(true); });
  c.on('error', () => resolve(false));
});
async function waitFor(fn, ms = 15000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await fn()) return true; await new Promise((r) => setTimeout(r, 150)); }
  return false;
}

function findBash() {
  const candidates = WIN ? ['C:\\Program Files\\Git\\bin\\bash.exe', 'C:\\Program Files (x86)\\Git\\bin\\bash.exe'] : ['bash'];
  for (const c of candidates) {
    const r = spawnSync(c, ['-c', 'uname -s'], { encoding: 'utf8' });
    if (r.status === 0 && (!WIN || /MINGW|MSYS|CYGWIN/.test(r.stdout))) return c; // never WSL's bash on Windows
  }
  return null;
}
const BASH = findBash();
const posix = (p) => p.split(path.sep).join('/');
const has = (cmd) => spawnSync(WIN ? 'where' : 'sh', WIN ? [cmd] : ['-c', `command -v ${cmd}`], { stdio: 'ignore' }).status === 0;

function runLauncher(kind, dir, env) {
  const opts = { cwd: dir, encoding: 'utf8', timeout: 120000, env: { ...process.env, RUN_DEMO_NO_BROWSER: '1', ...env } };
  return kind === 'sh'
    ? spawnSync(BASH, [posix(path.join(dir, 'run-demo.sh')), '--check'], opts)
    : spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/c', path.join(dir, 'run-demo.bat'), '--check'], opts); // full path: cmd may skip the current directory
}

// A listener that is not node or python, so the launchers must refuse to kill it.
function foreignListener(port) {
  if (WIN) {
    const ps = `$l=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse('127.0.0.1'),${port}); $l.Start(); Start-Sleep -Seconds 120`;
    return spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps], { stdio: 'ignore' });
  }
  const pl = `use IO::Socket::INET; my $s = IO::Socket::INET->new(LocalAddr => "127.0.0.1", LocalPort => ${port}, Listen => 5, ReuseAddr => 1) or die; sleep 120;`;
  return spawn('perl', ['-e', pl], { stdio: 'ignore' });
}
const canHoldForeign = WIN || (has('perl') && (has('lsof') || has('fuser')));

test('run-demo.bat keeps CRLF line endings and plain ASCII', () => {
  const buf = fs.readFileSync(path.join(ASSETS, 'run-demo.bat'));
  const text = buf.toString('latin1');
  assert.equal((text.match(/\r\n/g) || []).length, (text.match(/\n/g) || []).length, 'every line ends in CRLF: cmd.exe misreads labels in LF files');
  assert.ok([...buf].every((b) => b === 9 || b === 10 || b === 13 || (b >= 32 && b < 127)), 'ASCII only, so any code page prints it');
});

test('run-demo.sh keeps LF line endings and plain ASCII', () => {
  const buf = fs.readFileSync(path.join(ASSETS, 'run-demo.sh'));
  assert.ok(!buf.includes(13), 'no CR characters');
  assert.ok([...buf].every((b) => b === 9 || b === 10 || (b >= 32 && b < 127)), 'ASCII only');
  assert.ok(buf.toString('utf8').startsWith('#!/usr/bin/env bash\n'));
});

test('run-demo.sh passes a bash syntax check', { skip: !BASH && 'bash (Git Bash on Windows) is not available' }, () => {
  const r = spawnSync(BASH, ['-n', posix(path.join(ASSETS, 'run-demo.sh'))], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
});

for (const [kind, skip] of [
  ['sh', !BASH && 'bash (Git Bash on Windows) is not available'],
  ['bat', !WIN && 'run-demo.bat runs on Windows only'],
]) {
  test(`run-demo.${kind} --check starts the app in demo mode, waits for health, prints the links, then stops it`, { skip }, async () => {
    const dir = makeProject();
    const port = await freePort();
    const r = runLauncher(kind, dir, { PORT: String(port) });
    const out = r.stdout + r.stderr;
    assert.equal(r.status, 0, out);
    assert.match(out, new RegExp(`fixture listening on ${port} \\(DEMO=1\\)`));
    assert.match(out, new RegExp(`http://127\\.0\\.0\\.1:${port}/\\?demo=hero`));
    assert.match(out, new RegExp(`http://127\\.0\\.0\\.1:${port}/\\?autorun=1`));
    assert.match(out, /Check passed/);
    assert.ok(await waitFor(async () => !(await listening(port)), 5000), 'the server was stopped');
  });

  test(`run-demo.${kind} fails clearly when the health endpoint never answers`, { skip }, async () => {
    const dir = makeProject();
    const port = await freePort();
    const r = runLauncher(kind, dir, { PORT: String(port), HEALTH_PATH: '/nope', HEALTH_TIMEOUT: '3' });
    assert.notEqual(r.status, 0);
    assert.match(r.stdout + r.stderr, new RegExp(`No answer from http://127\\.0\\.0\\.1:${port}/nope after 3 seconds`));
    assert.ok(await waitFor(async () => !(await listening(port)), 5000), 'the server was stopped');
  });

  test(`run-demo.${kind} replaces a stale node server on its port`, { skip }, async () => {
    const dir = makeProject();
    const port = await freePort();
    const stale = spawn(process.execPath, [path.join(dir, 'server.js')], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
    const staleExited = new Promise((resolve) => stale.on('exit', () => resolve(true)));
    try {
      assert.ok(await waitFor(() => listening(port)), 'the stale server is listening');
      const r = runLauncher(kind, dir, { PORT: String(port) });
      const out = r.stdout + r.stderr;
      assert.equal(r.status, 0, out);
      assert.match(out, /is held by \S*node(\.exe)? \(PID \d+\), an old demo\. Stopping it\./i);
      assert.equal(await Promise.race([staleExited, new Promise((res) => setTimeout(() => res(false), 5000))]), true, 'the stale server was stopped');
    } finally {
      stale.kill();
    }
  });

  test(`run-demo.${kind} refuses to kill a program that is not an old demo`, { skip: skip || (!canHoldForeign && 'needs perl plus lsof or fuser to hold a port with a foreign program') }, async () => {
    const dir = makeProject();
    const port = await freePort();
    const holder = foreignListener(port);
    try {
      assert.ok(await waitFor(() => listening(port), 20000), 'the foreign program is listening');
      const r = runLauncher(kind, dir, { PORT: String(port) });
      const out = r.stdout + r.stderr;
      assert.equal(r.status, 1, out);
      assert.match(out, /not by an old demo/);
      assert.equal(await listening(port), true, 'the foreign program still holds its port');
    } finally {
      holder.kill();
    }
  });
}
