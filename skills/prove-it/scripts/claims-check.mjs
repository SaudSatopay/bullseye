#!/usr/bin/env node
/**
 * claims-check.mjs: re-checks every headline claim a project makes, in one command. Part of the
 * prove-it skill. Zero dependencies, Node 20+.
 *
 * Usage
 *   node claims-check.mjs [claims.json] [--json] [--no-measure] [--only id,id] [--help]
 *
 * For every claim in claims.json it checks:
 *   TEXT   the claim's exact `text` still appears in each of its files, so the claim and the document
 *          cannot drift apart;
 *   VALUE  the number written in `text` (or `value`) equals the committed fact in facts.json and every
 *          measurement, within tolerance.
 * For every drift rule it checks that each match of `pattern` anywhere in the listed files equals its
 * fact (the stale "58 tests" in a deck while the suite has 59).
 *
 * It prints one aligned line per check (ok, MISMATCH, MISSING-TEXT, DRIFT, ERROR, SKIP) and exits 1 when
 * any check fails, 2 when claims.json itself is unusable, 0 otherwise. SKIP means "not checked in this
 * run" (a measurement skipped by --no-measure, with no committed fact to fall back on): it is printed
 * and counted apart, never as ok.
 *
 * Paths inside claims.json are relative to the claims file. Commands run with the system shell in the
 * claims file's folder, and each distinct command runs once per check. Only run claims files you trust.
 *
 * claims.json
 * {
 *   "facts": "facts.json",                  facts file written by the scripts that measure (optional)
 *   "files": ["README.md"],                  where a claim must appear unless it lists its own files
 *   "claims": [
 *     {
 *       "id": "tests",                       unique short name
 *       "text": "**231** tests",             exact text, copied from the document
 *       "files": ["README.md", "SUBMISSION.md"],
 *       "fact": "tests.count",               key or dot path in facts.json
 *       "value": 231,                        the claimed value, when it is not the first number in text
 *       "tolerance": 0.5,                    absolute, or "1%" of the truth. Default: half a unit of the
 *                                            last digit the text writes ("90.1%" allows 90.05 to 90.15)
 *       "op": "<=",                          for bounds: "p95 under 200 ms" means truth <= 200
 *       "scale": 100,                        multiply the truth first (0.881 is written "88.1%")
 *       "measure": {                         one object, or an array (the system and an independent check)
 *         "cmd": "node scripts/count-tests.mjs --json",  re-measure now (skipped by --no-measure)
 *         "file": "data/verify/results.json",            read a committed oracle file (after cmd, if any)
 *         "json": "count",                   dot path into the JSON output, or
 *         "regex": "(\\d+) passing",         the first capture group of the first match
 *         "label": "independent",            name printed in the table
 *         "timeoutMs": 120000
 *       }
 *     }
 *   ],
 *   "drift": [
 *     { "pattern": "(\\d+) tests", "fact": "tests.count", "files": ["README.md", "deck/deck.html"],
 *       "flags": "gi", "min": 0 }
 *   ]
 * }
 *
 * The claimed number is the first number in `text` that is not glued to a letter, "@", "/", "." or a
 * letter and hyphen, so p95, Hit@3, v2, top-5, GPT-4 and the second half of 16/16 are skipped, while
 * 23,445, 90.1%, 26k, 1.5M, -8 and both ends of 82.2-94.1% parse. Set `value` when the number you mean
 * is not the first one. A fact that is a string ("1 Av") passes when the text contains it exactly.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const HELP = `claims-check: re-check every headline claim in one command.

Usage
  node claims-check.mjs [claims.json] [--json] [--no-measure] [--only id,id]

  claims.json    the claims file (default: ./claims.json); paths inside it are relative to it
  --json         print a JSON report instead of the table
  --no-measure   do not run measure commands; compare against facts.json and committed files only
  --only a,b     check only these claim and drift ids
  --help         this text

Statuses: ok, MISMATCH (a value disagrees), MISSING-TEXT (the claim's text is gone from a file),
DRIFT (a stale number somewhere in the listed files), ERROR (cannot check), SKIP (not checked this run).
Exit 0 when every check passes, 1 when any fails, 2 when claims.json is unusable.
The schema is documented at the top of this file.
`;

const OPS = new Set(['=', '<=', '>=', '<', '>']);
const MULT = { k: 1e3, K: 1e3, M: 1e6, B: 1e9 };
// The typographic minus sign and the byte-order mark, built from their codes so this file stays ASCII.
const MINUS = String.fromCharCode(0x2212);
const BOM = String.fromCharCode(0xfeff);
const NUMBER = new RegExp(`(?<![\\w.@/])(?<![A-Za-z]-)([-${MINUS}+]?)(\\d{1,3}(?:,\\d{3})+|\\d+)(\\.\\d+)?(?:([kKMB])(?![A-Za-z]))?%?`, 'g');
const NUMERIC_STRING = new RegExp(`^[-${MINUS}+]?(\\d{1,3}(?:,\\d{3})+|\\d+)(\\.\\d+)?[kKMB]?\\s?%?$`);
const stripBom = (text) => (text.startsWith(BOM) ? text.slice(1) : text);

function usage(message) {
  process.stderr.write(`claims-check: ${message}\n`);
  process.exit(2);
}

/** Every number written in a string, with the precision it is written to. */
function numbersIn(text) {
  const out = [];
  for (const m of String(text).matchAll(NUMBER)) {
    const sign = m[1] === '-' || m[1] === MINUS ? -1 : 1;
    const frac = m[3] ?? '';
    const mult = m[4] ? MULT[m[4]] : 1;
    out.push({
      raw: m[0],
      value: sign * Number(m[2].replace(/,/g, '') + frac) * mult,
      decimals: frac ? frac.length - 1 : 0,
      mult,
    });
  }
  return out;
}

