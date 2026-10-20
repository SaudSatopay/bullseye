// Tests for skills/judge-panel/scripts/judge-round.mjs and the scoring helpers in judging-lib.mjs.
// Run: node --test tests/judge-panel.judge-round.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { weightedTotal, reconcile, parseRubric, extractJson, validate, stopReasons } from '../skills/judge-panel/scripts/judging-lib.mjs';
import { upsertJudgeRow, prependLog } from '../skills/judge-panel/scripts/judge-round.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skill = path.join(repo, 'skills', 'judge-panel');
const script = path.join(skill, 'scripts', 'judge-round.mjs');
const schema = JSON.parse(fs.readFileSync(path.join(skill, 'assets', 'judge-scorecard.schema.json'), 'utf8'));

const BULLSEYE = `# BULLSEYE · Lantern · Demo Hackathon 2026

status: phase=judge step=1 updated=2026-10-18T10:00:00+03:00 next="Record round 1"
deadline: 2099-01-01T23:59:00+05:30

## Contract

**Rubric:**

| Criterion | Weight | What wins it | Our evidence | Where it shows | Owner |
|---|---|---|---|---|---|
| Innovation | 25% | | | | |
| Business Impact | 25% | | | | |
| Technical Excellence | 20% | | | | |
| Scalability | 15% | | | | |
| User Experience | 15% | | | | |

## Judge rounds
<!-- Owner: judge-panel. -->

| Round | Type | Date | Weighted score | Lowest criterion | Top finding | Fixed? |
|---|---|---|---|---|---|---|

## Submission
- [ ] README for judges

## Log
<!-- All skills. Newest first. One block per pass. -->

### ▶ STATUS · {{pass name}} · {{YYYY-MM-DD HH:MM TZ}}
- Changed:
`;

function card(over = {}) {
  return {
    round: 1,
    type: 'adversarial',
    judge: { persona: 'founders and VCs', runner: 'test' },
    criteria: [
      { name: 'Innovation', weight: 25, score: 8, evidence: 'rules.ts:88 is new' },
      { name: 'Business Impact', weight: 25, score: 7, evidence: 'no buyer named' },
      { name: 'Technical Excellence', weight: 20, score: 8, evidence: 'npm test: 59 passing' },
      { name: 'Scalability', weight: 15, score: 7, evidence: 'no load test' },
      { name: 'User Experience', weight: 15, score: 7, evidence: 'clipped table at 390 px' },
    ],
    weighted_total: 7.45,
    verdict: 'Strong engine, thin business case.',
    findings: [
      { id: 'F1', severity: 'low', title: 'Stale test count in README', where: 'README.md:10', evidence: 'says 58; npm test runs 59', fix: 'Generate the count' },
      { id: 'F2', severity: 'high', title: 'Modal says sent; nothing is sent', where: 'src/Response.tsx:41', evidence: 'no request in the network log', fix: 'Say prepared' },
    ],
    non_issues: [{ checked: 'permit id looked invented', result: 'real id in data/seed.ts:12' }],
    improvements: [{ rank: 1, change: 'Expected-value ROI', criterion: 'Business Impact', impact: 'high', effort: 'S', quick_win: true }],
    wow: [{ idea: 'Public dataset replay', criterion: 'Innovation', effort: 'M', feasibility: 'realistic' }],
    biggest_gap: 'No outside data.',
    code_maxed: false,
    ...over,
  };
}

// Business Impact moves the total by 0.25 per point.
const withBusiness = (score, over = {}) => card({ ...over, criteria: card().criteria.map((c) => (c.name === 'Business Impact' ? { ...c, score } : c)) });

function project() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'judge-panel-round-'));
  fs.writeFileSync(path.join(dir, 'BULLSEYE.md'), BULLSEYE);
  return dir;
}

function save(dir, rel, value) {
  const p = path.join(dir, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof value === 'string' ? value : JSON.stringify(value, null, 2));
  return p;
}

const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
const md = (dir) => fs.readFileSync(path.join(dir, 'BULLSEYE.md'), 'utf8');
const rows = (text) => text.split('\n').filter((l) => /^\| R\d+ \|/.test(l));

