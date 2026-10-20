#!/usr/bin/env node
// form-check.mjs - idea-round skill (BULLSEYE)
//
// Checks a paste-ready form pack (idea/SUBMISSION-FORM.md) before anything is pasted into a portal.
// Every Markdown heading that carries a budget is a form field, for example:
//   ## 6. Newness/uniqueness (1460/1500 chars)
//   ## Idea Description (~3,400 / 50,000 chars)
//   ## Q3 Validation (240/250 words)
// The paste text is everything under that heading up to the next heading, without HTML comments (a line
// that holds only a comment is dropped). A body that is one fenced code block counts as its content.
//
// For every field it measures the text the way a portal counts it, checks the limit and the fill band,
// and flags characters portals mangle, Markdown that would paste literally, identity leaks (--anon) and
// numbers that are missing from the spine's Numbers table (--numbers). --fix writes the measured counts
// back into the headings.
//
// Usage:  node form-check.mjs <SUBMISSION-FORM.md> [options]      (--help lists every option)
// Exit:   0 clean (warnings allowed); 1 a check failed, or a warning with --strict; 2 usage or file error
// Needs:  Node 20 or newer; no packages.
//
// Every non-ASCII character this file looks for is built from its code point, so the file stays ASCII.

import fs from 'node:fs';
import path from 'node:path';

const HELP = `form-check: check a paste-ready form pack before pasting it into a portal.

Usage
  node form-check.mjs <SUBMISSION-FORM.md> [options]

A field is any heading with a budget, such as "## 6. Newness (1460/1500 chars)" or
"## Q3 Validation (240/250 words)". Its paste text is the body up to the next heading,
without HTML comments.

Options
  --fix              write each measured count into its heading
  --numbers <file>   warn about numbers in the form that are missing from the Numbers table
                     in <file> (idea/SPINE.md); with no Numbers heading, every number in <file> counts
  --forbid <chars>   characters this portal strips or rejects, e.g. "%';" (a failure when present)
  --anon             fail on emails, phone numbers and links (anonymous rounds)
  --terms <a,b,c>    identity terms that must not appear: names, team, institute, brand (implies --anon)
  --allow-unicode    accept non-ASCII letters (Hindi or other scripts); dashes, curly quotes and
                     symbols are still reported
  --newline <1|2>    characters per line break (default 2: browsers submit CRLF)
  --min <pct>        lowest fill of a binding limit before a warning (default 91)
  --max <pct>        highest fill of a binding limit before a warning (default 98)
  --strict           warnings also exit 1
  --json             print the report as JSON
  -h, --help         show this help

Counting
  Characters are UTF-16 code units, as a browser's maxlength counts them; a line break counts 2
  unless --newline 1. Words are runs of non-space characters, the strictest common count.
  A limit is binding, and gets the fill check, when it is 300 to 5,000 characters or 50 to 800 words.

Exit codes
  0 clean (warnings allowed), 1 a check failed or a warning with --strict, 2 usage or file error
`;

class UsageError extends Error {}

