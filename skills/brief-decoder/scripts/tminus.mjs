#!/usr/bin/env node
// tminus.mjs: turn a hackathon deadline into your clock, UTC, time remaining and an internal deadline.
//
// Usage:
//   node tminus.mjs "<deadline>" ["<deadline>" ...] [options]
//
// A deadline is one of:
//   2026-10-18T23:59+05:30                   ISO date-time with an offset (or Z)
//   "2026-10-18 23:59 Asia/Kolkata"          wall-clock time plus an IANA zone
//   "2026-07-21 5:00 PM PDT"                 wall-clock time plus a common abbreviation (IST, PT, PDT, ET, CET, GST...)
//   "2026-10-18 23:59" --tz Asia/Kolkata     wall-clock time, zone from --tz
// Put a label in front with "=":  "Graph Hacks=2026-10-18 23:59 IST"
// Times after the date: 23:59, 23:59:30, 23:59:30.250, 23.59, 23.59.30, 2359, 23h59, 23h, 11:59 PM,
// 11.59pm, 11 PM, 24:00. Anything else (23:5, 23 alone, 23:59:59:59, trailing text) is refused, never truncated.
//
// Options:
//   --tz <zone>        zone for deadlines that carry none (IANA name or abbreviation)
//   --to <zone>        your zone (default: this machine's zone)
//   --buffer <dur>     internal deadline = official minus this (24h, 30m, 1d12h)
//   --now <datetime>   pretend it is this moment (same formats; a bare time is read on your clock)
//   --collide <dur>    with several deadlines, flag pairs closer than this (default 48h)
//   --json             machine-readable output
//   --line             one key=value line per deadline, for the deadline line in BULLSEYE.md
//   -h, --help         this help
//
// Rules it applies: a time with no zone is an error (never guess the organiser's zone); when a
// reading is ambiguous (DST overlap, "PST" printed in summer), the earlier instant wins.
// Zero dependencies (Intl only). Exit codes: 0 ok, 1 invalid input, 2 bad usage.

import process from 'node:process';

class UsageError extends Error {}
class InputError extends Error {}

const HELP = `tminus: convert hackathon deadlines to your clock, with T-minus and an internal deadline.

Usage:
  node tminus.mjs "<deadline>" ["<deadline>" ...] [--tz <zone>] [--to <zone>] [--buffer <dur>]
                  [--now <datetime>] [--collide <dur>] [--json | --line]

Deadline formats:
  2026-10-18T23:59+05:30                 ISO with offset (or Z)
  "2026-10-18 23:59 Asia/Kolkata"        wall-clock time plus IANA zone
  "2026-09-04 11:59 PM IST"              12-hour time plus abbreviation
  "2026-10-18 23:59" --tz Asia/Kolkata   zone from --tz
  "Graph Hacks=2026-10-18 23:59 IST"     labelled

Times after the date:
  23:59  23:59:30  23:59:30.250  23.59  23.59.30  2359  23h59  23h  11:59 PM  11.59pm  11 PM  24:00
  Anything else is refused with a hint, never truncated. Offsets: +05:30, +0530, UTC+5:30, GMT+5.30.

Options:
  --tz <zone>       zone for deadlines that carry none
  --to <zone>       your zone (default: this machine's zone)
  --buffer <dur>    internal deadline = official minus <dur> (24h for portals, 30m onsite)
  --now <datetime>  fix the current moment (a bare time is read on your clock)
  --collide <dur>   flag deadlines closer than <dur> to each other (default 48h)
  --json            JSON output
  --line            key=value line for BULLSEYE.md
  -h, --help        show this help

Examples:
  node tminus.mjs "2026-10-18 23:59 Asia/Kolkata" --buffer 24h
  node tminus.mjs "2026-07-21 5:00 PM PDT" --to Asia/Kolkata --line
  node tminus.mjs "A=2026-08-03 23:59 IST" "B=2026-08-04 18:00 IST" --collide 48h
`;

