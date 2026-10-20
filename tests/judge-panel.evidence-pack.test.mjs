// Tests for skills/judge-panel/scripts/evidence-pack.mjs and the prompt templates it fills.
// Run: node --test tests/judge-panel.evidence-pack.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validate, fillSlots, parseJudges, parseWeightsNote, parsePsTitle, parseRubric } from '../skills/judge-panel/scripts/judging-lib.mjs';
import { DEFAULT_QUESTIONS, TEMPLATES, TYPES, buildSlots, publicUrl, runway } from '../skills/judge-panel/scripts/evidence-pack.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skill = path.join(repo, 'skills', 'judge-panel');
const script = path.join(skill, 'scripts', 'evidence-pack.mjs');
const PASTE_LINE = 'Paste into a fresh session with no memory of the build; it will evaluate cold.';
const EM_DASH = String.fromCharCode(0x2014);

const BULLSEYE = `# BULLSEYE · Lantern · Demo Hackathon 2026

status: phase=build step=3 updated=2026-10-18T10:00:00+03:00 next="Run the first judge round"
deadline: 2099-01-01T23:59:00+05:30 (local) · internal: 2098-12-31 · T-many
process: private

## Contract

| Fact | Value | Source |
|---|---|---|
| Event / organiser / platform | Demo Hackathon 2026 | event page |

**Rubric:**

| Criterion | Weight | What wins it | Our evidence | Where it shows | Owner |
|---|---|---|---|---|---|
| Innovation | 25% | a new idea | SECRET-NARRATIVE-EVIDENCE | deck | me |
| Business Impact | 25% | | | | |
| Technical Excellence | 20% | | | | |
| Scalability | 15% | | | | |
| User Experience | 15% | | | | |

**Judges:** founders and VCs, not metric-graders.

## Thesis
- One-liner: SECRET-THESIS we win because the others are weak

## Claims

| Claim as written | Value | Label | Measured by | Pinned by |
|---|---|---|---|---|

## Judge rounds
<!-- Owner: judge-panel. -->

| Round | Type | Date | Weighted score | Lowest criterion | Top finding | Fixed? |
|---|---|---|---|---|---|---|

## Submission
- [ ] README for judges

## Decisions
- 2026-10-18: SECRET-DECISION chose the engine over the chatbot.

## Log
<!-- All skills. Newest first. One block per pass. -->
`;

const CARD = {
  round: 1,
  type: 'adversarial',
  criteria: [
    { name: 'Innovation', weight: 25, score: 8, evidence: 'e' },
    { name: 'Business Impact', weight: 25, score: 7, evidence: 'e' },
    { name: 'Technical Excellence', weight: 20, score: 8, evidence: 'e' },
    { name: 'Scalability', weight: 15, score: 7, evidence: 'e' },
    { name: 'User Experience', weight: 15, score: 7, evidence: 'e' },
  ],
  weighted_total: 7.45,
  verdict: 'v',
  findings: [],
  non_issues: [],
  improvements: [],
  wow: [],
  biggest_gap: 'g',
  code_maxed: false,
};

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'judge-panel-pack-'));
}

