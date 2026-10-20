// Tests for skills/brief-decoder/scripts/tminus.mjs (deadline conversion).
// Run from the repo root: node --test (or node --test tests/brief-decoder.tminus.test.mjs).
// Every case fixes --now and --to, so results do not depend on the machine's clock or zone,
// except the one test that checks the default zone against Intl directly.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, '..', 'skills', 'brief-decoder', 'scripts', 'tminus.mjs');
const FIXED = ['--to', 'Asia/Riyadh', '--now', '2026-10-17T14:17Z'];

function run(...args) {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
}
function json(...args) {
  const r = run(...args, '--json');
  assert.equal(r.code, 0, `exit ${r.code}: ${r.err}`);
  return JSON.parse(r.out);
}
const first = (...args) => json(...args).deadlines[0];

test('an ISO deadline with an offset converts to UTC, your clock and T-minus', () => {
  const d = first('2026-10-18T23:59+05:30', ...FIXED);
  assert.equal(d.utc, '2026-10-18T18:29:00Z');
  assert.equal(d.yours.local, '2026-10-18 21:29');
  assert.equal(d.yours.offset, '+03:00');
  assert.equal(d.yours.zone, 'Asia/Riyadh');
  assert.equal(d.official.offset, '+05:30');
  assert.equal(d.remaining.text, 'T-1d 04:12');
  assert.equal(d.remaining.passed, false);
});

test('inline zone, --tz, ISO offset, 12-hour time and the IST abbreviation agree', () => {
  const forms = [
    first('2026-10-18 23:59 Asia/Kolkata', ...FIXED),
    first('2026-10-18 23:59', '--tz', 'Asia/Kolkata', ...FIXED),
    first('2026-10-18T23:59:00+0530', ...FIXED),
    first('2026-10-18 11:59 PM IST', ...FIXED),
    first('2026-10-18 23:59 GMT+5:30', ...FIXED),
  ];
  for (const d of forms) assert.equal(d.utc, '2026-10-18T18:29:00Z', d.input);
  assert.match(forms[3].warnings.join(' '), /IST read as India Standard Time/);
});

test('the internal deadline is the official one minus the buffer', () => {
  const portal = first('2026-10-18 23:59 Asia/Kolkata', '--buffer', '24h', ...FIXED);
  assert.equal(portal.internal.utc, '2026-10-17T18:29:00Z');
  assert.equal(portal.internal.yours.local, '2026-10-17 21:29');
  assert.equal(portal.internal.remaining.text, 'T-0d 04:12');
  const onsite = first('2026-10-18 23:59 Asia/Kolkata', '--buffer', '30m', ...FIXED);
  assert.equal(onsite.internal.utc, '2026-10-18T17:59:00Z');
  const mixed = first('2026-10-18 23:59 Asia/Kolkata', '--buffer', '1d12h', ...FIXED);
  assert.equal(mixed.internal.utc, '2026-10-17T06:29:00Z');
});

test('a deadline after midnight on your clock is flagged with the evening to work to', () => {
  // OpenAI Build Week: Jul 21, 5:00 PM PDT was Tue 5:30 AM on an IST clock.
  const d = first('2026-07-21 5:00 PM PDT', '--to', 'Asia/Kolkata', '--now', '2026-07-20T00:00Z');
  assert.equal(d.utc, '2026-07-22T00:00:00Z');
  assert.equal(d.yours.local, '2026-07-22 05:30');
  const w = d.warnings.join(' | ');
  assert.match(w, /Lands at 05:30 on Wed 22 Jul/);
  assert.match(w, /evening of Tue 21 Jul/);
  assert.match(w, /Calendar date differs/);
});

test('an abbreviation that disagrees with the zone on that date takes the earlier instant', () => {
  // "PST" printed in July: Los Angeles is on -07:00, which is the earlier reading.
  const summer = first('2026-07-21 17:00 PST', ...FIXED);
  assert.equal(summer.utc, '2026-07-22T00:00:00Z');
  assert.match(summer.warnings.join(' '), /The page says PST \(UTC-08:00\)/);
  // "PDT" printed in January: the literal -07:00 is the earlier reading, shown as the page wrote it.
  const winter = first('2026-01-20 17:00 PDT', ...FIXED);
  assert.equal(winter.utc, '2026-01-21T00:00:00Z');
  assert.equal(winter.official.local, '2026-01-20 17:00');
  assert.equal(winter.official.offset, '-07:00');
});