// Common abbreviations seen on event pages. `fixed` is the literal offset the abbreviation names,
// checked against the zone's real offset on that date (organisers print PST in July).
const ALIASES = {
  IST: { zone: 'Asia/Kolkata', note: 'IST read as India Standard Time (Asia/Kolkata). Israel and Ireland also use IST: pass an IANA zone if you meant one of those.' },
  PKT: { zone: 'Asia/Karachi' },
  NPT: { zone: 'Asia/Kathmandu' },
  GST: { zone: 'Asia/Dubai', note: 'GST read as Gulf Standard Time (Asia/Dubai).' },
  SGT: { zone: 'Asia/Singapore' },
  HKT: { zone: 'Asia/Hong_Kong' },
  JST: { zone: 'Asia/Tokyo' },
  KST: { zone: 'Asia/Seoul' },
  PT: { zone: 'America/Los_Angeles' }, PST: { zone: 'America/Los_Angeles', fixed: -480 }, PDT: { zone: 'America/Los_Angeles', fixed: -420 },
  MT: { zone: 'America/Denver' }, MST: { zone: 'America/Denver', fixed: -420 }, MDT: { zone: 'America/Denver', fixed: -360 },
  CT: { zone: 'America/Chicago' }, CST: { zone: 'America/Chicago', fixed: -360, note: 'CST read as US Central. China also uses CST: pass Asia/Shanghai if you meant it.' }, CDT: { zone: 'America/Chicago', fixed: -300 },
  ET: { zone: 'America/New_York' }, EST: { zone: 'America/New_York', fixed: -300 }, EDT: { zone: 'America/New_York', fixed: -240 },
  BST: { zone: 'Europe/London', fixed: 60 },
  CET: { zone: 'Europe/Berlin', fixed: 60 }, CEST: { zone: 'Europe/Berlin', fixed: 120 },
  AEST: { zone: 'Australia/Sydney', fixed: 600 }, AEDT: { zone: 'Australia/Sydney', fixed: 660 },
};
const AMBIGUOUS = {
  AST: 'AST is ambiguous: Arabia Standard Time (UTC+03:00, Asia/Riyadh) or Atlantic Standard Time (UTC-04:00, America/Halifax). Pass the IANA zone.',
};
// ICU reports some zones by legacy names; show the current ones.
const LEGACY = { 'Asia/Calcutta': 'Asia/Kolkata', 'Asia/Katmandu': 'Asia/Kathmandu', 'Asia/Saigon': 'Asia/Ho_Chi_Minh', 'Asia/Rangoon': 'Asia/Yangon', 'Europe/Kiev': 'Europe/Kyiv' };

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

// ---------- time zone arithmetic (Intl only) ----------
const formatters = new Map();
function formatterFor(zone) {
  let f = formatters.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    formatters.set(zone, f);
  }
  return f;
}

// Wall-clock reading of an instant in a zone, with that zone's UTC offset in minutes.
function wallOf(ms, zone) {
  const p = {};
  for (const part of formatterFor(zone).formatToParts(new Date(ms))) p[part.type] = part.value;
  const w = { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute, s: +p.second, wd: p.weekday };
  w.offset = Math.round((Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi, w.s) - Math.floor(ms / 1000) * 1000) / 60000);
  return w;
}

const sameWall = (a, b) => a.y === b.y && a.mo === b.mo && a.d === b.d && a.h === b.h && a.mi === b.mi && a.s === b.s;

// Instant for a wall-clock time in a zone. Handles DST gaps (time does not exist) and overlaps (happens twice).
function wallToInstant(w, zone) {
  const naive = Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi, w.s);
  const offsets = new Set([wallOf(naive - 864e5, zone).offset, wallOf(naive, zone).offset, wallOf(naive + 864e5, zone).offset]);
  const hits = [...offsets].map((off) => naive - off * 60000).filter((t) => sameWall(wallOf(t, zone), w)).sort((a, b) => a - b);
  if (hits.length === 1) return { ms: hits[0] };
  if (hits.length > 1) return { ms: hits[0], overlap: true };
  const candidates = [...offsets].map((off) => naive - off * 60000).sort((a, b) => a - b);
  return { ms: candidates[0], gap: true };
}

