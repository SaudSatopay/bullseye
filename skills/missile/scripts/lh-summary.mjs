#!/usr/bin/env node
// Missile Lighthouse summary: turn one or more Lighthouse JSON reports into a short Markdown table.
// Usage: node lh-summary.mjs <report.json> [more.json ...]

import fs from 'node:fs';
import path from 'node:path';

const files = process.argv.slice(2);
if (!files.length) { console.error('usage: node lh-summary.mjs <lighthouse.json> [...]'); process.exit(2); }

const pct = (v) => (typeof v === 'number' ? Math.round(v * 100) : 'n/a');
for (const file of files) {
  let r;
  try { r = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')); } catch (e) { console.log(`## ${file}\n- could not read: ${e.message}\n`); continue; }
  const c = r.categories || {};
  const a = r.audits || {};
  const metric = (id) => a[id]?.displayValue || 'n/a';
  console.log(`## ${path.basename(file)} · ${r.finalDisplayedUrl || r.requestedUrl || ''} · ${r.configSettings?.formFactor || ''}`);
  if (r.runtimeError?.code) { console.log(`- RUNTIME ERROR ${r.runtimeError.code}: ${r.runtimeError.message || ''}`.trim()); console.log('- No scores: fix the URL or the server and run Lighthouse again.\n'); continue; }
  console.log('| performance | accessibility | best-practices | seo |');
  console.log('|---|---|---|---|');
  console.log(`| ${pct(c.performance?.score)} | ${pct(c.accessibility?.score)} | ${pct(c['best-practices']?.score)} | ${pct(c.seo?.score)} |`);
  console.log(`- LCP ${metric('largest-contentful-paint')} · CLS ${metric('cumulative-layout-shift')} · TBT ${metric('total-blocking-time')} · FCP ${metric('first-contentful-paint')} · Speed Index ${metric('speed-index')}${a['interaction-to-next-paint'] ? ` · INP ${metric('interaction-to-next-paint')}` : ''}`);
  const opportunities = Object.values(a).filter((x) => x.details?.type === 'opportunity' && (x.details.overallSavingsMs || 0) > 0).sort((x, y) => (y.details.overallSavingsMs || 0) - (x.details.overallSavingsMs || 0)).slice(0, 6);
  if (opportunities.length) {
    console.log('- Top opportunities:');
    for (const o of opportunities) console.log(`  - ${o.title}: ${Math.round(o.details.overallSavingsMs)} ms${o.details.overallSavingsBytes ? `, ${Math.round(o.details.overallSavingsBytes / 1024)} KB` : ''}`);
  }
  const byRef = (cat) => (c[cat]?.auditRefs || []).map((ref) => ({ id: ref.id, audit: a[ref.id] })).filter((x) => x.audit && x.audit.score !== null && x.audit.score < 1 && x.audit.scoreDisplayMode !== 'notApplicable');
  const failing = byRef('accessibility').slice(0, 8);
  if (failing.length) {
    console.log('- Accessibility findings:');
    for (const { audit } of failing) console.log(`  - ${audit.title}${audit.details?.items?.length ? ` (${audit.details.items.length} elements)` : ''}`);
  }
  const bp = byRef('best-practices').filter((x) => /console|errors|deprecat|https|vulnerab|csp|image-aspect/i.test(x.id)).slice(0, 4);
  if (bp.length) { console.log('- Best-practice findings:'); for (const { audit } of bp) console.log(`  - ${audit.title}`); }
  console.log('');
}