function write(dir, rel, text) {
  const p = path.join(dir, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
}

const read = (dir, rel) => fs.readFileSync(path.join(dir, rel), 'utf8');

function run(dir, ...args) {
  return spawnSync(process.execPath, [script, dir, ...args], { encoding: 'utf8' });
}

function project({ ps = true, claims = true, limits = true, init = true } = {}) {
  const dir = tmp();
  write(dir, 'BULLSEYE.md', BULLSEYE);
  write(dir, 'README.md', '# Lantern\n\nA demo.\n\n## Honest caveats\n\n- README-CAVEAT: it runs on a digital twin.\n');
  write(dir, 'package.json', JSON.stringify({ name: 'lantern', scripts: { build: 'next build', start: 'next start', test: 'vitest run' } }));
  write(dir, '.env.example', 'API_KEY=\nDEMO_MODE=1\n');
  if (claims) write(dir, 'CLAIMS.md', '# Claims\n\n| Claim | Command | Value |\n|---|---|---|\n| CLAIM-RECALL 100% recall | npm run bench | 100% |\n');
  if (limits) write(dir, 'LIMITS.md', '# Limits\n\n- LIMIT-TWIN: it runs on a digital twin, not a live plant.\n');
  if (init) {
    const r = run(dir, '--init');
    assert.equal(r.status, 0, r.stderr);
  }
  if (ps) write(dir, 'judging/PS.md', '# Problem Statement 1: Zero-Harm Operations\n\nPS-VERBATIM-TEXT Build a safety intelligence layer.\n\n## Evaluation focus\n- accuracy versus single-sensor baselines\n');
  return dir;
}

function recordedRound(dir, n, triage) {
  write(dir, `judging/round-${n}/scorecard-adversarial.json`, JSON.stringify({ ...CARD, round: n }, null, 2));
  if (triage) write(dir, `judging/round-${n}/triage.md`, triage);
}

test('--help prints usage and exits 0', () => {
  const r = spawnSync(process.execPath, [script, '--help'], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /--type <type>/);
});

test('bad arguments exit 2', () => {
  const dir = project();
  assert.equal(run(dir, '--type', 'nonsense').status, 2);
  assert.equal(run(dir).status, 2);
  assert.equal(run(dir, '--type', 'adversarial', '--round', 'zero').status, 2);
});

test('--init creates pack.json and a PS stub, detects run commands and demo mode, and ignores judging/ once', () => {
  const dir = project({ ps: false });
  const pack = JSON.parse(read(dir, 'judging/pack.json'));
  assert.deepEqual(pack.run, ['npm install', 'npm run build && npm start', 'npm test']);
  assert.equal(pack.demo_mode, 'set DEMO_MODE=1 (named in .env.example)');
  assert.ok(pack.artifacts.includes('README.md'));
  assert.ok(!pack.artifacts.includes('BULLSEYE.md'));
  assert.match(read(dir, 'judging/PS.md'), /^<!--/);
  assert.equal(run(dir, '--init').status, 0);
  const gitignore = read(dir, '.gitignore');
  assert.equal(gitignore.split('\n').filter((l) => l.trim() === 'judging/').length, 1);
  assert.ok(gitignore.startsWith('# BULLSEYE judge rounds'), 'a new .gitignore starts with the rule, not a blank line');
  const existing = tmp();
  write(existing, '.gitignore', 'node_modules/');
  assert.equal(run(existing, '--init').status, 0);
  assert.equal(read(existing, '.gitignore'), 'node_modules/\n\n# BULLSEYE judge rounds: internal red-team material, never public\njudging/\n');
});

test('a blind round refuses to run without the problem statement, even with --allow-missing', () => {
  const dir = project({ ps: false });
  const r = run(dir, '--type', 'blind');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /judging\/PS\.md/);
  assert.equal(run(dir, '--type', 'blind', '--allow-missing').status, 1);
  assert.ok(!fs.existsSync(path.join(dir, 'judging', 'round-1', 'PROMPT-blind.md')));
});

test('a blind round gets the problem statement, the rubric and the submission, and nothing else', () => {
  const dir = project();
  const r = run(dir, '--type', 'blind');
  assert.equal(r.status, 0, r.stderr);
  const prompt = read(dir, 'judging/round-1/PROMPT-blind.md');
  assert.equal(prompt.split('\n')[0], PASTE_LINE);
  for (const want of ['PS-VERBATIM-TEXT', '| Innovation | 25% |', '| User Experience | 15% |', 'founders and VCs, not metric-graders', 'npm run build && npm start', 'judging/round-1/scorecard-blind.json', '"type": "blind"']) {
    assert.ok(prompt.includes(want), `blind prompt should include ${want}`);
  }
  for (const banned of ['CLAIM-RECALL', 'LIMIT-TWIN', 'README-CAVEAT', 'SECRET-', 'UTF-16']) {
    assert.ok(!prompt.includes(banned), `blind prompt must not include ${banned}`);
  }
  assert.ok(!prompt.includes('{{'), 'no unfilled slots');
  assert.ok(!prompt.includes('<!--'), 'template comments are stripped');
  const pack = read(dir, 'judging/round-1/PACK-blind.md');
  assert.ok(pack.includes('PS-VERBATIM-TEXT') && !pack.includes('CLAIM-RECALL') && !pack.includes('SECRET-'));
  assert.ok(fs.existsSync(path.join(dir, 'judging', 'round-1', 'judge-scorecard.schema.json')));
});

