// Tests for skills/pitch-deck/scripts/pptx_kit.py (inspect, check, helpers) and the pptxgenjs starter
// skills/pitch-deck/assets/deck.pptx.mjs. Run: node --test tests/pitch-deck.pptx-kit.test.mjs
// Needs Python 3.10+ with python-pptx (and Pillow for the picture helpers); the starter case needs pptxgenjs
// (a local install, or a global one found through `npm root -g`). Missing pieces skip their cases.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = path.join(ROOT, 'skills', 'pitch-deck');
const KIT = path.join(SKILL, 'scripts', 'pptx_kit.py');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bullseye-pptx-kit-'));
const good = path.join(tmp, 'good.pptx');
const bad = path.join(tmp, 'bad.pptx');
let py = null, hasPptx = false, hasPil = false, built = false;

function findPython() {
  const tries = process.platform === 'win32' ? [['python'], ['py', '-3'], ['python3']] : [['python3'], ['python']];
  for (const [cmd, ...pre] of tries) {
    const r = spawnSync(cmd, [...pre, '-c', 'import sys; print(sys.version_info >= (3, 10))'], { encoding: 'utf8', windowsHide: true });
    if (r.status === 0 && r.stdout.trim() === 'True') return { cmd, pre };
  }
  return null;
}
const runPy = (args) => spawnSync(py.cmd, [...py.pre, ...args], {
  encoding: 'utf8', windowsHide: true, timeout: 60000, env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
});
const has = (mod) => runPy(['-c', `import ${mod}`]).status === 0;

before(() => {
  py = findPython();
  if (!py) return;
  hasPptx = has('pptx');
  hasPil = has('PIL');
  if (!hasPptx) return;
  const script = path.join(tmp, 'build.py');
  fs.writeFileSync(script, `
import sys, zipfile, re
sys.path.insert(0, ${JSON.stringify(path.join(SKILL, 'scripts'))})
from pptx_kit import *
from pptx import Presentation
from pptx.util import Emu
prs = Presentation()
prs.slide_width, prs.slide_height = Emu(12192000), Emu(6858000)   # 13.333 x 7.5 in
s = prs.slides.add_slide(prs.slide_layouts[6])
rect(s, 0, 0, 13.333, 7.5, fill="0B1016")
text_box(s, 0.6, 0.5, 9, 0.6, "Kit headline with **bold**", size=28, color="EEF2F5")
card(s, 0.6, 1.4, 3.6, 1.5, "01 · SENSE", "Reads every fridge **every 60 s**.", accent="7FB5FF")
x = chip(s, 0.6, 3.2, "IMPLEMENTED")
for label in ("PROTOTYPED", "SIMULATED", "FUTURE"):
    x = chip(s, x, 3.2, label)
line(s, 9.0, 4.0, 5.0, 2.0, color="FF5D5D", arrow="end")        # right to left and upward
rect(s, 12.6, 5.0, -2.0, 0.6, fill="2A3540")                     # negative width on purpose
stat(s, 0.6, 4.2, 2.6, "90%", "RECALL · SIMULATED", rule="7FB5FF")
if ${hasPil ? 'True' : 'False'}:
    from PIL import Image
    Image.new("RGB", (1600, 900), (40, 80, 120)).save(${JSON.stringify(path.join(tmp, 'shot.png'))})
    picture_fit(s, ${JSON.stringify(path.join(tmp, 'shot.png'))}, 7.0, 4.5, 2.4, 2.4, mode="contain")
    picture_fit(s, crop_image(${JSON.stringify(path.join(tmp, 'shot.png'))}, (0.25, 0.25, 0.75, 0.75)), 10.0, 4.5, 2.4, 2.4, mode="cover")
set_notes(s, "Kit self-test slide.")
s2 = prs.slides.add_slide(prs.slide_layouts[6])
text_box(s2, 0.6, 0.6, 6, 1, "Second slide")
set_notes(s2, "Second slide notes.")
prs.core_properties.author = ""
prs.core_properties.last_modified_by = ""
prs.save(${JSON.stringify(good)})
# the corrupted copy: one negative extent, one shape off the slide, and a third slide with no notes
from pptx import Presentation as P2
p2 = P2(${JSON.stringify(good)})
s3 = p2.slides.add_slide(p2.slide_layouts[6])
rect(s3, 12.5, 7.0, 2.0, 1.0, fill="FF0000")
p2.save(${JSON.stringify(path.join(tmp, 'tmp.pptx'))})
zin = zipfile.ZipFile(${JSON.stringify(path.join(tmp, 'tmp.pptx'))})
zout = zipfile.ZipFile(${JSON.stringify(bad)}, "w", zipfile.ZIP_DEFLATED)
for item in zin.infolist():
    data = zin.read(item.filename)
    if item.filename == "ppt/slides/slide2.xml":   # negate the first real shape width (the group's cx="0" would stay 0)
        data = re.sub(rb'<a:ext cx="([1-9][0-9]*)"', lambda m: b'<a:ext cx="-' + m.group(1) + b'"', data, count=1)
    zout.writestr(item, data)
zout.close()
print("built")
`, 'utf8');
  const r = runPy([script]);
  built = r.status === 0 && r.stdout.includes('built');
  if (!built) console.error(r.stderr);
});
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