function checkZone(name, where) {
  try { new Intl.DateTimeFormat('en-US', { timeZone: name }); } catch {
    throw new InputError(`Unknown time zone "${name}" in ${where}. Use an IANA name such as Asia/Kolkata, America/Los_Angeles or Europe/London.`);
  }
  return LEGACY[name] || name;
}

function resolveZone(token, where) {
  const up = token.toUpperCase();
  if (AMBIGUOUS[up]) throw new InputError(AMBIGUOUS[up]);
  if (ALIASES[up]) return { zone: ALIASES[up].zone, alias: up, fixed: ALIASES[up].fixed, note: ALIASES[up].note };
  if (up === 'UTC' || up === 'GMT' || up === 'Z') return { zone: 'UTC' };
  return { zone: checkZone(token, where) };
}

function localZone() {
  const z = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  return LEGACY[z] || z;
}

// ---------- parsing ----------
// The date comes first (YYYY-MM-DD). A time is read only in the position right after it, and whatever
// follows the time must be a zone or an offset. Accepted times: 23:59, 23:59:30, 23:59:30.250, 23.59,
// 23.59.30, 2359, 235930, 23h59, 23h, 11:59 PM, 11.59pm, 11 PM, and 24:00 (the end of the day).
// Anything else is refused with a hint. Nothing is ever truncated silently.
const TIME_FORMS = 'Write the time as 23:59, 23:59:30, 23.59, 2359, 23h59 or 11:59 PM, then the zone.';
// AM/PM must stand alone ("5 PM", "5pm", "5 p.m."), so "America/..." is never read as "Am".
const AMPM_RE = /^\s*([ap])\.?m\.?(?![a-z])/i;

// The time at the start of `t`, as strings, or null. Seconds and fractions only where unambiguous.
function readTime(t) {
  let m;
  if ((m = /^(\d{1,2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,9}))?)?/.exec(t))) return { h: m[1], mi: m[2], s: m[3], frac: m[4], text: m[0] };
  if ((m = /^(\d{1,2})\.(\d{2})(?:\.(\d{2}))?/.exec(t))) return { h: m[1], mi: m[2], s: m[3], text: m[0] };
  if ((m = /^(\d{1,2})h(\d{2})/i.exec(t))) return { h: m[1], mi: m[2], text: m[0] };
  if ((m = /^(\d{2})(\d{2})(\d{2})?(?!\d)/.exec(t))) return { h: m[1], mi: m[2], s: m[3], text: m[0] };
  if ((m = /^(\d{1,2})h(?![a-z0-9])/i.exec(t))) return { h: m[1], mi: '00', text: m[0] };
  if ((m = /^(\d{1,2})(?=\s*[ap]\.?m\.?(?![a-z]))/i.exec(t))) return { h: m[1], mi: '00', text: m[0] };
  return null;
}

const noTimeError = (text, y, mo, d) => new InputError(`"${text}" has no time of day. Pages that give only a date usually mean 23:59 in the organiser's zone: confirm it, then pass e.g. "${y}-${pad(mo)}-${pad(d)} 23:59 <zone>".`);

