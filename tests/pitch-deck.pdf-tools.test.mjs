// Tests for skills/pitch-deck/scripts/finalize-pdf.py, qa-pdf.py and pages-to-pptx.py, and for the QA probe
// shipped inside the HTML starters. Run: node --test tests/pitch-deck.pdf-tools.test.mjs
// Needs Python 3.10+ with PyMuPDF (fitz); pages-to-pptx also needs python-pptx; the probe case needs a browser.
// Each missing piece skips its cases. Fixtures are built here; no network.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = path.join(ROOT, 'skills', 'pitch-deck');
const SCRIPT = (name) => path.join(SKILL, 'scripts', name);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bullseye-pdf-tools-'));
let py = null, hasFitz = false, hasPptx = false, browser = false;

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
const isPng = (file) => fs.existsSync(file) && fs.readFileSync(file).subarray(1, 4).toString('latin1') === 'PNG';
function pyCheck(code) {
  const file = path.join(tmp, `check-${Math.random().toString(36).slice(2)}.py`);
  fs.writeFileSync(file, code, 'utf8');
  const r = runPy([file]);
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
}
const fixture = path.join(tmp, 'fixture.pdf');

before(() => {
  py = findPython();
  if (!py) return;
  hasFitz = has('fitz');
  hasPptx = has('pptx');
  browser = spawnSync(process.execPath, [SCRIPT('render-pdf.mjs'), '--which'], { windowsHide: true }).status === 0;
  if (!hasFitz) return;
  // three 16:9 pages; page 3 carries an em dash (built at runtime, never typed) and a hype word
  pyCheck(`
import fitz
doc = fitz.open()
for i, text in enumerate(["Alpha recall x 3", "Beta", "Gamma"]):
    page = doc.new_page(width=960, height=540)
    page.insert_text((72, 120), text, fontname="helv", fontsize=28)
    page.insert_text((72, 500), "FOOTER %02d / 03" % (i + 1), fontname="helv", fontsize=10)
doc[0].insert_text((72, 200), "Price " + chr(0xD7) + " 3", fontname="helv", fontsize=20)
doc[2].insert_text((72, 200), "A seamless tool " + chr(0x2014) + " truly", fontname="china-s", fontsize=20)
doc.set_metadata({"title": "Fixture", "author": "Fixture Author", "creator": "fixture"})
doc.save(${JSON.stringify(fixture)})
print("ok")
`);
});
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

const need = (t, what) => {
  if (!py) { t.skip('Python 3.10+ not found'); return true; }
  if (what.includes('fitz') && !hasFitz) { t.skip('PyMuPDF missing: pip install pymupdf'); return true; }
  if (what.includes('pptx') && !hasPptx) { t.skip('python-pptx missing: pip install python-pptx'); return true; }
  if (what.includes('browser') && !browser) { t.skip('no Chrome, Edge or Chromium found'); return true; }
  return false;
};
const copyFixture = (name) => { const f = path.join(tmp, name); fs.copyFileSync(fixture, f); return f; };

test('finalize-pdf subsets, gates the size and reports fonts and metadata', (t) => {
  if (need(t, ['fitz'])) return;
  const f = copyFixture('fin.pdf');
  const r = runPy([SCRIPT('finalize-pdf.py'), f, '--max-mb', '5']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /fin\.pdf · 3 pages · .* KB · OK <5 MB/);
  assert.match(r.stdout, /fonts\s+\d+:/);
  assert.match(r.stdout, /metadata\s+title='Fixture'/);
});

test('finalize-pdf exits 1 when the file is over the limit', (t) => {
  if (need(t, ['fitz'])) return;
  const r = runPy([SCRIPT('finalize-pdf.py'), copyFixture('over.pdf'), '--max-mb', '0.0001']);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /OVER 0\.0001 MB/);
});

test('finalize-pdf --select builds a cut in the given order', (t) => {
  if (need(t, ['fitz'])) return;
  const out = path.join(tmp, 'cut.pdf');
  const r = runPy([SCRIPT('finalize-pdf.py'), copyFixture('sel.pdf'), '--select', '3,1', '--out', out]);
  assert.equal(r.status, 0, r.stderr);
  const pages = pyCheck(`import fitz\nd = fitz.open(${JSON.stringify(out)})\nprint(d.page_count, d[0].get_text().split()[0])`);
  assert.equal(pages, '2 Gamma');
});

test('finalize-pdf --expect-fonts fails when a face never made it into the PDF', (t) => {
  if (need(t, ['fitz'])) return;
  const r = runPy([SCRIPT('finalize-pdf.py'), copyFixture('fonts.pdf'), '--expect-fonts', 'Helvetica,NoSuchFace']);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /expected fonts not in the PDF: NoSuchFace/);
});

test('finalize-pdf --strip-metadata blanks the identity fields', (t) => {
  if (need(t, ['fitz'])) return;
  const f = copyFixture('meta.pdf');
  const r = runPy([SCRIPT('finalize-pdf.py'), f, '--strip-metadata', '--title', 'Neutral']);
  assert.equal(r.status, 0, r.stderr);
  const meta = pyCheck(`import fitz\nm = fitz.open(${JSON.stringify(f)}).metadata\nprint(repr((m["title"], m["author"], m["creator"])))`);
  assert.equal(meta, "('Neutral', '', '')");
});

