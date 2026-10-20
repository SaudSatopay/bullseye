#!/usr/bin/env node
// BULLSEYE repo validator. Zero dependencies.
// Usage: node scripts/validate.mjs
// Checks every skill against the Agent Skills spec (agentskills.io/specification), every subagent's
// frontmatter, the plugin and marketplace manifests, every relative Markdown link, and scans for secrets.
// Exit code 0 when clean, 1 when any check fails.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);
const rel = (p) => path.relative(root, p).split(path.sep).join('/');
const read = (p) => fs.readFileSync(p, 'utf8');

// ---------- tiny frontmatter parser (the YAML subset skills use) ----------
function parseFrontmatter(text, where) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) { fail(where, 'missing YAML frontmatter'); return null; }
  const lines = m[1].split(/\r?\n/);
  const data = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!kv) { fail(where, `cannot parse frontmatter line: ${line}`); continue; }
    const [, key, rawValue] = kv;
    let value = rawValue.trim();
    // Real YAML parsers (the skills CLI, Claude Code, Codex) reject a plain value with ": " or " #" in it.
    if (value && !/^["']/.test(value) && !['|', '>', '|-', '>-'].includes(value) && (value.includes(': ') || value.includes(' #') || /^[&*!%@`,#?]|^- /.test(value))) {
      fail(where, `frontmatter "${key}" must be quoted: a plain YAML value cannot contain ": " or " #" or start with an indicator character`);
    }
    if (value === '' || value === '|' || value === '>' || value === '>-' || value === '|-') {
      const block = [];
      while (i + 1 < lines.length && (/^\s+/.test(lines[i + 1]) || lines[i + 1].trim() === '')) block.push(lines[++i]);
      if (value === '') {
        const map = {};
        for (const b of block) { const n = b.trim().match(/^([\w-]+):\s*(.*)$/); if (n) map[n[1]] = unquote(n[2].trim()); }
        data[key] = map;
      } else {
        data[key] = block.map((b) => b.trim()).join(value.startsWith('|') ? '\n' : ' ').trim();
      }
      continue;
    }
    data[key] = unquote(value);
  }
  return { data, body: text.slice(m[0].length) };
}
function unquote(v) {
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    const inner = v.slice(1, -1);
    return v.startsWith('"') ? inner.replace(/\\"/g, '"').replace(/\\\\/g, '\\') : inner.replace(/''/g, "'");
  }
  return v;
}

// ---------- skills ----------
const SKILL_FIELDS = new Set(['name', 'description', 'when_to_use', 'license', 'compatibility', 'metadata', 'allowed-tools', 'argument-hint', 'disable-model-invocation', 'user-invocable', 'model', 'effort', 'version']);
const skillsDir = path.join(root, 'skills');
const skills = fs.existsSync(skillsDir) ? fs.readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
if (!skills.length) fail('skills/', 'no skills found');
let descriptionBudget = 0;
for (const name of skills) {
  const file = path.join(skillsDir, name, 'SKILL.md');
  const where = rel(file);
  if (!fs.existsSync(file)) { fail(`skills/${name}`, 'missing SKILL.md'); continue; }
  const text = read(file);
  const fm = parseFrontmatter(text, where);
  if (!fm) continue;
  const { data, body } = fm;
  for (const key of Object.keys(data)) if (!SKILL_FIELDS.has(key)) warn(where, `unknown frontmatter field "${key}"`);
  if (!data.name) fail(where, 'name is required');
  else {
    if (data.name !== name) fail(where, `name "${data.name}" must match its directory "${name}"`);
    if (data.name.length > 64) fail(where, 'name longer than 64 characters');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.name)) fail(where, 'name must be lowercase letters, digits and single hyphens, not starting or ending with a hyphen');
  }
  if (!data.description) fail(where, 'description is required');
  else {
    if (data.description.length > 1024) fail(where, `description is ${data.description.length} characters (max 1024)`);
    if (!/\buse (it )?(when|whenever|for|to)\b|\btrigger/i.test(data.description)) warn(where, 'description should say when to use the skill');
    descriptionBudget += data.name.length + data.description.length;
  }
  if (data.compatibility && data.compatibility.length > 500) fail(where, 'compatibility longer than 500 characters');
  const lineCount = body.split('\n').length;
  if (lineCount > 500) fail(where, `body is ${lineCount} lines (keep SKILL.md under 500; move detail into references/)`);
  checkLinks(file, body);
}
if (descriptionBudget > 8000) warn('skills/', `all names and descriptions total ${descriptionBudget} characters; Codex lists skills within about 8,000 characters by default`);