const BUDGET = /\(\s*(~?\s*\d[\d,]*|\?|n|\{\{[^}]*\}\})\s*\/\s*(\d[\d,]*|\?|\{\{[^}]*\}\})\s*(chars?|characters|words?)\s*\)/i;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const HEADING = /^ {0,3}(#{1,6})[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/;
const COMMENT = /<!--[\s\S]*?-->/g;
const MARK = '@@form-check-comment@@';
const BOM = 0xfeff;

const hex = (cp) => 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');

// Characters web forms and portals mangle, keyed by code point.
const CHAR_RULES = new Map([
  [0x2014, { name: 'em dash', use: 'a colon, comma or full stop', level: 'fail' }],
  [0x2013, { name: 'en dash', use: 'a plain hyphen', level: 'warn' }],
  [0x2212, { name: 'minus sign', use: 'a plain hyphen', level: 'warn' }],
  [0x2010, { name: 'hyphen character', use: 'a plain hyphen', level: 'warn' }],
  [0x2011, { name: 'non-breaking hyphen', use: 'a plain hyphen', level: 'warn' }],
  [0x2018, { name: 'curly quote', use: "a straight ' quote", level: 'warn' }],
  [0x2019, { name: 'curly apostrophe', use: "a straight ' apostrophe", level: 'warn' }],
  [0x201c, { name: 'curly quote', use: 'a straight " quote', level: 'warn' }],
  [0x201d, { name: 'curly quote', use: 'a straight " quote', level: 'warn' }],
  [0x2026, { name: 'ellipsis character', use: 'three full stops', level: 'warn' }],
  [0x00a0, { name: 'non-breaking space', use: 'a normal space', level: 'warn' }],
  [0x202f, { name: 'narrow non-breaking space', use: 'a normal space', level: 'warn' }],
  [0x200b, { name: 'zero-width space', use: 'nothing (delete it)', level: 'fail' }],
  [0x2060, { name: 'word joiner', use: 'nothing (delete it)', level: 'fail' }],
  [BOM, { name: 'byte-order mark', use: 'nothing (delete it)', level: 'fail' }],
  [0x20b9, { name: 'rupee sign', use: 'Rs', level: 'warn' }],
  [0x00b1, { name: 'plus-minus sign', use: '+/-', level: 'warn' }],
  [0x2265, { name: 'greater-than-or-equal sign', use: '>=', level: 'warn' }],
  [0x2264, { name: 'less-than-or-equal sign', use: '<=', level: 'warn' }],
  [0x00d7, { name: 'multiplication sign', use: 'x', level: 'warn' }],
  [0x2192, { name: 'arrow', use: '"to" or ->', level: 'warn' }],
  [0x2190, { name: 'arrow', use: '"from" or <-', level: 'warn' }],
  [0x2194, { name: 'arrow', use: '"to and from" or <->', level: 'warn' }],
  [0x21d2, { name: 'arrow', use: '"so" or =>', level: 'warn' }],
  [0x2022, { name: 'bullet', use: '"- " at the start of the line', level: 'warn' }],
  [0x00b7, { name: 'middle dot', use: 'a comma or " - "', level: 'warn' }],
]);
// Joiners that Indic scripts need: a failure only when non-ASCII letters are not expected.
const JOINERS = new Map([
  [0x200c, 'zero-width non-joiner'],
  [0x200d, 'zero-width joiner'],
]);
const EMOJI = /\p{Emoji_Presentation}/u;
const VARIATION_EMOJI = 0xfe0f;

const FORBID_HINT = {
  '%': 'write "per cent"',
  "'": 'rephrase without it ("the baseline of the machine")',
  ';': 'use a full stop or a comma',
  '&': 'write "and"',
  '"': 'rephrase without double quotes',
  '<': 'write "less than"',
  '>': 'write "more than"',
  '#': 'write "number"',
  '/': 'write "or" or "per"',
};

const MARKDOWN = [
  [/\*\*[^*\n]+\*\*/, 'bold markers (**) paste literally'],
  [/(?:^|[^\w])__[^_\n]+__(?!\w)/, 'bold markers (__) paste literally'],
  [/`[^`\n]+`/, 'backticks paste literally'],
  [/\[[^\]\n]+\]\([^)\s]+\)/, 'a Markdown link pastes as [text](url)'],
  [/^ {0,3}>\s/m, 'a quote marker (>) pastes literally'],
  [/^ {0,3}\|.*\|\s*$/m, 'a Markdown table pastes as pipes'],
];

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
const LINK = /\bhttps?:\/\/[^\s)>\]]+|\bwww\.[^\s)>\]]+/gi;
const DOMAIN = /\b[A-Za-z0-9][A-Za-z0-9-]*(?:\.[A-Za-z0-9-]+)*\.(?:com|in|org|net|io|ai|app|dev|edu|gov|co|info|xyz)(?![A-Za-z0-9-])(?:\/[^\s)]*)?/g;
// 10 to 14 digits, optionally led by + and split by single spaces or hyphens; not part of a longer number.
const PHONE = /(?<![\w+])(?<!\d[.,])\+?\d(?:[ -]?\d){9,13}(?!\w)(?![.,]\d)/g;
const TRAILING_PUNCTUATION = /[.,;:!?'"]+$/;

// ---------------------------------------------------------------- arguments

function parseArgs(argv) {
  const o = {
    fix: false, numbers: null, forbid: '', anon: false, terms: [], allowUnicode: false,
    newline: 2, min: 91, max: 98, strict: false, json: false, help: false, file: null,
  };
  for (let i = 0; i < argv.length; i++) {
    let a = argv[i];
    let inline = null;
    if (a.startsWith('--') && a.includes('=')) {
      inline = a.slice(a.indexOf('=') + 1);
      a = a.slice(0, a.indexOf('='));
    }
    const value = () => {
      if (inline !== null) return inline;
      if (i + 1 >= argv.length) throw new UsageError(`${a} needs a value`);
      return argv[++i];
    };
    switch (a) {
      case '-h': case '--help': o.help = true; break;
      case '--fix': o.fix = true; break;
      case '--numbers': o.numbers = value(); break;
      case '--forbid': o.forbid = [...new Set(value())].join(''); break;
      case '--anon': o.anon = true; break;
      case '--terms': o.terms = value().split(',').map((t) => t.trim()).filter(Boolean); o.anon = true; break;
      case '--allow-unicode': o.allowUnicode = true; break;
      case '--newline': {
        const n = Number(value());
        if (n !== 1 && n !== 2) throw new UsageError('--newline takes 1 or 2');
        o.newline = n;
        break;
      }
      case '--min': o.min = percent(value(), '--min'); break;
      case '--max': o.max = percent(value(), '--max'); break;
      case '--strict': o.strict = true; break;
      case '--json': o.json = true; break;
      default:
        if (a.startsWith('-')) throw new UsageError(`unknown option ${a}`);
        if (o.file) throw new UsageError(`give one form file (got ${o.file} and ${a})`);
        o.file = a;
    }
  }
  if (o.min > o.max) throw new UsageError('--min is above --max');
  return o;
}

function percent(v, name) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 200) throw new UsageError(`${name} takes a percentage from 0 to 200`);
  return n;
}

// ---------------------------------------------------------------- parsing

const stripBom = (s) => (s.charCodeAt(0) === BOM ? s.slice(1) : s);
const normalise = (s) => stripBom(s).replace(/\r\n?/g, '\n');
const maskComments = (s) => s.replace(COMMENT, (c) => c.replace(/[^\n]/g, ' '));

function findHeadings(maskedLines) {
  const heads = [];
  let fence = null;
  maskedLines.forEach((line, i) => {
    const f = line.match(FENCE);
    if (f) {
      if (fence === null) fence = f[1][0];
      else if (f[1][0] === fence) fence = null;
      return;
    }
    if (fence !== null) return;
    const h = line.match(HEADING);
    if (h) heads.push({ line: i, level: h[1].length, title: h[2].trim() });
  });
  return heads;
}

function parseBudget(title) {
  const m = title.match(BUDGET);
  if (!m) return null;
  return {
    unit: /^w/i.test(m[3]) ? 'words' : 'chars',
    limit: /^\d/.test(m[2]) ? Number(m[2].replace(/,/g, '')) : null,
    countText: m[1],
    limitText: m[2],
    raw: m[0],
  };
}

function pasteText(bodyLines) {
  let lines = bodyLines
    .join('\n')
    .replace(COMMENT, MARK)
    .split('\n')
    .filter((l) => !(l.includes(MARK) && l.split(MARK).join('').trim() === ''))
    .map((l) => l.split(MARK).join(''));
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  if (lines.length >= 2 && FENCE.test(lines[0]) && FENCE.test(lines[lines.length - 1])) {
    const inner = lines.slice(1, -1);
    if (!inner.some((l) => FENCE.test(l))) lines = inner;
  }
  return lines.join('\n');
}

function extractFields(text) {
  const lines = text.split('\n');
  const heads = findHeadings(maskComments(text).split('\n'));
  const fields = [];
  heads.forEach((h, k) => {
    const budget = parseBudget(h.title);
    if (!budget) return;
    const end = k + 1 < heads.length ? heads[k + 1].line : lines.length;
    fields.push({
      line: h.line,
      name: h.title.replace(budget.raw, '').trim(),
      budget,
      body: pasteText(lines.slice(h.line + 1, end)),
    });
  });
  return fields;
}

// ---------------------------------------------------------------- measuring

function measure(text, unit, newline) {
  if (unit === 'words') return (text.match(/\S+/g) || []).length;
  const breaks = (text.match(/\n/g) || []).length;
  return text.length + (newline === 2 ? breaks : 0);
}

const isBinding = (unit, limit) => (unit === 'words' ? limit >= 50 && limit <= 800 : limit >= 300 && limit <= 5000);

// Problem characters are shown by code point in every snippet: some are invisible, and none should be
// echoed back as if they were fine.
function visible(s) {
  let out = '';
  for (const c of s) {
    const cp = c.codePointAt(0);
    const problem = CHAR_RULES.has(cp) || JOINERS.has(cp) || cp === VARIATION_EMOJI || (cp < 0x20 && c !== '\n' && c !== '\t');
    out += problem ? `<${hex(cp)}>` : c;
  }
  return out;
}

function snippet(text, index, length, label) {
  const a = Math.max(0, index - 24);
  const b = Math.min(text.length, index + length + 24);
  const middle = label ?? visible(text.slice(index, index + length));
  const s = `${visible(text.slice(a, index))}[${middle}]${visible(text.slice(index + length, b))}`.replace(/\s+/g, ' ').trim();
  return (a > 0 ? '...' : '') + s + (b < text.length ? '...' : '');
}

// ---------------------------------------------------------------- checks

function checkCharacters(text, o) {
  const seen = new Map();
  const add = (key, level, message, index, length, label) => {
    const s = seen.get(key);
    if (s) s.count += 1;
    else seen.set(key, { level, message, index, length, label, count: 1 });
  };
  let i = 0;
  for (const c of text) {
    const cp = c.codePointAt(0);
    if (o.forbid.includes(c)) {
      add(`forbid:${cp}`, 'fail', `"${c}" is stripped or rejected by this portal: ${FORBID_HINT[c] || 'remove it or rephrase'}`, i, c.length);
    } else if (cp < 0x80) {
      if (cp < 0x20 && c !== '\n' && c !== '\t') add(`ctrl:${cp}`, 'fail', `control character ${hex(cp)}: delete it`, i, c.length, hex(cp));
    } else if (CHAR_RULES.has(cp)) {
      const r = CHAR_RULES.get(cp);
      add(`char:${cp}`, r.level, `${r.name} (${hex(cp)}): use ${r.use}`, i, c.length, hex(cp));
    } else if (JOINERS.has(cp)) {
      if (!o.allowUnicode) add(`char:${cp}`, 'fail', `${JOINERS.get(cp)} (${hex(cp)}): delete it, or pass --allow-unicode for Indic text`, i, c.length, hex(cp));
    } else if (cp === VARIATION_EMOJI || EMOJI.test(c)) {
      add('emoji', 'warn', 'emoji: keep judge-facing text free of emoji', i, c.length, hex(cp));
    } else if (!o.allowUnicode) {
      add(`char:${cp}`, 'warn', `non-ASCII character ${hex(cp)}: check that the portal stores it, or pass --allow-unicode`, i, c.length, hex(cp));
    }
    i += c.length;
  }
  return [...seen.values()].map((s) => ({
    level: s.level,
    message: s.message + (s.count > 1 ? ` (x${s.count})` : ''),
    context: snippet(text, s.index, s.length, s.label),
  }));
}

function checkMarkdown(text) {
  const issues = [];
  for (const [re, message] of MARKDOWN) {
    const m = text.match(re);
    if (m) issues.push({ level: 'warn', message: `${message}: form boxes do not render Markdown`, context: snippet(text, m.index, m[0].length) });
  }
  return issues;
}

function termPattern(term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'giu');
}

function checkAnon(text, terms) {
  const taken = [];
  const hits = [];
  const scan = (re, kind, trim = false) => {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      if (m[0].length === 0) { re.lastIndex += 1; continue; }
      const value = trim ? m[0].replace(TRAILING_PUNCTUATION, '') : m[0];
      const a = m.index;
      const b = a + value.length;
      if (!value || taken.some(([x, y]) => a < y && b > x)) continue;
      taken.push([a, b]);
      hits.push({ kind, value, index: a });
    }
  };
  scan(EMAIL, 'email address');
  scan(LINK, 'link', true);
  scan(DOMAIN, 'domain name', true);
  scan(PHONE, 'phone or ID number');
  for (const t of terms) scan(termPattern(t), 'identity term');
  const seen = new Set();
  const issues = [];
  for (const h of hits.sort((x, y) => x.index - y.index)) {
    const key = `${h.kind}:${h.value.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    issues.push({ level: 'fail', message: `${h.kind} "${h.value}": remove it from an anonymous submission`, context: snippet(text, h.index, h.value.length) });
  }
  return issues.slice(0, 20);
}

function normaliseNumber(raw) {
  let s = raw.replace(/,/g, '');
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s.replace(/^0+(?=\d)/, '');
}

function numberTokens(text, skipMarkers) {
  const out = [];
  const re = /\d[\d,]*(?:\.\d+)?/g;
  let m;
  while ((m = re.exec(text))) {
    const raw = m[0].replace(/,+$/, '');
    const start = m.index;
    const before = start > 0 ? text[start - 1] : '';
    const after = text[start + raw.length] || '';
    if (/[A-Za-z_]/.test(before)) continue; // identifiers such as F1, YOLOv8, H0, Q3, file_2
    if (/^[A-Z](?![A-Za-z])/.test(text.slice(start + raw.length))) continue; // 3D, 4G, 5G (but 60Hz is a number)
    if (skipMarkers) {
      if (before === '(' && after === ')') continue; // (1) (2) (3)
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      if (/^\s*$/.test(text.slice(lineStart, start)) && /^[.)](\s|$)/.test(text.slice(start + raw.length))) continue; // "1." or "1)" opening a line
    }
    out.push({ raw, value: normaliseNumber(raw), index: start });
  }
  return out;
}

