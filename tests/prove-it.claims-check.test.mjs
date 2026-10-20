// Tests for skills/prove-it/scripts/claims-check.mjs. Run: node --test (from the repo root)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(ROOT, 'skills', 'prove-it', 'scripts', 'claims-check.mjs');
const NODE = `"${process.execPath}"`;

function project(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'claims-check-'));
  for (const [rel, content] of Object.entries(files)) {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
  }
  return dir;
}

function run(dir, args = ['claims.json', '--json']) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { cwd: dir, encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr, report: () => JSON.parse(r.stdout) };
}

const byId = (report, id) => report.claims.find((c) => c.id === id);

const README = `# Demo

**231** tests, all offline.
Hit@3 **88.9%** on the held-out set.
p95 under 200 ms on a laptop.
`;
const FACTS = { tests: { count: 231 }, eval: { heldout: { hit3: 0.8889 } }, latency: { p95: 180 } };
const CLAIMS = {
  facts: 'facts.json',
  files: ['README.md'],
  claims: [
    { id: 'tests', text: '**231** tests', fact: 'tests.count' },
    { id: 'hit3', text: 'Hit@3 **88.9%**', fact: 'eval.heldout.hit3', scale: 100 },
    { id: 'p95', text: 'p95 under 200 ms', fact: 'latency.p95', op: '<=' },
  ],
};

test('passes when every claim text, fact and measurement agree', () => {
  const dir = project({ 'README.md': README, 'facts.json': FACTS, 'claims.json': CLAIMS });
  const r = run(dir, ['claims.json']);
  assert.equal(r.code, 0, r.out + r.err);
  assert.match(r.out, /3\/3 claims ok/);
  assert.match(r.out, /PASS/);
  const report = run(dir).report();
  assert.equal(report.ok, true);
  assert.deepEqual(report.claims.map((c) => c.status), ['ok', 'ok', 'ok']);
  assert.equal(byId(report, 'hit3').claimed, '88.9%', 'Hit@3 is skipped; the claimed number is 88.9');
});

test('a number in the document that disagrees with the fact is a MISMATCH and exits 1', () => {
  const dir = project({ 'README.md': README.replace('**231**', '**230**'), 'facts.json': FACTS, 'claims.json': { ...CLAIMS, claims: [{ id: 'tests', text: '**230** tests', fact: 'tests.count' }] } });
  const r = run(dir);
  assert.equal(r.code, 1);
  const c = byId(r.report(), 'tests');
  assert.equal(c.status, 'MISMATCH');
  assert.match(c.notes.join(' '), /fact 231/);
});

test('rounding: the text must be the fact rounded the way the text writes it', () => {
  const ok = project({ 'README.md': 'Hit@3 **88.9%**', 'facts.json': { h: 88.94 }, 'claims.json': { facts: 'facts.json', claims: [{ id: 'h', text: 'Hit@3 **88.9%**', fact: 'h' }] } });
  assert.equal(run(ok).code, 0);
  const bad = project({ 'README.md': 'Hit@3 **88.9%**', 'facts.json': { h: 88.96 }, 'claims.json': { facts: 'facts.json', claims: [{ id: 'h', text: 'Hit@3 **88.9%**', fact: 'h' }] } });
  assert.equal(run(bad).code, 1, '88.96 rounds to 89.0, not 88.9');
});

test('a file that lost the claim text is MISSING-TEXT, naming the file', () => {
  const dir = project({
    'README.md': README,
    'SUBMISSION.md': 'Our suite has many tests.',
    'facts.json': FACTS,
    'claims.json': { facts: 'facts.json', claims: [{ id: 'tests', text: '**231** tests', fact: 'tests.count', files: ['README.md', 'SUBMISSION.md'] }] },
  });
  const r = run(dir);
  assert.equal(r.code, 1);
  const c = byId(r.report(), 'tests');
  assert.equal(c.status, 'MISSING-TEXT');
  assert.deepEqual(c.missingIn, ['SUBMISSION.md']);
});

test('a stale number anywhere in the listed files is DRIFT, with file and line', () => {
  const dir = project({
    'README.md': '# Demo\n\n59 tests pass.\n',
    'deck.md': '# Slide 1\n\nBuilt in a weekend.\n58 tests, all green.\n',
    'facts.json': { tests: 59 },
    'claims.json': {
      facts: 'facts.json',
      files: ['README.md', 'deck.md'],
      claims: [{ id: 'tests', text: '59 tests', fact: 'tests', files: ['README.md'] }],
      drift: [{ pattern: '(\\d+) tests', fact: 'tests' }],
    },
  });
  const r = run(dir);
  assert.equal(r.code, 1);
  const report = r.report();
  assert.equal(report.drift[0].status, 'DRIFT');
  assert.equal(report.drift[0].found, 2);
  assert.deepEqual(report.drift[0].mismatches, [{ file: 'deck.md', line: 4, text: '58 tests' }]);
  const text = run(dir, ['claims.json']).out;
  assert.match(text, /DRIFT\s+drift:tests\s+"58 tests"/);
  assert.match(text, /deck\.md:4/);
});

