// Tests for skills/prove-it/scripts/bootstrap-ci.py. Run: node --test (from the repo root)
// Skips when no Python 3 is on the machine.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(ROOT, 'skills', 'prove-it', 'scripts', 'bootstrap-ci.py');

function findPython() {
  // On Windows the bare "python" can be the Store stub, which prints nothing and exits 9009.
  const candidates = process.platform === 'win32' ? [['py', ['-3']], ['python', []], ['python3', []]] : [['python3', []], ['python', []]];
  for (const [cmd, pre] of candidates) {
    const r = spawnSync(cmd, [...pre, '--version'], { encoding: 'utf8' });
    const m = /Python (\d+)\.(\d+)/.exec(`${r.stdout ?? ''}${r.stderr ?? ''}`);
    if (r.status === 0 && m && Number(m[1]) === 3 && Number(m[2]) >= 8) return { cmd, pre };
  }
  return null;
}
const PY = findPython();
const SKIP = PY ? false : 'Python 3 not found (tried py -3, python, python3)';

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bootstrap-ci-'));
}
function csv(dir, name, header, rows) {
  const p = path.join(dir, name);
  fs.writeFileSync(p, [header.join(','), ...rows.map((r) => r.join(','))].join('\n') + '\n');
  return p;
}
function run(args, input) {
  const r = spawnSync(PY.cmd, [...PY.pre, SCRIPT, ...args], { encoding: 'utf8', input });
  return { code: r.status, out: r.stdout, err: r.stderr, json: () => JSON.parse(r.stdout) };
}
const all = (report) => report.groups.find((g) => g.group === 'all');

test('a binary column gives the rate with a percentile interval around it', { skip: SKIP }, () => {
  const dir = tmp();
  const file = csv(dir, 'r.csv', ['id', 'correct'], Array.from({ length: 100 }, (_, i) => [i, i < 80 ? 1 : 0]));
  const g = all(run([file, '--col', 'correct', '--json']).json());
  assert.equal(g.n, 100);
  assert.equal(g.value, 0.8);
  assert.equal(g.successes, 80);
  assert.ok(g.lo < 0.8 && 0.8 < g.hi, `0.8 inside [${g.lo}, ${g.hi}]`);
  assert.ok(g.lo >= 0 && g.hi <= 1);
  assert.match(g.display, /^80\.0% \(95% CI \d+\.\d-\d+\.\d%, n=100, 2000 bootstrap resamples\)$/);
});

test('the interval agrees with the normal approximation computed independently', { skip: SKIP }, () => {
  // n = 400 and p = 0.5: the Wald interval is 0.5 +- 1.96 * sqrt(0.25 / 400) = [0.451, 0.549].
  const dir = tmp();
  const file = csv(dir, 'r.csv', ['correct'], Array.from({ length: 400 }, (_, i) => [i % 2]));
  const g = all(run([file, '--col', 'correct', '--json']).json());
  const half = 1.96 * Math.sqrt(0.25 / 400);
  assert.ok(Math.abs(g.lo - (0.5 - half)) < 0.012, `lo ${g.lo}`);
  assert.ok(Math.abs(g.hi - (0.5 + half)) < 0.012, `hi ${g.hi}`);
});

test('the same seed gives the same interval; another seed may not', { skip: SKIP }, () => {
  const dir = tmp();
  const file = csv(dir, 'r.csv', ['correct'], Array.from({ length: 60 }, (_, i) => [i % 3 ? 1 : 0]));
  const a = all(run([file, '--col', 'correct', '--json', '--seed', '7']).json());
  const b = all(run([file, '--col', 'correct', '--json', '--seed', '7']).json());
  const c = all(run([file, '--col', 'correct', '--json', '--seed', '8']).json());
  assert.deepEqual([a.lo, a.hi], [b.lo, b.hi]);
  assert.notDeepEqual([a.lo, a.hi], [c.lo, c.hi]);
});

test('when items cluster, the cluster bootstrap is honest about how little is known', { skip: SKIP }, () => {
  // 20 stations x 10 decisions; a station is either all right or all wrong. 200 rows carry the information
  // of 20 stations, so the cluster interval must be far wider than the row interval.
  const dir = tmp();
  const rows = [];
  for (let s = 0; s < 20; s++) for (let k = 0; k < 10; k++) rows.push([`st${s}`, s < 14 ? 1 : 0]);
  const file = csv(dir, 'r.csv', ['station', 'correct'], rows);
  const naive = all(run([file, '--col', 'correct', '--json']).json());
  const cluster = all(run([file, '--col', 'correct', '--cluster', 'station', '--json']).json());
  assert.equal(cluster.clusters, 20);
  assert.ok(cluster.hi - cluster.lo > 2 * (naive.hi - naive.lo), `cluster width ${cluster.hi - cluster.lo} vs rows ${naive.hi - naive.lo}`);
  assert.match(cluster.display, /n=200 in 20 clusters, 2000 cluster bootstrap resamples/);
});