function readKnownNumbers(file) {
  const text = normalise(fs.readFileSync(file, 'utf8'));
  const lines = maskComments(text).split('\n');
  const heads = findHeadings(lines);
  const h = heads.find((x) => /^(?:\d+[.)]?\s*)?numbers\b/i.test(x.title));
  let source = maskComments(text);
  let scope = `every number in ${path.basename(file)}`;
  if (h) {
    const next = heads.find((x) => x.line > h.line && x.level <= h.level);
    const rows = lines.slice(h.line + 1, next ? next.line : lines.length).filter((l) => /^\s*\|/.test(l));
    if (rows.length) {
      const cells = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
      const header = cells(rows[0]).map((c) => c.toLowerCase());
      let cols = header.map((c, i) => (/as written|value|number|date/.test(c) ? i : -1)).filter((i) => i >= 0);
      if (!cols.length) cols = header.map((_, i) => i).slice(1);
      const data = rows.slice(1).filter((l) => !/^\s*\|?\s*:?-{2,}/.test(l));
      source = data.map((l) => { const c = cells(l); return cols.map((i) => c[i] || '').join(' '); }).join('\n');
      scope = `the Numbers table in ${path.basename(file)} (${data.length} rows)`;
    }
  }
  return { known: new Set(numberTokens(source, false).map((t) => t.value)), scope };
}