test('a drift rule can demand hits, so a broken pattern cannot pass silently', () => {
  const dir = project({
    'README.md': '59 tests',
    'facts.json': { tests: 59 },
    'claims.json': { facts: 'facts.json', claims: [{ id: 'tests', text: '59 tests', fact: 'tests' }], drift: [{ pattern: '(\\d+) testcases', fact: 'tests', min: 1 }] },
  });
  const r = run(dir);
  assert.equal(r.code, 1);
  assert.match(r.report().drift[0].notes.join(' '), /found 0, expected at least 1/);
});

test('a fresh measurement catches a stale facts.json', () => {
  const dir = project({
    'README.md': README,
    'facts.json': FACTS,
    'count.mjs': 'console.log(JSON.stringify({ count: 232 }));\n',
    'claims.json': { facts: 'facts.json', claims: [{ id: 'tests', text: '**231** tests', fact: 'tests.count', measure: { cmd: `${NODE} count.mjs`, json: 'count' } }] },
  });
  const r = run(dir);
  assert.equal(r.code, 1);
  const c = byId(r.report(), 'tests');
  assert.equal(c.status, 'MISMATCH');
  assert.deepEqual(c.truths, [{ source: 'fact', value: 231 }, { source: 'measured', value: 232 }]);
});

test('regex measures read the first capture group of plain output', () => {
  const dir = project({
    'README.md': '**231** tests',
    'suite.mjs': 'console.log("ran the suite");\nconsole.log("231 passing (4s)");\n',
    'claims.json': { claims: [{ id: 'tests', text: '**231** tests', measure: { cmd: `${NODE} suite.mjs`, regex: '(\\d+) passing' } }] },
  });
  const r = run(dir);
  assert.equal(r.code, 0, r.out);
  assert.deepEqual(byId(r.report(), 'tests').truths, [{ source: 'measured', value: 231 }]);
});

test('each distinct command runs once, however many claims read it', () => {
  const dir = project({
    'README.md': '**231** tests and **12** suites',
    'eval.mjs': "import fs from 'node:fs';\nfs.appendFileSync('runs.log', 'run\\n');\nconsole.log(JSON.stringify({ tests: 231, suites: 12 }));\n",
    'claims.json': {
      claims: [
        { id: 'tests', text: '**231** tests', measure: { cmd: `${NODE} eval.mjs`, json: 'tests' } },
        { id: 'suites', text: '**12** suites', measure: { cmd: `${NODE} eval.mjs`, json: 'suites' } },
      ],
    },
  });
  assert.equal(run(dir).code, 0);
  assert.equal(fs.readFileSync(path.join(dir, 'runs.log'), 'utf8').trim().split('\n').length, 1);
});

test('--no-measure falls back to facts and marks unmeasurable claims SKIP, never ok', () => {
  const dir = project({
    'README.md': '**231** tests, 7,195 reads a second',
    'facts.json': { tests: 231 },
    'eval.mjs': "import fs from 'node:fs';\nfs.appendFileSync('runs.log', 'run\\n');\nconsole.log(JSON.stringify({ tests: 231, reads: 7195 }));\n",
    'claims.json': {
      facts: 'facts.json',
      claims: [
        { id: 'tests', text: '**231** tests', fact: 'tests', measure: { cmd: `${NODE} eval.mjs`, json: 'tests' } },
        { id: 'reads', text: '7,195 reads a second', measure: { cmd: `${NODE} eval.mjs`, json: 'reads' } },
      ],
    },
  });
  const r = run(dir, ['claims.json', '--json', '--no-measure']);
  assert.equal(r.code, 0, r.out);
  const report = r.report();
  assert.equal(byId(report, 'tests').status, 'ok');
  assert.equal(byId(report, 'reads').status, 'SKIP');
  assert.equal(report.summary.ok, 1);
  assert.equal(report.summary.skipped, 1);
  assert.equal(fs.existsSync(path.join(dir, 'runs.log')), false, 'no command may run under --no-measure');
  assert.match(run(dir, ['claims.json', '--no-measure']).out, /1\/2 claims ok, 1 skipped/);
});

