// judge-panel · scripts/judging-lib.mjs
// Shared, dependency-free helpers for evidence-pack.mjs and judge-round.mjs (Node 20+):
// Markdown sections and tables, the BULLSEYE.md Contract (title, deadline, judges, rubric), a small
// JSON Schema validator for the subset judge-scorecard.schema.json uses, weighted totals with the
// Contract's exact weights, and the round history kept under judging/.
// This file is a module, not a command. Import it.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// True when the module at `url` is the script node was asked to run (so tests can import it without side effects).
export function isMainModule(url) {
  if (!process.argv[1]) return false;
  const a = path.resolve(process.argv[1]);
  const b = fileURLToPath(url);
  return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
}

export class UsageError extends Error {}

export const JUDGE_TYPES = ['blind', 'adversarial', 'verify-fixes', 'newest-surface'];
export const SEVERITIES = ['high', 'medium', 'low'];
export const JUDGE_ROUNDS_HEADER = '| Round | Type | Date | Weighted score | Lowest criterion | Top finding | Fixed? |';
export const SCORECARD_FILE = /^scorecard(-[\w.-]+)?\.json$/;

// ---------- files and text ----------

export function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  } catch {
    return null;
  }
}

export function readJson(file) {
  const text = readText(file);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`${file} is not valid JSON: ${e.message}`);
  }
}

export function stripComments(text) {
  return String(text ?? '').replace(/<!--[\s\S]*?-->/g, '');
}

// Comments removed, trailing spaces trimmed, runs of blank lines collapsed.
export function clean(text) {
  return stripComments(text).replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
}

// True when the text has real content: not empty after removing comments, and no {{placeholder}} left.
export function filled(text) {
  if (text === null || text === undefined) return false;
  const t = clean(text);
  return t.length > 0 && !t.includes('{{');
}

// Replace {{slot}} markers that have a value. Unknown slots stay as they are (a human fills them) and are
// reported. By default the result is cleaned (comments removed); keepComments leaves guidance comments in.
export function fillSlots(template, slots, { keepComments = false } = {}) {
  const unfilled = new Set();
  const out = String(template).replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/g, (m, name) => {
    if (Object.prototype.hasOwnProperty.call(slots, name) && slots[name] !== null && slots[name] !== undefined) return String(slots[name]);
    unfilled.add(name);
    return m;
  });
  return { text: keepComments ? out : `${clean(out)}\n`, unfilled: [...unfilled] };
}

export function cap(text, max = 20000, source = 'the full file') {
  const t = String(text);
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}\n\n(truncated at ${max.toLocaleString('en-US')} characters: read ${source} in the repository)`;
}

export const round2 = (x) => Math.round(x * 100) / 100;
export const fmtScore = (x) => (Number.isInteger(x) ? String(x) : String(round2(x)));
export const fmtTotal = (x) => round2(x).toFixed(2);
export const fmtDelta = (d) => `${d >= 0 ? '+' : '-'}${Math.abs(round2(d)).toFixed(2)}`;

// One table cell: no pipes, no line breaks, bounded length.
export function cell(text, max = 140) {
  const t = String(text ?? '').replace(/\|/g, '/').replace(/\s*\r?\n\s*/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 3).trimEnd()}...` : t;
}

// Local wall-clock stamp with offset, e.g. "2026-10-20 14:05 +03:00".
export function localStamp(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  const off = -date.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const abs = Math.abs(off);
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())} ${sign}${p(Math.floor(abs / 60))}:${p(abs % 60)}`;
}

export const localDate = (date = new Date()) => localStamp(date).slice(0, 10);

// ---------- Markdown ----------

// Every heading outside code fences, with the body that runs to the next heading of the same or higher level.
export function sections(md) {
  const lines = String(md ?? '').split(/\r?\n/);
  const heads = [];
  let fence = null;
  lines.forEach((line, i) => {
    const f = line.match(/^\s*(```|~~~)/);
    if (f) {
      if (fence === null) fence = f[1];
      else if (fence === f[1]) fence = null;
      return;
    }
    if (fence) return;
    const m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (m) heads.push({ level: m[1].length, title: m[2].trim(), line: i });
  });
  return heads.map((h, k) => {
    let end = lines.length;
    for (let j = k + 1; j < heads.length; j++) {
      if (heads[j].level <= h.level) {
        end = heads[j].line;
        break;
      }
    }
    return { ...h, end, body: lines.slice(h.line + 1, end).join('\n') };
  });
}