/** A key, or a dot path, into an object. */
function lookup(obj, key) {
  if (obj !== null && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, key)) return { found: true, value: obj[key] };
  let cur = obj;
  for (const part of String(key).split('.')) {
    if (cur !== null && typeof cur === 'object' && Object.prototype.hasOwnProperty.call(cur, part)) cur = cur[part];
    else return { found: false };
  }
  return { found: true, value: cur };
}

/** A fact or measurement as a comparable value: a number, a string or a boolean. */
function asTruth(raw, scale) {
  let v = raw;
  if (typeof v === 'string' && NUMERIC_STRING.test(v.trim())) v = numbersIn(v.trim())[0]?.value ?? v;
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return { error: 'is not a finite number' };
    return { kind: 'number', value: scale ? v * scale : v };
  }
  if (typeof v === 'string') return { kind: 'string', value: v.trim() };
  if (typeof v === 'boolean') return { kind: 'boolean', value: v };
  if (v === null || v === undefined) return { error: 'is empty (null): unknown, not zero' };
  return { error: 'is an object or a list; point at a number or a string inside it' };
}

function fmt(v) {
  if (typeof v === 'number') return v.toLocaleString('en-US', { maximumFractionDigits: 6 });
  if (typeof v === 'string') return JSON.stringify(v);
  return String(v);
}

function toleranceFor(spec, truth, token, op) {
  if (spec === undefined || spec === null) {
    if (op !== '=') return 0;
    return token ? 0.5 * 10 ** -token.decimals * token.mult + 1e-9 : 1e-9;
  }
  if (typeof spec === 'number') return Math.abs(spec);
  const m = /^\s*(\d+(?:\.\d+)?)\s*%\s*$/.exec(String(spec));
  return m ? (Math.abs(truth) * Number(m[1])) / 100 : NaN;
}

function holds(claimed, truth, tol, op) {
  switch (op) {
    case '<=': return truth <= claimed + tol;
    case '<': return truth < claimed + tol;
    case '>=': return truth >= claimed - tol;
    case '>': return truth > claimed - tol;
    default: return Math.abs(truth - claimed) <= tol;
  }
}