test('a committed oracle file is read, also under --no-measure', () => {
  const dir = project({
    'README.md': '**23,445** riders an hour',
    'facts.json': { displaced: 23445 },
    'verify.mjs': "import fs from 'node:fs';\nfs.writeFileSync('verify/out.json', JSON.stringify({ displaced: 23445.2 }));\n",
    'verify/out.json': { displaced: 23445.2 },
    'claims.json': {
      facts: 'facts.json',
      claims: [{ id: 'displaced', text: '**23,445** riders an hour', fact: 'displaced', measure: { cmd: `${NODE} verify.mjs`, file: 'verify/out.json', json: 'displaced', label: 'independent' } }],
    },
  });
  const live = run(dir).report();
  assert.equal(live.ok, true);
  assert.deepEqual(byId(live, 'displaced').truths.map((t) => t.source), ['fact', 'independent']);
  const committed = run(dir, ['claims.json', '--json', '--no-measure']).report();
  assert.equal(byId(committed, 'displaced').status, 'ok');
  assert.equal(byId(committed, 'displaced').truths[1].value, 23445.2);
});

test('numbers parse the way documents write them', () => {
  const minus = String.fromCharCode(0x2212);
  const lines = [
    'Latency p95 18 ms',
    'Hit@3 100% on the public set',
    'scores 26k accounts/sec',
    `lift ${minus}8 pts against the FAQ bot`,
    'replays 1.5M rows',
    'pnpm judge: 16/16 claims',
    'recall@top-5% = 90.1%',
    'held-out 88.1% (95% CI 82.2-94.1%, n=101)',
    'GPT-4o answered 41 of 50',
  ];
  const dir = project({
    'README.md': lines.join('\n'),
    'facts.json': { p95: 18, hit: 100, rate: 26412, lift: -8, rows: 1500000, judged: 16, recall: 90.1, hi: 94.06, answered: 41 },
    'claims.json': {
      facts: 'facts.json',
      claims: [
        { id: 'p95', text: 'p95 18 ms', fact: 'p95' },
        { id: 'hit', text: 'Hit@3 100%', fact: 'hit' },
        { id: 'rate', text: '26k accounts/sec', fact: 'rate' },
        { id: 'lift', text: `lift ${minus}8 pts`, fact: 'lift' },
        { id: 'rows', text: '1.5M rows', fact: 'rows' },
        { id: 'judged', text: '16/16 claims', fact: 'judged' },
        { id: 'recall', text: 'recall@top-5% = 90.1%', fact: 'recall' },
        { id: 'ci-high', text: '95% CI 82.2-94.1%', fact: 'hi', value: 94.1 },
        { id: 'answered', text: 'GPT-4o answered 41 of 50', fact: 'answered' },
      ],
    },
  });
  const r = run(dir);
  assert.equal(r.code, 0, JSON.stringify(r.report().claims.filter((c) => c.status !== 'ok'), null, 1));
});

test('a string fact must appear in the text verbatim', () => {
  const files = (cut) => ({ 'README.md': 'Bottleneck: **1 Av**, whose only links are the closed L', 'facts.json': { cut }, 'claims.json': { facts: 'facts.json', claims: [{ id: 'cut', text: 'Bottleneck: **1 Av**', fact: 'cut' }] } });
  assert.equal(run(project(files('1 Av'))).code, 0);
  const r = run(project(files('3 Av')));
  assert.equal(r.code, 1);
  assert.equal(byId(r.report(), 'cut').status, 'MISMATCH');
});

test('tolerance: relative and absolute', () => {
  const files = (tolerance) => ({ 'README.md': '7,195 reads a second', 'facts.json': { reads: 7300 }, 'claims.json': { facts: 'facts.json', claims: [{ id: 'reads', text: '7,195 reads a second', fact: 'reads', tolerance }] } });
  assert.equal(run(project(files('2%'))).code, 0, '105 is within 2% of 7,300');
  assert.equal(run(project(files(50))).code, 1, '105 is more than 50');
});

test('bounds: op <= passes under the budget and fails over it', () => {
  const files = (p95) => ({ 'README.md': 'p95 under 200 ms', 'facts.json': { p95 }, 'claims.json': { facts: 'facts.json', claims: [{ id: 'p95', text: 'p95 under 200 ms', fact: 'p95', op: '<=' }] } });
  assert.equal(run(project(files(199.9))).code, 0);
  assert.equal(run(project(files(250))).code, 1);
});

test('value picks the number that is not first, and must itself be written in the text', () => {
  const files = (value) => ({ 'README.md': '**17,167 of 18,432** riders toward Manhattan', 'facts.json': { required: 18432 }, 'claims.json': { facts: 'facts.json', claims: [{ id: 'required', text: '**17,167 of 18,432**', fact: 'required', value }] } });
  assert.equal(run(project(files(18432))).code, 0);
  const r = run(project(files(18433)));
  assert.equal(r.code, 1);
  assert.match(byId(r.report(), 'required').notes.join(' '), /not written in the text/);
});