test('an adversarial round carries the claims, the declared limits, abuse inputs and earlier non-issues, never the narrative', () => {
  const dir = project();
  recordedRound(dir, 1, '# Triage\n\n## Non-issues\n\n- NONISSUE-PERMIT: the id is real (data/seed.ts:12)\n\n## Fixes\n');
  const r = run(dir, '--type', 'adversarial');
  assert.equal(r.status, 0, r.stderr);
  const prompt = read(dir, 'judging/round-2/PROMPT-adversarial.md');
  for (const want of ['CLAIM-RECALL', 'LIMIT-TWIN', '(R1) NONISSUE-PERMIT', 'UTF-16', 'Runway left: about', 'PS-VERBATIM-TEXT', 'set DEMO_MODE=1']) {
    assert.ok(prompt.includes(want), `adversarial prompt should include ${want}`);
  }
  assert.ok(!prompt.includes('SECRET-'), 'BULLSEYE.md narrative never reaches the judge');
  assert.ok(!prompt.includes('{{') && !prompt.includes('<!--'));
  assert.ok(prompt.includes('The jury is founders and VCs, not metric-graders.'));
  assert.equal(run(dir, '--type', 'adversarial', '--persona', 'senior bankers and risk officers').status, 0);
  assert.ok(read(dir, 'judging/round-2/PROMPT-adversarial.md').includes('The jury is senior bankers and risk officers.'), '--persona overrides the Contract');
});

test('limits fall back to the README caveats section when LIMITS.md is missing', () => {
  const dir = project({ limits: false });
  assert.equal(run(dir, '--type', 'adversarial').status, 0);
  assert.ok(read(dir, 'judging/round-1/PROMPT-adversarial.md').includes('README-CAVEAT'));
});

test('the round number reuses an open round and moves on once a scorecard exists', () => {
  const dir = project();
  assert.equal(run(dir, '--type', 'adversarial').status, 0);
  assert.equal(run(dir, '--type', 'blind').status, 0);
  assert.ok(fs.existsSync(path.join(dir, 'judging', 'round-1', 'PROMPT-adversarial.md')));
  assert.ok(fs.existsSync(path.join(dir, 'judging', 'round-1', 'PROMPT-blind.md')));
  recordedRound(dir, 1);
  assert.equal(run(dir, '--type', 'adversarial').status, 0);
  assert.ok(fs.existsSync(path.join(dir, 'judging', 'round-2', 'PROMPT-adversarial.md')));
});

test('verify-fixes needs the previous score and its fixes, and quotes both', () => {
  const dir = project();
  const first = run(dir, '--type', 'verify-fixes');
  assert.equal(first.status, 1);
  assert.match(first.stderr, /prior_score/);
  assert.match(first.stderr, /claimed_fixes/);
  recordedRound(dir, 1, '# Triage\n\n## Fixes\n\n<!-- guidance -->\n1. FIX-PAYLOAD the payload says prepared. Check: GET /api/response.\n\n## Next round\n');
  const r = run(dir, '--type', 'verify-fixes');
  assert.equal(r.status, 0, r.stderr);
  const prompt = read(dir, 'judging/round-2/PROMPT-verify-fixes.md');
  assert.ok(prompt.includes('FIX-PAYLOAD'));
  assert.ok(prompt.includes('**7.45/10**'), 'the prior score is recomputed from the recorded scorecard');
  assert.ok(prompt.includes('lowest criterion: Business Impact 7'), 'ties go to the heavier criterion');
  assert.ok(prompt.includes('moved from 7.45'));
});

test('newest-surface quotes the next-round surfaces and drops the Type line', () => {
  const dir = project();
  recordedRound(dir, 1, '# Triage\n\n## Next round\n\nType: newest-surface\n- **SURFACE-FLEET** (GET /api/fleet): honest or a sleight of hand?\n');
  const r = run(dir, '--type', 'newest-surface');
  assert.equal(r.status, 0, r.stderr);
  const prompt = read(dir, 'judging/round-2/PROMPT-newest-surface.md');
  assert.ok(prompt.includes('SURFACE-FLEET'));
  assert.ok(!/Type: newest-surface/.test(prompt));
  assert.ok(prompt.includes('Innovation 25% · Business Impact 25% · Technical Excellence 20%'));
  const pack = read(dir, 'judging/round-2/PACK-newest-surface.md');
  assert.ok(pack.includes('SURFACE-FLEET'));
  assert.ok(!prompt.includes('PS-VERBATIM-TEXT') && !pack.includes('PS-VERBATIM-TEXT'), 'the pack records only what this prompt carries');
});