// ---------- arguments ----------
const opts = { json: false, measure: true, only: null, file: null };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--help' || a === '-h') { process.stdout.write(HELP); process.exit(0); }
  else if (a === '--json') opts.json = true;
  else if (a === '--no-measure') opts.measure = false;
  else if (a === '--only' || a.startsWith('--only=')) {
    const list = a.includes('=') ? a.slice(a.indexOf('=') + 1) : argv[++i];
    if (!list) usage('--only needs a comma-separated list of ids');
    opts.only = new Set(list.split(',').map((s) => s.trim()).filter(Boolean));
  } else if (a.startsWith('-')) usage(`unknown option ${a} (see --help)`);
  else if (!opts.file) opts.file = a;
  else usage(`unexpected argument ${a} (see --help)`);
}

const claimsPath = path.resolve(opts.file ?? 'claims.json');
if (!fs.existsSync(claimsPath)) usage(`no claims file at ${opts.file ?? './claims.json'}; pass its path (see --help)`);
const baseDir = path.dirname(claimsPath);
let config;
try {
  config = JSON.parse(stripBom(fs.readFileSync(claimsPath, 'utf8')));
} catch (e) {
  usage(`${path.basename(claimsPath)} is not valid JSON: ${e.message}`);
}
if (!config || typeof config !== 'object' || !Array.isArray(config.claims)) usage('claims.json needs a "claims" array');
if (!config.claims.length) usage('claims.json lists no claims; a check of nothing proves nothing');
const defaultFiles = config.files ?? ['README.md'];
if (!Array.isArray(defaultFiles) || !defaultFiles.length) usage('"files" must be a non-empty list of paths');

const ids = new Set();
config.claims.forEach((c, i) => {
  if (!c || typeof c.id !== 'string' || !c.id || typeof c.text !== 'string' || !c.text) usage(`claims[${i}] needs a string "id" and a non-empty "text"`);
  if (ids.has(c.id)) usage(`claim id "${c.id}" is used twice`);
  ids.add(c.id);
  if (c.op !== undefined && !OPS.has(c.op)) usage(`claim "${c.id}": op must be one of = <= >= < >`);
  if (c.files !== undefined && (!Array.isArray(c.files) || !c.files.length)) usage(`claim "${c.id}": "files" must be a non-empty list`);
  if (c.tolerance !== undefined && Number.isNaN(toleranceFor(c.tolerance, 1, null, '='))) usage(`claim "${c.id}": tolerance must be a number or a string like "1%"`);
  for (const m of [].concat(c.measure ?? [])) {
    if (!m || (typeof m.cmd !== 'string' && typeof m.file !== 'string')) usage(`claim "${c.id}": every measure needs "cmd" or "file"`);
    if (m.regex !== undefined) {
      try { new RegExp(m.regex, m.flags ?? ''); } catch (e) { usage(`claim "${c.id}": bad regex: ${e.message}`); }
    }
  }
});
const driftRules = config.drift ?? [];
if (!Array.isArray(driftRules)) usage('"drift" must be a list');
driftRules.forEach((r, i) => {
  if (!r || typeof r.pattern !== 'string' || typeof r.fact !== 'string') usage(`drift[${i}] needs "pattern" and "fact"`);
  try { new RegExp(r.pattern, r.flags ?? 'gi'); } catch (e) { usage(`drift[${i}]: bad pattern: ${e.message}`); }
});

// ---------- inputs ----------
let facts = null;
let factsError = null;
if (config.facts) {
  const p = path.resolve(baseDir, config.facts);
  try {
    facts = JSON.parse(stripBom(fs.readFileSync(p, 'utf8')));
  } catch (e) {
    factsError = fs.existsSync(p) ? `${config.facts} is not valid JSON: ${e.message}` : `${config.facts} not found`;
  }
}

const docs = new Map();
function readDoc(rel) {
  if (!docs.has(rel)) {
    const p = path.resolve(baseDir, rel);
    docs.set(rel, fs.existsSync(p) ? stripBom(fs.readFileSync(p, 'utf8')).replace(/\r\n/g, '\n') : null);
  }
  return docs.get(rel);
}

function factValue(key) {
  if (factsError) return { error: factsError };
  if (!facts) return { error: 'claims.json names no "facts" file' };
  const got = lookup(facts, key);
  return got.found ? { value: got.value } : { error: `fact "${key}" is not in ${config.facts}` };
}