function checkNumbers(text, known) {
  const missing = new Map();
  let first = null;
  for (const t of numberTokens(text, true)) {
    if (known.has(t.value)) continue;
    missing.set(t.raw, (missing.get(t.raw) || 0) + 1);
    if (!first) first = t;
  }
  if (!missing.size) return [];
  const list = [...missing.entries()].slice(0, 12).map(([raw, n]) => (n > 1 ? `${raw} (x${n})` : raw)).join(', ');
  const more = missing.size > 12 ? ` and ${missing.size - 12} more` : '';
  return [{
    level: 'warn',
    message: `not in the Numbers table: ${list}${more}. Add each with its label and source, or cut it`,
    context: snippet(text, first.index, first.raw.length),
  }];
}

function checkField(f, o, known) {
  const { unit, limit, countText } = f.budget;
  const count = measure(f.body, unit, o.newline);
  const fill = limit ? (count / limit) * 100 : null;
  const issues = [];
  if (limit !== null) {
    if (count > limit) issues.push({ level: 'fail', message: `over the limit by ${count - limit} ${unit}` });
    else if (isBinding(unit, limit)) {
      if (fill < o.min) issues.push({ level: 'warn', message: `fill ${fill.toFixed(1)}% is under ${o.min}% of a binding limit: add evidence, not adjectives` });
      else if (fill > o.max) issues.push({ level: 'warn', message: `fill ${fill.toFixed(1)}% is over ${o.max}%: leave a margin for how the portal counts` });
    }
  }
  if (count === 0) issues.push({ level: 'warn', message: 'the field is empty' });
  if (!o.fix && /^\d/.test(countText)) {
    const stated = Number(countText.replace(/,/g, ''));
    if (stated !== count) issues.push({ level: 'warn', message: `the heading says ${stated}, the text measures ${count}: run with --fix` });
  }
  issues.push(...checkCharacters(f.body, o), ...checkMarkdown(f.body));
  if (o.anon) issues.push(...checkAnon(f.body, o.terms));
  if (known) issues.push(...checkNumbers(f.body, known));
  const status = issues.some((x) => x.level === 'fail') ? 'FAIL'
    : issues.some((x) => x.level === 'warn') ? 'WARN'
      : limit === null ? 'SKIP' : 'OK';
  return { line: f.line + 1, name: f.name, unit, limit, count, fill: fill === null ? null : Number(fill.toFixed(1)), status, issues };
}