test('qa-pdf writes page renders, zoom crops, footer strips and a contact sheet', (t) => {
  if (need(t, ['fitz'])) return;
  const out = path.join(tmp, 'qa png');
  const r = runPy([SCRIPT('qa-pdf.py'), fixture, '--pages', '1', '--crop', '1:0.1-0.4', '--bottoms', '--sheet', '--out', out]);
  assert.equal(r.status, 0, r.stderr);
  for (const name of ['fixture-p01.png', 'fixture-p01-crop-10-40.png', 'fixture-p01-bottom.png', 'fixture-bottoms.png', 'fixture-sheet.png']) {
    assert.ok(isPng(path.join(out, name)), `${name} should be a PNG`);
  }
  assert.match(r.stdout, /wrote 5 PNG\(s\)/);
});

test('qa-pdf --glyphs reports glyphs that survived and fails on missing ones', (t) => {
  if (need(t, ['fitz'])) return;
  const ok = runPy([SCRIPT('qa-pdf.py'), fixture, '--glyphs', chrToString(0xd7)]);
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /ok\s+\S\s+U\+00D7\s+x1/);
  const missing = runPy([SCRIPT('qa-pdf.py'), fixture, '--glyphs', chrToString(0xd7) + chrToString(0x20b9)]);
  assert.equal(missing.status, 1);
  assert.match(missing.stdout, /MISSING\s+\S\s+U\+20B9/);
});
function chrToString(code) { return String.fromCharCode(code); }

test('qa-pdf --tells fails on a visible em dash and warns on hype words', (t) => {
  if (need(t, ['fitz'])) return;
  const r = runPy([SCRIPT('qa-pdf.py'), fixture, '--tells']);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /FAIL\s+p03\s+em dash/);
  assert.match(r.stdout, /hype word 'seamless'/);
});

test('qa-pdf rejects a page that is not in the document', (t) => {
  if (need(t, ['fitz'])) return;
  const r = runPy([SCRIPT('qa-pdf.py'), fixture, '--pages', '9']);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /page 9 is outside 1-3/);
});

test('pages-to-pptx builds one image slide per page with notes and alt text', (t) => {
  if (need(t, ['fitz', 'pptx'])) return;
  const notes = path.join(tmp, 'notes.json');
  fs.writeFileSync(notes, JSON.stringify(['Open on the problem.', null, 'Close on the ask.']));
  const out = path.join(tmp, 'deck out', 'Deck.pptx');
  const r = runPy([SCRIPT('pages-to-pptx.py'), fixture, '--out', out, '--notes', notes, '--width', '1200', '--max-mb', '5']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /3 slides/);
  const facts = pyCheck(`
from pptx import Presentation
p = Presentation(${JSON.stringify(out)})
s = list(p.slides)
pic = s[0].shapes[0]
print(len(s), round(p.slide_width / 914400, 3), s[0].notes_slide.notes_text_frame.text, bool(pic._element.nvPicPr.cNvPr.get("descr")), repr(p.core_properties.author))
`);
  assert.equal(facts, "3 13.333 Open on the problem. True ''");
});

test("the starters' QA probe stamps overlapping text and stays silent on a clean page", (t) => {
  if (need(t, ['fitz', 'browser'])) return;
  const starter = fs.readFileSync(path.join(SKILL, 'assets', 'deck-16x9.html'), 'utf8');
  const probe = starter.slice(starter.lastIndexOf('<script>'), starter.lastIndexOf('</script>') + '</script>'.length);
  assert.match(probe, /BULLSEYE-QA/);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Probe</title><style>
    :root { --total: "2"; } @page { size: 338.667mm 190.5mm; margin: 0 }
    * { margin: 0; padding: 0; box-sizing: border-box }
    .page { position: relative; width: 338.667mm; height: 190.5mm; overflow: hidden; page-break-after: always; font: 28pt Arial, sans-serif }
    .page:last-child { page-break-after: auto }
    .a, .b { position: absolute; left: 20mm; top: 40mm; width: 200mm }
  </style></head><body>
    <section class="page"><div class="a">First block of text here</div><div class="b">Second block on top</div></section>
    <section class="page"><div class="a">A clean page</div></section>
    ${probe}</body></html>`;
  const input = path.join(tmp, 'probe.html');
  fs.writeFileSync(input, html, 'utf8');
  const pdf = path.join(tmp, 'probe.pdf');
  const render = spawnSync(process.execPath, [SCRIPT('render-pdf.mjs'), input, '--qa', '--out', pdf, '--expect-pages', '2'], { encoding: 'utf8', windowsHide: true, timeout: 120000 });
  assert.equal(render.status, 0, render.stderr);
  const r = runPy([SCRIPT('qa-pdf.py'), pdf]);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stdout, /FLAG\s+p01\s+BULLSEYE-QA · 1 issue\(s\) \| OVERLAP/);
  assert.doesNotMatch(r.stdout, /FLAG\s+p02/);
});