test('mock-qa grades against the facts and falls back to the universal questions', () => {
  const dir = project();
  write(dir, 'facts.json', JSON.stringify({ tests: { count: 42 }, eval: { recall: '100%' } }));
  const r = run(dir, '--type', 'mock-qa');
  assert.equal(r.status, 0, r.stderr);
  const prompt = read(dir, 'judging/qa-1/PROMPT.md');
  assert.ok(prompt.includes('tests.count: 42'));
  assert.ok(prompt.includes('CLAIM-RECALL'));
  assert.ok(prompt.includes(DEFAULT_QUESTIONS[0]));
  assert.ok(prompt.includes('LIMIT-TWIN'));
  assert.equal(prompt.split('\n')[0], PASTE_LINE);
  const bare = project({ claims: false });
  assert.equal(run(bare, '--type', 'mock-qa').status, 1, 'no facts at all means the rehearsal judge cannot catch a wrong number');
});

test('mock-qa uses QA-BANK.md when it exists', () => {
  const dir = project();
  write(dir, 'QA-BANK.md', '# Q&A bank\n\n- BANK-QUESTION: who pays?\n');
  assert.equal(run(dir, '--type', 'mock-qa').status, 0);
  const prompt = read(dir, 'judging/qa-1/PROMPT.md');
  assert.ok(prompt.includes('BANK-QUESTION'));
  assert.ok(!prompt.includes(DEFAULT_QUESTIONS[0]));
});

test('a partly written document still counts, and the builder hears about its leftover placeholders', () => {
  const dir = project();
  write(dir, 'CLAIMS.md', '# Claims\n\n| Claim | Command |\n|---|---|\n| CLAIM-REAL 59 tests | npm test |\n| {{88.1%}} held out | {{scripts/eval.mjs}} |\n');
  write(dir, 'QA-BANK.md', '# Q&A bank\n\n**Q: BANK-REAL who pays?**\nLIVE: {{2 to 5 sentences}}\n');
  const r = run(dir, '--type', 'adversarial');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /CLAIMS\.md still has 2 unfilled template placeholder/);
  assert.ok(read(dir, 'judging/round-1/PROMPT-adversarial.md').includes('CLAIM-REAL'), 'the public ledger reaches the judge as the jury would read it');
  write(dir, 'facts.json', '{"tests": 59}');
  assert.equal(run(dir, '--type', 'mock-qa').status, 0);
  const qa = read(dir, 'judging/qa-1/PROMPT.md');
  assert.ok(qa.includes('BANK-REAL') && !qa.includes(DEFAULT_QUESTIONS[0]), 'a half-written bank is still the bank');
});

test('claims-audit writes its prompt and names the ledger and the report path', () => {
  const dir = project();
  write(dir, 'tests/a.test.mjs', '');
  const r = run(dir, '--type', 'claims-audit');
  assert.equal(r.status, 0, r.stderr);
  const prompt = read(dir, 'judging/audit-1/PROMPT.md');
  assert.ok(prompt.includes('- `CLAIMS.md`') && prompt.includes('- `LIMITS.md`') && prompt.includes('`tests/` (the test suite)'));
  assert.ok(prompt.includes('judging/audit-1/AUDIT.md'));
  assert.ok(prompt.includes('Claims check command: none'), 'no check exists yet');
  assert.equal(run(dir, '--type', 'claims-audit').status, 0);
  assert.ok(!fs.existsSync(path.join(dir, 'judging', 'audit-2')), 'an audit without AUDIT.md is still open');
  write(dir, 'scripts/claims-check.mjs', '');
  write(dir, 'claims.json', '{}');
  fs.rmSync(path.join(dir, 'judging', 'pack.json'));
  assert.equal(run(dir, '--type', 'claims-audit').status, 0);
  assert.ok(read(dir, 'judging/audit-1/PROMPT.md').includes('Claims check command: node scripts/claims-check.mjs claims.json'), "prove-it's checker is found");
});