function parseWall(text) {
  const t = text.trim();
  const notes = [];
  const dm = /^(\d{4})-(\d{1,2})-(\d{1,2})(?!\d)/.exec(t);
  if (!dm) throw new InputError(`Cannot read "${text}". Start with the date as YYYY-MM-DD, like "2026-10-18 23:59 Asia/Kolkata" or 2026-10-18T23:59+05:30.`);
  const y = +dm[1], mo = +dm[2], d = +dm[3];
  const day = new Date(Date.UTC(y, mo - 1, d));
  if (mo < 1 || mo > 12 || day.getUTCFullYear() !== y || day.getUTCMonth() !== mo - 1 || day.getUTCDate() !== d) {
    throw new InputError(`"${text}" is not a real date and time.`);
  }
  let rest = t.slice(dm[0].length);
  const sep = /^(?:\s*T\s*|\s+)/i.exec(rest);
  if (!sep) {
    if (rest === '' || /^[a-z+\-(]/i.test(rest)) throw noTimeError(text, y, mo, d);
    throw new InputError(`Cannot read "${text}": put a space or "T" between the date and the time.`);
  }
  rest = rest.slice(sep[0].length);
  if (rest === '' || /^\D/.test(rest)) throw noTimeError(text, y, mo, d);

  const tm = readTime(rest);
  if (!tm) {
    const bare = /^(\d{1,2})(?![\d:.h])/i.exec(rest);
    if (bare) {
      const hh = +bare[1];
      throw new InputError(`"${text}": the time "${bare[1]}" has no minutes. Write it as ${pad(hh)}:00${hh >= 1 && hh <= 12 ? ` (or ${hh} AM, ${hh} PM)` : ''}.`);
    }
    throw new InputError(`Cannot read the time in "${text}". ${TIME_FORMS}`);
  }
  rest = rest.slice(tm.text.length);
  let shown = tm.text;
  const ap = AMPM_RE.exec(rest);
  if (ap) { rest = rest.slice(ap[0].length); shown += ap[0]; }

  // What follows the time: nothing, a zone after a space, or an offset or zone written on.
  let zoneText = '';
  if (rest !== '') {
    if (/^\s/.test(rest) || /^[a-z+\-(]/i.test(rest)) zoneText = rest.trim();
    else throw new InputError(`Cannot read "${text}": "${rest.trim()}" follows the time ${shown.trim()}. ${TIME_FORMS}`);
  }

  let h = +tm.h;
  const mi = +tm.mi;
  const s = tm.s === undefined ? 0 : +tm.s;
  let ms = 0;
  if (tm.frac !== undefined) {
    ms = +(tm.frac + '00').slice(0, 3);
    if (tm.frac.length > 3 && /[1-9]/.test(tm.frac.slice(3))) notes.push(`Fractions of a second beyond milliseconds were dropped (.${tm.frac} read as .${String(ms).padStart(3, '0')}).`);
  }
  if (ap) {
    if (h < 1 || h > 12) throw new InputError(`"${text}": with AM/PM the hour must be 1 to 12.`);
    h = (h % 12) + (ap[1].toLowerCase() === 'p' ? 12 : 0);
  }
  if (h === 24 && mi === 0 && s === 0 && ms === 0) {
    const next = new Date(Date.UTC(y, mo - 1, d + 1));
    const w = { y: next.getUTCFullYear(), mo: next.getUTCMonth() + 1, d: next.getUTCDate(), h: 0, mi: 0, s: 0, ms: 0 };
    notes.push(`24:00 read as 00:00 on ${w.y}-${pad(w.mo)}-${pad(w.d)}, the end of ${y}-${pad(mo)}-${pad(d)}.`);
    return { wall: w, zoneText, notes };
  }
  if (h > 23 || mi > 59 || s > 59) throw new InputError(`"${text}" is not a real date and time.`);
  return { wall: { y, mo, d, h, mi, s, ms }, zoneText, notes };
}

function parseOffset(rest) {
  if (/^(z|utc|gmt)$/i.test(rest)) return 0;
  const m = /^(?:utc|gmt)?\s*([+-])(\d{1,2})(?:([:.]?)(\d{2}))?$/i.exec(rest);
  if (!m) return null;
  const [, sign, hh, sep, mm] = m;
  // "+5.30" is common in Indian writing; a dot is accepted only where it cannot mean a decimal hour.
  if (sep === '.' && !['00', '30', '45'].includes(mm)) throw new InputError(`Offset "${rest}" is unclear. Write it with a colon, like +05:30.`);
  if (+hh > 14 || (mm && +mm > 59)) throw new InputError(`Offset "${rest}" is out of range.`);
  return (sign === '-' ? -1 : 1) * (+hh * 60 + (mm ? +mm : 0));
}

// Resolve one datetime string to an instant plus how the organiser's clock reads it.
function resolve(text, fallbackZone, where) {
  const { wall, zoneText, notes } = parseWall(text);
  const paren = /^\((.*)\)$/.exec(zoneText);
  const rest = paren ? paren[1].trim() : zoneText;
  const naive = Date.UTC(wall.y, wall.mo - 1, wall.d, wall.h, wall.mi, wall.s, wall.ms);
  const offset = rest ? parseOffset(rest) : null;
  if (offset !== null) {
    if (fallbackZone && where === 'deadline') notes.push(`The deadline carries its own offset (${fmtOffset(offset)}); --tz was not used for it.`);
    return { ms: naive - offset * 60000, official: { ...wall, wd: DAYS[new Date(Date.UTC(wall.y, wall.mo - 1, wall.d)).getUTCDay()], offset, zone: null }, notes };
  }
  if (rest && /^(?:utc|gmt)?\s*[+-]\d/i.test(rest)) throw new InputError(`Cannot read the offset "${rest}" in "${text}". Write it as +05:30, +0530 or UTC+5:30.`);
  if (rest && /\s/.test(rest)) throw new InputError(`Cannot read the zone "${rest}" in "${text}". Give one IANA zone or abbreviation.`);
  const zoneToken = rest || fallbackZone;
  if (!zoneToken) {
    throw new InputError(`"${text}" has no time zone. Never assume one: add an offset (+05:30), a zone ("Asia/Kolkata", "IST") or --tz <zone> with the organiser's zone.`);
  }
  const z = resolveZone(zoneToken, where === 'deadline' ? `"${text}"` : `--${where}`);
  const aliasNote = z.note || null;
  const real = wallToInstant(wall, z.zone);
  const ms = real.ms + wall.ms;
  if (real.gap) notes.push(`${fmtWall(wall)} does not exist in ${z.zone} that day (clocks jump forward). Read as the earlier instant; confirm with the organiser.`);
  if (real.overlap) notes.push(`${fmtWall(wall)} happens twice in ${z.zone} that day (clocks fall back). Read as the first one.`);
  if (z.fixed !== undefined) {
    const literal = naive - z.fixed * 60000;
    if (literal !== ms) {
      const realOffset = wallOf(ms, z.zone).offset;
      notes.push(`The page says ${z.alias} (UTC${fmtOffset(z.fixed)}), but ${z.zone} is on UTC${fmtOffset(realOffset)} on ${wall.y}-${pad(wall.mo)}-${pad(wall.d)}. Used the earlier reading; confirm with the organiser.`);
      if (literal < ms) {
        // The literal offset is the earlier instant: show the page's own wall time with that offset.
        return { ms: literal, official: { ...wall, wd: DAYS[new Date(Date.UTC(wall.y, wall.mo - 1, wall.d)).getUTCDay()], offset: z.fixed, zone: null }, notes, aliasNote };
      }
    }
  }
  const o = wallOf(ms, z.zone);
  return { ms, official: { ...o, zone: z.zone }, notes, aliasNote };
}

function parseDuration(text, flag) {
  const t = String(text).replace(/\s+/g, '').toLowerCase();
  const m = /^(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?$/.exec(t);
  if (!t || !m || (m[1] === undefined && m[2] === undefined && m[3] === undefined)) {
    throw new InputError(`${flag} "${text}" is not a duration. Use units: 24h, 30m, 1d, 1d12h.`);
  }
  return ((+m[1] || 0) * 1440 + (+m[2] || 0) * 60 + (+m[3] || 0)) * 60000;
}

// ---------- formatting ----------
function fmtOffset(min) {
  const sign = min < 0 ? '-' : '+';
  const a = Math.abs(min);
  return `${sign}${pad(Math.floor(a / 60))}:${pad(a % 60)}`;
}
function fmtWall(w) {
  return `${w.y}-${pad(w.mo)}-${pad(w.d)} ${pad(w.h)}:${pad(w.mi)}${w.s ? `:${pad(w.s)}` : ''}`;
}
const fmtDayMonth = (w) => `${w.wd} ${w.d} ${MONTHS[w.mo - 1]}`;
function fmtDuration(ms) {
  const totalMin = Math.floor(Math.abs(ms) / 60000);
  return `${Math.floor(totalMin / 1440)}d ${pad(Math.floor((totalMin % 1440) / 60))}:${pad(totalMin % 60)}`;
}
const tminus = (ms) => (ms >= 0 ? `T-${fmtDuration(ms)}` : `T+${fmtDuration(ms)} (passed)`);
const iso = (ms) => new Date(ms).toISOString().replace('.000Z', 'Z');
const zoneText = (o) => (o.zone ? `${o.zone} (UTC${fmtOffset(o.offset)})` : `UTC${fmtOffset(o.offset)}`);
function clock(w, zone) {
  return { local: fmtWall(w), weekday: w.wd, zone, offset: fmtOffset(w.offset) };
}

// ---------- main ----------
function parseArgs(argv) {
  const opts = { deadlines: [], json: false, line: false, help: false };
  const takesValue = new Set(['--tz', '--to', '--buffer', '--now', '--collide']);
  for (let i = 0; i < argv.length; i++) {
    let arg = argv[i];
    if (arg === '-h' || arg === '--help') { opts.help = true; continue; }
    if (arg === '--json') { opts.json = true; continue; }
    if (arg === '--line') { opts.line = true; continue; }
    let value;
    const eq = arg.startsWith('--') ? arg.indexOf('=') : -1;
    if (eq > 0) { value = arg.slice(eq + 1); arg = arg.slice(0, eq); }
    if (takesValue.has(arg)) {
      if (value === undefined) {
        value = argv[++i];
        if (value === undefined || value.startsWith('--')) throw new UsageError(`${arg} needs a value.`);
      }
      opts[arg.slice(2)] = value;
      continue;
    }
    if (arg.startsWith('-') && !/^-\d/.test(arg)) throw new UsageError(`Unknown option ${arg}.`);
    opts.deadlines.push(arg);
  }
  if (opts.json && opts.line) throw new UsageError('Use --json or --line, not both.');
  if (!opts.help && !opts.deadlines.length) throw new UsageError('Give at least one deadline.');
  return opts;
}

function build(opts) {
  const to = opts.to ? resolveZone(opts.to, '--to').zone : localZone();
  if (opts.tz) resolveZone(opts.tz, '--tz');
  const buffer = opts.buffer !== undefined ? parseDuration(opts.buffer, '--buffer') : null;
  const collide = parseDuration(opts.collide ?? '48h', '--collide');
  const nowMs = opts.now !== undefined ? resolve(opts.now, to, 'now').ms : Date.now();
  const nowWall = wallOf(nowMs, to);
  const seenAliasNotes = new Set();

  const deadlines = opts.deadlines.map((raw) => {
    const eq = raw.indexOf('=');
    const label = eq > 0 ? raw.slice(0, eq).trim() : null;
    const input = eq > 0 ? raw.slice(eq + 1).trim() : raw.trim();
    const r = resolve(input, opts.tz, 'deadline');
    const yours = wallOf(r.ms, to);
    const warnings = [];
    if (r.aliasNote && !seenAliasNotes.has(r.aliasNote)) { warnings.push(r.aliasNote); seenAliasNotes.add(r.aliasNote); }
    warnings.push(...r.notes);
    if (yours.h < 6) warnings.push(`Lands at ${pad(yours.h)}:${pad(yours.mi)} on ${fmtDayMonth(yours)} on your clock: treat the evening of ${fmtDayMonth(wallOf(r.ms - 864e5, to))} as the deadline.`);
    if (yours.y !== r.official.y || yours.mo !== r.official.mo || yours.d !== r.official.d) {
      warnings.push(`Calendar date differs: the page says ${fmtDayMonth(r.official)}, your clock says ${fmtDayMonth(yours)}.`);
    }
    const remaining = r.ms - nowMs;
    if (remaining < 0) warnings.push('This deadline has passed.');
    let internal = null;
    if (buffer !== null) {
      const ims = r.ms - buffer;
      const iw = wallOf(ims, to);
      internal = { buffer: opts.buffer.replace(/\s+/g, ''), utc: iso(ims), yours: clock(iw, to), remaining: { ms: ims - nowMs, text: tminus(ims - nowMs), passed: ims - nowMs < 0 } };
      if (remaining >= 0 && ims - nowMs < 0) warnings.push('The internal deadline has passed: submit now.');
    }
    return {
      label, input, ms: r.ms,
      official: clock(r.official, r.official.zone), utc: iso(r.ms), yours: clock(yours, to),
      remaining: { ms: remaining, text: tminus(remaining), passed: remaining < 0 },
      internal, warnings,
    };
  }).sort((a, b) => a.ms - b.ms);

  const collisions = [];
  for (let i = 0; i < deadlines.length; i++) {
    for (let j = i + 1; j < deadlines.length; j++) {
      const gap = deadlines[j].ms - deadlines[i].ms;
      if (gap < collide) collisions.push({ a: deadlines[i].label || deadlines[i].input, b: deadlines[j].label || deadlines[j].input, gapHours: Math.round(gap / 36e5 * 10) / 10 });
    }
  }
  return { now: { utc: iso(nowMs), yours: clock(nowWall, to) }, collide: opts.collide ?? '48h', deadlines, collisions };
}

function human(res) {
  const out = [];
  for (const d of res.deadlines) {
    out.push(d.label || d.input);
    out.push(`  Official    ${d.official.weekday} ${d.official.local}  ${zoneText({ zone: d.official.zone, offset: parseOffsetText(d.official.offset) })}`);
    out.push(`  Your clock  ${d.yours.weekday} ${d.yours.local}  ${d.yours.zone} (UTC${d.yours.offset})`);
    out.push(`  UTC         ${d.utc}`);
    out.push(`  Remaining   ${d.remaining.text}  (now ${res.now.yours.weekday} ${res.now.yours.local} your clock)`);
    if (d.internal) out.push(`  Internal    ${d.internal.yours.weekday} ${d.internal.yours.local}  your clock, ${d.internal.buffer} buffer, ${d.internal.remaining.text}`);
    for (const w of d.warnings) out.push(`  Note        ${w}`);
    out.push('');
  }
  if (res.deadlines.length > 1) {
    out.push(`Collisions (closer than ${res.collide})`);
    if (!res.collisions.length) out.push('  none');
    for (const c of res.collisions) out.push(`  ${c.a} and ${c.b}: ${c.gapHours} h apart`);
    out.push('');
  }
  return out.join('\n');
}

function parseOffsetText(t) {
  const m = /^([+-])(\d{2}):(\d{2})$/.exec(t);
  return (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +m[3]);
}

function lines(res) {
  return res.deadlines.map((d) => {
    const official = `${d.official.weekday} ${d.official.local} ${zoneText({ zone: d.official.zone, offset: parseOffsetText(d.official.offset) })}`;
    const parts = [`deadline:`];
    if (d.label) parts.push(`label="${d.label}"`);
    parts.push(`official="${official}"`, `yours="${d.yours.weekday} ${d.yours.local} ${d.yours.zone} (UTC${d.yours.offset})"`);
    if (d.internal) parts.push(`internal="${d.internal.yours.weekday} ${d.internal.yours.local}"`, `buffer=${d.internal.buffer}`);
    parts.push(`tminus="${d.remaining.text}"`, `asof=${res.now.utc}`);
    return parts.join(' ');
  }).join('\n') + '\n';
}

function run() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
    if (opts.help) { process.stdout.write(HELP); return 0; }
    const res = build(opts);
    if (opts.json) {
      const clean = { ...res, deadlines: res.deadlines.map(({ ms, ...rest }) => rest) };
      process.stdout.write(JSON.stringify(clean, null, 2) + '\n');
    } else if (opts.line) {
      process.stdout.write(lines(res));
      for (const d of res.deadlines) for (const w of d.warnings) process.stderr.write(`note: ${w}\n`);
    } else {
      process.stdout.write(human(res));
    }
    return 0;
  } catch (e) {
    if (e instanceof UsageError) { process.stderr.write(`tminus: ${e.message}\nRun with --help for usage.\n`); return 2; }
    if (e instanceof InputError) { process.stderr.write(`tminus: ${e.message}\n`); return 1; }
    throw e;
  }
}

process.exitCode = run();