const need = (t) => {
  if (!py) { t.skip('Python 3.10+ not found'); return true; }
  if (!hasPptx) { t.skip('python-pptx missing: pip install python-pptx'); return true; }
  assert.ok(built, 'the fixture decks should build');
  return false;
};

test('inspect prints the slide size, layouts and every shape with its position', (t) => {
  if (need(t)) return;
  const r = runPy([KIT, 'inspect', good]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /good\.pptx · 2 slides · 13\.333 x 7\.5 in \(16:9\)/);
  assert.match(r.stdout, /layouts/);
  assert.match(r.stdout, /slide 1 · layout 'Blank' · notes: yes/);
  assert.match(r.stdout, /'Kit headline with bold'/);
});

test('inspect --json is machine-readable for planning a fill', (t) => {
  if (need(t)) return;
  const r = runPy([KIT, 'inspect', good, '--json']);
  assert.equal(r.status, 0, r.stderr);
  const data = JSON.parse(r.stdout);
  assert.equal(data.slides, 2);
  assert.deepEqual(data.size_in, [13.333, 7.5]);
  const shapes = data.slide_list[0].shapes;
  assert.ok(shapes.length > 10);
  assert.ok(shapes.every((s) => s.w === null || s.w >= 0), 'no negative widths reported');
});

test('the helpers never write a negative extent: right-to-left lines and negative widths are flipped', (t) => {
  if (need(t)) return;
  const r = runPy(['-c', `
import zipfile, re
x = zipfile.ZipFile(${JSON.stringify(good)}).read("ppt/slides/slide1.xml").decode()
print(len(re.findall(r'c[xy]="-', x)), x.count('flipH="1"') >= 2, 'tailEnd type="triangle"' in x)
`]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), '0 True True');
});

test('check passes a clean deck', (t) => {
  if (need(t)) return;
  const r = runPy([KIT, 'check', good, '--require-notes', '--expect-slides', '2', '--max-mb', '5']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /result clean · 0 error\(s\)/);
});

test('check fails on a negative extent, and reports off-slide shapes and missing notes', (t) => {
  if (need(t)) return;
  const r = runPy([KIT, 'check', bad, '--require-notes']);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /NEGATIVE EXTENT\s+slide 2: shape \d+/);
  assert.match(r.stdout, /OFF-SLIDE\s+slide 3/);
  assert.match(r.stdout, /NO NOTES\s+slide 3/);
});

test('check exits 1 for a file that is not a PPTX', (t) => {
  if (!py) return t.skip('Python 3.10+ not found');
  const junk = path.join(tmp, 'junk.pptx');
  fs.writeFileSync(junk, 'not a zip');
  const r = runPy([KIT, 'check', junk]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /not a readable \.pptx/);
});

test('the pptxgenjs starter builds a deck that passes check with notes on every slide', (t) => {
  if (need(t)) return;
  const env = { ...process.env };
  const local = fs.existsSync(path.join(process.cwd(), 'node_modules', 'pptxgenjs'));
  if (!local) {
    const npm = spawnSync('npm', ['root', '-g'], { encoding: 'utf8', shell: true, windowsHide: true, timeout: 30000 });
    const globalRoot = (npm.stdout || '').trim();
    if (npm.status !== 0 || !globalRoot || !fs.existsSync(path.join(globalRoot, 'pptxgenjs'))) return t.skip('pptxgenjs not installed (npm i pptxgenjs)');
    env.NODE_PATH = [globalRoot, env.NODE_PATH].filter(Boolean).join(path.delimiter);
  }
  const out = path.join(tmp, 'starter', 'Deck.pptx');
  const build = spawnSync(process.execPath, [path.join(SKILL, 'assets', 'deck.pptx.mjs'), '--out', out], { encoding: 'utf8', env, windowsHide: true, timeout: 60000 });
  assert.equal(build.status, 0, build.stderr);
  assert.match(build.stdout, /8 slides/);
  assert.match(build.stdout, /fit check: no estimated overflow/);
  const r = runPy([KIT, 'check', out, '--require-notes', '--expect-slides', '8']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});