test('DST gaps and overlaps resolve to the earlier instant with a note', () => {
  const gap = first('2026-03-08 02:30 America/New_York', ...FIXED);
  assert.equal(gap.utc, '2026-03-08T06:30:00Z');
  assert.match(gap.warnings.join(' '), /does not exist/);
  const overlap = first('2026-11-01 01:30 America/New_York', ...FIXED);
  assert.equal(overlap.utc, '2026-11-01T05:30:00Z');
  assert.match(overlap.warnings.join(' '), /happens twice/);
});

test('a zone name starting with "Am" is not read as AM', () => {
  const d = first('2026-03-09 09:00 America/New_York', ...FIXED);
  assert.equal(d.utc, '2026-03-09T13:00:00Z');
});

test('a passed deadline is reported, not treated as an error', () => {
  const d = first('2026-10-01 23:59 IST', ...FIXED);
  assert.equal(d.remaining.passed, true);
  assert.match(d.remaining.text, /^T\+\d+d \d\d:\d\d \(passed\)$/);
  assert.match(d.warnings.join(' '), /has passed/);
  const late = first('2026-10-18 23:59 IST', '--buffer', '2d', ...FIXED);
  assert.match(late.warnings.join(' '), /internal deadline has passed: submit now/);
});

test('several deadlines come back sorted and close pairs are flagged', () => {
  const res = json(
    'NextGen reg=2026-08-12 23:59 IST',
    'Port Mortem=2026-08-03 23:59 IST',
    'Slack winners=2026-08-12 02:30 Asia/Kolkata',
    '--to', 'Asia/Kolkata', '--now', '2026-07-24 10:00 Asia/Kolkata', '--collide', '48h',
  );
  assert.deepEqual(res.deadlines.map((d) => d.label), ['Port Mortem', 'Slack winners', 'NextGen reg']);
  assert.deepEqual(res.collisions, [{ a: 'Slack winners', b: 'NextGen reg', gapHours: 21.5 }]);
  const notes = res.deadlines.flatMap((d) => d.warnings).filter((w) => w.startsWith('IST read as'));
  assert.equal(notes.length, 1, 'the abbreviation note is printed once per run');
});

test('--line prints one key=value deadline line and sends notes to stderr', () => {
  const r = run('Graph Hacks=2026-10-18 23:59 IST', '--buffer', '24h', '--line', ...FIXED);
  assert.equal(r.code, 0, r.err);
  assert.equal(
    r.out.trim(),
    'deadline: label="Graph Hacks" official="Sun 2026-10-18 23:59 Asia/Kolkata (UTC+05:30)" yours="Sun 2026-10-18 21:29 Asia/Riyadh (UTC+03:00)" internal="Sat 2026-10-17 21:29" buffer=24h tminus="T-1d 04:12" asof=2026-10-17T14:17:00Z',
  );
  assert.match(r.err, /^note: IST read as/m);
});

test('the human report names every line a planner needs', () => {
  const r = run('2026-10-18 23:59 Asia/Kolkata', '--buffer', '24h', ...FIXED);
  assert.equal(r.code, 0, r.err);
  for (const label of ['Official', 'Your clock', 'UTC', 'Remaining', 'Internal']) assert.match(r.out, new RegExp(`^  ${label}`, 'm'));
  assert.match(r.out, /Sun 2026-10-18 21:29 {2}Asia\/Riyadh \(UTC\+03:00\)/);
});

test('without --to the machine zone is used and its offset is right', () => {
  const d = first('2026-10-18T23:59+05:30', '--now', '2026-10-17T14:17Z');
  assert.ok(d.yours.zone.length > 0);
  // Recompute the offset for the reported zone with Intl and compare.
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: d.yours.zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    .formatToParts(new Date('2026-10-18T18:29:00Z')).map((p) => [p.type, p.value]));
  assert.equal(d.yours.local, `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`);
});

test('a time with no zone is refused instead of guessed', () => {
  const r = run('2026-10-18 23:59', ...FIXED);
  assert.equal(r.code, 1);
  assert.match(r.err, /has no time zone/);
});

