// Tests for skills/pitch-deck/scripts/render-pdf.mjs. Run: node --test tests/pitch-deck.render-pdf.test.mjs
// Renders tiny fixtures with whatever Chrome, Edge or Chromium the machine has; render cases skip when none is found.
// No network: fixtures use system fonts only.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RENDER = path.join(ROOT, 'skills', 'pitch-deck', 'scripts', 'render-pdf.mjs');
// a space in the temp folder name exercises the space-handling the script exists for
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bullseye pitch-deck render '));
let browser = null;

const run = (...args) => spawnSync(process.execPath, [RENDER, ...args], { encoding: 'utf8', timeout: 120000, windowsHide: true });
function page(height = '190.5mm', body = ['One', 'Two']) {
  const pages = body.map((b) => `<section class="page">${b}</section>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Fixture</title><style>@page{size:338.667mm 190.5mm;margin:0}*{margin:0;padding:0}.page{width:338.667mm;height:${height};overflow:hidden;page-break-after:always;font:24pt Arial,sans-serif}.page:last-child{page-break-after:auto}</style></head><body>${pages}</body></html>`;
}
function write(rel, text) {
  const file = path.join(tmp, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
  return file;
}

before(() => {
  const r = run('--which');
  if (r.status === 0) browser = r.stdout.trim();
});
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

test('prints usage with --help', () => {
  const r = run('--help');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /render-pdf\.mjs/);
  assert.match(r.stdout, /--expect-pages/);
});

test('rejects an unknown option with exit code 2', () => {
  const r = run('--bogus');
  assert.equal(r.status, 2);
  assert.match(r.stderr, /unknown option --bogus/);
});

test('fails clearly when the input file is missing', () => {
  const r = run(path.join(tmp, 'nope.html'));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /input not found/);
});

test('renders a two-page fixture through paths that contain spaces', (t) => {
  if (!browser) return t.skip('no Chrome, Edge or Chromium found');
  const input = write('in put/two page.html', page());
  const out = path.join(tmp, 'out dir', 'nested', 'Two Pages.pdf');
  const r = run(input, '--out', out, '--expect-pages', '2');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /2 page\(s\)/);
  const head = fs.readFileSync(out).subarray(0, 5).toString('latin1');
  assert.equal(head, '%PDF-');
});

test('fails when the page count differs from --expect-pages', (t) => {
  if (!browser) return t.skip('no Chrome, Edge or Chromium found');
  const input = write('count.html', page());
  const r = run(input, '--out', path.join(tmp, 'count.pdf'), '--expect-pages', '3');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /expected 3 page\(s\), got 2/);
});

test('warns when a page spills onto an extra sheet', (t) => {
  if (!browser) return t.skip('no Chrome, Edge or Chromium found');
  const input = write('spill.html', page('200mm'));
  const r = run(input, '--out', path.join(tmp, 'spill.pdf'));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /spilled onto an extra sheet/);
});

test('fills {{fact:...}} tokens from a facts file and refuses missing keys', (t) => {
  if (!browser) return t.skip('no Chrome, Edge or Chromium found');
  const input = write('facts.html', page('190.5mm', ['Recall {{fact:eval.recall}}', 'Two']));
  const good = write('facts.json', JSON.stringify({ eval: { recall: '0.91' } }));
  const ok = run(input, '--facts', good, '--out', path.join(tmp, 'facts.pdf'));
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /1 \{\{fact:\.\.\.\}\} token\(s\) filled/);
  const bad = write('facts-missing.json', JSON.stringify({ eval: {} }));
  const no = run(input, '--facts', bad, '--out', path.join(tmp, 'facts2.pdf'));
  assert.equal(no.status, 1);
  assert.match(no.stderr, /no scalar value for eval\.recall/);
});

test('lists leftover placeholders, and --strict makes them a failure', (t) => {
  if (!browser) return t.skip('no Chrome, Edge or Chromium found');
  const input = write('placeholders.html', page('190.5mm', ['Team {{TEAM}}', 'Two']).replace('<!doctype html>', '<!doctype html><!-- {{IN_A_COMMENT}} -->'));
  const draft = run(input, '--out', path.join(tmp, 'ph.pdf'));
  assert.equal(draft.status, 0, draft.stderr);
  assert.match(draft.stderr, /\{\{TEAM\}\}/);
  assert.doesNotMatch(draft.stderr, /IN_A_COMMENT/);
  const strict = run(input, '--strict', '--out', path.join(tmp, 'ph2.pdf'));
  assert.equal(strict.status, 1);
});