test('warns when judging/ is not gitignored', () => {
  const dir = project({ init: false });
  const r = run(dir, '--type', 'adversarial');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /judging\/ is not in \.gitignore/);
});

test('only tracked, public files are listed as deliverables', (t) => {
  if (spawnSync('git', ['--version']).status !== 0) {
    t.skip('git is not installed');
    return;
  }
  const dir = project();
  write(dir, 'docs/deck.html', '<html></html>');
  write(dir, 'docs/blog-draft.md', 'draft');
  write(dir, 'docs/HANDOFF.md', 'notes');
  spawnSync('git', ['init', '-q'], { cwd: dir });
  spawnSync('git', ['add', 'README.md', 'CLAIMS.md', 'docs/deck.html', 'docs/HANDOFF.md'], { cwd: dir });
  fs.rmSync(path.join(dir, 'judging', 'pack.json'));
  assert.equal(run(dir, '--type', 'adversarial').status, 0);
  const prompt = read(dir, 'judging/round-1/PROMPT-adversarial.md');
  assert.ok(prompt.includes('`docs/deck.html`'));
  assert.ok(!prompt.includes('blog-draft'), 'untracked drafts are not deliverables');
  assert.ok(!prompt.includes('HANDOFF'), 'process notes are never deliverables');
});

test('every template opens with the paste line, and every slot in it is one the script fills', () => {
  const dir = project();
  write(dir, 'facts.json', '{"tests": 1}');
  recordedRound(dir, 1, '# Triage\n\n## Fixes\n\n1. A fix. Check: a command.\n\n## Next round\n\n- **A surface**: a question?\n');
  for (const type of TYPES) {
    const template = fs.readFileSync(path.join(skill, 'assets', TEMPLATES[type]), 'utf8');
    assert.equal(template.split(/\r?\n/)[0], PASTE_LINE, `${TEMPLATES[type]} opens with the paste line`);
    const { slots } = buildSlots(dir, type, 2);
    const used = [...template.matchAll(/\{\{\s*([a-z0-9_]+)\s*\}\}/g)].map((m) => m[1]);
    for (const name of used) assert.ok(Object.prototype.hasOwnProperty.call(slots, name), `${TEMPLATES[type]} uses {{${name}}}, which evidence-pack does not fill`);
  }
});

test('the JSON example in every judge template validates against the scorecard schema', () => {
  const schema = JSON.parse(fs.readFileSync(path.join(skill, 'assets', 'judge-scorecard.schema.json'), 'utf8'));
  for (const type of ['adversarial', 'verify-fixes', 'newest-surface', 'blind']) {
    const template = fs.readFileSync(path.join(skill, 'assets', TEMPLATES[type]), 'utf8');
    const block = template.match(/```json\s*\n([\s\S]*?)```/);
    assert.ok(block, `${TEMPLATES[type]} has a JSON example`);
    const example = JSON.parse(fillSlots(block[1], { round: '3' }, { keepComments: true }).text);
    assert.equal(example.type, type);
    assert.equal(example.round, 3);
    assert.deepEqual(validate(schema, example), [], `${TEMPLATES[type]} example is a valid scorecard`);
  }
});

test('the universal questions appear verbatim in references/personas.md', () => {
  const personas = fs.readFileSync(path.join(skill, 'references', 'personas.md'), 'utf8');
  for (const q of DEFAULT_QUESTIONS) assert.ok(personas.includes(q), `personas.md is missing: ${q}`);
});

test('no em dash in any judge-panel file, its agents or its tests', () => {
  const files = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else files.push(full);
    }
  })(skill);
  files.push(path.join(repo, 'agents', 'hackathon-judge.md'), path.join(repo, 'agents', 'claims-auditor.md'));
  for (const f of fs.readdirSync(path.join(repo, 'tests'))) if (f.startsWith('judge-panel.')) files.push(path.join(repo, 'tests', f));
  for (const f of files) assert.ok(!fs.readFileSync(f, 'utf8').includes(EM_DASH), `${path.relative(repo, f)} contains an em dash`);
});