test('a date with no time is refused with the 23:59 hint', () => {
  const r = run('2026-10-18', ...FIXED);
  assert.equal(r.code, 1);
  assert.match(r.err, /no time of day/);
  assert.match(r.err, /23:59/);
});

test('ambiguous, unknown and impossible inputs are refused', () => {
  assert.match(run('2026-10-18 23:59 AST', ...FIXED).err, /AST is ambiguous/);
  const unknown = run('2026-10-18 23:59 Mars/Base', ...FIXED);
  assert.equal(unknown.code, 1);
  assert.match(unknown.err, /Unknown time zone "Mars\/Base"/);
  assert.equal(run('2026-02-30 10:00 UTC', ...FIXED).code, 1);
  assert.equal(run('2026-10-18 13:00 PM IST', ...FIXED).code, 1);
  assert.match(run('2026-10-18 23:59 IST', '--buffer', '24', ...FIXED).err, /not a duration/);
});

test('bad usage exits 2 and --help exits 0', () => {
  assert.equal(run().code, 2);
  assert.equal(run('--bogus', 'x').code, 2);
  assert.equal(run('2026-10-18 23:59 IST', '--json', '--line').code, 2);
  assert.equal(run('2026-10-18 23:59 IST', '--buffer').code, 2);
  const help = run('--help');
  assert.equal(help.code, 0);
  assert.match(help.out, /Usage:/);
});

// ---------- time forms ----------
// Regression: "08.43" was once read as 08:00 with exit 0, because a fractional-seconds group could
// match straight after the hour. Every form below must parse exactly or be refused; never truncated.
const utcOf = (input) => first(input, ...FIXED).utc;

test('dot-separated times keep their minutes: 08.43, 23.59, 8.43 PM', () => {
  assert.equal(utcOf('2026-10-21 08.43 UTC'), '2026-10-21T08:43:00Z');
  assert.equal(utcOf('2026-10-21 23.59 Asia/Kolkata'), '2026-10-21T18:29:00Z');
  assert.equal(first('2026-10-21 23.59 Asia/Kolkata', ...FIXED).official.local, '2026-10-21 23:59');
  assert.equal(utcOf('2026-10-21 8.43 PM UTC'), '2026-10-21T20:43:00Z');
  assert.equal(utcOf('2026-10-21 8.43pm UTC'), '2026-10-21T20:43:00Z');
  assert.equal(utcOf('2026-10-21 23.59.30 UTC'), '2026-10-21T23:59:30Z');
  const res = json('2026-10-21 23:59 IST', '--now', '2026-10-21 08.43 Asia/Riyadh', '--to', 'Asia/Riyadh');
  assert.equal(res.now.utc, '2026-10-21T05:43:00Z', '--now reads dot times too');
});

test('a date that does not come first as YYYY-MM-DD is refused', () => {
  const r = run('21 Oct 2026 8.43 PM UTC', ...FIXED);
  assert.equal(r.code, 1);
  assert.equal(r.out, '');
  assert.match(r.err, /Start with the date as YYYY-MM-DD/);
});

test('seconds and fractions of a second are kept, never dropped', () => {
  assert.equal(utcOf('2026-10-21 23:59:30 UTC'), '2026-10-21T23:59:30Z');
  assert.equal(first('2026-10-21 23:59:30 UTC', ...FIXED).official.local, '2026-10-21 23:59:30');
  assert.equal(utcOf('2026-10-21T23:59:30.250Z'), '2026-10-21T23:59:30.250Z');
  assert.equal(utcOf('2026-10-21T23:59:30,5Z'), '2026-10-21T23:59:30.500Z');
  const micro = first('2026-10-21T23:59:30.123456Z', ...FIXED);
  assert.equal(micro.utc, '2026-10-21T23:59:30.123Z');
  assert.match(micro.warnings.join(' '), /beyond milliseconds were dropped \(\.123456 read as \.123\)/);
});

