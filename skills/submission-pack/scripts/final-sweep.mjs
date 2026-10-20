#!/usr/bin/env node
// final-sweep.mjs: the last check before a hackathon submission. Part of the submission-pack skill.
// Zero dependencies. Node 20+ on Windows, macOS and Linux. This file stays ASCII: special characters
// (the em dash, the middot) are built from their character codes.
//
// It fails on the slips real submissions shipped with: a video link left as a {VIDEO_URL} placeholder,
// a README that said 58 tests when the suite had 59, a mandatory README section nobody wrote, localhost
// links, absolute machine paths, secret-shaped strings, tracked .env files, an open [hard] line in the
// requirements gate, and files over a portal's upload cap. It warns on http:// links, em dashes and hype
// words in judge-facing prose, stale character counts in form answers, and screenshots that may show the
// Next.js dev indicator.
//
// Usage
//   node final-sweep.mjs [dir] [options]
//
//   dir                  the project to sweep (default: the current directory)
//   --require <text>     a README heading that must exist; repeat it (--require "For judges" --require "Run it locally")
//   --config <file>      sweep config (default: <dir>/sweep.config.json when it exists)
//   --facts <file>       facts file for the count checks (default: config, then claims.json, then facts.json)
//   --gate <file>        file holding the "### Requirements gate" (default: <dir>/BULLSEYE.md when it exists)
//   --run-gate           also run every "cmd:" check of the gate from the project root and print its output
//                        next to its "pass:" condition, for you to judge (it runs commands: use a gate you trust)
//   --gate-timeout <ms>  per-command timeout for --run-gate (default 60000)
//   --gate-table         print the gate as a "Requirement | Where it is" table for SUBMISSION.md, then exit
//   --check-links        request every http(s) link in judge-facing files (uses the network; off by default)
//   --timeout <ms>       per-request timeout for --check-links (default 8000)
//   --strict-prose       em dashes in judge-facing prose are errors, not warnings
//   --no-history         skip the scan of git history for secrets
//   --only <a,b>         run only these checks; --skip <a,b> runs every check but these
//   --max <n>            findings printed per check (default 25; 0 prints all; --json always holds all)
//   --json               print the report as JSON
//   --help               this text
//
// Judge-facing files are README.md, every SUBMISSION*.md and BRIEFING*.md, deck HTML (deck/, pitch/,
// slides/ or *deck*.html) and the Markdown in docs/. Code is every other text file git would push.
// Exit code: 0 with no ERROR, 1 with at least one ERROR, 2 on bad usage.
// A line containing "sweep-ignore" is skipped; "sweep-ignore-file" near the top of a file skips the file.

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const VERSION = '1.0.0';
const NUL = String.fromCharCode(0);
const EM_DASH = String.fromCharCode(0x2014);
const MIDDOT = String.fromCharCode(0xb7);
const LESS_EQUAL = String.fromCharCode(0x2264);
const BOM = String.fromCharCode(0xfeff);
const MAX_TEXT_BYTES = 2 * 1024 * 1024;
const HISTORY_MARK = '==final-sweep== ';

export const CHECKS = [
  'requirements', 'required-section', 'placeholder', 'template-guide', 'field-budget', 'stale-count',
  'localhost-link', 'http-link', 'repo-link', 'link', 'abs-path', 'secret', 'history', 'env-file',
  'process-file', 'large-file', 'dev-indicator', 'em-dash', 'ai-tell', 'config',
];

const HELP = `final-sweep ${VERSION}: the last check before a hackathon submission.

Usage
  node final-sweep.mjs [dir] [options]

  dir                  the project to sweep (default: the current directory)
  --require <text>     a README heading that must exist; repeat it
  --config <file>      sweep config (default: <dir>/sweep.config.json when it exists)
  --facts <file>       facts file for count checks (default: config, claims.json, then facts.json)
  --gate <file>        file holding the "### Requirements gate" (default: <dir>/BULLSEYE.md)
  --run-gate           run every "cmd:" check of the gate and print its output beside its pass condition
  --gate-timeout <ms>  per-command timeout for --run-gate (default 60000)
  --gate-table         print the gate as a "Requirement | Where it is" table, then exit
  --check-links        request every http(s) link in judge-facing files (network; off by default)
  --timeout <ms>       per-request timeout for --check-links (default 8000)
  --strict-prose       em dashes in judge-facing prose are errors, not warnings
  --no-history         skip the scan of git history for secrets
  --only <a,b>         run only these checks; --skip <a,b> runs all but these
  --max <n>            findings printed per check (default 25; 0 prints all)
  --json               print the report as JSON
  --help               this text

Checks: ${CHECKS.join(', ')}
Exit code: 0 with no ERROR, 1 with at least one ERROR, 2 on bad usage.
A line containing "sweep-ignore" is skipped.
`;

class UsageError extends Error {}

// ---------- file classes ----------

export const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', '.venv', 'venv', 'coverage', 'out', '__pycache__',
  '.turbo', '.vercel', '.svelte-kit', '.nuxt', '.output', '.parcel-cache', '.pytest_cache', '.mypy_cache',
  '.ruff_cache', '.missile', '.pnpm-store', '.yarn',
]);
const GENERATED = /(^|\/)(node_modules|dist|build|out|vendor|coverage|\.next|\.output)\//i;
const TOOLING = ['.agents/**', '.claude/**', '.cursor/**', '.codex/**', '.gemini/**', '.windsurf/**'];
const TEMPLATE_FILES = ['*.template.*', '.github/ISSUE_TEMPLATE/**', '.github/PULL_REQUEST_TEMPLATE*'];
const BINARY_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.icns', '.bmp', '.tif', '.tiff', '.psd',
  '.pdf', '.zip', '.gz', '.tgz', '.bz2', '.xz', '.7z', '.rar', '.tar', '.mp4', '.mov', '.webm', '.mkv',
  '.avi', '.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.pptx', '.ppt', '.docx', '.doc', '.xlsx', '.xls', '.key', '.onnx', '.pt', '.pth', '.bin',
  '.safetensors', '.h5', '.pkl', '.npy', '.npz', '.exe', '.dll', '.so', '.dylib', '.wasm', '.class',
  '.jar', '.pyc', '.sqlite', '.db', '.parquet', '.lockb', '.keystore', '.jks', '.p12', '.pfx',
]);
const CODE_EXT = new Set([
  '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.mts', '.cts', '.vue', '.svelte', '.astro', '.py',
  '.rb', '.go', '.rs', '.java', '.kt', '.kts', '.swift', '.c', '.h', '.cc', '.cpp', '.hpp', '.cs',
  '.php', '.scala', '.dart', '.lua', '.r', '.sh', '.bash', '.zsh', '.ps1', '.bat', '.cmd', '.css',
  '.scss', '.sass', '.less', '.html', '.htm', '.json', '.jsonc', '.yml', '.yaml', '.toml', '.ini',
  '.cfg', '.sql', '.graphql', '.gql', '.cypher', '.ipynb', '.xml', '.svg', '.example',
]);
const MD_EXT = new Set(['.md', '.mdx', '.markdown']);
const DOC_UPLOAD_EXT = new Set(['.pdf', '.pptx', '.ppt', '.docx', '.zip']);
export const DEFAULT_PROCESS = [
  '/BULLSEYE.md', '/MISSILE.md', '/PRODUCT.md', '/DESIGN.md', '/AGENT-DESIGN.md', '/HANDOFF*.md', '/NEXT_SESSION*.md',
  '/NEXT-SESSION*.md', '/MASTER_PLAN*.md', '/MASTER-PLAN*.md', '/QA-BANK.md', '/RUNSHEET.md',
  '/PITCH-SCRIPT.md', '/PREFLIGHT.md', '/idea/SPINE.md',
  'judging/**', 'brief/**', '.missile/**', '.claude/**',
];
const PREP_FILES = ['/SUBMISSION.md', '/BRIEFING.md', 'docs/submission.md', 'docs/briefing.md', '/idea/SUBMISSION-FORM.md'];

const toPosix = (p) => p.split(path.sep).join('/');
const extOf = (rel) => path.posix.extname(rel).toLowerCase();
const baseOf = (rel) => path.posix.basename(rel);
const unique = (xs) => [...new Set(xs)];
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const num = (s) => Number(String(s).replace(/,/g, ''));
const stripBom = (t) => (t.startsWith(BOM) ? t.slice(1) : t);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------- globs: "*" one segment, "**" any depth, "{a,b}" alternatives, leading "/" anchors to the root ----------

