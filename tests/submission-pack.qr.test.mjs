// Tests for skills/submission-pack/scripts/qr.py.
// Run from the repo root: node --test tests/submission-pack.qr.test.mjs
// Skips when Python 3.10+ or the qrcode and Pillow libraries are missing. When OpenCV is installed, it also
// checks that every PNG decodes back to its URL.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(here, '..', 'skills', 'submission-pack', 'scripts', 'qr.py');

/** The first Python 3.10+ on PATH, skipping the Windows Store alias, which fails this probe. */
function findPython() {
  const candidates = [['python', []], ['python3', []], ['py', ['-3']]];
  for (const [cmd, pre] of candidates) {
    const r = spawnSync(cmd, [...pre, '-c', 'import sys; print(sys.version_info >= (3, 10))'], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim() === 'True') return { cmd, pre };
  }
  return null;
}

const python = findPython();
const hasLibs = python && spawnSync(python.cmd, [...python.pre, '-c', 'import qrcode, PIL'], { encoding: 'utf8' }).status === 0;
const skip = !python ? 'Python 3.10+ is not installed' : !hasLibs ? 'qrcode and Pillow are not installed (pip install "qrcode[pil]")' : false;
const run = (...args) => spawnSync(python.cmd, [...python.pre, SCRIPT, ...args], { encoding: 'utf8' });

const dirs = [];
test.after(() => {
  for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
});
const tmp = () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'qr-'));
  dirs.push(d);
  return d;
};

/** Width and height from a PNG's IHDR chunk. */
function pngSize(file) {
  const b = fs.readFileSync(file);
  assert.equal(b.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${path.basename(file)} is a PNG`);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

test('writes a labelled PNG and SVG per pair, and each PNG decodes to its URL', { skip }, () => {
  const out = tmp();
  const live = 'https://demo-team.vercel.app/control?scenario=one&run=1';
  const repo = 'https://github.com/team/demo';
  const r = run(`Live demo=${live}`, `Code=${repo}`, '--out', out, '--size', '400', '--verify');
  assert.equal(r.status, 0, r.stderr);
  for (const name of ['live-demo-qr', 'code-qr']) {
    const { width, height } = pngSize(path.join(out, `${name}.png`));
    assert.ok(width >= 200 && width <= 400, `${name} width ${width} is within --size`);
    assert.ok(height > width, `${name} has a label band under the code`);
    const svg = fs.readFileSync(path.join(out, `${name}.svg`), 'utf8');
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  }
  const svg = fs.readFileSync(path.join(out, 'code-qr.svg'), 'utf8');
  assert.match(svg, /<title>Code: https:\/\/github\.com\/team\/demo<\/title>/);
  assert.match(svg, />Code<\/text>/);
  if (!/verify skipped/.test(r.stderr)) {
    assert.equal((r.stdout.match(/decodes to its URL/g) || []).length, 2, 'OpenCV decoded both codes to their URLs');
  }
});

test('refuses localhost, malformed pairs and light-on-dark colours', { skip }, () => {
  const out = tmp();
  const local = run('Local=http://localhost:3000', '--out', out);
  assert.equal(local.status, 1);
  assert.match(local.stderr, /phone cannot open/);
  const malformed = run('just-a-label', '--out', out);
  assert.equal(malformed.status, 1);
  assert.match(malformed.stderr, /is not label=url/);
  const inverted = run('Live=https://demo.org', '--fg', 'ffffff', '--bg', '000000', '--out', out);
  assert.equal(inverted.status, 1);
  assert.match(inverted.stderr, /darker than the background/);
  assert.deepEqual(fs.readdirSync(out), [], 'nothing is written when an input is refused');
});

test('warns on http:// but still writes the code; --no-svg writes PNG only', { skip }, () => {
  const out = tmp();
  const r = run('Old link=http://demo.org/page', '--out', out, '--no-svg');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /prefer https/);
  assert.deepEqual(fs.readdirSync(out), ['old-link-qr.png']);
});