test('compact, h-separated and 24:00 times are read exactly', () => {
  assert.equal(utcOf('2026-10-21 2359 UTC'), '2026-10-21T23:59:00Z');
  assert.equal(utcOf('2026-10-21T2359+0530'), '2026-10-21T18:29:00Z');
  assert.equal(utcOf('2026-10-21T235930Z'), '2026-10-21T23:59:30Z');
  assert.equal(utcOf('2026-10-21 1159 PM UTC'), '2026-10-21T23:59:00Z');
  assert.equal(utcOf('2026-10-21 23h59 UTC'), '2026-10-21T23:59:00Z');
  assert.equal(utcOf('2026-10-21 23h UTC'), '2026-10-21T23:00:00Z');
  const end = first('2026-10-18 24:00 Asia/Kolkata', ...FIXED);
  assert.equal(end.utc, '2026-10-18T18:30:00Z');
  assert.match(end.warnings.join(' '), /24:00 read as 00:00 on 2026-10-19, the end of 2026-10-18/);
});

test('offsets and zones in common page styles are read', () => {
  assert.equal(utcOf('2026-10-21 23:59 UTC+5.30'), '2026-10-21T18:29:00Z');
  assert.equal(utcOf('2026-10-21 23:59 GMT+5:45'), '2026-10-21T18:14:00Z');
  assert.equal(utcOf('2026-10-21 23:59 +530'), '2026-10-21T18:29:00Z');
  assert.equal(utcOf('2026-10-21 11:59 PM (IST)'), '2026-10-21T18:29:00Z');
  assert.equal(utcOf('2026-10-21 23:59IST'), '2026-10-21T18:29:00Z');
});

test('a time that cannot be read exactly is refused with a hint and prints no result', () => {
  const cases = {
    '2026-10-21 23:5 UTC': /Cannot read the time/,
    '2026-10-21 23.5 UTC': /Cannot read the time/,
    '2026-10-21 959 UTC': /Cannot read the time/,
    '2026-10-21 23595 UTC': /Cannot read the time/,
    '2026-10-21 2359305 UTC': /Cannot read the time/,
    '2026-10-21 23h5 UTC': /Cannot read the time/,
    '2026-10-21 23hours UTC': /Cannot read the time/,
    '2026-10-21 23:595 UTC': /"5 UTC" follows the time 23:59/,
    '2026-10-21 23:59:59:59 UTC': /":59 UTC" follows the time 23:59:59/,
    '2026-10-21 23:59.5 UTC': /"\.5 UTC" follows the time 23:59/,
    '2026-10-21 23.59.30.5 UTC': /follows the time 23\.59\.30/,
    '2026-10-21 23.59:30 UTC': /":30 UTC" follows the time 23\.59/,
    '2026-10-21 23 UTC': /the time "23" has no minutes/,
    '2026-10-21 23 59 UTC': /has no minutes/,
    '2026-10-21 9 UTC': /09:00 \(or 9 AM, 9 PM\)/,
    '2026-10-18 24:30 UTC': /not a real date and time/,
    '2026-10-18 24:00 PM UTC': /hour must be 1 to 12/,
    '2026-10-21 23:59:60 UTC': /not a real date and time/,
    '2026-10-21/23:59 UTC': /space or "T"/,
    '2026-10-211 23:59 UTC': /YYYY-MM-DD/,
    '2026-10-21 noon UTC': /no time of day/,
    '2026-10-21 23:59 UTC+5.50': /Offset "UTC\+5\.50" is unclear/,
    '2026-10-21 23:59 UTC+5.5': /Cannot read the offset/,
    '2026-10-21 23:59 +05:3': /Cannot read the offset/,
    '2026-10-21 23:59 IST extra': /Cannot read the zone "IST extra"/,
  };
  for (const [input, message] of Object.entries(cases)) {
    const r = run(input, ...FIXED);
    assert.equal(r.code, 1, `${input} should be refused (exit ${r.code}, out ${r.out.trim()})`);
    assert.equal(r.out, '', `${input} must print no result`);
    assert.match(r.err, message, input);
  }
  assert.match(run('2026-10-21 23:5 UTC', ...FIXED).err, /23:59, 23:59:30, 23\.59, 2359, 23h59 or 11:59 PM/);
});

test('--help lists the accepted time forms', () => {
  assert.match(run('--help').out, /23:59 {2}23:59:30 {2}23:59:30\.250 {2}23\.59/);
});