function globSource(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        if (glob[i + 2] === '/') { re += '(?:.*/)?'; i += 2; } else { re += '.*'; i += 1; }
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if (c === '{') {
      const end = glob.indexOf('}', i);
      if (end === -1) { re += '\\{'; continue; }
      re += `(?:${glob.slice(i + 1, end).split(',').map(globSource).join('|')})`;
      i = end;
    } else re += escapeRe(c);
  }
  return re;
}
export const globToRegExp = (glob) => new RegExp(`^${globSource(glob)}$`, 'i');
export function matchesGlob(rel, glob) {
  const g = String(glob).replace(/\\/g, '/').replace(/^\.\//, '');
  if (g.startsWith('/')) return globToRegExp(g.slice(1)).test(rel);
  if (!g.includes('/')) return globToRegExp(g).test(baseOf(rel)) || globToRegExp(g).test(rel);
  return globToRegExp(g).test(rel);
}
const matchesAny = (rel, globs) => globs.some((g) => matchesGlob(rel, g));

function isPrimary(rel, judgeGlobs) {
  const lower = rel.toLowerCase();
  const base = baseOf(lower);
  if (lower === 'readme.md') return true;
  if (/^(submission|briefing)([._-][\w.-]*)?\.md$/.test(base)) return true;
  if (/\.html?$/.test(base)) {
    if (/(^|\/)(deck|decks|pitch|slides|presentation)\//.test(lower)) return true;
    if (/(^|[-_.])(deck|pitch|slides)([-_.]|$)/.test(base.replace(/\.html?$/, ''))) return true;
  }
  return matchesAny(rel, judgeGlobs);
}

/** "error" for files that hold secrets by design, "warn" for key or certificate files, null otherwise. */
export function envKind(rel) {
  const b = baseOf(rel).toLowerCase();
  if (/^\.env(\..+)?$/.test(b)) return /\.(example|sample|template|dist|defaults|schema)$/.test(b) ? null : 'error';
  if (b === 'keys.env' || /^id_(rsa|dsa|ecdsa|ed25519)$/.test(b) || /\.(p12|pfx|keystore|jks)$/.test(b)) return 'error';
  if (/\.(pem|key)$/.test(b)) return 'warn';
  return null;
}

// ---------- reading and locating ----------

function readText(abs) {
  try {
    const st = fs.statSync(abs);
    if (!st.isFile() || st.size > MAX_TEXT_BYTES || BINARY_EXT.has(path.extname(abs).toLowerCase())) return null;
    const buf = fs.readFileSync(abs);
    if (buf.subarray(0, 8000).includes(0)) return null;
    return stripBom(buf.toString('utf8'));
  } catch {
    return null;
  }
}

function lineStarts(text) {
  const s = [0];
  for (let i = text.indexOf('\n'); i !== -1; i = text.indexOf('\n', i + 1)) s.push(i + 1);
  return s;
}

function rangesOf(text, re) {
  const out = [];
  for (const m of text.matchAll(re)) out.push([m.index, m.index + m[0].length]);
  return out;
}

/** Fenced code blocks as [start, end, info string], so Mermaid blocks can be told apart. */
function fenceRanges(text, starts) {
  const out = [];
  let open = null;
  for (let i = 0; i < starts.length; i++) {
    const s = starts[i];
    const e = i + 1 < starts.length ? starts[i + 1] : text.length;
    const line = text.slice(s, e).replace(/\r?\n$/, '');
    const m = /^ {0,3}(`{3,}|~{3,})\s*([\w-]*)/.exec(line);
    if (!m) continue;
    if (!open) open = { start: s, ch: m[1][0], len: m[1].length, info: m[2].toLowerCase() };
    else if (m[1][0] === open.ch && m[1].length >= open.len && /^ {0,3}(`{3,}|~{3,})\s*$/.test(line)) {
      out.push([open.start, e, open.info]);
      open = null;
    }
  }
  if (open) out.push([open.start, text.length, open.info]);
  return out;
}

const inside = (ranges, pos) => ranges.some(([a, b]) => pos >= a && pos < b);

function docOf(rel, text) {
  const lower = rel.toLowerCase();
  const kind = /\.html?$/.test(lower) ? 'html' : MD_EXT.has(extOf(lower)) ? 'md' : 'text';
  const starts = lineStarts(text);
  let comments = [];
  if (kind === 'html') comments = rangesOf(text, /<!--[\s\S]*?(?:-->|$)|\/\*[\s\S]*?(?:\*\/|$)/g);
  else if (kind === 'md') comments = rangesOf(text, /<!--[\s\S]*?(?:-->|$)/g);
  const fences = kind === 'md' ? fenceRanges(text, starts) : [];
  const code = fences.map(([a, b]) => [a, b]).concat(kind === 'md' ? rangesOf(text, /``[^`\n][^\n]*?``|`[^`\n]+`/g) : []);
  // Mermaid uses {{hexagon}} and {rhombus} node shapes, which are syntax there, not placeholders.
  const diagrams = fences.filter((f) => f[2] === 'mermaid').map(([a, b]) => [a, b]);
  const scripts = kind === 'html' ? rangesOf(text, /<(script|style)\b[\s\S]*?<\/\1\s*>/gi) : [];
  return { rel, text, kind, starts, comments, code, diagrams, scripts, skip: text.slice(0, 600).includes('sweep-ignore-file') };
}

function locate(doc, pos) {
  let lo = 0;
  let hi = doc.starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (doc.starts[mid] <= pos) lo = mid;
    else hi = mid - 1;
  }
  const start = doc.starts[lo];
  let end = doc.text.indexOf('\n', start);
  if (end === -1) end = doc.text.length;
  return { line: lo + 1, text: doc.text.slice(start, end).replace(/\r$/, ''), col: pos - start };
}

function excerptOf(lineText, col = 0) {
  const t = lineText.replace(/\t/g, ' ');
  if (t.length <= 140) return t.trim();
  const a = Math.max(0, col - 60);
  return `${a > 0 ? '...' : ''}${t.slice(a, a + 130).trim()}${a + 130 < t.length ? '...' : ''}`;
}

const clipUrl = (u) => (u.length > 90 ? `${u.slice(0, 87)}...` : u);

class Report {
  constructor(allow = []) {
    this.findings = [];
    this.notes = [];
    this.gateRuns = [];
    this.allow = allow;
    this.seen = new Set();
  }

  add(level, check, file, line, message, excerpt = '') {
    const probe = `${message} ${excerpt}`;
    if (excerpt.includes('sweep-ignore') || this.allow.some((re) => re.test(probe))) return;
    const key = `${check}|${file}|${line}|${message}`;
    if (this.seen.has(key)) return;
    this.seen.add(key);
    this.findings.push({ level, check, file, line, message, excerpt });
  }

  at(level, check, doc, pos, message) {
    if (doc.skip) return;
    const loc = locate(doc, pos);
    if (loc.text.includes('sweep-ignore') || this.allow.some((re) => re.test(loc.text))) return;
    this.add(level, check, doc.rel, loc.line, message, excerptOf(loc.text, loc.col));
  }
}

// ---------- walk, git ----------

function walk(root, ignoreGlobs) {
  const out = [];
  const stack = [''];
  while (stack.length) {
    const relDir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(path.join(root, relDir), { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const rel = relDir ? `${relDir}/${e.name}` : e.name;
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) stack.push(rel);
        continue;
      }
      if (e.isFile() && !matchesAny(rel, ignoreGlobs)) out.push(rel);
    }
  }
  return out.sort();
}

function runGit(root, args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28, windowsHide: true });
  return { ok: r.status === 0, out: r.stdout || '', err: `${r.stderr || ''}${r.error ? r.error.message : ''}` };
}

function gitState(root, report) {
  const probe = runGit(root, ['rev-parse', '--is-inside-work-tree']);
  if (!probe.ok || probe.out.trim() !== 'true') {
    if (/dubious ownership/i.test(probe.err)) {
      report.add('WARN', 'config', '', 0, 'git refuses this folder (dubious ownership), so tracked-file and history checks were skipped: run git config --global --add safe.directory <this folder>');
    }
    return { ok: false, tracked: [], others: [] };
  }
  const list = (args) => {
    const r = runGit(root, ['ls-files', '-z', ...args]);
    return r.ok ? r.out.split(NUL).filter(Boolean) : [];
  };
  return { ok: true, tracked: list(['--cached']), others: list(['--others', '--exclude-standard']) };
}

// ---------- config and facts ----------

const CONFIG_KEYS = new Set([
  'requireSections', 'facts', 'counts', 'maxFileMB', 'judgeFiles', 'processFiles', 'processPolicy',
  'ignore', 'allow', 'hypeWords', 'allowWords', 'allowHttp', 'strictProse',
]);

function loadConfig(root, configArg) {
  const file = configArg ? path.resolve(configArg) : path.join(root, 'sweep.config.json');
  if (!fs.existsSync(file)) {
    if (configArg) throw new UsageError(`config file not found: ${configArg}`);
    return { config: {}, file: null, warnings: [] };
  }
  let config;
  try {
    config = JSON.parse(stripBom(fs.readFileSync(file, 'utf8')));
  } catch (e) {
    throw new UsageError(`${configArg || 'sweep.config.json'} is not valid JSON: ${e.message}`);
  }
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new UsageError('the sweep config must be a JSON object');
  const warnings = [];
  for (const key of Object.keys(config)) {
    if (key.startsWith('//') || key.startsWith('$') || key.startsWith('_')) continue;
    if (!CONFIG_KEYS.has(key)) warnings.push(`unknown config key "${key}" (known: ${[...CONFIG_KEYS].join(', ')})`);
  }
  const rel = toPosix(path.relative(root, file)) || 'sweep.config.json';
  return { config, file: rel.startsWith('..') ? file : rel, warnings };
}

function compileList(list, report, where, flags = 'i') {
  const out = [];
  for (const s of Array.isArray(list) ? list : []) {
    try {
      out.push(new RegExp(s, flags));
    } catch (e) {
      report.add('WARN', 'config', where, 0, `ignored the pattern ${JSON.stringify(s)}: ${e.message}`);
    }
  }
  return out;
}

function findFacts(root, opts, cfg, report, cfgFile) {
  const tryFile = (abs, label) => {
    if (!fs.existsSync(abs)) return null;
    try {
      return { facts: JSON.parse(stripBom(fs.readFileSync(abs, 'utf8'))), rel: label };
    } catch (e) {
      report.add('WARN', 'config', label, 0, `facts file is not valid JSON, so counts were not compared: ${e.message}`);
      return { facts: null, rel: label };
    }
  };
  if (opts.facts) {
    const got = tryFile(path.resolve(opts.facts), opts.facts);
    if (!got) throw new UsageError(`facts file not found: ${opts.facts}`);
    return got;
  }
  if (typeof cfg.facts === 'string') {
    const got = tryFile(path.resolve(root, cfg.facts), cfg.facts);
    if (!got) report.add('WARN', 'config', cfgFile || 'sweep.config.json', 0, `facts file not found: ${cfg.facts}`);
    return got || { facts: null, rel: cfg.facts };
  }
  const claims = path.join(root, 'claims.json');
  if (fs.existsSync(claims)) {
    try {
      const c = JSON.parse(stripBom(fs.readFileSync(claims, 'utf8')));
      if (c && typeof c.facts === 'string') {
        const abs = path.resolve(root, c.facts);
        const got = tryFile(abs, toPosix(path.relative(root, abs)));
        if (got) return got;
      }
    } catch {
      // claims.json is prove-it's file; its own checker reports a broken one
    }
  }
  for (const cand of ['facts.json', 'data/facts.json', 'docs/facts.json', 'public/facts.json', 'src/facts.json', 'proof/facts.json']) {
    const got = tryFile(path.join(root, cand), cand);
    if (got) return got;
  }
  return { facts: null, rel: null };
}

function lookupFact(facts, key) {
  if (facts && typeof facts === 'object' && Object.prototype.hasOwnProperty.call(facts, key)) return { found: true, value: facts[key] };
  let cur = facts;
  for (const part of String(key).split('.')) {
    if (cur !== null && typeof cur === 'object' && Object.prototype.hasOwnProperty.call(cur, part)) cur = cur[part];
    else return { found: false };
  }
  return { found: true, value: cur };
}

