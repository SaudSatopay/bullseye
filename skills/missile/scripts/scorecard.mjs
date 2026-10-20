#!/usr/bin/env node
// Missile scorecard: validate a critic scorecard, compute the verdict, and record it in MISSILE.md.
// Usage: node scorecard.mjs <projectDir> <scorecard.json>
// Updates the status line, the scoreboard table (between the scoreboard markers) and the iteration log.

import fs from 'node:fs';
import path from 'node:path';

const DIMS = ['first_impression', 'design_system', 'layout', 'motion', 'ux_completeness', 'accessibility', 'performance', 'code_health', 'story', 'shipped'];
const [, , dirArg, fileArg] = process.argv;
if (!dirArg || !fileArg) { console.error('usage: node scorecard.mjs <projectDir> <scorecard.json>'); process.exit(2); }
const root = path.resolve(dirArg);
const card = JSON.parse(fs.readFileSync(path.resolve(fileArg), 'utf8'));
const missilePath = path.join(root, 'MISSILE.md');
if (!fs.existsSync(missilePath)) { console.error('MISSILE.md not found in ' + root); process.exit(2); }

// ---------- validate ----------
const errors = [];
if (!Number.isInteger(card.iteration) || card.iteration < 0) errors.push('iteration must be a non-negative integer');
if (!card.scores || typeof card.scores !== 'object') errors.push('scores object missing');
for (const d of DIMS) {
  const s = card.scores?.[d];
  if (!s) { errors.push(`scores.${d} missing`); continue; }
  if (s.score !== null && (typeof s.score !== 'number' || s.score < 0 || s.score > 10)) errors.push(`scores.${d}.score must be 0..10 or null`);
  if (s.score === null && !s.unmeasured) errors.push(`scores.${d} is null without an "unmeasured" reason`);
  if (s.score !== null && !s.evidence) errors.push(`scores.${d} has no evidence`);
}
if (!Array.isArray(card.top_fixes)) errors.push('top_fixes must be an array');
if (errors.length) { console.error('Scorecard rejected:\n- ' + errors.join('\n- ')); process.exit(1); }

// ---------- previous scorecards ----------
const cardsDir = path.join(root, '.missile', 'scorecards');
fs.mkdirSync(cardsDir, { recursive: true });
const savedPath = path.join(cardsDir, `it${card.iteration}.json`);
const previous = fs.readdirSync(cardsDir).filter((f) => /^it\d+\.json$/.test(f)).map((f) => JSON.parse(fs.readFileSync(path.join(cardsDir, f), 'utf8'))).filter((c) => c.iteration < card.iteration).sort((a, b) => a.iteration - b.iteration);
const last = previous[previous.length - 1];

// ---------- effective scores, mean, verdict ----------
const eff = {};
for (const d of DIMS) {
  const s = card.scores[d];
  eff[d] = s.score === null ? (last?.effective?.[d] ?? 5) : s.score;
}
const values = DIMS.map((d) => eff[d]);
const mean = Math.round((values.reduce((a, b) => a + b, 0) / DIMS.length) * 100) / 100;
const min = Math.min(...values);
const verdict = min >= 9 && mean >= 9.5 ? 'IMPACT' : 'CONTINUE';
let stalled = false;
if (previous.length >= 2) {
  const p1 = previous[previous.length - 1].effective, p2 = previous[previous.length - 2].effective;
  const improvedNow = DIMS.some((d) => eff[d] > (p1?.[d] ?? -1));
  const improvedBefore = DIMS.some((d) => (p1?.[d] ?? -1) > (p2?.[d] ?? -1));
  stalled = !improvedNow && !improvedBefore;
}
const record = { ...card, effective: eff, mean, min, verdict, stalled };
fs.writeFileSync(savedPath, JSON.stringify(record, null, 2));

// ---------- MISSILE.md ----------
let md = fs.readFileSync(missilePath, 'utf8');
const stamp = new Date().toISOString();
const statusRe = /^status:.*$/m;
const stageMatch = md.match(/^status:\s*stage=(\d+)/m);
const stage = stageMatch ? Number(stageMatch[1]) : 4;
const statusLine = `status: stage=${stage} iteration=${card.iteration} verdict=${verdict}${stalled ? ' stalled=true' : ''} updated=${stamp}`;
md = statusRe.test(md) ? md.replace(statusRe, statusLine) : statusLine + '\n' + md;

const all = [...previous, record].sort((a, b) => a.iteration - b.iteration);
const header = '| dimension | ' + all.map((c) => (c.iteration === 0 ? 'baseline' : `it${c.iteration}`)).join(' | ') + ' | target |';
const sep = '|---|' + all.map(() => '---|').join('') + '---|';
const rows = DIMS.map((d) => `| ${d} | ` + all.map((c) => (c.scores?.[d]?.score === null ? `(${c.effective[d]})` : String(c.effective[d]))).join(' | ') + ' | 9+ |');
rows.push('| **mean** | ' + all.map((c) => String(c.mean)).join(' | ') + ' | 9.5+ |');
const table = [header, sep, ...rows].join('\n');
md = md.replace(/<!-- scoreboard:start -->[\s\S]*?<!-- scoreboard:end -->/, `<!-- scoreboard:start -->\n${table}\n<!-- scoreboard:end -->`);

const fixes = (card.top_fixes || []).map((f) => `- [${f.effort || '?'}] ${f.dimension}: ${f.fix}${f.files?.length ? ` (${f.files.join(', ')})` : ''}`).join('\n');
const unmeasured = DIMS.filter((d) => card.scores[d].score === null).map((d) => `${d}: ${card.scores[d].unmeasured}`);
const entry = [`### Iteration ${card.iteration} · ${stamp}`, `- mean ${mean}, min ${min}, verdict **${verdict}**${stalled ? ' (stalled: no improvement for two iterations)' : ''}`, card.url ? `- url: ${card.url}` : null, card.screens_reviewed?.length ? `- screens: ${card.screens_reviewed.join(', ')}` : null, unmeasured.length ? `- unmeasured: ${unmeasured.join('; ')}` : null, fixes ? `- next fixes:\n${fixes.replace(/^/gm, '  ')}` : '- next fixes: none'].filter(Boolean).join('\n');
md = md.includes('<!-- iterations:end -->') ? md.replace('<!-- iterations:end -->', `${entry}\n\n<!-- iterations:end -->`) : md + '\n\n## Iteration log\n\n' + entry + '\n';
fs.writeFileSync(missilePath, md);

console.log(`Iteration ${card.iteration}: mean ${mean}, min ${min}, verdict ${verdict}${stalled ? ' (STALLED)' : ''}`);
console.log(DIMS.map((d) => `${d}=${card.scores[d].score === null ? `(${eff[d]})` : eff[d]}`).join('  '));
console.log(`Saved ${path.relative(root, savedPath)} and updated MISSILE.md`);