test('weightedTotal uses the exact weights, in percent or fractions, and equal weights when none are published', () => {
  assert.equal(weightedTotal(card().criteria), 7.45);
  assert.equal(weightedTotal(card().criteria.map((c) => ({ ...c, weight: c.weight / 100 }))), 7.45);
  assert.equal(weightedTotal([{ score: 8, weight: 0 }, { score: 7, weight: 0 }]), 7.5);
  assert.throws(() => weightedTotal([{ score: 8, weight: 25 }, { score: 7, weight: 0 }]), /every criterion/);
});

test('reconcile replaces the judge weights with the Contract, matches names loosely, and refuses a missing criterion', () => {
  const rubric = parseRubric(BULLSEYE);
  assert.deepEqual(rubric.map((r) => r.weight), [25, 25, 20, 15, 15]);
  const skewed = card().criteria.map((c) => (c.name === 'Innovation' ? { ...c, weight: 40, name: 'innovation' } : c));
  const r = reconcile(skewed, rubric);
  assert.equal(r.errors.length, 0);
  assert.equal(weightedTotal(r.criteria), 7.45);
  assert.ok(r.warnings.some((w) => /Contract says 25%/.test(w)));
  const loose = reconcile(card().criteria.map((c) => (c.name === 'Technical Excellence' ? { ...c, name: 'Technical excellence (code)' } : c)), rubric);
  assert.equal(loose.errors.length, 0);
  const missing = reconcile(card().criteria.filter((c) => c.name !== 'Scalability'), rubric);
  assert.match(missing.errors[0], /Scalability/);
});

test('the schema accepts a full scorecard and rejects what a recorder cannot trust', () => {
  assert.deepEqual(validate(schema, card()), []);
  const bad = card();
  bad.criteria[0].score = 11;
  bad.criteria[1].evidence = '  ';
  const errors = validate(schema, bad);
  assert.ok(errors.some((e) => e.includes('criteria[0].score')));
  assert.ok(errors.some((e) => e.includes('criteria[1].evidence')));
  assert.ok(validate(schema, card({ type: 'blind', wow: undefined })).some((e) => e.includes('"coverage"')));
  assert.ok(validate(schema, card({ type: 'verify-fixes' })).some((e) => e.includes('"fix_verification"')));
  assert.ok(validate(schema, card({ type: 'newest-surface' })).some((e) => e.includes('"surfaces"')));
  assert.ok(validate(schema, card({ type: 'adversarial', wow: undefined })).some((e) => e.includes('"wow"')));
});

test('extractJson reads a pasted reply with one JSON block', () => {
  const reply = `# Verdict\n\nGood work.\n\n\`\`\`json\n${JSON.stringify(card())}\n\`\`\`\n\nBlockers: none.`;
  assert.equal(extractJson(reply).weighted_total, 7.45);
  assert.throws(() => extractJson('no json here'), /no JSON object/);
});

test('stopReasons fires after two rounds under +0.2, or when the code is maxed', () => {
  assert.deepEqual(stopReasons([{ total: 7.3 }, { total: 7.6 }, { total: 7.7 }], card()), []);
  assert.equal(stopReasons([{ total: 7.7 }, { total: 7.9 }, { total: 8.0 }], card()).length, 0, 'a +0.2 step still counts as progress');
  assert.equal(stopReasons([{ total: 7.7 }, { total: 7.8 }, { total: 7.85 }], card()).length, 1);
  assert.equal(stopReasons([{ total: 7.0 }], card({ code_maxed: true })).length, 1);
});

test('records a round: the Judge rounds row, a Log block above older blocks, and a triage sheet', () => {
  const dir = project();
  const file = save(dir, 'judging/round-1/scorecard-adversarial.json', card());
  const r = run(dir, file);
  assert.equal(r.status, 0, r.stderr);
  const text = md(dir);
  const row = rows(text);
  assert.equal(row.length, 1);
  assert.match(row[0], /^\| R1 \| adversarial \| \d{4}-\d{2}-\d{2} \| 7\.45 \| Business Impact 7 \| Modal says sent; nothing is sent \(high\) \| pending \|$/);
  assert.ok(text.indexOf('### ▶ STATUS · Judge round 1 (adversarial)') < text.indexOf('### ▶ STATUS · {{pass name}}'), 'newest log block first');
  assert.match(text, /- Numbers: Innovation 8 · Business Impact 7 · Technical Excellence 8 · Scalability 7 · User Experience 7 → 7\.45/);
  const triage = fs.readFileSync(path.join(dir, 'judging', 'round-1', 'triage.md'), 'utf8');
  assert.match(triage, /\| F2 \| high \| Modal says sent; nothing is sent \| src\/Response\.tsx:41 \| Say prepared \|/);
  assert.match(triage, /- \(judge\) permit id looked invented: real id in data\/seed\.ts:12/);
  assert.match(triage, /<!-- Verdict:/, 'guidance comments stay for the builder');
  assert.match(r.stdout, /Stop rule: keep going/);
});