function factNumber(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && /^\s*-?\d[\d,]*(\.\d+)?\s*$/.test(v)) return num(v.trim());
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    for (const k of ['value', 'count', 'total']) {
      if (Object.prototype.hasOwnProperty.call(v, k)) {
        const n = factNumber(v[k]);
        if (n !== undefined) return n;
      }
    }
  }
  return undefined;
}

function firstFact(facts, keys) {
  for (const key of keys) {
    const got = lookupFact(facts, key);
    if (!got.found) continue;
    const value = factNumber(got.value);
    if (value !== undefined) return { key, value };
  }
  return null;
}

// ---------- requirements gate (written by brief-decoder into BULLSEYE.md) ----------

const R_LINE = new RegExp(`^\\s*[-*]\\s+\\[([ xX])\\]\\s+(R\\d+)\\s+\\[(hard|scored)\\]\\s+(.+?)\\s+${MIDDOT}\\s+check:\\s*(.+?)(?:\\s+${MIDDOT}\\s+source:\\s*(.*?))?\\s*$`);
const R_ISH = /^\s*[-*]\s+\[[ xX]\]\s+R\d+\b/;

export function parseGate(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => /^#{2,4}\s+Requirements gate\b/i.test(l));
  if (start === -1) return { found: false, line: 0, items: [], malformed: [] };
  const level = /^(#+)/.exec(lines[start])[1].length;
  const items = [];
  const malformed = [];
  let inComment = false;
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    const h = /^(#{1,6})\s/.exec(l);
    if (h && h[1].length <= level) break;
    if (inComment) {
      if (l.includes('-->')) inComment = false;
      continue;
    }
    if (l.trim().startsWith('<!--')) {
      if (!l.includes('-->')) inComment = true;
      continue;
    }
    const m = R_LINE.exec(l);
    if (m) {
      items.push({
        line: i + 1,
        done: m[1].toLowerCase() === 'x',
        id: m[2],
        kind: m[3],
        requirement: m[4].trim(),
        check: m[5].trim(),
        source: (m[6] || '').trim(),
        cmds: [...m[5].matchAll(/cmd:\s*(.+?)\s*\(pass:\s*([^)]*)\)/g)].map((c) => ({ cmd: c[1].trim(), pass: c[2].trim() })),
        manual: [...m[5].matchAll(/manual:\s*([^;]+)/g)].map((c) => c[1].trim()),
      });
    } else if (R_ISH.test(l)) malformed.push({ line: i + 1, text: l.trim() });
  }
  return { found: true, line: start + 1, items, malformed };
}

export function gateTable(gate) {
  const cell = (s) => s.replace(/\|/g, '\\|');
  const rows = gate.items.map((it) => `| ${cell(`${it.id} [${it.kind}] ${it.requirement}`)} | {{where: a link, or a file and its section}} |`);
  return ['| Requirement | Where it is |', '|---|---|', ...rows].join('\n');
}