const runs = new Map();
function lastLine(s) {
  return String(s ?? '').trim().split(/\r?\n/).pop()?.slice(0, 160) ?? '';
}
function parseJson(text) {
  const t = String(text).trim();
  const tries = [t, t.split(/\r?\n/).filter(Boolean).pop() ?? '', t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)];
  for (const candidate of tries) {
    try { return { value: JSON.parse(candidate) }; } catch { /* next */ }
  }
  return { error: 'output is not JSON' };
}

/** Runs (once) and reads one measure spec. Returns {value, label} or {error} or {skipped}. */
function measureOnce(m) {
  let output = null;
  let label = m.label ?? (m.cmd ? 'measured' : 'oracle');
  if (m.cmd) {
    if (!opts.measure) {
      if (!m.file) return { skipped: true, label };
      label = m.label ?? 'oracle';
    } else {
      if (!runs.has(m.cmd)) {
        const r = spawnSync(m.cmd, { shell: true, cwd: baseDir, encoding: 'utf8', timeout: m.timeoutMs ?? 120000, maxBuffer: 64 * 1024 * 1024, windowsHide: true });
        runs.set(m.cmd, r);
      }
      const r = runs.get(m.cmd);
      if (r.error) return { error: r.error.code === 'ETIMEDOUT' ? `"${m.cmd}" timed out` : `"${m.cmd}" did not run: ${r.error.message}` };
      if (r.status !== 0) return { error: `"${m.cmd}" exited ${r.status}${lastLine(r.stderr) ? `: ${lastLine(r.stderr)}` : ''}` };
      output = r.stdout ?? '';
    }
  }
  if (m.file) {
    const p = path.resolve(baseDir, m.file);
    if (!fs.existsSync(p)) return { error: `${m.file} not found` };
    output = stripBom(fs.readFileSync(p, 'utf8'));
  }
  const source = m.file ?? `"${m.cmd}"`;
  if (m.json !== undefined) {
    const parsed = parseJson(output);
    if (parsed.error) return { error: `${source}: ${parsed.error}` };
    const got = lookup(parsed.value, m.json);
    return got.found ? { value: got.value, label } : { error: `${source}: no "${m.json}" in its JSON` };
  }
  if (m.regex !== undefined) {
    const hit = new RegExp(m.regex, m.flags ?? '').exec(output);
    return hit ? { value: hit[1] ?? hit[0], label } : { error: `${source}: regex /${m.regex}/ found nothing` };
  }
  return { value: String(output).trim(), label };
}

