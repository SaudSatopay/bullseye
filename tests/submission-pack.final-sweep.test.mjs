// Tests for skills/submission-pack/scripts/final-sweep.mjs.
// Run from the repo root: node --test tests/submission-pack.final-sweep.test.mjs
// Every problem string (a fake key, an em dash, a home path, a marker word) is assembled at runtime, so this
// file holds no key-shaped literal and nothing the repo's own validator or the sweep itself would flag.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(here, '..', 'skills', 'submission-pack', 'scripts', 'final-sweep.mjs');
const { checkUrl, parseGate, gateTable, matchesGlob } = await import(pathToFileURL(SCRIPT).href);

const EM_DASH = String.fromCharCode(0x2014);
const MIDDOT = String.fromCharCode(0xb7);
const FAKE_KEY = ['sk', 'ant', 'api03', 'Q7'.repeat(24)].join('-');
const HOME_PATH = ['C:', 'Users', 'builder', 'proj', 'out'].join('\\');
const MARKER = ['TO', 'DO'].join('');

// Keep git from finding a repository above the temp folders.
const env = { ...process.env, GIT_CEILING_DIRECTORIES: os.tmpdir() };
const roots = [];
test.after(() => {
  for (const dir of roots) fs.rmSync(dir, { recursive: true, force: true });
});