// ---------------------------------------------------------------- fixing

function fixHeadings(raw, fields, results) {
  const bom = raw.charCodeAt(0) === BOM ? String.fromCharCode(BOM) : '';
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = normalise(raw).split('\n');
  let changed = 0;
  fields.forEach((f, k) => {
    const line = lines[f.line];
    const m = line.match(BUDGET);
    if (!m) return;
    const count = results[k].count;
    const text = m[2].includes(',') ? count.toLocaleString('en-US') : String(count);
    const at = m[0].indexOf(m[1]);
    const next = m[0].slice(0, at) + text + m[0].slice(at + m[1].length);
    if (next === m[0]) return;
    lines[f.line] = line.slice(0, m.index) + next + line.slice(m.index + m[0].length);
    changed += 1;
  });
  return { text: bom + lines.join(eol), changed };
}

// ---------------------------------------------------------------- report

function printReport(o, results, summary, fixed, scope) {
  const out = [`form-check  ${o.file}  (a line break counts ${o.newline})`];
  if (scope) out.push(`numbers checked against ${scope}`);
  for (const r of results) {
    const name = r.name.length > 40 ? `${r.name.slice(0, 37)}...` : r.name;
    const budget = `${r.count} / ${r.limit === null ? '?' : r.limit} ${r.unit}`;
    const fill = r.fill === null ? '' : `${r.fill.toFixed(1)}%`;
    out.push(`  ${r.status.padEnd(4)}  L${String(r.line).padEnd(4)} ${name.padEnd(40)} ${budget.padStart(22)} ${fill.padStart(7)}`);
    for (const i of r.issues) out.push(`        ${i.level}: ${i.message}${i.context ? `  ${JSON.stringify(i.context)}` : ''}`);
    if (r.status === 'SKIP') out.push('        skip: the limit is not set in the heading');
  }
  const parts = [`${summary.fields} fields`, `${summary.fail} FAIL`, `${summary.warn} WARN`, `${summary.ok} OK`];
  if (summary.skip) parts.push(`${summary.skip} SKIP`);
  out.push(parts.join(', '));
  if (fixed) out.push(`updated ${fixed} heading count${fixed === 1 ? '' : 's'} in ${o.file}`);
  process.stdout.write(`${out.join('\n')}\n`);
}