// ---------- claims ----------
function checkClaim(c) {
  const op = c.op ?? '=';
  const files = c.files ?? defaultFiles;
  const res = { id: c.id, status: 'ok', text: c.text, files, missingIn: [], claimed: null, op, truths: [], notes: [] };
  const errors = [];
  const mismatches = [];

  for (const f of files) {
    const content = readDoc(f);
    if (content === null) errors.push(`${f} not found`);
    else if (!content.includes(c.text)) res.missingIn.push(f);
  }

  // What the project says is true now: the committed fact, then every measurement.
  if (c.fact !== undefined) {
    const got = factValue(c.fact);
    if (got.error) errors.push(got.error);
    else {
      const t = asTruth(got.value, c.scale);
      if (t.error) errors.push(`fact "${c.fact}" ${t.error}`);
      else res.truths.push({ source: 'fact', ...t });
    }
  }
  let skipped = 0;
  for (const m of [].concat(c.measure ?? [])) {
    const got = measureOnce(m);
    if (got.skipped) { skipped++; res.notes.push(`${got.label}: not run (--no-measure)`); continue; }
    if (got.error) { errors.push(got.error); continue; }
    const t = asTruth(got.value, c.scale);
    if (t.error) errors.push(`${got.label} value ${t.error}`);
    else res.truths.push({ source: got.label, ...t });
  }

  // What the document says.
  const tokens = numbersIn(c.text);
  let token = null;
  if (c.value !== undefined) {
    if (typeof c.value === 'number') {
      token = tokens.find((t) => Math.abs(t.value - c.value) <= 1e-9 * Math.max(1, Math.abs(c.value))) ?? null;
      if (!token) mismatches.push(`value ${fmt(c.value)} is not written in the text`);
      res.claimed = token ? token.raw : fmt(c.value);
    } else if (typeof c.value === 'string') {
      if (!c.text.includes(c.value)) mismatches.push(`value ${fmt(c.value)} is not in the text`);
      res.claimed = fmt(c.value);
    } else if (typeof c.value === 'boolean') res.claimed = String(c.value);
    else errors.push('value must be a number, a string or a boolean');
  } else if (tokens.length) {
    token = tokens[0];
    res.claimed = token.raw;
  }

  for (const t of res.truths) {
    if (t.kind === 'string') {
      const claimedString = typeof c.value === 'string' ? c.value : null;
      const ok = claimedString !== null ? claimedString === t.value : c.text.includes(t.value);
      res.claimed = fmt(claimedString ?? (ok ? t.value : c.text));
      if (!ok) mismatches.push(`${t.source} is ${fmt(t.value)}, which the text does not say`);
    } else if (t.kind === 'boolean') {
      if (typeof c.value !== 'boolean') errors.push(`${t.source} is a boolean; set "value": true or false`);
      else if (c.value !== t.value) mismatches.push(`${t.source} is ${t.value}`);
    } else {
      const claimed = typeof c.value === 'number' ? c.value : token?.value;
      if (claimed === undefined || claimed === null) { errors.push('no number in the text; set "value"'); continue; }
      const tol = toleranceFor(c.tolerance, t.value, token, op);
      if (!holds(claimed, t.value, tol, op)) {
        const gap = op === '=' ? ` (off by ${fmt(Math.abs(t.value - claimed))}; the text allows ${fmt(tol)})` : '';
        mismatches.push(`${t.source} ${fmt(t.value)} is not ${op === '=' ? '' : `${op} `}${fmt(claimed)}${gap}`);
      }
    }
  }

  if (!res.truths.length && !errors.length && !skipped) res.notes.push('text only: no fact or measure to compare');
  if (res.missingIn.length) res.notes.unshift(`text not found in ${res.missingIn.join(', ')}`);
  res.notes.unshift(...errors, ...mismatches);
  if (errors.length) res.status = 'ERROR';
  else if (mismatches.length) res.status = 'MISMATCH';
  else if (res.missingIn.length) res.status = 'MISSING-TEXT';
  else if (skipped && !res.truths.length) res.status = 'SKIP';
  return res;
}

// ---------- drift ----------
function checkDrift(rule) {
  const id = rule.id ?? `drift:${rule.fact}`;
  const files = rule.files ?? defaultFiles;
  const res = { id, status: 'ok', pattern: rule.pattern, fact: rule.fact, files, found: 0, mismatches: [], notes: [] };
  const got = factValue(rule.fact);
  if (got.error) return { ...res, status: 'ERROR', notes: [got.error] };
  const truth = asTruth(got.value, rule.scale);
  if (truth.error) return { ...res, status: 'ERROR', notes: [`fact "${rule.fact}" ${truth.error}`] };
  res.truth = truth.value;
  let flags = rule.flags ?? 'gi';
  if (!flags.includes('g')) flags += 'g';
  const re = new RegExp(rule.pattern, flags);
  for (const f of files) {
    const content = readDoc(f);
    if (content === null) { res.status = 'ERROR'; res.notes.push(`${f} not found`); continue; }
    for (const m of content.matchAll(re)) {
      res.found++;
      const captured = m[1] ?? m[0];
      const line = content.slice(0, m.index).split('\n').length;
      let ok;
      if (truth.kind === 'number') {
        const tok = numbersIn(captured)[0];
        ok = tok ? holds(tok.value, truth.value, toleranceFor(rule.tolerance, truth.value, tok, '='), '=') : false;
      } else ok = captured.trim() === String(truth.value);
      if (!ok) res.mismatches.push({ file: f, line, text: m[0].trim().slice(0, 80) });
    }
  }
  if (res.status !== 'ERROR' && res.mismatches.length) res.status = 'DRIFT';
  if (res.status !== 'ERROR' && res.found < (rule.min ?? 0)) {
    res.status = 'DRIFT';
    res.notes.push(`found ${res.found}, expected at least ${rule.min}`);
  }
  return res;
}

