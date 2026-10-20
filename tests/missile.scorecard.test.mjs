import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(root, 'skills', 'missile', 'scripts', 'scorecard.mjs');
const template = path.join(root, 'skills', 'missile', 'assets', 'MISSILE.template.md');
const DIMS = ['first_impression', 'design_system', 'layout', 'motion', 'ux_completeness', 'accessibility', 'performance', 'code_health', 'story', 'shipped'];

function card(iteration, scoreOf) {
  const scores = Object.fromEntries(DIMS.map((d) => [d, { score: scoreOf(d), evidence: `shots/it${iteration}/home-390.png`, fixes: [] }]));
  return { iteration, timestamp: '2026-10-20T12:00:00Z', url: 'http://localhost:3000', screens_reviewed: ['/'], scores, top_fixes: [{ dimension: 'story', fix: 'Write the README for a judge', effort: 'M', files: ['README.md'] }] };
}

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scorecard-'));
  fs.writeFileSync(path.join(dir, 'MISSILE.md'), fs.readFileSync(template, 'utf8'));
  return dir;
}

test('records a CONTINUE iteration and updates the scoreboard', () => {
  const dir = setup();
  try {
    const file = path.join(dir, 'it1.json');
    fs.writeFileSync(file, JSON.stringify(card(1, () => 7)));
    const run = spawnSync(process.execPath, [script, dir, file], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /verdict CONTINUE/);
    const md = fs.readFileSync(path.join(dir, 'MISSILE.md'), 'utf8');
    assert.match(md, /status: stage=\d+ iteration=1 verdict=CONTINUE/);
    assert.match(md, /\| first_impression \| 7 \| 9\+ \|/);
    assert.match(md, /### Iteration 1/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('reaches IMPACT only when every dimension is at least 9 and the mean at least 9.5', () => {
  const dir = setup();
  try {
    const file = path.join(dir, 'it2.json');
    fs.writeFileSync(file, JSON.stringify(card(2, (d) => (d === 'motion' ? 9 : 10))));
    const run = spawnSync(process.execPath, [script, dir, file], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /verdict IMPACT/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('rejects a score without evidence', () => {
  const dir = setup();
  try {
    const bad = card(1, () => 8);
    delete bad.scores.layout.evidence;
    const file = path.join(dir, 'bad.json');
    fs.writeFileSync(file, JSON.stringify(bad));
    const run = spawnSync(process.execPath, [script, dir, file], { encoding: 'utf8' });
    assert.equal(run.status, 1);
    assert.match(run.stderr, /scores\.layout has no evidence/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