// Body of the first section whose title equals `match` (case-insensitive) or matches a RegExp; null if none.
export function section(md, match) {
  const test = match instanceof RegExp ? (t) => match.test(t) : (t) => t.toLowerCase() === String(match).toLowerCase();
  const found = sections(md).find((s) => test(s.title));
  return found ? found.body : null;
}

export function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  return s.replace(/\\\|/g, '\u0000').split('|').map((c) => c.replace(/\u0000/g, '|').trim());
}

// Pipe tables: [{ header: [...], rows: [[...]], start, end }] with line indexes relative to `text`.
export function parseTables(text) {
  const lines = String(text ?? '').split(/\r?\n/);
  const sep = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;
  const out = [];
  for (let i = 0; i + 1 < lines.length; i++) {
    if (!/^\s*\|/.test(lines[i]) || !sep.test(lines[i + 1])) continue;
    const rows = [];
    let j = i + 2;
    while (j < lines.length && /^\s*\|/.test(lines[j])) rows.push(splitRow(lines[j++]));
    out.push({ header: splitRow(lines[i]), rows, start: i, end: j });
    i = j - 1;
  }
  return out;
}

// ---------- BULLSEYE.md ----------

// "# BULLSEYE · <project> · <event>" -> { project, event }
export function parseTitle(md) {
  const first = String(md ?? '').split(/\r?\n/).find((l) => /^#\s+/.test(l));
  if (!first || first.includes('{{')) return {};
  const parts = first.replace(/^#\s+/, '').split(/\s+·\s+/);
  if (parts.length >= 3 && /bullseye/i.test(parts[0])) return { project: parts[1].trim(), event: parts.slice(2).join(' · ').trim() };
  return {};
}

export function parseDeadline(md) {
  const line = String(md ?? '').split(/\r?\n/).find((l) => /^deadline:/i.test(l.trim()));
  if (!line) return null;
  const v = stripComments(line.trim().replace(/^deadline:\s*/i, '')).trim();
  return v && !v.includes('{{') ? v : null;
}

// A labelled line such as "Judges: ...", "**Judges:** ..." or "- **Jury:** ...", cut before the builder's own
// strategy that follows it ("Weights: ...", "Weight what they reward: ...").
function labelledLine(body, label) {
  if (!body) return null;
  const m = stripComments(body).match(new RegExp(`(?:^|\\n)[ \\t]*(?:[-*][ \\t]+)?(?:\\*\\*)?${label}:(?:\\*\\*)?[ \\t]*([^\\n]+)`, 'i'));
  if (!m) return null;
  const v = m[1].split(/[.;]\s*Weights?\b/i)[0].replace(/\*\*/g, '').trim().replace(/[.;,\s]+$/, '');
  return v && !v.includes('{{') ? v : null;
}

// Who the jury is: the Contract's "Judges:" line, else the Thesis "Jury:" line (the who part only).
export function parseJudges(md) {
  return labelledLine(section(md, 'Contract'), 'Judges') ?? labelledLine(section(md, 'Thesis'), 'Jury');
}

// "Weights: not published" or "Weights: proxy built from <source>" in the Contract, so the judge knows. Null when published.
export function parseWeightsNote(md) {
  const contract = section(md, 'Contract');
  if (!contract) return null;
  const m = stripComments(contract).match(/\bWeights:\s*([^.\n]+)/i);
  if (!m) return null;
  const v = m[1].trim();
  return v && !v.includes('{{') && !/^published$/i.test(v) ? v : null;
}

// The chosen problem statement's id and title from the Thesis ("**Problem statement:** <id · title> · runner-up: ...").
export function parsePsTitle(md) {
  const thesis = section(md, 'Thesis');
  if (!thesis) return null;
  const m = stripComments(thesis).match(/\*\*Problem statement:\*\*\s*([^\n]+)/i);
  if (!m) return null;
  const v = m[1].split(/\s+·\s+runner-up\b/i)[0].trim();
  return v && !v.includes('{{') ? v : null;
}

export function parseWeight(text) {
  const m = String(text ?? '').replace(/,/g, '.').match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

// The rubric table in ## Contract: the first table with a "Criterion" column and a "Weight" (or points) column.
// Only the criterion and its weight are read; the builder's own columns never leave this file.
export function parseRubric(md) {
  const contract = section(md, 'Contract');
  if (!contract) return [];
  for (const t of parseTables(stripComments(contract))) {
    const h = t.header.map((x) => x.toLowerCase());
    const ci = h.findIndex((x) => x.includes('criteri'));
    const wi = h.findIndex((x) => /weight|points|marks|%/.test(x));
    if (ci === -1 || wi === -1) continue;
    const rows = [];
    for (const r of t.rows) {
      const name = (r[ci] ?? '').replace(/\*\*/g, '').trim();
      if (!name || name.includes('{{')) continue;
      const weightText = (r[wi] ?? '').trim();
      rows.push({ name, weightText, weight: parseWeight(weightText) });
    }
    if (rows.length) return rows;
  }
  return [];
}

// ---------- scoring ----------

export function normName(s) {
  return String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
}

// Weighted total = sum(score x weight) / sum(weight). All weights missing or zero means equal weights.
export function weightedTotal(criteria) {
  const ws = criteria.map((c) => (Number.isFinite(c.weight) && c.weight > 0 ? c.weight : null));
  const equal = ws.every((w) => w === null);
  if (!equal && ws.some((w) => w === null)) throw new Error('some criteria have a weight and some do not: give every criterion its weight');
  let num = 0;
  let den = 0;
  criteria.forEach((c, i) => {
    const w = equal ? 1 : ws[i];
    num += w * c.score;
    den += w;
  });
  return den ? round2(num / den) : 0;
}

function fractions(list) {
  const ws = list.map((x) => (Number.isFinite(x.weight) && x.weight > 0 ? x.weight : null));
  const sum = ws.reduce((a, w) => a + (w ?? 0), 0);
  return ws.map((w) => (w === null || !sum ? null : w / sum));
}

// Map the judge's criteria onto the Contract rubric so the total uses the official weights.
export function reconcile(criteria, rubric) {
  const warnings = [];
  const errors = [];
  if (!rubric || !rubric.length) {
    return { criteria: criteria.map((c) => ({ ...c })), warnings: ["no rubric table in BULLSEYE.md ## Contract: the total uses the judge's own weights"], errors };
  }
  const official = fractions(rubric);
  const judged = fractions(criteria);
  const used = new Set();
  const out = [];
  rubric.forEach((r, k) => {
    const n = normName(r.name);
    let idx = criteria.findIndex((c, i) => !used.has(i) && normName(c.name) === n);
    if (idx === -1) {
      idx = criteria.findIndex((c, i) => {
        const m = normName(c.name);
        return !used.has(i) && m.length > 2 && n.length > 2 && (m.includes(n) || n.includes(m));
      });
    }
    if (idx === -1) {
      errors.push(`criterion "${r.name}" from the Contract rubric has no score in the scorecard (name it exactly as the rubric does)`);
      return;
    }
    used.add(idx);
    const c = criteria[idx];
    if (official[k] !== null && judged[idx] !== null && Math.abs(official[k] - judged[idx]) > 0.005) {
      warnings.push(`the judge weighted "${c.name}" at ${round2(judged[idx] * 100)}%, the Contract says ${round2(official[k] * 100)}%: recomputed with the Contract`);
    }
    out.push({ ...c, name: r.name, weight: r.weight });
  });
  criteria.forEach((c, i) => {
    if (!used.has(i)) warnings.push(`"${c.name}" is not a Contract criterion: left out of the total`);
  });
  return { criteria: out, warnings, errors };
}

// Lowest score; ties go to the heavier criterion, because that is the binding constraint.
export function lowestCriterion(criteria) {
  return [...criteria].sort((a, b) => a.score - b.score || (b.weight ?? 0) - (a.weight ?? 0))[0] ?? null;
}

export function topFinding(findings) {
  const rank = (s) => {
    const i = SEVERITIES.indexOf(s);
    return i === -1 ? SEVERITIES.length : i;
  };
  const list = (findings ?? []).map((f, i) => ({ f, i }));
  list.sort((a, b) => rank(a.f.severity) - rank(b.f.severity) || a.i - b.i);
  return list[0]?.f ?? null;
}

// Validate a card against the rubric and recompute its total.
export function summarize(card, rubric) {
  const r = reconcile(card.criteria ?? [], rubric);
  if (r.errors.length) return { ...r, total: null };
  let total;
  try {
    total = weightedTotal(r.criteria);
  } catch (e) {
    return { ...r, errors: [e.message], total: null };
  }
  if (Number.isFinite(card.weighted_total) && Math.abs(card.weighted_total - total) > 0.05) {
    r.warnings.push(`the judge stated a weighted total of ${card.weighted_total}; the exact weights give ${fmtTotal(total)} (recorded)`);
  }
  return { ...r, total, lowest: lowestCriterion(r.criteria), top: topFinding(card.findings) };
}

// Several scorecards for one round (a blind and an informed judge, or two fresh sessions): mean total,
// mean per criterion, the most severe finding across all of them, and a type label for the table.
export function mergeRound(entries) {
  const total = round2(entries.reduce((a, e) => a + e.sum.total, 0) / entries.length);
  const byName = new Map();
  for (const e of entries) {
    for (const c of e.sum.criteria) {
      const x = byName.get(c.name) ?? { name: c.name, weight: c.weight, scores: [] };
      x.scores.push(c.score);
      byName.set(c.name, x);
    }
  }
  const criteria = [...byName.values()].map((x) => ({ name: x.name, weight: x.weight, score: round2(x.scores.reduce((a, b) => a + b, 0) / x.scores.length) }));
  const counts = new Map();
  for (const e of entries) counts.set(e.card.type, (counts.get(e.card.type) ?? 0) + 1);
  const type = [...counts].map(([t, k]) => (k > 1 ? `${t} ×${k}` : t)).join(' + ');
  return { total, criteria, lowest: lowestCriterion(criteria), top: topFinding(entries.flatMap((e) => e.card.findings ?? [])), type, totals: entries.map((e) => e.sum.total) };
}

// Stop judging code when the last two rounds each added less than 0.2, or the judge says the code is maxed.
export function stopReasons(series, card) {
  const reasons = [];
  if (series.length >= 3) {
    const d1 = round2(series[series.length - 1].total - series[series.length - 2].total);
    const d2 = round2(series[series.length - 2].total - series[series.length - 3].total);
    if (d1 < 0.2 && d2 < 0.2) reasons.push(`two rounds in a row added less than 0.2 (${fmtDelta(d2)}, then ${fmtDelta(d1)})`);
  }
  if (card && card.code_maxed === true) reasons.push('the judge says the code is maxed');
  return reasons;
}

// ---------- JSON ----------

// Accept a bare JSON file, or a pasted reply that contains a JSON code block.
export function extractJson(text) {
  const t = String(text ?? '').replace(/^﻿/, '');
  try {
    return JSON.parse(t);
  } catch {
    // fall through to fenced blocks
  }
  const blocks = [...t.matchAll(/```[a-zA-Z]*\s*\n([\s\S]*?)```/g)].map((m) => m[1]);
  let fallback = null;
  for (const b of blocks.reverse()) {
    try {
      const v = JSON.parse(b);
      if (v && typeof v === 'object' && Array.isArray(v.criteria)) return v;
      fallback ??= v;
    } catch {
      // not JSON
    }
  }
  if (fallback) return fallback;
  const a = t.indexOf('{');
  const b = t.lastIndexOf('}');
  if (a !== -1 && b > a) {
    try {
      return JSON.parse(t.slice(a, b + 1));
    } catch {
      // not JSON
    }
  }
  throw new Error('no JSON object found: expected a scorecard JSON file, or a reply that contains one JSON code block');
}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function typeOk(t, v) {
  switch (t) {
    case 'object': return isObject(v);
    case 'array': return Array.isArray(v);
    case 'integer': return Number.isInteger(v);
    case 'number': return typeof v === 'number' && Number.isFinite(v);
    case 'string': return typeof v === 'string';
    case 'boolean': return typeof v === 'boolean';
    case 'null': return v === null;
    default: return true;
  }
}

// JSON Schema subset: type, enum, const, required, properties, additionalProperties: false, items,
// minItems, minLength, pattern, minimum, maximum, exclusiveMinimum, allOf, if/then/else.
export function validate(schema, data, at = '$', errors = []) {
  if (schema === true || schema === undefined || schema === null) return errors;
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => typeOk(t, data))) {
      errors.push(`${at}: expected ${types.join(' or ')}`);
      return errors;
    }
  }
  if (schema.const !== undefined && data !== schema.const) errors.push(`${at}: must be ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(data)) errors.push(`${at}: must be one of ${schema.enum.map((x) => JSON.stringify(x)).join(', ')}`);
  if (typeof data === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum) errors.push(`${at}: must be >= ${schema.minimum}`);
    if (schema.maximum !== undefined && data > schema.maximum) errors.push(`${at}: must be <= ${schema.maximum}`);
    if (schema.exclusiveMinimum !== undefined && data <= schema.exclusiveMinimum) errors.push(`${at}: must be > ${schema.exclusiveMinimum}`);
  }
  if (typeof data === 'string') {
    if (schema.minLength !== undefined && data.trim().length < schema.minLength) errors.push(`${at}: must not be empty`);
    if (schema.pattern && !new RegExp(schema.pattern).test(data)) errors.push(`${at}: must match ${schema.pattern}`);
  }
  if (Array.isArray(data)) {
    if (schema.minItems !== undefined && data.length < schema.minItems) errors.push(`${at}: needs at least ${schema.minItems} item(s)`);
    if (schema.items) data.forEach((d, i) => validate(schema.items, d, `${at}[${i}]`, errors));
  }
  if (isObject(data)) {
    // A key holding undefined is absent, as it would be after a JSON round trip.
    for (const k of schema.required ?? []) if (data[k] === undefined) errors.push(`${at}: missing "${k}"`);
    for (const [k, s] of Object.entries(schema.properties ?? {})) if (data[k] !== undefined) validate(s, data[k], `${at}.${k}`, errors);
    if (schema.additionalProperties === false) {
      for (const k of Object.keys(data)) if (!(k in (schema.properties ?? {}))) errors.push(`${at}: unexpected "${k}"`);
    }
  }
  for (const s of schema.allOf ?? []) validate(s, data, at, errors);
  if (schema.if) {
    const probe = validate(schema.if, data, at, []);
    if (probe.length === 0 && schema.then) validate(schema.then, data, at, errors);
    if (probe.length > 0 && schema.else) validate(schema.else, data, at, errors);
  }
  return errors;
}

// ---------- judging/ history ----------

export function roundDirs(root, prefix = 'round') {
  const base = path.join(root, 'judging');
  let entries;
  try {
    entries = fs.readdirSync(base, { withFileTypes: true });
  } catch {
    return [];
  }
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  return entries
    .filter((d) => d.isDirectory())
    .map((d) => {
      const m = d.name.match(re);
      return m ? { n: Number(m[1]), dir: path.join(base, d.name) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.n - b.n);
}

export function scorecardFiles(dir) {
  try {
    return fs.readdirSync(dir).filter((f) => SCORECARD_FILE.test(f)).sort().map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}

// Every recorded scorecard, parsed and recomputed: Map(round -> [{ file, card, sum }]). Bad files become warnings.
export function loadRounds(root, rubric, warnings = []) {
  const byRound = new Map();
  for (const { n, dir } of roundDirs(root)) {
    for (const file of scorecardFiles(dir)) {
      let card;
      try {
        card = extractJson(readText(file));
      } catch (e) {
        warnings.push(`${path.relative(root, file)}: ${e.message}`);
        continue;
      }
      const sum = summarize(card, rubric);
      if (sum.total === null) {
        warnings.push(`${path.relative(root, file)}: skipped (${sum.errors.join('; ')})`);
        continue;
      }
      const list = byRound.get(n) ?? [];
      list.push({ file, card, sum });
      byRound.set(n, list);
    }
  }
  return byRound;
}

export function isGitignored(gitignoreText, name = 'judging') {
  const ok = new Set([name, `${name}/`, `/${name}`, `/${name}/`, `${name}/*`, `/${name}/*`, `${name}/**`, `/${name}/**`]);
  return String(gitignoreText ?? '').split(/\r?\n/).some((l) => ok.has(l.trim()));
}