function checkGate(report, gate, gateRel) {
  if (!gate) {
    report.notes.push('requirements gate: no BULLSEYE.md (pass --gate <file>), so the R lines were not checked');
    return;
  }
  if (!gate.found) {
    report.add('WARN', 'requirements', gateRel, 0, 'no "### Requirements gate" block: list every deliverable and hard rule as R lines (sibling skill brief-decoder)');
    return;
  }
  if (!gate.items.length) report.add('WARN', 'requirements', gateRel, gate.line, 'the requirements gate has no R lines');
  for (const it of gate.items) {
    if (/\{\{/.test(`${it.requirement} ${it.check}`)) report.add('WARN', 'requirements', gateRel, it.line, `${it.id} still holds a template placeholder`);
    if (!it.cmds.length && !it.manual.length) {
      report.add('WARN', 'requirements', gateRel, it.line, `${it.id} has no "cmd: <command> (pass: <result>)" or "manual: <check>" in its check`);
    }
    if (!it.done) {
      report.add(it.kind === 'hard' ? 'ERROR' : 'WARN', 'requirements', gateRel, it.line, `${it.id} [${it.kind}] open: ${it.requirement} | check: ${it.check}`);
    }
  }
  for (const m of gate.malformed) {
    report.add('WARN', 'requirements', gateRel, m.line, `R line not in the gate shape "- [ ] R<n> [hard|scored] <requirement> ${MIDDOT} check: ... ${MIDDOT} source: ..."`, excerptOf(m.text));
  }
  const hard = gate.items.filter((i) => i.kind === 'hard');
  const scored = gate.items.filter((i) => i.kind === 'scored');
  report.notes.push(`requirements gate: ${plural(gate.items.length, 'line')}, ${hard.length} hard (${hard.filter((i) => !i.done).length} open), ${scored.length} scored (${scored.filter((i) => !i.done).length} open)`);
}

function gateShell() {
  if (process.platform === 'win32' && process.env.MSYSTEM) {
    const probe = spawnSync('bash', ['-c', 'exit 0'], { windowsHide: true });
    if (probe.status === 0) return 'bash';
  }
  return process.platform === 'win32' ? 'cmd' : 'sh';
}

function runGateChecks(report, gate, gateRel, root, timeout) {
  const shell = gateShell();
  for (const it of gate.items) {
    for (const c of it.cmds) {
      const t0 = Date.now();
      const opts = { cwd: root, encoding: 'utf8', timeout, windowsHide: true, maxBuffer: 1 << 24 };
      const r = shell === 'bash' ? spawnSync('bash', ['-c', c.cmd], opts) : spawnSync(c.cmd, { ...opts, shell: true });
      const output = `${r.stdout || ''}${r.stderr || ''}`.replace(/\r/g, '').trimEnd();
      const timedOut = Boolean(r.error && r.error.code === 'ETIMEDOUT');
      report.gateRuns.push({
        id: it.id, kind: it.kind, done: it.done, cmd: c.cmd, pass: c.pass, shell,
        exitCode: r.status, timedOut, ms: Date.now() - t0, tail: output ? output.split('\n').slice(-6) : [],
      });
      if (timedOut) report.add('WARN', 'requirements', gateRel, it.line, `${it.id} check timed out after ${timeout} ms: ${c.cmd}`);
      else if (r.error) report.add('WARN', 'requirements', gateRel, it.line, `${it.id} check could not run (${r.error.message}): ${c.cmd}`);
      else if (it.done && r.status !== 0) {
        // A stale tick: the line says it passed, but its own check fails now.
        report.add('WARN', 'requirements', gateRel, it.line, `${it.id} is ticked, but its check failed just now (exit ${r.status}): re-check it before submitting: ${c.cmd}`);
      }
    }
  }
}

// ---------- headings and required sections ----------

function normHeading(s) {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function headingsOf(doc) {
  const out = [];
  doc.starts.forEach((start, i) => {
    const end = i + 1 < doc.starts.length ? doc.starts[i + 1] : doc.text.length;
    if (inside(doc.code, start)) return;
    const m = /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/.exec(doc.text.slice(start, end).replace(/\r?\n$/, ''));
    if (m) out.push({ text: normHeading(m[1]), pos: start });
  });
  for (const m of doc.text.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) out.push({ text: normHeading(m[2]), pos: m.index });
  return out;
}

// ---------- placeholders ----------

// The marker words are written with a character class so this file does not itself contain them.
const MARKERS = /\b(?:T[O]DO|F[I]XME|T[B]D|T[B]A|X[X]X)\b/g;
const CODE_MARKERS = /\b(?:T[O]DO|F[I]XME|T[B]D)\b/g;
const PHRASES = /\b(?:lorem ipsum|fill(?: this)? (?:after|in later|in before submitting)|coming soon|insert (?:link|url|here)|link (?:goes )?here)\b/gi;
const DOUBLE_BRACE = /(?<![$\\{])\{\{(?!\s*[#/>!^&])[^{}\n]{1,80}\}\}(?!\})/g;
const BRACE_TOKEN = /(?<![$\w{])\{[A-Z][A-Z0-9_]{2,}(?=[\s}:.,)]|$)/g;
const BRACE_URL = /(?<![$\w{])\{(?:VIDEO|REPO|LIVE|DEMO|DECK|BLOG|YOUTUBE|DEVPOST|FORM)_?(?:URL|LINK)\b/g;
const ANGLE_TOKEN = /<(?:VIDEO|INSERT|YOUR|ADD|LINK|URL)(?=[\s_A-Z>])/g;
const URL_PLACEHOLDER = /\bhttps?:\/\/[^\s<>"')\]]*?(?:[\/.=]your[-_]|<you|<user|<owner|<org)[^\s<>"')\]]*/gi;
const TEST_PATH = /(^|\/)(tests?|__tests__|e2e|spec|fixtures?|__fixtures__|testdata)\/|\.(test|spec)\.[cm]?[jt]sx?$/i;
const EXAMPLE_DOMAIN = /\b(?:[\w-]+\.)*example\.(?:com|org|net)\b/gi;

function scanPlaceholders(report, doc, patterns, levelOutside, levelInComment) {
  const perLine = new Map();
  for (const re of patterns) {
    for (const m of doc.text.matchAll(re)) {
      // In Mermaid, id{{text}} is a hexagon node: the braces follow a node id. A template's ["{{who}}"] does not.
      if (re === DOUBLE_BRACE && doc.diagrams && inside(doc.diagrams, m.index) && /\w/.test(doc.text[m.index - 1] || '')) continue;
      const line = locate(doc, m.index).line;
      const entry = perLine.get(line) || { pos: m.index, tokens: new Set(), outside: false };
      entry.tokens.add(m[0].length > 40 ? `${m[0].slice(0, 37)}...` : m[0]);
      if (!inside(doc.comments, m.index)) entry.outside = true;
      perLine.set(line, entry);
    }
  }
  for (const e of perLine.values()) {
    const where = e.outside ? '' : ' (inside an HTML comment)';
    report.at(e.outside ? levelOutside : levelInComment, 'placeholder', doc, e.pos, `placeholder left${where}: ${[...e.tokens].join(', ')}`);
  }
}

// ---------- form budgets in SUBMISSION headings: "(1460/1500 chars)", "(~3,400 / 50,000)", "(max 100 chars)" ----------

const BUDGET_SLASH = /\(\s*(~)?\s*(\d[\d,]*)\s*\/\s*(\d[\d,]*)\s*(chars?|characters|words)?\s*\)/i;
const BUDGET_MAX = new RegExp(`\\(\\s*(?:${LESS_EQUAL}|<=|max\\.?|up to|at most|limit:?)\\s*(\\d[\\d,]*)\\s*(chars?|characters|words)\\s*\\)|\\(\\s*(\\d[\\d,]*)\\s*(chars?|characters|words)\\s*(?:max|limit)\\s*\\)`, 'i');

function checkBudgets(report, doc) {
  const heads = [];
  doc.starts.forEach((start, i) => {
    const end = i + 1 < doc.starts.length ? doc.starts[i + 1] : doc.text.length;
    const line = doc.text.slice(start, end).replace(/\r?\n$/, '');
    if (!inside(doc.code, start) && /^\s{0,3}#{1,6}\s/.test(line)) heads.push({ start, end, line });
  });
  heads.forEach((h, k) => {
    let used = null;
    let limit = null;
    let unit = 'chars';
    let approx = false;
    const s = BUDGET_SLASH.exec(h.line);
    const mx = BUDGET_MAX.exec(h.line);
    if (s && (s[4] || s[1])) {
      approx = Boolean(s[1]);
      used = num(s[2]);
      limit = num(s[3]);
      unit = /word/i.test(s[4] || '') ? 'words' : 'chars';
    } else if (mx) {
      limit = num(mx[1] || mx[3]);
      unit = /word/i.test(mx[2] || mx[4] || '') ? 'words' : 'chars';
    } else return;
    const bodyEnd = k + 1 < heads.length ? heads[k + 1].start : doc.text.length;
    const body = doc.text.slice(h.end, bodyEnd).replace(/<!--[\s\S]*?-->/g, '').replace(/\r/g, '').trim();
    if (!body) return;
    const n = unit === 'words' ? (body.match(/\S+/g) || []).length : body.length;
    if (n > limit) report.at('ERROR', 'field-budget', doc, h.start, `the answer is ${n} ${unit}; the field allows ${limit}`);
    else if (used !== null && !approx && Math.abs(n - used) > Math.max(10, Math.round(limit * 0.03))) {
      report.at('WARN', 'field-budget', doc, h.start, `the heading says ${used}/${limit}; the answer is ${n} ${unit}: update the count`);
    }
  });
}

// ---------- counts against facts.json ----------

const TOTAL_WORDS = new Set(['passing', 'green', 'automated', 'offline', 'total', 'all', 'passed']);
const SKIP_WORDS = new Set(['more', 'new', 'additional', 'extra', 'failing', 'failed', 'skipped', 'flaky', 'broken', 'red', 'fewer', 'added', 'removed', 'other', 'of']);
const TEST_ALIAS = { 'end-to-end': 'e2e', end2end: 'e2e', playwright: 'e2e', cypress: 'e2e', vitest: 'unit', jest: 'unit', pytest: 'python', unittest: 'python' };
const TESTS_TOTAL_KEYS = ['tests', 'tests.count', 'tests.total', 'tests.value', 'testCount', 'test_count'];
const CLAIMS_TOTAL_KEYS = ['claims.total', 'claims.count', 'claims'];
const CLAIMS_PASSED_KEYS = ['claims.passed', 'claims.ok', 'claims.matched', 'claims.verified'];
const TEXT_TESTS = /(?<![\w.\/@+#-])(\d{1,3}(?:,\d{3})+|\d+)(?:\s+([A-Za-z][\w-]*))?\s+tests?\b/gi;
const BADGE_TESTS = /badge\/tests?-((?:[^-?#"'\s)]|--)+)-/gi;
const TEXT_CLAIMS_PAIR = /(?<![\w.])(\d+)\s*(?:\/|of|out of)\s*(\d+)\s+(?:[A-Za-z-]+\s+){0,2}?claims\b/gi;
const TEXT_CLAIMS_ONE = /(?<![\w.\/])(\d+)\s+(?:(?:headline|readme|measured|re-measured|verified|checked)\s+)?claims\b/gi;
const BADGE_CLAIMS = /(\d+)%2F(\d+)_claims/gi;

function decodeBadge(s) {
  const text = s.split('--').map((part) => part.replace(/__/g, NUL).replace(/_/g, ' ').split(NUL).join('_')).join('-');
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

function testsOccurrence(value, word, doc, pos, label) {
  const w = (word || '').toLowerCase();
  if (SKIP_WORDS.has(w)) return null;
  if (!w || TOTAL_WORDS.has(w)) return { group: 'tests', keys: TESTS_TOTAL_KEYS, value, doc, pos, label };
  const alias = TEST_ALIAS[w];
  return { group: `tests.${alias || w}`, keys: [`tests.${w}`, ...(alias ? [`tests.${alias}`] : [])], value, doc, pos, label };
}

function collectCounts(docs, rules) {
  const occ = [];
  for (const d of docs) {
    for (const m of d.text.matchAll(TEXT_TESTS)) {
      if (/\bof\s*$/i.test(d.text.slice(Math.max(0, m.index - 4), m.index))) continue;
      const o = testsOccurrence(num(m[1]), m[2], d, m.index, `"${m[0]}"`);
      if (o) occ.push(o);
    }
    for (const m of d.text.matchAll(BADGE_TESTS)) {
      const msg = decodeBadge(m[1]);
      for (const p of msg.matchAll(/(\d[\d,]*)\s*([A-Za-z][\w-]*)?/g)) {
        const o = testsOccurrence(num(p[1]), p[2], d, m.index, `the badge "tests ${msg}"`);
        if (o) occ.push(o);
      }
    }
    for (const re of [TEXT_CLAIMS_PAIR, BADGE_CLAIMS]) {
      for (const m of d.text.matchAll(re)) {
        occ.push({ group: 'claims.passed', keys: CLAIMS_PASSED_KEYS, value: num(m[1]), doc: d, pos: m.index, label: `"${m[0]}"` });
        occ.push({ group: 'claims.total', keys: CLAIMS_TOTAL_KEYS, value: num(m[2]), doc: d, pos: m.index, label: `"${m[0]}"` });
      }
    }
    for (const m of d.text.matchAll(TEXT_CLAIMS_ONE)) {
      occ.push({ group: 'claims.total', keys: CLAIMS_TOTAL_KEYS, value: num(m[1]), doc: d, pos: m.index, label: `"${m[0]}"` });
    }
  }
  for (const rule of rules) {
    for (const d of docs) {
      if (rule.files.length && !matchesAny(d.rel, rule.files)) continue;
      for (const m of d.text.matchAll(rule.re)) {
        const groups = m.slice(1).filter((g) => g !== undefined);
        rule.facts.forEach((fact, i) => {
          if (groups[i] === undefined || !/\d/.test(groups[i])) return;
          occ.push({ group: fact, keys: [fact], value: num(groups[i]), doc: d, pos: m.index, label: `"${m[0]}"`, tolerance: rule.tolerance });
        });
      }
    }
  }
  return occ;
}

function checkCounts(report, docs, factsInfo, rules) {
  const occ = collectCounts(docs, rules);
  const facts = factsInfo.facts;
  if (facts) {
    for (const rule of rules) {
      for (const fact of rule.facts) if (!lookupFact(facts, fact).found) report.add('WARN', 'config', factsInfo.rel, 0, `count rule names "${fact}", which is not in ${factsInfo.rel}`);
    }
    for (const o of occ) {
      const f = firstFact(facts, o.keys);
      if (!f) continue;
      if (Math.abs(f.value - o.value) > (o.tolerance || 0)) report.at('ERROR', 'stale-count', o.doc, o.pos, `says ${o.label}; ${factsInfo.rel} has ${f.key} = ${f.value}`);
    }
    return;
  }
  const groups = new Map();
  for (const o of occ) groups.set(o.group, [...(groups.get(o.group) || []), o]);
  for (const [group, list] of groups) {
    const tally = new Map();
    for (const o of list) tally.set(o.value, (tally.get(o.value) || 0) + 1);
    if (tally.size < 2) continue;
    const mode = [...tally.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
    const places = unique(list.filter((o) => o.value === mode).map((o) => `${o.doc.rel}:${locate(o.doc, o.pos).line}`));
    const others = `${places.slice(0, 3).join(', ')}${places.length > 3 ? ', ...' : ''} ${places.length === 1 ? 'says' : 'say'} ${mode}`;
    for (const o of list) {
      if (o.value !== mode) report.at('WARN', 'stale-count', o.doc, o.pos, `says ${o.label}, but ${others} (${group}): add a facts.json so the right number wins`);
    }
  }
  if (occ.length) report.notes.push('counts: no facts.json found, so counts were only compared with each other');
}

// ---------- links ----------

const LOCAL_URL = /\bhttps?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?(?:[/?#][^\s<>"'`)\]]*)?/gi;
const LOCAL_HOST = /^https?:\/\/(?:localhost|127\.|0\.0\.0\.0|\[::1\]|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|[^/?#]*\.(?:localhost|local|test|invalid)(?=[:/?#]|$))/i;
const HTTP_URL = /\bhttp:\/\/[^\s<>"'`)\]]+/gi;
const ANY_URL = /\bhttps?:\/\/[^\s<>"'`)\]]+/gi;
const NAMESPACE = /^http:\/\/(?:www\.w3\.org\/|schemas\.|purl\.org\/|ns\.adobe\.com\/|json-schema\.org\/|xmlns\.com\/|schema\.org(?:\/|$)|www\.inkscape\.org\/|sodipodi\.)/i;
const SKIP_LINK_HOSTS = /^(?:img\.shields\.io|badgen\.net|fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|unpkg\.com|(?:[\w-]+\.)*example\.(?:com|org|net))$/i;
const LOGIN_RE = /(?:^https?:\/\/(?:vercel\.com\/(?:login|sso|sso-api)|accounts\.google\.com\/|github\.com\/(?:login|session)|login\.)|\/(?:login|signin|sign-in|sso|sso-api|auth\/login|oauth\/authorize)(?:[/?#]|$)|_vercel_sso)/i;

function youTubeVideo(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^(?:www|m)\./, '');
    if (host === 'youtu.be') return u.pathname.length > 1;
    if (host === 'youtube.com') return (u.pathname === '/watch' && u.searchParams.has('v')) || /^\/(?:shorts|embed|live)\/./.test(u.pathname);
  } catch {
    return false;
  }
  return false;
}

async function requestOnce(fetchImpl, url, method, timeout) {
  const res = await fetchImpl(url, {
    method,
    redirect: 'manual',
    signal: AbortSignal.timeout(timeout),
    headers: { 'user-agent': `Mozilla/5.0 (compatible; final-sweep/${VERSION})`, accept: 'text/html,application/json;q=0.9,*/*;q=0.8' },
  });
  try {
    await res.body?.cancel();
  } catch {
    // the body is not needed
  }
  return res;
}

const failure = (e, timeout) => (e && (e.name === 'TimeoutError' || e.name === 'AbortError') ? `no answer within ${timeout} ms` : `request failed (${(e && e.cause && e.cause.code) || (e && e.message) || e})`);

/** Requests one URL the way a stranger would: no cookies, redirects followed by hand so a login wall shows. */
export async function checkUrl(url, { timeout = 8000, fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') return { level: 'WARN', status: 0, message: 'this Node has no fetch; use Node 20 or newer' };
  if (youTubeVideo(url)) {
    try {
      const res = await fetchImpl(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(timeout) });
      try {
        await res.body?.cancel();
      } catch {
        // ignore
      }
      if (res.ok) return { level: 'OK', status: res.status };
      if (res.status === 401 || res.status === 403) return { level: 'ERROR', status: res.status, message: `YouTube reports the video as private (oEmbed ${res.status}): set it to unlisted or public` };
      if (res.status === 400 || res.status === 404) return { level: 'ERROR', status: res.status, message: `YouTube has no such video (oEmbed ${res.status})` };
      return { level: 'WARN', status: res.status, message: `YouTube oEmbed answered ${res.status}` };
    } catch (e) {
      return { level: 'WARN', status: 0, message: `YouTube: ${failure(e, timeout)}` };
    }
  }
  let current = url;
  for (let hop = 0; hop <= 5; hop++) {
    let res;
    try {
      res = await requestOnce(fetchImpl, current, 'HEAD', timeout);
      if ([400, 403, 405, 501].includes(res.status)) res = await requestOnce(fetchImpl, current, 'GET', timeout);
    } catch (e) {
      return { level: 'WARN', status: 0, message: failure(e, timeout) };
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) return { level: 'WARN', status: res.status, message: `HTTP ${res.status} with no Location header` };
      const next = new URL(loc, current).href;
      if (LOGIN_RE.test(next)) return { level: 'ERROR', status: res.status, message: `redirects to a login page (${clipUrl(next)}): a judge who is not signed in cannot open it` };
      current = next;
      continue;
    }
    if (res.status >= 200 && res.status < 300) return { level: 'OK', status: res.status, finalUrl: current };
    if (res.status === 401) return { level: 'ERROR', status: 401, message: 'HTTP 401: the page needs a login (a protected preview deploy?)' };
    if (res.status === 404 || res.status === 410) {
      const repo = /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/i.test(url) ? ' (a private repository also answers 404 to strangers)' : '';
      return { level: 'ERROR', status: res.status, message: `HTTP ${res.status}: not found${repo}` };
    }
    if (res.status === 403 || res.status === 429) return { level: 'WARN', status: res.status, message: `HTTP ${res.status}: the site blocks scripts or rate-limits them; open it by hand in a private window` };
    return { level: 'WARN', status: res.status, message: `HTTP ${res.status}` };
  }
  return { level: 'WARN', status: 0, message: 'more than 5 redirects' };
}

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }));
  return out;
}

function urlsIn(doc) {
  const out = [];
  for (const m of doc.text.matchAll(ANY_URL)) {
    if (inside(doc.code, m.index) || inside(doc.comments, m.index)) continue;
    let url = m[0];
    const end = m.index + url.length;
    if ((url.match(/\(/g) || []).length > (url.match(/\)/g) || []).length && doc.text[end] === ')') url += ')';
    url = url.replace(/[.,;:!?*]+$/, '').replace(/&quot;$/, '');
    out.push({ url, pos: m.index });
  }
  return out;
}

async function checkLinks(report, docs, timeout) {
  const found = new Map();
  for (const d of docs) {
    for (const { url, pos } of urlsIn(d)) {
      let host;
      try {
        host = new URL(url).hostname;
      } catch {
        continue;
      }
      if (LOCAL_HOST.test(url) || SKIP_LINK_HOSTS.test(host) || /[{}<>]/.test(url)) continue;
      if (!found.has(url)) found.set(url, { doc: d, pos });
    }
  }
  const urls = [...found.keys()];
  const results = await pool(urls, 6, (u) => checkUrl(u, { timeout }));
  results.forEach((r, i) => {
    if (r.level === 'OK') return;
    const at = found.get(urls[i]);
    report.at(r.level, 'link', at.doc, at.pos, `${clipUrl(urls[i])}: ${r.message}`);
  });
  report.notes.push(`links: ${plural(urls.length, 'link')} requested, ${results.filter((r) => r.level === 'OK').length} answered`);
}

// ---------- secrets and absolute paths ----------

const SECRET_RULES = [
  ['Anthropic API key', /\bsk-ant-[A-Za-z0-9_-]{20,}/g],
  ['OpenAI API key', /\bsk-(?!ant-)(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{32,}/g],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,})\b/g],
  ['AWS access key id', /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g],
  ['Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/g],
  ['Slack webhook URL', /\bhooks\.slack\.com\/services\/T[A-Z0-9]{6,}\/B[A-Z0-9]{6,}\/[A-Za-z0-9]{20,}/g],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/g],
  ['Groq API key', /\bgsk_[A-Za-z0-9]{40,}\b/g],
  ['Hugging Face token', /\bhf_[A-Za-z0-9]{30,}\b/g],
  ['Stripe live key', /\b[rs]k_live_[0-9A-Za-z]{20,}\b/g],
  ['private key block', /-{5}BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-{5}/g],
];
const SECRET_ONE = SECRET_RULES.map(([label, re]) => [label, new RegExp(re.source)]);
const maskSecret = (s) => `${s.slice(0, 4)}... (${s.length} chars)`;

// A home folder names the person and breaks on every other machine: ERROR. Any other drive path: WARN.
const HOME_PATHS = [
  /\b[A-Za-z]:(?:\\\\|\\|\/)(?:Users|Documents and Settings)(?:\\\\|\\|\/)(?!(?:Public|Default|All Users)\b)[^\\/\s"'<>|*?:;,)\]]+/g,
  /(?<![\w.:\/~-])\/Users\/(?!Shared\/)[A-Za-z0-9._-]+\//g,
  /(?<![\w.:\/~-])\/home\/(?!(?:runner|node|app|appuser|ubuntu|ec2-user|user|vscode|codespace|pwuser|circleci|gitpod)\/)[A-Za-z0-9._-]+\//g,
];
const DRIVE_PATH = /(?<![\w])[A-Za-z]:(?:\\\\|\\|\/)(?!\/)(?!(?:Users|Windows|Program Files|Program Files \(x86\)|ProgramData|Documents and Settings)\b)[\w.() -]{2,}(?:\\\\|\\|\/)/g;

function scanFile(report, rel, text, wantSecrets, wantPaths) {
  if (text.slice(0, 600).includes('sweep-ignore-file')) return;
  const doc = { rel, text, starts: lineStarts(text) };
  if (wantSecrets) {
    const lines = new Set();
    for (const [label, re] of SECRET_RULES) {
      for (const m of text.matchAll(re)) {
        const loc = locate(doc, m.index);
        if (lines.has(loc.line) || loc.text.includes('sweep-ignore')) continue;
        lines.add(loc.line);
        report.add('ERROR', 'secret', rel, loc.line, `${label} (${maskSecret(m[0])}): remove it, rotate it, and keep keys in an ignored .env file`);
      }
    }
  }
  if (wantPaths) {
    const lines = new Set();
    for (const re of HOME_PATHS) {
      for (const m of text.matchAll(re)) {
        const loc = locate(doc, m.index);
        if (lines.has(loc.line)) continue;
        lines.add(loc.line);
        if (!loc.text.includes('sweep-ignore')) report.add('ERROR', 'abs-path', rel, loc.line, `absolute home path "${m[0]}": it names a person and breaks on every other machine; make it relative`, excerptOf(loc.text, loc.col));
      }
    }
    for (const m of text.matchAll(DRIVE_PATH)) {
      const loc = locate(doc, m.index);
      if (lines.has(loc.line)) continue;
      lines.add(loc.line);
      if (!loc.text.includes('sweep-ignore')) report.add('WARN', 'abs-path', rel, loc.line, `absolute path "${m[0]}": it breaks when the project moves; make it relative`, excerptOf(loc.text, loc.col));
    }
  }
}

function scanHistory(report, root) {
  const t0 = Date.now();
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn('git', ['log', '--all', '-p', '-U0', '--no-color', '--no-ext-diff', '--no-textconv', `--format=${HISTORY_MARK}%h`], { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
    } catch {
      resolve();
      return;
    }
    let commit = '';
    let file = '';
    let commits = 0;
    const seen = new Set();
    const rl = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
    rl.on('line', (line) => {
      if (line.startsWith(HISTORY_MARK)) {
        commit = line.slice(HISTORY_MARK.length).trim();
        commits++;
        return;
      }
      if (line.startsWith('diff --git ')) {
        const m = / "?b\/(.+?)"?$/.exec(line);
        file = m ? m[1] : '';
        if (file && envKind(file) === 'error' && !seen.has(`env:${file}`)) {
          seen.add(`env:${file}`);
          report.add('ERROR', 'history', file, 0, `${file} is in git history (commit ${commit}): rotate every key it held, then purge it from history after a backup bundle`);
        }
        return;
      }
      if (line[0] !== '+' || line.startsWith('+++')) return;
      for (const [label, re] of SECRET_ONE) {
        const m = re.exec(line);
        if (!m) continue;
        const key = `${label}:${m[0]}`;
        if (!seen.has(key)) {
          seen.add(key);
          report.add('ERROR', 'history', file, 0, `${label} (${maskSecret(m[0])}) was committed in ${commit}: rotate it; deleting the line later does not remove it from history`);
        }
        break;
      }
    });
    rl.on('close', () => {
      report.notes.push(`history: ${plural(commits, 'commit')} scanned for secrets in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
      resolve();
    });
    child.on('error', () => resolve());
  });
}

// ---------- environment variables documented in .env.example ----------

const ENV_USE = /process\.env\.([A-Z][A-Z0-9_]+)|process\.env\[['"]([A-Z][A-Z0-9_]+)['"]\]|import\.meta\.env\.([A-Z][A-Z0-9_]+)|os\.environ(?:\.get)?\(\s*['"]([A-Z][A-Z0-9_]+)['"]|os\.environ\[['"]([A-Z][A-Z0-9_]+)['"]\]|os\.getenv\(\s*['"]([A-Z][A-Z0-9_]+)['"]|Deno\.env\.get\(\s*['"]([A-Z][A-Z0-9_]+)['"]\)/g;
const ENV_BUILTIN = /^(?:NODE_ENV|PORT|HOST|HOSTNAME|CI|HOME|PATH|PWD|TZ|LANG|SHELL|USER|USERNAME|TEMP|TMP|TMPDIR|APPDATA|LOCALAPPDATA|USERPROFILE|COMSPEC|SYSTEMROOT|DEBUG|FORCE_COLOR|NO_COLOR|TERM|MSYSTEM|INIT_CWD|PYTHONUTF8|PYTHONPATH|VIRTUAL_ENV|BASE_URL|NEXT_RUNTIME|NEXT_PHASE|VERCEL|RENDER|NETLIFY|CF_PAGES)$|^(?:VERCEL_|NEXT_PUBLIC_VERCEL_|GITHUB_|RUNNER_|NPM_|RAILWAY_|RENDER_|NETLIFY_|CF_|CLAUDE_|CODEX_|PLAYWRIGHT_)/;

function checkEnvExample(report, root, codeRels, read, all) {
  const example = all.find((r) => /^\.env\.(example|sample|template)$/i.test(baseOf(r)) && !r.includes('/'));
  const used = new Map();
  for (const rel of codeRels) {
    if (/(^|\/)(tests?|e2e|__tests__|spec)\//i.test(rel) || /\.(test|spec)\.[cm]?[jt]sx?$/i.test(rel)) continue;
    const text = read(rel);
    if (!text) continue;
    for (const m of text.matchAll(ENV_USE)) {
      const name = m.slice(1).find(Boolean);
      if (name && !ENV_BUILTIN.test(name) && !used.has(name)) used.set(name, rel);
    }
  }
  if (!used.size) return;
  if (!example) {
    report.add('WARN', 'env-file', '.env.example', 0, `no .env.example, but the code reads ${plural(used.size, 'variable')} (${[...used.keys()].slice(0, 6).join(', ')}): list each with what it does and where to get it`);
    return;
  }
  const documented = new Set();
  for (const line of (read(example) || '').split(/\r?\n/)) {
    const m = /^\s*#?\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/.exec(line);
    if (m) documented.add(m[1]);
  }
  const missing = [...used.entries()].filter(([name]) => !documented.has(name));
  if (missing.length) {
    report.add('WARN', 'env-file', example, 0, `${plural(missing.length, 'variable')} read by the code but missing here: ${missing.slice(0, 8).map(([n, f]) => `${n} (${f})`).join(', ')}`);
  }
}

// ---------- prose: em dashes and AI tells ----------

const HYPE_WORDS = [
  'seamless(?:ly)?', 'effortless(?:ly)?', 'powerful', 'elevat(?:e|es|ed|ing)', 'leverag(?:e|es|ed|ing)',
  'cutting[- ]edge', 'bleeding[- ]edge', 'unleash(?:es|ed|ing)?', 'robust(?:ly)?', 'comprehensive(?:ly)?',
  'delv(?:e|es|ed|ing)', 'revolutionary', 'revolutioni[sz](?:e|es|ed|ing)', 'game[- ]chang(?:er|ers|ing)',
  'groundbreaking', 'state[- ]of[- ]the[- ]art', 'world[- ]class', 'next[- ]gen(?:eration)?',
  'supercharg(?:e|ed|es|ing)', 'blazing(?:ly)?[- ]fast', 'best[- ]in[- ]class', 'synerg(?:y|ies|istic)',
  'paradigm(?:s)?', 'transformative', 'unparalleled',
];

function checkProse(report, docs, cfg, strict) {
  const extra = (Array.isArray(cfg.hypeWords) ? cfg.hypeWords : []).map(escapeRe);
  const hype = new RegExp(`\\b(?:${[...HYPE_WORDS, ...extra].join('|')})\\b`, 'gi');
  const allowWords = new Set((Array.isArray(cfg.allowWords) ? cfg.allowWords : []).map((w) => String(w).toLowerCase()));
  const dashLevel = strict ? 'ERROR' : 'WARN';
  for (const d of docs) {
    for (let i = d.text.indexOf(EM_DASH); i !== -1; i = d.text.indexOf(EM_DASH, i + 1)) {
      if (!inside(d.comments, i)) report.at(dashLevel, 'em-dash', d, i, 'em dash in judge-facing prose: use a colon, a comma, a period, parentheses or a middot');
    }
    const urls = rangesOf(d.text, /\bhttps?:\/\/[^\s<>"')\]]+/g);
    const skip = (pos) => inside(d.code, pos) || inside(d.comments, pos) || inside(urls, pos) || inside(d.scripts, pos);
    for (const m of d.text.matchAll(hype)) {
      if (skip(m.index) || allowWords.has(m[0].toLowerCase())) continue;
      report.at('WARN', 'ai-tell', d, m.index, `hype word "${m[0]}": write the number or the fact it stands for`);
    }
    for (const m of d.text.matchAll(/(?<![!<[])!(?=\s|$)/g)) {
      if (!skip(m.index)) report.at('WARN', 'ai-tell', d, m.index, 'exclamation mark in judge-facing prose: let the number carry the weight');
    }
    if (d.kind === 'md') {
      for (const h of headingsOf(d)) {
        const line = locate(d, h.pos).text;
        if (/\p{Extended_Pictographic}/u.test(line)) report.at('WARN', 'ai-tell', d, h.pos, 'emoji in a heading: judges read it as generated; use words');
      }
    }
  }
}

// ---------- the sweep ----------

export async function sweep(dirArg = '.', options = {}) {
  const o = {
    require: [], checkLinks: false, timeout: 8000, strictProse: false, history: true, only: null,
    skip: new Set(), runGate: false, gateTimeout: 60000, ...options,
  };
  const root = path.resolve(dirArg);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new UsageError(`not a directory: ${dirArg}`);
  const cfgInfo = loadConfig(root, o.config);
  const cfg = cfgInfo.config;
  const pre = new Report();
  const allow = compileList(cfg.allow, pre, cfgInfo.file || 'sweep.config.json');
  const report = new Report(allow);
  for (const f of pre.findings) report.add(f.level, f.check, f.file, f.line, f.message);
  for (const w of cfgInfo.warnings) report.add('WARN', 'config', cfgInfo.file, 0, w);
  const want = (check) => (o.only ? o.only.has(check) : !o.skip.has(check));

  const ignore = Array.isArray(cfg.ignore) ? cfg.ignore : [];
  const all = walk(root, ignore);
  const git = gitState(root, report);
  const exists = (rel) => fs.existsSync(path.join(root, rel));
  const pushed = git.ok ? unique([...git.tracked.filter(exists), ...git.others]).filter((r) => !matchesAny(r, ignore)).sort() : all;
  const pushedSet = new Set(pushed);
  const texts = new Map();
  const read = (rel) => {
    if (!texts.has(rel)) texts.set(rel, readText(path.join(root, rel)));
    return texts.get(rel);
  };

  const judgeGlobs = Array.isArray(cfg.judgeFiles) ? cfg.judgeFiles : [];
  const processGlobs = [...DEFAULT_PROCESS, ...(Array.isArray(cfg.processFiles) ? cfg.processFiles : [])];
  const notJudge = (r) => matchesAny(r, TOOLING) || matchesAny(r, TEMPLATE_FILES) || GENERATED.test(r);
  const primaryRel = all.filter((r) => isPrimary(r, judgeGlobs) && !notJudge(r));
  const primarySet = new Set(primaryRel);
  const proseRel = unique([
    ...all.filter((r) => /^docs\//i.test(r) && MD_EXT.has(extOf(r))),
    ...pushed.filter((r) => MD_EXT.has(extOf(r))),
  ]).filter((r) => !primarySet.has(r) && !notJudge(r) && !matchesAny(r, processGlobs));
  const codeRel = pushed.filter((r) => CODE_EXT.has(extOf(r)) && !primarySet.has(r) && !notJudge(r) && !envKind(r) && !/\.min\.(js|css)$/i.test(r) && !matchesAny(r, processGlobs));
  const toDocs = (rels) => rels.map((r) => {
    const t = read(r);
    return t === null ? null : docOf(r, t);
  }).filter(Boolean);
  const primary = toDocs(primaryRel);
  const prose = toDocs(proseRel);
  const code = toDocs(codeRel);
  const judgeDocs = [...primary, ...prose];
  const readme = primary.find((d) => d.rel.toLowerCase() === 'readme.md');

  const bullseyePath = path.join(root, 'BULLSEYE.md');
  const bullseyeText = fs.existsSync(bullseyePath) ? readText(bullseyePath) : null;
  let gate = null;
  let gateRel = 'BULLSEYE.md';
  if (o.gate) {
    const gatePath = path.resolve(o.gate);
    const gateText = fs.existsSync(gatePath) ? readText(gatePath) : null;
    if (gateText === null) throw new UsageError(`gate file not found or unreadable: ${o.gate}`);
    gate = parseGate(gateText);
    const rel = toPosix(path.relative(root, gatePath));
    gateRel = rel && !rel.startsWith('..') ? rel : gatePath;
  } else if (bullseyeText !== null) gate = parseGate(bullseyeText);

  // 1. requirements gate
  if (want('requirements')) {
    checkGate(report, gate, gateRel);
    if (o.runGate && gate && gate.found) runGateChecks(report, gate, gateRel, root, o.gateTimeout);
  }

  // 2. required README (or other) sections
  if (want('required-section')) {
    const required = [];
    for (const t of o.require) required.push({ file: 'README.md', text: t, source: '--require' });
    if (Array.isArray(cfg.requireSections)) for (const t of cfg.requireSections) required.push({ file: 'README.md', text: String(t), source: 'sweep.config.json' });
    else if (cfg.requireSections && typeof cfg.requireSections === 'object') {
      for (const [file, list] of Object.entries(cfg.requireSections)) for (const t of [].concat(list)) required.push({ file, text: String(t), source: 'sweep.config.json' });
    }
    if (gate && gate.found) {
      for (const it of gate.items) {
        for (const c of it.cmds) {
          const m = /\bgrep\s+(?:-[A-Za-z]+\s+)*(["'])([^"']+)\1\s+(?:\.\/)?README\.md\b/i.exec(c.cmd);
          if (m && /^[\w ,.&'()/-]+$/.test(m[2])) required.push({ file: 'README.md', text: m[2], source: it.id });
        }
      }
    }
    const seen = new Set();
    for (const r of required) {
      const key = `${r.file.toLowerCase()}|${normHeading(r.text)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const doc = [...primary, ...prose].find((d) => d.rel.toLowerCase() === r.file.replace(/^\.\//, '').toLowerCase())
        || (exists(r.file) && read(r.file) !== null ? docOf(r.file, read(r.file)) : null);
      if (!doc) {
        report.add('ERROR', 'required-section', r.file, 0, `${r.file} not found, so the required "${r.text}" section is missing (required by ${r.source})`);
        continue;
      }
      const want2 = normHeading(r.text);
      if (!headingsOf(doc).some((h) => h.text.includes(want2))) {
        report.add('ERROR', 'required-section', doc.rel, 0, `no "${r.text}" section: add a heading with these words (required by ${r.source})`);
      }
    }
    if (!readme && !required.length) report.add('WARN', 'required-section', 'README.md', 0, 'no README.md at the project root');
  }

  // 3. placeholders
  if (want('placeholder')) {
    for (const d of primary) {
      const pasteable = !/^briefing/i.test(baseOf(d.rel));
      scanPlaceholders(report, d, [DOUBLE_BRACE, BRACE_TOKEN, ANGLE_TOKEN, MARKERS, PHRASES, URL_PLACEHOLDER, ...(pasteable ? [EXAMPLE_DOMAIN] : [])], 'ERROR', 'WARN');
    }
    for (const d of prose) scanPlaceholders(report, d, [DOUBLE_BRACE, BRACE_TOKEN, ANGLE_TOKEN, MARKERS, PHRASES, URL_PLACEHOLDER], 'WARN', 'WARN');
    for (const d of code) {
      if (TEST_PATH.test(d.rel)) continue;
      const data = /\.(json|jsonc|ipynb|xml|svg)$/i.test(d.rel);
      scanPlaceholders(report, d, data ? [BRACE_URL, URL_PLACEHOLDER] : [BRACE_URL, CODE_MARKERS, PHRASES, URL_PLACEHOLDER], 'WARN', 'WARN');
    }
  }

  // 4. template guidance comments left in
  if (want('template-guide')) {
    for (const d of primary) {
      const n = (d.text.match(/<!--\s*guide:/gi) || []).length;
      if (n) report.at('WARN', 'template-guide', d, d.text.search(/<!--\s*guide:/i), `${plural(n, 'template guidance comment')} left in: delete them before submitting`);
    }
  }

  // 5. form answer budgets
  if (want('field-budget')) for (const d of primary) if (d.kind === 'md' && /^submission/i.test(baseOf(d.rel))) checkBudgets(report, d);

  // 6. counts against facts.json
  if (want('stale-count')) {
    const factsInfo = findFacts(root, o, cfg, report, cfgInfo.file);
    const rules = [];
    for (const r of Array.isArray(cfg.counts) ? cfg.counts : []) {
      if (!r || typeof r.pattern !== 'string' || !r.fact) {
        report.add('WARN', 'config', cfgInfo.file || 'sweep.config.json', 0, 'a counts rule needs "pattern" and "fact"');
        continue;
      }
      try {
        const flags = unique(`${r.flags || 'i'}g`.split('')).join('');
        rules.push({ re: new RegExp(r.pattern, flags), facts: [].concat(r.fact).map(String), files: [].concat(r.files || []), tolerance: Number(r.tolerance) || 0 });
      } catch (e) {
        report.add('WARN', 'config', cfgInfo.file || 'sweep.config.json', 0, `ignored the counts pattern ${JSON.stringify(r.pattern)}: ${e.message}`);
      }
    }
    checkCounts(report, judgeDocs, factsInfo, rules);
  }

  // 7-9. links
  if (want('localhost-link')) {
    for (const d of primary) {
      if (/^briefing/i.test(baseOf(d.rel))) continue;
      for (const m of d.text.matchAll(LOCAL_URL)) {
        if (inside(d.code, m.index) || inside(d.comments, m.index)) continue;
        report.at('ERROR', 'localhost-link', d, m.index, `${m[0]} only works on your machine: link the live URL, or put local commands in a code block`);
      }
    }
  }
  if (want('http-link')) {
    const allowHttp = Array.isArray(cfg.allowHttp) ? cfg.allowHttp.map(String) : [];
    for (const d of judgeDocs) {
      for (const m of d.text.matchAll(HTTP_URL)) {
        if (inside(d.code, m.index) || inside(d.comments, m.index)) continue;
        const url = m[0];
        if (LOCAL_HOST.test(url) || NAMESPACE.test(url) || allowHttp.some((p) => url.startsWith(p))) continue;
        report.at('WARN', 'http-link', d, m.index, `http:// link (${clipUrl(url)}): use https://, or add it to allowHttp if the site has no https`);
      }
    }
  }
  if (want('repo-link')) {
    // A relative link or image that is missing, or ignored by git, is a broken link or image on GitHub.
    const allFiles = new Set(all.map((r) => r.toLowerCase()));
    const pushedLower = new Map(pushed.map((r) => [r.toLowerCase(), r]));
    for (const d of judgeDocs) {
      if (d.kind === 'text' || (git.ok && !pushedSet.has(d.rel))) continue;
      const dir = path.posix.dirname(d.rel);
      const targets = [
        ...[...d.text.matchAll(/!?\[[^\]\n]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)].map((m) => [m[1], m.index]),
        ...[...d.text.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)].map((m) => [m[1], m.index]),
      ];
      for (const [raw, pos] of targets) {
        if (inside(d.code, pos) || inside(d.comments, pos) || inside(d.scripts, pos)) continue;
        if (/^(?:[a-z][a-z0-9+.-]*:|#|\/\/|\{|<)/i.test(raw) || raw.includes('{{')) continue;
        let target = raw.split('#')[0].split('?')[0];
        try {
          target = decodeURIComponent(target);
        } catch {
          // keep the raw text
        }
        if (!target) continue;
        const rel = path.posix.normalize(target.startsWith('/') ? target.slice(1) : path.posix.join(dir === '.' ? '' : dir, target)).replace(/\/$/, '');
        if (rel.startsWith('..')) continue;
        const lower = rel.toLowerCase();
        const isDir = fs.existsSync(path.join(root, rel)) && fs.statSync(path.join(root, rel)).isDirectory();
        if (isDir) continue;
        if (!allFiles.has(lower) && !fs.existsSync(path.join(root, rel))) {
          report.at('ERROR', 'repo-link', d, pos, `links to ${rel}, which does not exist: GitHub shows a broken ${/\.(png|jpe?g|gif|webp|svg|avif)$/i.test(rel) ? 'image' : 'link'}`);
        } else if (git.ok && !pushedLower.has(lower)) {
          report.at('ERROR', 'repo-link', d, pos, `links to ${rel}, which git ignores, so it never reaches GitHub: commit it or link something that is pushed`);
        } else if (git.ok && pushedLower.get(lower) !== rel) {
          report.at('ERROR', 'repo-link', d, pos, `links to ${rel}, but the file is ${pushedLower.get(lower)}: GitHub paths are case-sensitive, so the link breaks there`);
        }
      }
    }
  }
  if (want('link') && o.checkLinks) await checkLinks(report, judgeDocs, o.timeout);

  // 10-12. absolute paths, secrets, history
  const wantPaths = want('abs-path');
  const wantSecrets = want('secret');
  if (wantPaths || wantSecrets) {
    let skipped = 0;
    for (const rel of unique([...pushed, ...primaryRel])) {
      if (envKind(rel) || BINARY_EXT.has(extOf(rel))) continue;
      const text = read(rel);
      if (text === null) {
        skipped++;
        continue;
      }
      scanFile(report, rel, text, wantSecrets, wantPaths && (pushedSet.has(rel) || primarySet.has(rel)));
    }
    if (skipped) report.notes.push(`${plural(skipped, 'file')} not scanned for secrets and paths (binary, unreadable, or over 2 MB)`);
  }
  if (want('history') && o.history && git.ok) await scanHistory(report, root);

  // 13. env files
  if (want('env-file')) {
    if (git.ok) {
      for (const rel of git.tracked) {
        const k = envKind(rel);
        if (k === 'error') report.add('ERROR', 'env-file', rel, 0, 'tracked by git: run git rm --cached on it, add it to .gitignore, and rotate every key it held');
        else if (k === 'warn') report.add('WARN', 'env-file', rel, 0, 'tracked key or certificate file: confirm it holds no private key');
      }
      for (const rel of git.others) if (envKind(rel) === 'error') report.add('ERROR', 'env-file', rel, 0, 'not covered by .gitignore: the next "git add ." pushes it');
    } else {
      const envs = all.filter((r) => envKind(r) === 'error');
      if (envs.length) report.add('WARN', 'env-file', envs[0], 0, `no git repository yet: make sure .gitignore covers ${envs.slice(0, 5).join(', ')} before the first commit`);
    }
    checkEnvExample(report, root, codeRel, read, all);
  }

  // 14. process files kept local under "process: private"
  if (want('process-file')) {
    const declared = bullseyeText ? (/^process:\s*(private|public)\b/im.exec(bullseyeText) || [])[1] : undefined;
    const policy = String(cfg.processPolicy || declared || (bullseyeText ? 'unknown' : '')).toLowerCase();
    if (!git.ok || !policy) {
      if (!git.ok && policy) report.notes.push('process files: no git repository, so tracked files could not be checked');
    } else if (policy !== 'public') {
      for (const rel of git.tracked) {
        if (matchesAny(rel, processGlobs)) {
          report.add(policy === 'private' ? 'ERROR' : 'WARN', 'process-file', rel, 0, policy === 'private'
            ? 'process file tracked under "process: private": git rm --cached it, add it to .gitignore and .vercelignore'
            : 'process file tracked: set "process: private" or "process: public" in BULLSEYE.md to decide');
        } else if (policy === 'private' && matchesAny(rel, PREP_FILES)) {
          report.add('WARN', 'process-file', rel, 0, 'submission prep file tracked: fine if the event wants it public; remove the coaching lines first');
        }
      }
    }
  }

  // 15. large files
  if (want('large-file')) {
    const caps = cfg.maxFileMB && typeof cfg.maxFileMB === 'object'
      ? Object.entries(cfg.maxFileMB).map(([glob, v]) => ({
        glob,
        mb: typeof v === 'number' ? v : Number(v && v.mb),
        level: v && typeof v === 'object' && /^warn/i.test(String(v.level || '')) ? 'WARN' : 'ERROR',
      })).filter((c) => c.mb > 0)
      : [];
    for (const rel of unique([...all, ...pushed])) {
      let size;
      try {
        size = fs.statSync(path.join(root, rel)).size;
      } catch {
        continue;
      }
      const mb = size / 1048576;
      const cap = caps.find((c) => matchesGlob(rel, c.glob));
      if (cap) {
        if (mb > cap.mb) report.add(cap.level, 'large-file', rel, 0, `${mb.toFixed(1)} MB, over the ${cap.mb} MB cap set for ${cap.glob}`);
        continue;
      }
      if (pushedSet.has(rel) && mb > 100) report.add('ERROR', 'large-file', rel, 0, `${mb.toFixed(1)} MB: GitHub rejects files over 100 MB; use a release asset or a link`);
      else if (pushedSet.has(rel) && mb > 50) report.add('WARN', 'large-file', rel, 0, `${mb.toFixed(1)} MB: GitHub warns above 50 MB`);
      else if (DOC_UPLOAD_EXT.has(extOf(rel)) && mb > 10) report.add('WARN', 'large-file', rel, 0, `${mb.toFixed(1)} MB: many portals cap uploads at 10 MB; set maxFileMB from the event's own limit`);
    }
  }

  // 16. Next.js dev indicator in screenshots
  if (want('dev-indicator')) {
    const nextConfigs = all.filter((r) => /(^|\/)next\.config\.(?:js|mjs|cjs|ts|mts)$/i.test(r));
    if (nextConfigs.length && !nextConfigs.some((r) => /devIndicators\s*:\s*false/.test(read(r) || ''))) {
      const shots = all.filter((r) => /^docs\//i.test(r) && /\.(png|jpe?g|webp|gif)$/i.test(r));
      if (readme) {
        for (const m of readme.text.matchAll(/(?:src=["']|!\[[^\]]*\]\()(?!https?:|data:)([^"')\s]+\.(?:png|jpe?g|webp|gif))/gi)) shots.push(m[1].replace(/^\.\//, ''));
      }
      const list = unique(shots);
      if (list.length) {
        report.add('WARN', 'dev-indicator', nextConfigs[0], 0, `Next.js project with ${plural(list.length, 'screenshot')} (${list.slice(0, 3).join(', ')}${list.length > 3 ? ', ...' : ''}): confirm they came from "next build && next start", or set devIndicators: false, because dev-mode captures show the dev badge`);
      }
    }
  }

  // 17-18. prose
  if (want('em-dash') || want('ai-tell')) {
    const sub = new Report(allow);
    checkProse(sub, judgeDocs, cfg, o.strictProse || cfg.strictProse === true);
    for (const f of sub.findings) if (want(f.check)) report.add(f.level, f.check, f.file, f.line, f.message, f.excerpt);
  }

  return {
    root,
    mode: git.ok ? 'git' : 'files',
    files: { walked: all.length, pushed: pushed.length, tracked: git.tracked.length, untracked: git.others.length },
    judgeFiles: primaryRel,
    ran: CHECKS.filter((c) => want(c) && (c !== 'link' || o.checkLinks) && (c !== 'history' || (o.history && git.ok))),
    report,
  };
}

// ---------- output ----------

function stamp(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const off = -d.getTimezoneOffset();
  const abs = Math.abs(off);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())} ${off >= 0 ? '+' : '-'}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

export function summarize(result) {
  const { findings } = result.report;
  const errors = findings.filter((f) => f.level === 'ERROR').length;
  const warnings = findings.length - errors;
  const byCheck = {};
  for (const c of result.ran) byCheck[c] = { errors: 0, warnings: 0 };
  for (const f of findings) {
    byCheck[f.check] = byCheck[f.check] || { errors: 0, warnings: 0 };
    byCheck[f.check][f.level === 'ERROR' ? 'errors' : 'warnings']++;
  }
  const result2 = errors ? 'FAIL' : 'PASS';
  return { errors, warnings, result: result2, byCheck, line: `sweep: ${result2}, ${plural(errors, 'error')}, ${plural(warnings, 'warning')} (${stamp()})` };
}

function formatHuman(result, summary, max) {
  const out = [];
  const r = result.report;
  out.push(`final-sweep ${VERSION} on ${result.root}`);
  const files = result.mode === 'git'
    ? `git, ${plural(result.files.pushed, 'file')} would be pushed (${result.files.untracked} untracked)`
    : `files (no git repository), ${plural(result.files.walked, 'file')}`;
  out.push(`mode: ${files}; judge-facing: ${result.judgeFiles.length ? result.judgeFiles.join(', ') : 'none found'}`);
  for (const n of r.notes) out.push(`note: ${n}`);
  out.push('');
  const order = (f) => CHECKS.indexOf(f.check) * 10 + (f.level === 'ERROR' ? 0 : 1);
  const sorted = [...r.findings].sort((a, b) => order(a) - order(b) || a.file.localeCompare(b.file) || a.line - b.line);
  const printed = new Map();
  for (const f of sorted) {
    const n = (printed.get(f.check) || 0) + 1;
    printed.set(f.check, n);
    if (max && n > max) continue;
    const where = f.file ? `${f.file}${f.line ? `:${f.line}` : ''}` : '-';
    out.push(`${f.level.padEnd(5)}  ${f.check.padEnd(16)} ${where}  ${f.message}`);
    if (f.excerpt) out.push(`       > ${f.excerpt}`);
  }
  for (const [check, n] of printed) if (max && n > max) out.push(`...    ${check}: ${n - max} more (use --max 0 or --json)`);
  if (r.gateRuns.length) {
    out.push('');
    out.push(`Requirements gate checks (shell: ${r.gateRuns[0].shell}). Judge each output against its pass condition, then tick the line:`);
    for (const g of r.gateRuns) {
      out.push(`  ${g.id} [${g.kind}, ${g.done ? 'ticked' : 'open'}]  $ ${g.cmd}`);
      out.push(`      pass: ${g.pass}`);
      out.push(`      ${g.timedOut ? 'timed out' : `exit ${g.exitCode}`} after ${(g.ms / 1000).toFixed(1)} s`);
      for (const t of g.tail) out.push(`      | ${t}`);
    }
  }
  out.push('');
  out.push(`${'check'.padEnd(17)}${'errors'.padStart(7)}${'warnings'.padStart(10)}`);
  for (const c of CHECKS) {
    const s = summary.byCheck[c];
    if (s) out.push(`${c.padEnd(17)}${String(s.errors).padStart(7)}${String(s.warnings).padStart(10)}`);
  }
  out.push('');
  out.push(summary.line);
  return `${out.join('\n')}\n`;
}

function parseArgs(argv) {
  const o = { dir: null, require: [], checkLinks: false, timeout: 8000, strictProse: false, history: true, json: false, max: 25, only: null, skip: new Set(), runGate: false, gateTimeout: 60000, gateTable: false, help: false };
  const list = (s) => new Set(String(s).split(',').map((x) => x.trim()).filter(Boolean));
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => {
      if (i + 1 >= argv.length) throw new UsageError(`${a} needs a value`);
      return argv[++i];
    };
    const int = () => {
      const v = Number(value());
      if (!Number.isInteger(v) || v < 0) throw new UsageError(`${a} needs a whole number`);
      return v;
    };
    if (a === '--help' || a === '-h') o.help = true;
    else if (a === '--require') o.require.push(value());
    else if (a === '--config') o.config = value();
    else if (a === '--facts') o.facts = value();
    else if (a === '--gate') o.gate = value();
    else if (a === '--run-gate') o.runGate = true;
    else if (a === '--gate-timeout') o.gateTimeout = int();
    else if (a === '--gate-table') o.gateTable = true;
    else if (a === '--check-links') o.checkLinks = true;
    else if (a === '--timeout') o.timeout = int();
    else if (a === '--strict-prose') o.strictProse = true;
    else if (a === '--no-history') o.history = false;
    else if (a === '--json') o.json = true;
    else if (a === '--max') o.max = int();
    else if (a === '--only') o.only = list(value());
    else if (a === '--skip') o.skip = list(value());
    else if (a.startsWith('-')) throw new UsageError(`unknown option ${a} (see --help)`);
    else if (o.dir === null) o.dir = a;
    else throw new UsageError(`unexpected argument ${a}`);
  }
  for (const c of [...(o.only || []), ...o.skip]) if (!CHECKS.includes(c)) throw new UsageError(`unknown check "${c}" (checks: ${CHECKS.join(', ')})`);
  o.dir = o.dir || '.';
  return o;
}

async function main(argv) {
  let o;
  try {
    o = parseArgs(argv);
  } catch (e) {
    if (e instanceof UsageError) {
      process.stderr.write(`final-sweep: ${e.message}\n`);
      return 2;
    }
    throw e;
  }
  if (o.help) {
    process.stdout.write(HELP);
    return 0;
  }
  if (o.gateTable) {
    const file = o.gate ? path.resolve(o.gate) : path.join(path.resolve(o.dir), 'BULLSEYE.md');
    const text = fs.existsSync(file) ? readText(file) : null;
    const gate = text === null ? null : parseGate(text);
    if (!gate || !gate.found || !gate.items.length) {
      process.stderr.write(`final-sweep: no requirements gate with R lines in ${file}\n`);
      return 1;
    }
    process.stdout.write(`${gateTable(gate)}\n`);
    return 0;
  }
  let result;
  try {
    result = await sweep(o.dir, o);
  } catch (e) {
    if (e instanceof UsageError) {
      process.stderr.write(`final-sweep: ${e.message}\n`);
      return 2;
    }
    throw e;
  }
  const summary = summarize(result);
  if (o.json) {
    const { report, ...rest } = result;
    const json = { tool: 'final-sweep', version: VERSION, ...rest, notes: report.notes, gateRuns: report.gateRuns, summary, findings: report.findings };
    process.stdout.write(`${JSON.stringify(json, null, 2)}\n`);
  } else process.stdout.write(formatHuman(result, summary, o.max));
  return summary.errors ? 1 : 0;
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : '';
const self = fileURLToPath(import.meta.url);
if (invoked && (process.platform === 'win32' ? invoked.toLowerCase() === self.toLowerCase() : invoked === self)) {
  main(process.argv.slice(2)).then(
    (code) => { process.exitCode = code; },
    (e) => {
      process.stderr.write(`final-sweep: ${e && e.stack ? e.stack : e}\n`);
      process.exitCode = 1;
    },
  );
}