test('recomputes a wrong total and the judge weights, and says so', () => {
  const dir = project();
  const skewed = card({ weighted_total: 8.9 });
  skewed.criteria[0].weight = 40;
  const r = run(dir, save(dir, 'judging/round-1/scorecard-adversarial.json', skewed));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /stated a weighted total of 8\.9; the exact weights give 7\.45/);
  assert.match(r.stdout, /Contract says 25%/);
  assert.match(rows(md(dir))[0], /\| 7\.45 \|/);
});

test('re-recording a round replaces its row and keeps the Fixed? cell the builder set', () => {
  const dir = project();
  const file = save(dir, 'judging/round-1/scorecard-adversarial.json', card());
  assert.equal(run(dir, file).status, 0);
  fs.writeFileSync(path.join(dir, 'BULLSEYE.md'), md(dir).replace('| pending |', '| yes: 2 of 2 fixed |'));
  assert.equal(run(dir, file).status, 0);
  const row = rows(md(dir));
  assert.equal(row.length, 1);
  assert.match(row[0], /\| yes: 2 of 2 fixed \|$/);
});

test('rejects an invalid scorecard and one that skips a Contract criterion', () => {
  const dir = project();
  const bad = card();
  delete bad.criteria[0].evidence;
  const r = run(dir, save(dir, 'judging/round-1/scorecard-adversarial.json', bad));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Scorecard rejected/);
  const short = card({ criteria: card().criteria.slice(0, 4) });
  const r2 = run(dir, save(dir, 'judging/round-1/scorecard-adversarial.json', short));
  assert.equal(r2.status, 1);
  assert.match(r2.stderr, /User Experience/);
  assert.equal(rows(md(dir)).length, 0, 'nothing recorded');
});

test('needs BULLSEYE.md unless --dry, and --dry writes nothing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'judge-panel-round-'));
  const file = save(dir, 'card.json', card());
  assert.equal(run(dir, file).status, 1);
  const dry = run(dir, file, '--dry');
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /Dry run: nothing written/);
  assert.ok(!fs.existsSync(path.join(dir, 'judging')));
});

test('accepts a pasted reply and files the scorecard inside the round folder', () => {
  const dir = project();
  const reply = save(dir, 'judging/round-1/verdict-adversarial.md', `Verdict.\n\n\`\`\`json\n${JSON.stringify(card())}\n\`\`\`\n`);
  const r = run(dir, reply);
  assert.equal(r.status, 0, r.stderr);
  const saved = JSON.parse(fs.readFileSync(path.join(dir, 'judging', 'round-1', 'scorecard-adversarial.json'), 'utf8'));
  assert.equal(saved.round, 1);
});