test('reads the jury, the weights note and the problem statement title in every shape the control file uses', () => {
  assert.equal(parseJudges('## Contract\n\n### Judging\n\nJudges: founders and VCs, they see through hand-waving. Weights: published. Screening: none.\n'), 'founders and VCs, they see through hand-waving');
  assert.equal(parseJudges('## Contract\n\n**Judges:** founders and VCs, not metric-graders.\n'), 'founders and VCs, not metric-graders');
  assert.equal(parseJudges('## Contract\n\n## Thesis\n- **Jury:** senior bankers; weight what they reward: governance\n'), 'senior bankers');
  assert.equal(parseJudges('## Thesis\n\n**Jury:** race engineers who weight depth. Weight what they reward: rigour\n'), 'race engineers who weight depth');
  assert.equal(parseJudges('## Contract\n\nJudges: {{who they are}}. Weights: {{published}}.\n\n## Thesis\n- **Jury:** {{who}}; weight what they reward:\n'), null);
  assert.equal(parseWeightsNote("## Contract\n\nJudges: x. Weights: proxy built from last year's winners. Screening: none.\n"), "proxy built from last year's winners");
  assert.equal(parseWeightsNote('## Contract\n\nJudges: x. Weights: published. Screening: none.\n'), null);
  assert.equal(parsePsTitle('## Thesis\n\n**Problem statement:** PS1 · Zero-Harm Operations · runner-up: PS4 · why this one: data\n'), 'PS1 · Zero-Harm Operations');
  assert.equal(parsePsTitle('## Thesis\n- **Problem statement:** {{id}} · runner-up: {{id}} · why this one:\n'), null);
});

test('works on the real BULLSEYE.md template from the bullseye skill', (t) => {
  const templatePath = path.join(repo, 'skills', 'bullseye', 'assets', 'BULLSEYE.template.md');
  if (!fs.existsSync(templatePath)) {
    t.skip('the bullseye skill is not installed beside this one');
    return;
  }
  let md = fs.readFileSync(templatePath, 'utf8');
  md = md.replace(/^# BULLSEYE · .*$/m, '# BULLSEYE · Lantern · Demo AI Hackathon 2026');
  const header = /\| Criterion \| Weight \|[^\n]*\n\|[-| :]+\|\n/;
  assert.match(md, header, 'the control file still has a "Criterion | Weight" table: update parseRubric if this changed');
  md = md.replace(header, (m) => `${m}| Innovation | 25 | | | | |\n| Business Impact | 25 | | | | |\n| Technical Excellence | 20 | | | | |\n| Scalability | 15 | | | | |\n| User Experience | 15 | | | | |\n`);
  md = md.replace(/(\*\*Jury:\*\*)\s*\{\{who\}\}/, '$1 founders and VCs');
  assert.deepEqual(parseRubric(md).map((r) => [r.name, r.weight]), [['Innovation', 25], ['Business Impact', 25], ['Technical Excellence', 20], ['Scalability', 15], ['User Experience', 15]]);
  const dir = project();
  write(dir, 'BULLSEYE.md', md);
  assert.equal(run(dir, '--type', 'adversarial').status, 0);
  const prompt = read(dir, 'judging/round-1/PROMPT-adversarial.md');
  assert.ok(prompt.includes('| Innovation | 25% |') && prompt.includes('| User Experience | 15% |'), 'bare weights that sum to 100 are shown as percentages');
  if (md.includes('**Jury:** founders and VCs')) assert.ok(prompt.includes('The jury is founders and VCs.'));
  assert.ok(!prompt.includes('{{'), 'no placeholder from the control file leaks into the prompt');
});

test('publicUrl strips credentials and converts ssh remotes', () => {
  assert.equal(publicUrl('https://someone:not-a-real-token@github.com/acme/demo.git'), 'https://github.com/acme/demo');
  assert.equal(publicUrl('git@github.com:acme/demo.git'), 'https://github.com/acme/demo');
  assert.equal(publicUrl('https://gitlab.com/acme/demo'), 'https://gitlab.com/acme/demo');
});

test('runway reads the deadline line', () => {
  const now = new Date('2026-10-20T12:00:00+03:00');
  assert.equal(runway('2026-10-21T12:00:00+03:00 (local)', now), 'about 24 hours');
  assert.equal(runway('2026-10-23T12:00:00+0300', now), 'about 3 days');
  assert.equal(runway('2026-10-19T12:00:00Z', now), 'none, the deadline has passed');
  assert.equal(runway('not recorded', now), 'unknown');
});