// ---------- subagents ----------
const agentsDir = path.join(root, 'agents');
if (fs.existsSync(agentsDir)) {
  for (const f of fs.readdirSync(agentsDir).filter((n) => n.endsWith('.md'))) {
    const file = path.join(agentsDir, f);
    const fm = parseFrontmatter(read(file), rel(file));
    if (!fm) continue;
    if (!fm.data.name) fail(rel(file), 'name is required');
    else if (fm.data.name !== f.replace(/\.md$/, '')) fail(rel(file), `name "${fm.data.name}" should match the file name`);
    if (!fm.data.description) fail(rel(file), 'description is required');
  }
}

// ---------- manifests ----------
for (const manifest of ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json']) {
  const file = path.join(root, manifest);
  if (!fs.existsSync(file)) { fail(manifest, 'missing'); continue; }
  let json;
  try { json = JSON.parse(read(file)); } catch (e) { fail(manifest, `invalid JSON: ${e.message}`); continue; }
  if (!json.name) fail(manifest, 'name is required');
  if (manifest.endsWith('marketplace.json')) {
    if (!json.owner?.name) fail(manifest, 'owner.name is required');
    if (!Array.isArray(json.plugins) || !json.plugins.length) fail(manifest, 'plugins[] is required');
    for (const p of json.plugins || []) {
      if (!p.name || !p.source) fail(manifest, 'every plugin needs name and source');
      if (typeof p.source === 'string' && p.source.startsWith('./') && !fs.existsSync(path.join(root, p.source))) fail(manifest, `plugin source ${p.source} does not exist`);
    }
  }
}

// ---------- links in every Markdown file ----------
// SKILL.md files were checked above. Files under a skill's assets/ are templates copied into a user's project,
// so their relative links point at files that exist there, not here; they are skipped.
const IGNORE = new Set(['.git', 'node_modules', '.missile', 'out', 'dist']);
const mdFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (!(e.name === 'assets' && full.includes(`${path.sep}skills${path.sep}`))) walk(full); continue; }
    const isSkillFile = e.name === 'SKILL.md' && path.basename(path.dirname(path.dirname(full))) === 'skills';
    if (e.name.endsWith('.md') && !isSkillFile) mdFiles.push(full);
  }
})(root);
for (const file of mdFiles) checkLinks(file, read(file));

function checkLinks(file, text) {
  const stripped = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  const re = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m;
  while ((m = re.exec(stripped))) {
    let target = m[1];
    if (/^(https?:|mailto:|#|data:)/.test(target) || target.includes('{{') || target.includes('<')) continue;
    target = decodeURIComponent(target.split('#')[0]);
    if (!target) continue;
    const resolved = path.resolve(path.dirname(file), target);
    if (!fs.existsSync(resolved)) fail(rel(file), `broken link → ${m[1]}`);
  }
}

// ---------- house style: no em dashes ----------
// The builder strips em dashes from everything judges and maintainers read; this repo practises it.
const EM_DASH = String.fromCharCode(0x2014);
(function style(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { style(full); continue; }
    if (!/\.(md|mjs|js|ts|tsx|json|ya?ml|html|css|py|sh|txt|bat|ps1)$/.test(e.name)) continue;
    const lines = read(full).split('\n');
    lines.forEach((line, i) => { if (line.includes(EM_DASH)) fail(`${rel(full)}:${i + 1}`, 'em dash (U+2014); use a colon, comma, period, parentheses or a middot'); });
  }
})(root);

// ---------- secrets ----------
const SECRET_PATTERNS = [
  [/sk-ant-[A-Za-z0-9_-]{20,}/, 'Anthropic API key'],
  [/sk-(proj-)?[A-Za-z0-9]{32,}/, 'OpenAI-style API key'],
  [/gh[pousr]_[A-Za-z0-9]{30,}/, 'GitHub token'],
  [/AKIA[0-9A-Z]{16}/, 'AWS access key'],
  [/xox[abprs]-[A-Za-z0-9-]{10,}/, 'Slack token'],
  [/AIza[0-9A-Za-z_-]{35}/, 'Google API key'],
  [/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, 'private key'],
];
(function scan(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { scan(full); continue; }
    if (/^\.env(\.|$)/.test(e.name) && !e.name.endsWith('.example')) fail(rel(full), 'environment file committed to the repo');
    if (!/\.(md|mjs|js|ts|tsx|json|ya?ml|html|css|py|sh|txt|toml)$/.test(e.name)) continue;
    const text = read(full);
    for (const [re, label] of SECRET_PATTERNS) if (re.test(text)) fail(rel(full), `looks like a ${label}`);
  }
})(root);

// ---------- report ----------
for (const w of warnings) console.log(`warn  ${w}`);
for (const e of errors) console.log(`FAIL  ${e}`);
console.log(`\n${skills.length} skills, ${mdFiles.length} other Markdown files checked: ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