// ---------- run ----------
const selected = config.claims.filter((c) => !opts.only || opts.only.has(c.id));
const selectedDrift = driftRules.filter((r) => !opts.only || opts.only.has(r.id ?? `drift:${r.fact}`));
if (!selected.length && !selectedDrift.length) usage('--only matched no claim or drift id');
const claimResults = selected.map(checkClaim);
const driftResults = selectedDrift.map(checkDrift);

const count = (list, s) => list.filter((r) => r.status === s).length;
const summary = {
  claims: claimResults.length,
  ok: count(claimResults, 'ok'),
  skipped: count(claimResults, 'SKIP'),
  failed: claimResults.filter((r) => !['ok', 'SKIP'].includes(r.status)).length,
  driftRules: driftResults.length,
  driftFound: driftResults.reduce((s, r) => s + r.mismatches.length, 0),
  driftFailed: driftResults.filter((r) => r.status !== 'ok').length,
};
const pass = summary.failed === 0 && summary.driftFailed === 0;

if (opts.json) {
  const truthsOut = (r) => r.truths.map((t) => ({ source: t.source, value: t.value }));
  process.stdout.write(`${JSON.stringify({
    ok: pass,
    claimsFile: path.basename(claimsPath),
    factsFile: config.facts ?? null,
    measured: opts.measure,
    summary,
    claims: claimResults.map((r) => ({ id: r.id, status: r.status, text: r.text, files: r.files, missingIn: r.missingIn, claimed: r.claimed, op: r.op, truths: truthsOut(r), notes: r.notes })),
    drift: driftResults.map((r) => ({ id: r.id, status: r.status, pattern: r.pattern, fact: r.fact, truth: r.truth ?? null, found: r.found, files: r.files, mismatches: r.mismatches, notes: r.notes })),
  }, null, 2)}\n`);
} else {
  const rows = [];
  for (const r of claimResults) {
    const truths = r.truths.map((t) => `${t.source} ${fmt(t.value)}`).join(' | ') || '-';
    const claimed = r.claimed === null ? '-' : r.op === '=' ? r.claimed : `${r.op} ${r.claimed}`;
    const where = r.status === 'ok' || r.status === 'SKIP' ? [r.files.join(', '), ...r.notes].join('; ') : r.notes.join('; ');
    rows.push([r.status, r.id, claimed, truths, where]);
  }
  for (const r of driftResults) {
    if (r.status === 'ERROR') rows.push(['ERROR', r.id, '-', '-', r.notes.join('; ')]);
    else if (!r.mismatches.length) rows.push([r.status, r.id, `/${r.pattern}/`, `fact ${fmt(r.truth)}`, [`${r.found} found in ${r.files.join(', ')}`, ...r.notes].join('; ')]);
    else for (const m of r.mismatches) rows.push(['DRIFT', r.id, `"${m.text}"`, `fact ${fmt(r.truth)}`, `${m.file}:${m.line}`]);
  }
  const width = [0, 1, 2, 3].map((i) => Math.min(i === 2 ? 22 : i === 3 ? 34 : 28, Math.max(...rows.map((row) => row[i].length))));
  const pad = (s, w) => (s.length > w ? `${s.slice(0, w - 1)}~` : s.padEnd(w));
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const head = `claims-check  ${path.basename(claimsPath)}  (${config.facts ? `facts: ${config.facts}, ` : ''}${plural(claimResults.length, 'claim')}, ${plural(driftResults.length, 'drift rule')}${opts.measure ? '' : ', --no-measure'})`;
  process.stdout.write(`${head}\n\n`);
  for (const row of rows) process.stdout.write(`  ${row.slice(0, 4).map((c, i) => pad(c, width[i])).join('  ')}  ${row[4]}\n`);
  const skip = summary.skipped ? `, ${summary.skipped} skipped` : '';
  const drift = summary.driftRules ? `, ${summary.driftFound} stale number${summary.driftFound === 1 ? '' : 's'} found` : '';
  process.stdout.write(`\n${summary.ok}/${summary.claims} claims ok${skip}${drift}. ${pass ? 'PASS' : 'FAIL'}\n`);
}
process.exit(pass ? 0 : 1);