function project(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sweep-'));
  roots.push(dir);
  for (const [rel, content] of Object.entries(files)) {
    const file = path.join(dir, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  return dir;
}

function sweep(dir, ...args) {
  const r = spawnSync(process.execPath, [SCRIPT, dir, '--json', ...args], { encoding: 'utf8', env });
  let report = null;
  try {
    report = JSON.parse(r.stdout);
  } catch {
    // left null; the assertions say why
  }
  return { code: r.status, report, stdout: r.stdout, stderr: r.stderr };
}

const find = (report, check, file) => report.findings.filter((f) => f.check === check && (file === undefined || f.file === file));
const hasGit = spawnSync('git', ['--version'], { env }).status === 0;
function git(dir, ...args) {
  const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8', env });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${r.stderr}`);
  return r.stdout.trim();
}

const GATE = [
  'status: phase=package',
  'process: private',
  '',
  '## Contract',
  '',
  '### Requirements gate',
  '',
  '<!-- One line per deliverable: - [ ] R<n> [hard|scored] <requirement> -->',
  `- [x] R1 [hard] Repo public with an MIT licence ${MIDDOT} check: cmd: node -e "console.log('PUBLIC mit')" (pass: PUBLIC and mit) ${MIDDOT} source: rules, read 2026-10-16`,
  `- [ ] R2 [hard] Demo video at most 3:00 ${MIDDOT} check: cmd: node -e "console.log(172.8)" (pass: 180 or less); manual: opens in a private window ${MIDDOT} source: FAQ, read 2026-10-16`,
  `- [ ] R3 [scored] The sponsor tech does real work ${MIDDOT} check: manual: the README answers the sponsor test ${MIDDOT} source: rules, read 2026-10-16`,
  `- [ ] R4 [hard] README section "Codex collaboration" ${MIDDOT} check: cmd: grep -in "codex collaboration" README.md (pass: a heading matches) ${MIDDOT} source: rules, read 2026-10-16`,
  '- [ ] R5 a line that lost its shape',
  `- [x] R6 [hard] LICENSE file present ${MIDDOT} check: cmd: node -e "process.exit(3)" (pass: exit 0) ${MIDDOT} source: rules, read 2026-10-16`,
  '',
  '## Thesis',
  '',
].join('\n');

test('every planted problem is reported and the exit code is 1', () => {
  const dir = project({
    'README.md': [
      '# Demo',
      '',
      '**Demo measures one thing.**',
      '',
      'Try the [live demo](http://localhost:3000).',
      '',
      'Video: {VIDEO_URL}',
      '',
      'The suite has 58 tests.',
      '',
      `A sentence with an em dash ${EM_DASH} right here.`,
      '',
      '## Run it locally',
      '',
      '```bash',
      'npm start',
      '```',
      '',
    ].join('\n'),
    'facts.json': JSON.stringify({ tests: { count: 59 } }),
    'src/config.js': `export const key = "${FAKE_KEY}";\n`,
    'scripts/build.ps1': `$out = "${HOME_PATH}"\n`,
  });
  const { code, report, stdout } = sweep(dir, '--no-history', '--require', 'For judges', '--require', 'Run it locally');
  assert.equal(code, 1);
  assert.ok(report, 'the --json output parses');
  assert.equal(report.summary.result, 'FAIL');

  const sections = find(report, 'required-section', 'README.md');
  assert.equal(sections.length, 1, 'only the missing section is reported');
  assert.equal(sections[0].level, 'ERROR');
  assert.match(sections[0].message, /For judges/);

  assert.ok(find(report, 'placeholder', 'README.md').some((f) => f.level === 'ERROR' && /VIDEO_URL/.test(f.message)));
  assert.ok(find(report, 'localhost-link', 'README.md').some((f) => f.level === 'ERROR'));
  assert.ok(find(report, 'abs-path', 'scripts/build.ps1').some((f) => f.level === 'ERROR'));

  const secrets = find(report, 'secret', 'src/config.js');
  assert.equal(secrets.length, 1);
  assert.equal(secrets[0].level, 'ERROR');
  assert.ok(!stdout.includes(FAKE_KEY), 'the key is masked in the output');

  const stale = find(report, 'stale-count', 'README.md');
  assert.equal(stale.length, 1);
  assert.equal(stale[0].level, 'ERROR');
  assert.match(stale[0].message, /58 tests.*59/);

  const dash = find(report, 'em-dash', 'README.md');
  assert.equal(dash.length, 1);
  assert.equal(dash[0].level, 'WARN');
});

test('a clean project exits 0', () => {
  const dir = project({
    'README.md': [
      '# Demo',
      '',
      '**Demo measures what the network can still carry.**',
      '',
      `[Live demo](https://demo.vercel.app) ${MIDDOT} [Code](https://github.com/team/demo)`,
      '',
      '## For judges: 60 seconds',
      '',
      '1. Open the live demo and press Run.',
      '',
      '## Evidence',
      '',
      '| What was tested | Result |',
      '|---|---|',
      '| The suite | 59 tests pass |',
      '',
      '## Run it locally',
      '',
      '```bash',
      'npm install',
      'npm run dev   # http://localhost:3000',
      '```',
      '',
    ].join('\n'),
    'facts.json': JSON.stringify({ tests: { count: 59 } }),
    'src/app.js': 'export const answer = 42;\n',
  });
  const { code, report } = sweep(dir, '--no-history', '--require', 'For judges', '--require', 'Run it locally');
  assert.equal(code, 0, JSON.stringify(report && report.findings, null, 2));
  assert.equal(report.summary.errors, 0);
  assert.equal(report.summary.result, 'PASS');
  assert.match(report.summary.line, /^sweep: PASS, 0 errors/);
});

test('--strict-prose turns em dashes into errors, and dashes inside HTML comments are ignored', () => {
  const dir = project({
    'README.md': `# Demo\n\nOne line ${EM_DASH} with a dash.\n`,
    'docs/notes.md': `Visible text. <!-- a dash ${EM_DASH} in a comment -->\n`,
  });
  const loose = sweep(dir, '--no-history');
  assert.equal(loose.code, 0);
  assert.equal(find(loose.report, 'em-dash').length, 1);
  const strict = sweep(dir, '--no-history', '--strict-prose');
  assert.equal(strict.code, 1);
  assert.equal(find(strict.report, 'em-dash')[0].level, 'ERROR');
});

test('the requirements gate: open hard lines are errors, open scored lines warnings, ticked lines pass', () => {
  const dir = project({ 'BULLSEYE.md': GATE, 'README.md': '# Demo\n\n## Run it locally\n' });
  const { code, report } = sweep(dir, '--no-history');
  assert.equal(code, 1);
  const req = find(report, 'requirements', 'BULLSEYE.md');
  assert.ok(req.some((f) => f.level === 'ERROR' && /^R2 \[hard\] open: Demo video at most 3:00/.test(f.message)));
  assert.ok(req.some((f) => f.level === 'ERROR' && /^R4 \[hard\] open/.test(f.message)));
  assert.ok(req.some((f) => f.level === 'WARN' && /^R3 \[scored\] open/.test(f.message)));
  assert.ok(!req.some((f) => /^R1\b|^R6\b/.test(f.message)), 'ticked lines pass when the gate is not run');
  assert.ok(req.some((f) => f.level === 'WARN' && /not in the gate shape/.test(f.message)), 'a malformed R line is reported');
  const section = find(report, 'required-section', 'README.md');
  assert.ok(section.some((f) => /codex collaboration/i.test(f.message) && /R4/.test(f.message)), 'a README grep check becomes a required section');
});

test('--run-gate runs each cmd: check and prints its output beside the pass condition', () => {
  const dir = project({ 'BULLSEYE.md': GATE, 'README.md': '# Demo\n' });
  const { report } = sweep(dir, '--no-history', '--run-gate', '--only', 'requirements');
  const r2 = report.gateRuns.find((g) => g.id === 'R2');
  assert.ok(r2, 'R2 ran');
  assert.equal(r2.exitCode, 0);
  assert.equal(r2.pass, '180 or less');
  assert.ok(r2.tail.some((line) => line.includes('172.8')), 'the output is captured');
  assert.equal(report.gateRuns.length, 4, 'R1, R2, R4 and R6 have cmd: checks; R3 is manual');
  const req = find(report, 'requirements', 'BULLSEYE.md');
  assert.ok(req.some((f) => f.level === 'WARN' && /^R6 is ticked, but its check failed just now \(exit 3\)/.test(f.message)), 'a stale tick is flagged');
  assert.ok(!req.some((f) => /^R1 is ticked/.test(f.message)), 'a ticked line whose check passes is not flagged');
});

test('--gate-table prints a Requirement | Where it is table, and parseGate reads the shape', () => {
  const dir = project({ 'BULLSEYE.md': GATE });
  const r = spawnSync(process.execPath, [SCRIPT, dir, '--gate-table'], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^\| Requirement \| Where it is \|/);
  assert.match(r.stdout, /\| R2 \[hard\] Demo video at most 3:00 \| \{\{where/);
  const gate = parseGate(GATE);
  assert.equal(gate.items.length, 5);
  assert.deepEqual(gate.items[1].cmds, [{ cmd: 'node -e "console.log(172.8)"', pass: '180 or less' }]);
  assert.deepEqual(gate.items[1].manual, ['opens in a private window']);
  assert.equal(gate.malformed.length, 1);
  assert.match(gateTable(gate), /R4 \[hard\] README section "Codex collaboration"/);
});

test('git mode: a tracked .env, an unignored .env.local and a tracked process file are errors', (t) => {
  if (!hasGit) return t.skip('git is not installed');
  const dir = project({ 'README.md': '# Demo\n', '.env': 'X=1\n', '.env.local': 'Y=2\n', 'BULLSEYE.md': 'process: private\n', '.gitignore': 'node_modules/\n' });
  git(dir, 'init', '-q');
  git(dir, 'add', 'README.md', '.env', 'BULLSEYE.md', '.gitignore');
  const { code, report } = sweep(dir, '--no-history');
  assert.equal(code, 1);
  assert.equal(report.mode, 'git');
  assert.ok(find(report, 'env-file', '.env').some((f) => f.level === 'ERROR' && /tracked/.test(f.message)));
  assert.ok(find(report, 'env-file', '.env.local').some((f) => f.level === 'ERROR' && /not covered/.test(f.message)));
  assert.ok(find(report, 'process-file', 'BULLSEYE.md').some((f) => f.level === 'ERROR'));
});

test('history: a key committed and later deleted is still reported, masked', (t) => {
  if (!hasGit) return t.skip('git is not installed');
  const dir = project({ 'README.md': '# Demo\n', 'config.js': `export const key = "${FAKE_KEY}";\n` });
  git(dir, 'init', '-q');
  const configured = (key) => spawnSync('git', ['config', '--get', key], { cwd: dir, encoding: 'utf8', env }).stdout.trim();
  if (configured('commit.gpgsign') === 'true' || configured('core.hooksPath')) return t.skip('commits here need signing or run hooks');
  const id = ['-c', 'user.name=sweep test', '-c', 'user.email=sweep@example.invalid'];
  git(dir, 'add', '.');
  git(dir, ...id, 'commit', '-q', '-m', 'add config');
  git(dir, 'rm', '-q', 'config.js');
  git(dir, ...id, 'commit', '-q', '-m', 'remove config');
  const { code, report, stdout } = sweep(dir);
  assert.equal(code, 1);
  const history = find(report, 'history');
  assert.equal(history.length, 1);
  assert.match(history[0].message, /Anthropic API key/);
  assert.ok(!stdout.includes(FAKE_KEY), 'the key is masked');
  assert.equal(find(report, 'secret').length, 0, 'the working tree is clean; only history holds the key');
});

test('form answers: over the field limit is an error, a stale stated count a warning', () => {
  const dir = project({
    'README.md': '# Demo\n',
    'SUBMISSION.md': [
      '# Form',
      '',
      '### Project title (12/20 chars)',
      '',
      'Demo: a tool that measures far too much',
      '',
      '### Tagline (10/200 chars)',
      '',
      'A short and honest tagline that runs to about sixty characters.',
      '',
    ].join('\n'),
  });
  const { code, report } = sweep(dir, '--no-history');
  assert.equal(code, 1);
  const budget = find(report, 'field-budget', 'SUBMISSION.md');
  assert.ok(budget.some((f) => f.level === 'ERROR' && /allows 20/.test(f.message)));
  assert.ok(budget.some((f) => f.level === 'WARN' && /says 10\/200/.test(f.message)));
});

test('config: upload caps, required sections, unknown keys, and the Next.js screenshot hint', () => {
  const dir = project({
    'README.md': '# Demo\n\n![Home](docs/home.png)\n',
    'next.config.mjs': 'export default {};\n',
    'docs/home.png': Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    'deck/deck.pdf': Buffer.alloc(Math.round(1.5 * 1024 * 1024)),
    'sweep.config.json': JSON.stringify({ maxFileMB: { 'deck/*.pdf': 1 }, requireSections: ['Run it locally'], unknownKey: true }),
  });
  const { code, report } = sweep(dir, '--no-history');
  assert.equal(code, 1);
  assert.ok(find(report, 'large-file', 'deck/deck.pdf').some((f) => f.level === 'ERROR'));
  assert.equal(find(report, 'dev-indicator').length, 1);
  assert.ok(find(report, 'required-section', 'README.md').some((f) => /Run it locally/.test(f.message)));
  assert.ok(find(report, 'config').some((f) => /unknownKey/.test(f.message)));
});

test('placeholders in code are warnings, Mermaid shapes are not placeholders, and sweep-ignore skips a line', () => {
  const dir = project({
    'README.md': [
      '# Demo',
      '',
      `This README names the word ${MARKER} on purpose. <!-- sweep-ignore -->`,
      '',
      '```mermaid',
      'flowchart LR',
      '  A --> B{{"A person approves"}}',
      '  B --> C{OK}',
      '```',
      '',
    ].join('\n'),
    'src/app.js': `// ${MARKER}: wire the real API\nexport const x = 1;\n`,
  });
  const { code, report } = sweep(dir, '--no-history');
  assert.equal(code, 0, JSON.stringify(report && report.findings, null, 2));
  assert.equal(find(report, 'placeholder', 'README.md').length, 0);
  assert.equal(find(report, 'placeholder', 'src/app.js')[0].level, 'WARN');

  const template = project({ 'README.md': '# Demo\n\n```mermaid\nflowchart LR\n  user(["{{who starts it}}"]) --> H{{"A hexagon"}}\n```\n' });
  const left = sweep(template, '--no-history');
  const found = find(left.report, 'placeholder', 'README.md');
  assert.equal(found.length, 1, 'a template placeholder inside Mermaid is still a placeholder');
  assert.match(found[0].message, /who starts it/);
  assert.doesNotMatch(found[0].message, /A hexagon/);
});

test('repo-link: a missing image and an image git ignores are errors; a your- link is a placeholder', (t) => {
  if (!hasGit) return t.skip('git is not installed');
  const dir = project({
    'README.md': [
      '# Demo',
      '',
      '![Hero](docs/hero.png)',
      '',
      '<img src=".missile/shot.png" alt="A shot from a local folder">',
      '',
      '![Phone](docs/Phone.PNG)',
      '',
      '[Code](https://github.com/your-username/demo) and [docs](https://nextjs.org/docs/app/building-your-application).',
      '',
    ].join('\n'),
    '.missile/shot.png': Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    'docs/phone.png': Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    '.gitignore': '.missile/\n',
  });
  git(dir, 'init', '-q');
  const { code, report } = sweep(dir, '--no-history');
  assert.equal(code, 1);
  const links = find(report, 'repo-link', 'README.md');
  assert.ok(links.some((f) => /docs\/hero\.png, which does not exist/.test(f.message)));
  assert.ok(links.some((f) => /\.missile\/shot\.png, which git ignores/.test(f.message)));
  if (fs.existsSync(path.join(dir, 'docs', 'Phone.PNG'))) {
    // A case-insensitive file system (Windows, macOS) opens the wrong-case path locally; GitHub will not.
    assert.ok(links.some((f) => /docs\/Phone\.PNG, but the file is docs\/phone\.png/.test(f.message)));
  }
  const placeholders = find(report, 'placeholder', 'README.md');
  assert.equal(placeholders.length, 1, 'only the your-username link is a placeholder');
  assert.match(placeholders[0].message, /your-username/);
});

test('globs: one segment, any depth, alternatives and a root anchor', () => {
  assert.ok(matchesGlob('deck/deck.pdf', '*.pdf'));
  assert.ok(matchesGlob('a/b/c.md', 'a/**/*.md'));
  assert.ok(matchesGlob('a/c.md', 'a/**/*.md'));
  assert.ok(matchesGlob('HANDOFF-H16.md', '/HANDOFF*.md'));
  assert.ok(!matchesGlob('docs/HANDOFF.md', '/HANDOFF*.md'));
  assert.ok(matchesGlob('slides.pptx', '*.{pdf,pptx}'));
});

test('checkUrl: answers, a missing page, a login wall and a 401, against a local server', async (t) => {
  const server = http.createServer((req, res) => {
    const routes = {
      '/ok': [200, {}],
      '/moved': [301, { location: '/ok' }],
      '/preview': [302, { location: '/login?next=/preview' }],
      '/protected': [401, {}],
    };
    const [status, headers] = routes[req.url] || [404, {}];
    res.writeHead(status, headers);
    res.end();
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await checkUrl(`${base}/ok`)).level, 'OK');
  assert.equal((await checkUrl(`${base}/moved`)).level, 'OK');
  const missing = await checkUrl(`${base}/missing`);
  assert.equal(missing.level, 'ERROR');
  assert.match(missing.message, /404/);
  const preview = await checkUrl(`${base}/preview`);
  assert.equal(preview.level, 'ERROR');
  assert.match(preview.message, /login/);
  assert.equal((await checkUrl(`${base}/protected`)).level, 'ERROR');
});

test('checkUrl: a private YouTube video is an error (oEmbed answers 401)', async () => {
  const fake = async () => ({ ok: false, status: 401, headers: new Headers(), body: null });
  const r = await checkUrl('https://youtu.be/abc123def', { fetchImpl: fake });
  assert.equal(r.level, 'ERROR');
  assert.match(r.message, /private/);
});

test('bad usage exits 2', () => {
  const r = spawnSync(process.execPath, [SCRIPT, '--no-such-flag'], { encoding: 'utf8', env });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /unknown option/);
  const missing = spawnSync(process.execPath, [SCRIPT, path.join(os.tmpdir(), 'no-such-folder-for-sweep')], { encoding: 'utf8', env });
  assert.equal(missing.status, 2);
});
