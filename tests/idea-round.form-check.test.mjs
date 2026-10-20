// Tests for skills/idea-round/scripts/form-check.mjs (form budgets, portal-safe text, anonymity, numbers).
// Run from the repo root: node --test tests/idea-round.form-check.test.mjs
// Every fixture is written to a fresh temp folder; nothing touches the network. Non-ASCII characters are
// built from code points so this file stays ASCII.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const skill = path.join(here, '..', 'skills', 'idea-round');
const script = path.join(skill, 'scripts', 'form-check.mjs');
const template = path.join(skill, 'assets', 'SUBMISSION-FORM.template.md');

const cp = (...codes) => String.fromCodePoint(...codes);
const EM_DASH = cp(0x2014);
const CURLY_APOSTROPHE = cp(0x2019);
const RUPEE = cp(0x20b9);
const BOM = cp(0xfeff);
const ZWJ = cp(0x200d);
const MACHHALI = cp(0x092e, 0x091b, 0x0932, 0x0940); // a Hindi word: four Devanagari code points

function write(content, name = 'SUBMISSION-FORM.md') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'form-check-'));
  const file = path.join(dir, name);
  fs.writeFileSync(file, content, 'utf8');
  return file;
}

function run(...args) {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

function report(file, ...args) {
  const r = run(file, '--json', ...args);
  assert.ok(r.code === 0 || r.code === 1, `exit ${r.code}: ${r.err}`);
  return { code: r.code, ...JSON.parse(r.out) };
}

const field = (heading, body) => `${heading}\n\n${body}\n\n`;
const messages = (f) => f.issues.map((i) => i.message).join('\n');

test('a field is counted the way a portal counts it and passes inside the fill band', () => {
  const r = report(write(`# Pack\n\n${field('## 6. Newness (950/1000 chars)', 'a'.repeat(950))}`));
  assert.equal(r.code, 0);
  assert.equal(r.fields.length, 1);
  const [f] = r.fields;
  assert.equal(f.name, '6. Newness');
  assert.equal(f.count, 950);
  assert.equal(f.limit, 1000);
  assert.equal(f.fill, 95);
  assert.equal(f.status, 'OK');
});

test('a field over its limit fails and the run exits 1', () => {
  const r = report(write(field('## Q1 (1010/1000 chars)', 'a'.repeat(1010))));
  assert.equal(r.code, 1);
  assert.equal(r.fields[0].status, 'FAIL');
  assert.match(messages(r.fields[0]), /over the limit by 10 chars/);
});

test('an under-filled binding limit warns, and --strict turns the warning into exit 1', () => {
  const file = write(field('## Concept (500/1000 chars)', 'a'.repeat(500)));
  const loose = report(file);
  assert.equal(loose.code, 0);
  assert.equal(loose.fields[0].status, 'WARN');
  assert.match(messages(loose.fields[0]), /fill 50\.0% is under 91%/);
  assert.equal(report(file, '--strict').code, 1);
});

test('short titles and very large limits are not held to the fill band', () => {
  const file = write(field('## Idea Title (60/100 chars)', 'b'.repeat(60)) + field('## Idea Description (3400/50000 chars)', 'c'.repeat(3400)));
  const r = report(file);
  assert.deepEqual(r.fields.map((f) => f.status), ['OK', 'OK']);
});

test('a stale count in a heading is reported until --fix rewrites it', () => {
  const r = report(write(field('## Applications (900/1000 chars)', 'a'.repeat(950))));
  assert.equal(r.fields[0].status, 'WARN');
  assert.match(messages(r.fields[0]), /the heading says 900, the text measures 950/);
});

test('HTML comments are neither pasted nor counted', () => {
  const body = [
    '<!-- guidance that is never pasted -->',
    'Hello world.',
    '<!-- a',
    'multiline note -->',
    'Second line <!-- inline --> ends.',
  ].join('\n');
  // Paste text: "Hello world." + line break + "Second line  ends." = 12 + 1 + 18 characters.
  const r = report(write(field('## Note (32/100 chars)', body)));
  assert.equal(r.fields[0].count, 32);
  assert.equal(r.fields[0].status, 'OK');
  assert.equal(report(write(field('## Note (31/100 chars)', body)), '--newline', '1').fields[0].count, 31);
});

test('a line break counts two characters by default and one with --newline 1', () => {
  const file = write(field('## Field (10/100 chars)', 'aaa\n\nbbb'));
  assert.equal(report(file).fields[0].count, 10);
  assert.equal(report(file, '--newline', '1').fields[0].count, 8);
});

test('word budgets count every run of non-space characters', () => {
  const r = report(write(field('## Q (6/10 words)', 'One two three - (1) four.')));
  assert.equal(r.fields[0].unit, 'words');
  assert.equal(r.fields[0].count, 6);
  assert.equal(r.fields[0].status, 'OK');
});

test('an em dash fails; curly quotes and the rupee sign warn with their ASCII stand-ins', () => {
  const body = `Ships in two weeks ${EM_DASH} on time. It${CURLY_APOSTROPHE}s priced at ${RUPEE}20,000.`;
  const r = report(write(field('## Pitch (?/200 chars)', body)));
  const [f] = r.fields;
  assert.equal(f.status, 'FAIL');
  const text = messages(f);
  assert.match(text, /em dash \(U\+2014\)/);
  assert.match(text, /curly apostrophe/);
  assert.match(text, /rupee sign \(U\+20B9\): use Rs/);
  assert.ok(f.issues.some((i) => /\[U\+2014\]/.test(i.context)), 'the snippet names the character by code point');
  const human = run(write(field('## Pitch (?/200 chars)', body)));
  assert.ok(!human.out.includes(EM_DASH), 'the printed report never echoes the em dash itself');
});

test('--forbid fails on the characters a portal strips and says what to write instead', () => {
  const body = "Targets 8-10% savings; the machine's baseline.";
  const file = write(field('## Objective (?/200 chars)', body));
  assert.equal(report(file).fields[0].status, 'OK');
  const r = report(file, '--forbid', "%';");
  assert.equal(r.code, 1);
  const text = messages(r.fields[0]);
  assert.match(text, /"%" is stripped or rejected by this portal: write "per cent"/);
  assert.match(text, /";" .*full stop or a comma/);
  assert.match(text, /"'" .*rephrase without it/);
});

test('--anon catches emails, phone numbers, links, domains and listed identity terms', () => {
  const body = 'Write to team@example.com or call +91 98765 43210. Demo at https://demo.example.app and github.com/acme/repo. Built by Acme Labs.';
  const r = report(write(field('## Team (?/200 chars)', body)), '--anon', '--terms', 'Acme Labs');
  assert.equal(r.code, 1);
  const text = messages(r.fields[0]);
  for (const kind of ['email address "team@example.com"', 'phone or ID number "+91 98765 43210"', 'link "https://demo.example.app"', 'domain name "github.com/acme/repo', 'identity term "Acme Labs"']) {
    assert.ok(text.includes(kind), `missing: ${kind}\n${text}`);
  }
  assert.ok(!text.includes('domain name "example.com"'), 'an email is not reported a second time as a domain');
});

test('--anon leaves ordinary numbers, ranges and abbreviations alone', () => {
  const body = 'A kit for 10-15 machines across 3-5 units, priced under Rs 20,000, built with B.Tech students in 2026 and 1,00,000 users in view.';
  const r = report(write(field('## Applications (?/200 chars)', body)), '--anon');
  assert.equal(r.fields[0].status, 'OK', messages(r.fields[0]));
});

test('Markdown that would paste literally is flagged', () => {
  const r = report(write(field('## Summary (?/200 chars)', 'This is **bold** and a [link](https://x.y).')));
  assert.equal(r.fields[0].status, 'WARN');
  const text = messages(r.fields[0]);
  assert.match(text, /bold markers \(\*\*\)/);
  assert.match(text, /Markdown link/);
});

test('--fix writes measured counts into the headings, keeps their style, and a second run changes nothing', () => {
  const file = write(
    field('## 6. Newness (0/1,500 chars)', 'a'.repeat(1400)) +
    field('## 7. Concept ({{n}}/1500 chars)', 'b'.repeat(1380)) +
    field('## Idea Description (~3,400 / 50,000 chars)', 'c'.repeat(4259)),
  );
  const first = report(file, '--fix');
  assert.equal(first.fixed, 3);
  const text = fs.readFileSync(file, 'utf8');
  assert.ok(text.includes('## 6. Newness (1,400/1,500 chars)'), text);
  assert.ok(text.includes('## 7. Concept (1380/1500 chars)'), text);
  assert.ok(text.includes('## Idea Description (4,259 / 50,000 chars)'), text);
  const second = report(file, '--fix');
  assert.equal(second.fixed, 0);
  assert.equal(fs.readFileSync(file, 'utf8'), text);
  assert.deepEqual(report(file).fields.map((f) => f.status), ['OK', 'OK', 'OK']);
});

test('--fix keeps CRLF line endings and a byte-order mark', () => {
  const file = write(`${BOM}# Pack\r\n\r\n## A (0/100 chars)\r\n\r\nhello\r\n`);
  report(file, '--fix');
  const text = fs.readFileSync(file, 'utf8');
  assert.ok(text.startsWith(BOM), 'byte-order mark kept');
  assert.ok(text.includes('## A (5/100 chars)'), text);
  assert.ok(!/[^\r]\n/.test(text), 'every line break is still CRLF');
});

test('a body wrapped in one code fence counts as the fence content', () => {
  const r = report(write(field('## Abstract (7/100 chars)', '```text\nabc def\n```')));
  assert.equal(r.fields[0].count, 7);
  assert.equal(r.fields[0].status, 'OK', messages(r.fields[0]));
});

test('--numbers warns about numbers missing from the Numbers table and skips list markers and identifiers', () => {
  const spine = write([
    '# Spine',
    '',
    '## 4. Numbers',
    '',
    '| id | As written | Label | Source or script | Date | Appears in |',
    '|---|---|---|---|---|---|',
    '| N1 | 1,200+ | SOURCED | motorsport press | 2023 | form Q1 |',
    '| N2 | 2006 | SOURCED | sport history | | form Q1 |',
    '',
    '## 5. Proven and open risks',
    '',
    '| Proven | Open |',
    '|---|---|',
    '| 2012 is only here | not in the Numbers table |',
    '',
  ].join('\n'), 'SPINE.md');
  const body = 'In 2023, 1,200+ calls were made by eye for F1 cars filmed in 3D. (1) Tennis 2006, football 2012.\n1. First point';
  const r = report(write(field('## Q1 (?/200 chars)', body)), '--numbers', spine);
  assert.match(r.numbers, /Numbers table in SPINE\.md \(2 rows\)/);
  const [f] = r.fields;
  assert.equal(f.status, 'WARN');
  // Exactly one number is missing: 2023, 1,200 and 2006 are in the table; "(1)", "1.", "F1" and "3D" are not numbers.
  assert.match(messages(f), /not in the Numbers table: 2012\. Add each/);
});

test('non-ASCII letters warn unless --allow-unicode; a joiner fails without it', () => {
  const file = write(field('## Hindi line (?/100 chars)', `Voice prompt: ${MACHHALI}`));
  assert.equal(report(file).fields[0].status, 'WARN');
  assert.equal(report(file, '--allow-unicode').fields[0].status, 'OK');
  const joined = write(field('## Hindi line (?/100 chars)', `Voice prompt: ${MACHHALI}${ZWJ}`));
  assert.equal(report(joined).fields[0].status, 'FAIL');
  assert.equal(report(joined, '--allow-unicode').fields[0].status, 'OK');
});

test('the shipped template parses: every field is found and skipped until its limit is set', () => {
  const r = report(template);
  assert.equal(r.code, 0);
  assert.ok(r.fields.length >= 4, `fields found: ${r.fields.length}`);
  assert.ok(r.fields.every((f) => f.status === 'SKIP'), JSON.stringify(r.fields.map((f) => [f.name, f.status])));
  assert.ok(r.fields.some((f) => f.unit === 'words'), 'the template shows a word budget too');
});

test('usage errors and unreadable files exit 2; --help exits 0; a file with no budgets exits 1', () => {
  const help = run('--help');
  assert.equal(help.code, 0);
  assert.match(help.out, /Usage/);
  assert.equal(run().code, 2);
  const missing = run(path.join(os.tmpdir(), 'form-check-does-not-exist', 'FORM.md'));
  assert.equal(missing.code, 2);
  assert.match(missing.err, /cannot read/);
  const file = write(field('## Field (10/100 chars)', 'aaaaaaaaaa'));
  assert.equal(run(file, '--newline', '3').code, 2);
  assert.equal(run(file, '--bogus').code, 2);
  assert.equal(run(file, '--numbers', path.join(os.tmpdir(), 'form-check-does-not-exist', 'SPINE.md')).code, 2);
  const none = run(write('# Title\n\n## A field without a budget\n\ntext\n'));
  assert.equal(none.code, 1);
  assert.match(none.err, /no field heading with a budget/);
});
