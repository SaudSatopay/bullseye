// Tests for skills/demo-video/scripts/record-demo.mjs. The dry-run checks need no browser. The recording test
// runs only when Playwright resolves from the current directory (the same lookup the script uses); otherwise it
// is skipped. To run it here, set NODE_PATH to a node_modules folder that has playwright or @playwright/test.
// Run: node --test tests/demo-video.record-demo.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const script = path.join(root, 'skills', 'demo-video', 'scripts', 'record-demo.mjs');
const example = path.join(root, 'skills', 'demo-video', 'assets', 'beats.example.json');

const run = (args, cwd = process.cwd()) => spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8', timeout: 240000 });
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bullseye-rec-'));
const write = (dir, name, data) => {
  const file = path.join(dir, name);
  fs.writeFileSync(file, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  return file;
};

function playwrightHere() {
  const req = createRequire(path.join(process.cwd(), 'noop.js'));
  for (const name of ['playwright', '@playwright/test']) {
    try {
      req.resolve(name);
      return name;
    } catch {
      // not installed here
    }
  }
  return null;
}
const hasFfmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;

test('--help prints usage and exits 0; no arguments is a usage error', () => {
  const help = run(['--help']);
  assert.equal(help.status, 0);
  assert.match(help.stdout, /--dry-run/);
  assert.match(help.stdout, /goto, fill, click, press, scroll, waitFor, caption, hold/);
  const none = run([]);
  assert.equal(none.status, 2);
  assert.match(none.stderr, /give the beats file/);
});

test('the shipped example passes the dry run', () => {
  const r = run([example, '--dry-run']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /OK: 9 steps valid \(dry run; no browser started\)/);
  assert.match(r.stdout, /video 1920x1080/);
  assert.doesNotMatch(r.stdout, /^warn/m, 'the example should not need any warning');
});

test('the dry run rejects a broken beats file with exact, fixable messages', () => {
  const dir = tmp();
  const file = write(dir, 'bad.json', {
    url: 'ftp://example.com',
    viewport: { w: 100, h: 100 },
    colour: 'dark',
    steps: [
      { id: 'a', clik: '#go', hold: 1000 },
      { id: 'a', fill: { selector: '#q' } },
      { speed: 40, hold: 500 },
      { press: 42 },
      {},
    ],
  });
  const r = run([file, '--dry-run'], dir);
  assert.equal(r.status, 1);
  const out = r.stdout;
  assert.match(out, /unknown key "colour" \(did you mean "colorScheme"\?\)|unknown key "colour"/);
  assert.match(out, /"url" must be an http, https, file or data URL/);
  assert.match(out, /"viewport" must be/);
  assert.match(out, /step 1 \(a\): unknown key "clik" \(did you mean "click"\?\)/);
  assert.match(out, /step 2 \(a\): duplicate id "a"/);
  assert.match(out, /step 2 \(a\): "fill" must be \{"selector"/);
  assert.match(out, /step 3: "speed" must be 1-16/);
  assert.match(out, /step 4: "press" must be a key/);
  assert.match(out, /step 5: does nothing/);
  assert.match(out, /errors? in /);
});

test('the dry run warns about unreadable captions and fails holds over maxSeconds', () => {
  const dir = tmp();
  const warnFile = write(dir, 'warn.json', {
    url: 'http://localhost:3000',
    steps: [
      { caption: 'Too quick to read', hold: 600 },
      { caption: 'Fine', hold: 2000 },
      { caption: 'Set inside a sped-up step', speed: 4, hold: 4000 },
    ],
  });
  const w = run([warnFile, '--dry-run'], dir);
  assert.equal(w.status, 0, w.stdout + w.stderr);
  assert.match(w.stdout, /warn {2}step 1: the caption has 0\.6 s of hold time/);
  assert.match(w.stdout, /warn {2}step 3: a caption set in a sped-up step/);
  assert.doesNotMatch(w.stdout, /step 2: the caption/);

  const longFile = write(dir, 'long.json', { url: 'http://localhost:3000', maxSeconds: 10, steps: [{ caption: 'A', hold: 8000 }, { caption: 'B', hold: 8000 }] });
  const l = run([longFile, '--dry-run'], dir);
  assert.equal(l.status, 1);
  assert.match(l.stdout, /holds alone run 16\.0 s after speed-ups, over "maxSeconds" 10/);

  const broken = write(dir, 'broken.json', '{ "url": ');
  const b = run([broken, '--dry-run'], dir);
  assert.equal(b.status, 1);
  assert.match(b.stderr, /is not valid JSON/);
});

const pw = playwrightHere();
test('records a local page: captions from page variables, cursor, speed-up, timing and H.264', {
  skip: pw ? false : 'Playwright does not resolve from this directory (set NODE_PATH to a node_modules that has it to run this test)',
  timeout: 240000,
}, (t) => {
  const dir = tmp();
  const page = write(dir, 'page.html', `<!doctype html><html><head><meta charset="utf-8"><style>
:root{--ink:#14181f;--paper:#f7f3e8;--accent:#e8a13b;--font-display:Georgia,serif}
body{margin:40px;font:20px system-ui;background:var(--paper);color:var(--ink)} .tall{height:1600px}
</style></head><body><h1>Recorder test</h1><input id="q"> <button id="go" onclick="document.getElementById('out').textContent='done: '+document.getElementById('q').value">Run</button>
<p id="out"></p><div class="tall"></div><p id="end">The end</p></body></html>`);
  const beats = write(dir, 'beats.json', {
    url: pathToFileURL(page).href,
    viewport: { w: 640, h: 360 },
    colorScheme: 'light',
    steps: [
      { id: 'hook', caption: 'Recorder test', detail: 'Captions use the page variables', hold: 1500 },
      { id: 'type', fill: { selector: '#q', text: 'hello judges', delay: 20 }, click: '#go', waitFor: 'text=done: hello judges', caption: 'Typed and clicked', hold: 1500 },
      { id: 'fast', caption: '', scroll: '#end', hold: 2000, speed: 2 },
    ],
  });
  const r = run([beats, '--out', 'out'], dir);
  if (r.status !== 0 && /Could not start a browser/.test(r.stderr)) {
    t.skip('Playwright resolves but no Chromium, Chrome or Edge could start');
    return;
  }
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const timing = JSON.parse(fs.readFileSync(path.join(dir, 'out', 'timing.json'), 'utf8'));
  assert.equal(timing.failed, null);
  assert.deepEqual(timing.steps.map((s) => [s.id, s.ok, s.speed]), [['hook', true, 1], ['type', true, 1], ['fast', true, 2]]);
  for (const s of timing.steps) assert.ok(s.endMs >= s.startMs);
  assert.ok(timing.steps[1].startMs >= timing.steps[0].endMs - 1);
  assert.equal(timing.caption.background, '#14181f', 'caption background should come from --ink');
  assert.equal(timing.caption.color, '#f7f3e8', 'caption text should come from --paper');
  assert.equal(timing.caption.fontFamily, 'Georgia,serif', 'caption title font should come from --font-display');
  assert.ok(fs.statSync(path.join(dir, 'out', 'raw.webm')).size > 0);
  if (hasFfmpeg) {
    assert.equal(timing.files.mp4, 'demo.mp4');
    const fast = timing.steps[2];
    const recorded = fast.endMs - fast.startMs;
    const played = fast.outEndMs - fast.outStartMs;
    assert.ok(Math.abs(played - recorded / 2) < 150, `the 2x step should play in half the time (${played} vs ${recorded})`);
    const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,width,height,pix_fmt', '-of', 'json', path.join(dir, 'out', 'demo.mp4')], { encoding: 'utf8' });
    const stream = JSON.parse(probe.stdout).streams[0];
    assert.deepEqual([stream.codec_name, stream.width, stream.height, stream.pix_fmt], ['h264', 640, 360, 'yuv420p']);
  }

  // A dev server is refused unless --allow-dev is passed.
  const devPage = write(dir, 'dev.html', '<!doctype html><html><body><h1>dev</h1><script type="module" src="./@vite/client"></script></body></html>');
  const devBeats = write(dir, 'dev.json', { url: pathToFileURL(devPage).href, viewport: { w: 640, h: 360 }, steps: [{ caption: 'x', hold: 200 }] });
  const dev = run([devBeats, '--out', 'dev-out', '--no-mp4'], dir);
  assert.equal(dev.status, 1);
  assert.match(dev.stderr, /Vite dev server/);
  assert.match(dev.stderr, /vite build && vite preview/);
});