test('--by reports one line per group after the overall line', { skip: SKIP }, () => {
  const dir = tmp();
  const rows = Array.from({ length: 30 }, (_, i) => [i % 3 === 0 ? 'negative' : 'impact', i % 4 ? 1 : 0]);
  const file = csv(dir, 'r.csv', ['category', 'correct'], rows);
  const report = run([file, '--col', 'correct', '--by', 'category', '--json', '--resamples', '500']).json();
  assert.deepEqual(report.groups.map((g) => [g.group, g.n]), [['all', 30], ['impact', 20], ['negative', 10]]);
  const text = run([file, '--col', 'correct', '--by', 'category', '--resamples', '500']).out;
  assert.match(text, /^ {2}negative\s/m);
  assert.match(text, /write it as: /);
});

test('sum and median are supported', { skip: SKIP }, () => {
  const dir = tmp();
  const file = csv(dir, 'r.csv', ['ms'], [[10], [12], [11], [50], [13]]);
  const median = all(run([file, '--col', 'ms', '--stat', 'median', '--json', '--resamples', '300']).json());
  assert.equal(median.value, 12);
  assert.equal(median.binary, false);
  const sum = all(run([file, '--col', 'ms', '--stat', 'sum', '--json', '--resamples', '300']).json());
  assert.equal(sum.value, 96);
});

test('empty and null values are unknown: left out and counted, never read as 0', { skip: SKIP }, () => {
  const dir = tmp();
  const p = path.join(dir, 'r.jsonl');
  const lines = [{ correct: true }, { correct: true }, { correct: null }, { correct: 'yes' }, { correct: '' }, { correct: 'no' }];
  fs.writeFileSync(p, lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
  const report = run([p, '--col', 'correct', '--json', '--resamples', '300']).json();
  assert.equal(report.left_out, 2);
  assert.equal(all(report).n, 4);
  assert.equal(all(report).value, 0.75);
  assert.match(run([p, '--col', 'correct', '--resamples', '300']).out, /2 row\(s\) had no value/);
});

test('JSON files with a results list and dot-path columns are read', { skip: SKIP }, () => {
  const dir = tmp();
  const p = path.join(dir, 'results.json');
  const results = Array.from({ length: 12 }, (_, i) => ({ qid: `q${i}`, arm: 'graph', grade: { correct: i % 4 !== 0 } }));
  fs.writeFileSync(p, JSON.stringify({ run: { id: 'r1' }, results }));
  const g = all(run([p, '--col', 'grade.correct', '--json', '--resamples', '300']).json());
  assert.equal(g.n, 12);
  assert.equal(g.successes, 9);
});

test('stdin works with "-"', { skip: SKIP }, () => {
  const g = all(run(['-', '--col', 'correct', '--json', '--resamples', '300'], 'correct\n1\n0\n1\n1\n').json());
  assert.equal(g.value, 0.75);
});

test('--confidence 90 gives a narrower interval than 95', { skip: SKIP }, () => {
  const dir = tmp();
  const file = csv(dir, 'r.csv', ['correct'], Array.from({ length: 80 }, (_, i) => [i % 5 ? 1 : 0]));
  const c95 = all(run([file, '--col', 'correct', '--json']).json());
  const report90 = run([file, '--col', 'correct', '--json', '--confidence', '90']).json();
  assert.equal(report90.confidence, 0.9);
  const c90 = all(report90);
  assert.ok(c90.hi - c90.lo < c95.hi - c95.lo);
  assert.match(c90.display, /90% CI/);
});

test('bad input exits 2 with the row or the available columns; nothing usable exits 1', { skip: SKIP }, () => {
  const dir = tmp();
  const bad = csv(dir, 'bad.csv', ['correct'], [[1], ['maybe'], [0]]);
  const r1 = run([bad, '--col', 'correct']);
  assert.equal(r1.code, 2);
  assert.match(r1.err, /row 2: 'maybe'/);
  const r2 = run([bad, '--col', 'right']);
  assert.equal(r2.code, 2);
  assert.match(r2.err, /columns: correct/);
  const empty = csv(dir, 'empty.csv', ['id', 'correct'], [[1, ''], [2, 'n/a']]);
  assert.equal(run([empty, '--col', 'correct']).code, 1);
  assert.equal(run([path.join(dir, 'missing.csv'), '--col', 'correct']).code, 2);
});

test('--help exits 0', { skip: SKIP }, () => {
  const r = run(['--help']);
  assert.equal(r.code, 0);
  assert.match(r.out, /percentile bootstrap/);
});