test('compares rounds, and prints STOP after two rounds that each add less than 0.2', () => {
  const dir = project();
  assert.equal(run(dir, save(dir, 'judging/round-1/scorecard-adversarial.json', card())).status, 0);
  const second = run(dir, save(dir, 'judging/round-2/scorecard-verify-fixes.json', withBusiness(7.6, { round: 2, type: 'verify-fixes', prior_score: 7.45, build_next: 'b', fix_verification: [{ fix: 'f', status: 'confirmed', evidence: 'e' }] })));
  assert.equal(second.status, 0, second.stderr);
  assert.match(second.stdout, /weighted 7\.60 \(\+0\.15 vs R1\)/);
  assert.match(second.stdout, /keep going/);
  const third = run(dir, save(dir, 'judging/round-3/scorecard-adversarial.json', withBusiness(8, { round: 3 })));
  assert.equal(third.status, 0, third.stderr);
  assert.match(third.stdout, /STOP RULE: stop judging code \(two rounds in a row added less than 0\.2/);
  assert.match(md(dir), /- Stop rule: STOP judging code/);
  assert.deepEqual(rows(md(dir)).map((l) => l.split('|')[1].trim()), ['R1', 'R2', 'R3']);
});

test('two judges in one round share one row with the mean and both totals', () => {
  const dir = project();
  const blind = withBusiness(7.8, { round: 1, type: 'blind', wow: undefined, coverage: [{ item: 'i', status: 'covered', evidence: 'e' }] });
  assert.equal(run(dir, save(dir, 'judging/round-1/scorecard-blind.json', blind)).status, 0);
  const r = run(dir, save(dir, 'judging/round-1/scorecard-newest-surface.json', card({ type: 'newest-surface', surfaces: [{ surface: 's', verdict: 'honest', evidence: 'e' }] })));
  assert.equal(r.status, 0, r.stderr);
  const row = rows(md(dir));
  assert.equal(row.length, 1);
  assert.match(row[0], /^\| R1 \| blind \+ newest-surface \| .* \| 7\.55 \(7\.65 \/ 7\.45\) \|/);
});

test('--compare flags criterion gaps of 1 or more', () => {
  const dir = project();
  const a = save(dir, 'a.json', card());
  const b = save(dir, 'b.json', withBusiness(9));
  const r = run('--compare', a, b, '--project', dir);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Business Impact\s+7\s+9\s+\+2\.00\s+<- read both evidence strings/);
  assert.match(r.stdout, /weighted\s+7\.45\s+7\.95\s+\+0\.50/);
  assert.doesNotMatch(r.stdout, /Innovation.*<- read both/);
});

test('--help exits 0 and bad arguments exit 2', () => {
  assert.equal(run('--help').status, 0);
  assert.equal(run('--compare', 'only-one.json').status, 2);
  assert.equal(run('--frobnicate').status, 2);
  assert.equal(run().status, 2);
});

test('writes into the real BULLSEYE.md template from the bullseye skill', (t) => {
  const templatePath = path.join(repo, 'skills', 'bullseye', 'assets', 'BULLSEYE.template.md');
  if (!fs.existsSync(templatePath)) {
    t.skip('the bullseye skill is not installed beside this one');
    return;
  }
  const header = /\| Criterion \| Weight \|[^\n]*\n\|[-| :]+\|\n/;
  const template = fs.readFileSync(templatePath, 'utf8');
  assert.match(template, header, 'the control file still has a "Criterion | Weight" table');
  const filledIn = template.replace(header, (m) => `${m}| Innovation | 25 | | | | |\n| Business Impact | 25 | | | | |\n| Technical Excellence | 20 | | | | |\n| Scalability | 15 | | | | |\n| User Experience | 15 | | | | |\n`);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'judge-panel-round-'));
  fs.writeFileSync(path.join(dir, 'BULLSEYE.md'), filledIn);
  const r = run(dir, save(dir, 'judging/round-1/scorecard-adversarial.json', card()));
  assert.equal(r.status, 0, r.stderr);
  const out = md(dir);
  const row = rows(out);
  assert.equal(row.length, 1);
  assert.ok(out.indexOf(row[0]) > out.indexOf('## Judge rounds') && out.indexOf(row[0]) < out.indexOf('## Submission'), 'the row lands in the Judge rounds table');
  assert.ok(out.indexOf('### ▶ STATUS · Judge round 1') > out.indexOf('## Log'), 'the block lands in the Log');
  assert.equal(out.split('\n').length, filledIn.split('\n').length + 1 + 6, 'one row and one six-line block added, nothing else touched');
});

test('upsertJudgeRow adds the section before Submission when it is missing, and prependLog adds a Log', () => {
  const bare = '# BULLSEYE · X · Y\n\n## Contract\n\nfacts\n\n## Submission\n- [ ] tag\n';
  const withRow = upsertJudgeRow(bare, 1, '| R1 | adversarial | 2026-10-20 | 7.45 | B 7 | t (high) | pending |');
  assert.ok(withRow.indexOf('## Judge rounds') < withRow.indexOf('## Submission'));
  assert.match(withRow, /\| Round \| Type \| Date \| Weighted score \| Lowest criterion \| Top finding \| Fixed\? \|\n\|---\|/);
  const withLog = prependLog(withRow, '### ▶ STATUS · Judge round 1 (adversarial) · now');
  assert.match(withLog, /## Log\n\n### ▶ STATUS · Judge round 1/);
});