// ---------------------------------------------------------------- main

function main(argv) {
  let o;
  try {
    o = parseArgs(argv);
  } catch (e) {
    if (e instanceof UsageError) {
      process.stderr.write(`form-check: ${e.message}. Try --help.\n`);
      return 2;
    }
    throw e;
  }
  if (o.help) {
    process.stdout.write(HELP);
    return 0;
  }
  if (!o.file) {
    process.stderr.write('form-check: give the form file, for example: node form-check.mjs idea/SUBMISSION-FORM.md (--help lists the options)\n');
    return 2;
  }
  const file = path.resolve(o.file);
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (e) {
    process.stderr.write(`form-check: cannot read ${o.file} (${e.code || e.message})\n`);
    return 2;
  }
  let known = null;
  let scope = null;
  if (o.numbers) {
    try {
      ({ known, scope } = readKnownNumbers(path.resolve(o.numbers)));
    } catch (e) {
      process.stderr.write(`form-check: cannot read the numbers file ${o.numbers} (${e.code || e.message})\n`);
      return 2;
    }
  }
  const fields = extractFields(normalise(raw));
  if (!fields.length) {
    process.stderr.write(`form-check: no field heading with a budget such as "(1460/1500 chars)" in ${o.file}\n`);
    return 1;
  }
  const results = fields.map((f) => checkField(f, o, known));
  let fixed = 0;
  if (o.fix) {
    const out = fixHeadings(raw, fields, results);
    if (out.changed) fs.writeFileSync(file, out.text, 'utf8');
    fixed = out.changed;
  }
  const summary = { fields: results.length, fail: 0, warn: 0, ok: 0, skip: 0 };
  for (const r of results) summary[r.status.toLowerCase()] += 1;
  if (o.json) process.stdout.write(`${JSON.stringify({ file: o.file, newline: o.newline, numbers: scope, fixed, summary, fields: results }, null, 2)}\n`);
  else printReport(o, results, summary, fixed, scope);
  return summary.fail > 0 || (o.strict && summary.warn > 0) ? 1 : 0;
}

process.exitCode = main(process.argv.slice(2));