test('a failing measure command is an ERROR, never a pass', () => {
  const dir = project({
    'README.md': '**231** tests',
    'fail.mjs': 'console.error("database unreachable");\nprocess.exit(3);\n',
    'claims.json': { claims: [{ id: 'tests', text: '**231** tests', measure: { cmd: `${NODE} fail.mjs`, json: 'count' } }] },
  });
  const r = run(dir);
  assert.equal(r.code, 1);
  const c = byId(r.report(), 'tests');
  assert.equal(c.status, 'ERROR');
  assert.match(c.notes.join(' '), /exited 3: database unreachable/);
});

test('an unknown fact key and a missing file are ERRORs', () => {
  const dir = project({ 'README.md': '**231** tests', 'facts.json': { tests: 231 }, 'claims.json': { facts: 'facts.json', files: ['README.md', 'gone.md'], claims: [{ id: 'tests', text: '**231** tests', fact: 'test' }] } });
  const r = run(dir);
  assert.equal(r.code, 1);
  const notes = byId(r.report(), 'tests').notes.join(' ');
  assert.match(notes, /gone\.md not found/);
  assert.match(notes, /fact "test" is not in facts\.json/);
});

test('--only checks a subset', () => {
  const dir = project({ 'README.md': README, 'facts.json': FACTS, 'claims.json': CLAIMS });
  const report = run(dir, ['claims.json', '--json', '--only', 'tests,p95']).report();
  assert.deepEqual(report.claims.map((c) => c.id), ['tests', 'p95']);
});

test('unusable claims files exit 2 with a reason', () => {
  const cases = [
    [{ 'claims.json': { claims: [] } }, /lists no claims/],
    [{ 'claims.json': '{ not json' }, /not valid JSON/],
    [{ 'claims.json': { claims: [{ id: 'a', text: 'x' }, { id: 'a', text: 'y' }] } }, /used twice/],
    [{ 'claims.json': { claims: [{ id: 'a', text: 'x', op: '~' }] } }, /op must be/],
    [{ 'claims.json': { claims: [{ id: 'a', text: 'x', measure: { json: 'n' } }] } }, /needs "cmd" or "file"/],
  ];
  for (const [files, reason] of cases) {
    const r = run(project({ 'README.md': 'x y', ...files }));
    assert.equal(r.code, 2, r.err);
    assert.match(r.err, reason);
  }
  const missing = run(project({ 'README.md': 'x' }), ['nope.json']);
  assert.equal(missing.code, 2);
  const unknown = run(project({ 'README.md': 'x' }), ['--frobnicate']);
  assert.equal(unknown.code, 2);
});

test('the shipped example claims.json and facts.json pass against docs that carry their texts', () => {
  const assets = path.join(ROOT, 'skills', 'prove-it', 'assets');
  const claims = JSON.parse(fs.readFileSync(path.join(assets, 'claims.example.json'), 'utf8'));
  const facts = JSON.parse(fs.readFileSync(path.join(assets, 'facts.example.json'), 'utf8'));
  assert.equal(claims.claims.length, facts.claims, 'the example badge counts its own claims');
  const docs = {};
  for (const c of claims.claims) for (const f of c.files ?? claims.files) docs[f] = `${docs[f] ?? ''}${c.text}\n`;
  for (const rule of claims.drift) for (const f of rule.files) docs[f] ??= '';
  docs['deck/deck.html'] += '<p>231 tests, all offline</p>\n';
  docs['.github/workflows/claims.yml'] += '      - name: "Tests (231 passing, offline: no API keys, no credits spent)"\n';
  const dir = project({ ...docs, 'facts.json': facts, 'claims.json': claims });
  const r = run(dir, ['claims.json', '--json', '--no-measure']);
  assert.equal(r.code, 0, JSON.stringify(r.report().claims.filter((c) => c.status !== 'ok'), null, 1));
  assert.equal(r.report().summary.ok, claims.claims.length);
  assert.ok(r.report().drift.every((d) => d.status === 'ok' && d.found >= 1), 'every example drift rule matches something');

  const stale = project({ ...docs, 'deck/deck.html': '<p>230 tests</p>\n', 'facts.json': facts, 'claims.json': claims });
  const s = run(stale, ['claims.json', '--json', '--no-measure']);
  assert.equal(s.code, 1);
  assert.deepEqual(s.report().drift.find((d) => d.id === 'drift:tests').mismatches, [{ file: 'deck/deck.html', line: 1, text: '230 tests' }]);
});

test('--help prints usage and exits 0', () => {
  const r = spawnSync(process.execPath, [SCRIPT, '--help'], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Usage/);
});
