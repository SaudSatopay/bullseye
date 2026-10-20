#!/usr/bin/env node
// deck.pptx.mjs · editable PPTX deck as code with pptxgenjs (route B), for rounds that require an editable .pptx.
//
// Copy this file into your project, then:
//   npm i pptxgenjs
//   node deck.pptx.mjs [--out out/Deck.pptx] [--facts facts.json] [--fonts windows|anywhere|brand] [--strict]
//
// What it gives you (each from a deck that shipped):
//   - five masters: COVER, DARK, PAPER, BLEED (full-bleed photo), APPENDIX
//   - colours named by ROLE, with a dark context and a paper context, so a re-theme is one table
//   - primitives: kicker, title (two beats, accent on the second), chip (status), numType (number label),
//     stat, card, arrow (never writes a negative extent), footer "NN / TT", credit (throws if it would
//     collide with the page number), notes (every slide must have speaker notes or the build fails)
//   - numbers read from a facts object (pass --facts to use your facts.json), never typed into slides
//   - a text-fit estimator that warns at build time when text is likely to overflow its box (--strict fails)
//   - a native, editable PowerPoint chart
// Fonts: system-safe by default so the file renders on any laptop without embedding:
//   windows  : Bahnschrift SemiBold Condensed / Segoe UI / Cascadia Mono   (Windows 10+; Cascadia Mono on 11)
//   anywhere : Arial Narrow / Arial / Courier New                            (every Office install)
//   brand    : Barlow Condensed ExtraBold / Barlow / IBM Plex Mono         (install them, then embed by re-saving
//              in PowerPoint: SaveAs(path, 24, -1), see references/powerpoint-com.md)
// After the build: python pptx_kit.py check out/Deck.pptx --require-notes, then render the slides to PNG and look.
// VialWatch is a FICTIONAL sample product; every number below is invented to show the layout.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

// ---------------------------------------------------------------- arguments
const argv = process.argv.slice(2);
const opt = (name, fallback) => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback; };
if (argv.includes('--help') || argv.includes('-h')) {
  console.log('node deck.pptx.mjs [--out out/Deck.pptx] [--facts facts.json] [--fonts windows|anywhere|brand] [--strict]');
  process.exit(0);
}
const OUT = path.resolve(opt('--out', 'out/Deck.pptx'));
const FONT_SET = opt('--fonts', 'windows');
const STRICT = argv.includes('--strict');

// pptxgenjs from the project first, then from beside this file (or NODE_PATH)
function loadPptxgen() {
  for (const base of [path.join(process.cwd(), 'noop.js'), import.meta.url]) {
    try { const mod = createRequire(base)('pptxgenjs'); return mod.default || mod; } catch { /* next */ }
  }
  console.error('deck.pptx: pptxgenjs is not installed. Run:  npm i pptxgenjs   (in the folder you run this from)');
  process.exit(1);
}
const PptxGenJS = loadPptxgen();

// ---------------------------------------------------------------- facts: every number comes from here
const SAMPLE_FACTS = {
  product: 'VialWatch', tagline: 'Every dose, kept cold.', event: '{{EVENT}}', track: '{{TRACK}}', date: '{{DATE}}',
  team: '{{TEAM}}', doc: 'DOC VW-03 · REV 0.1',
  problem: [
    { value: '1 in 4', unit: '', label: 'clinic fridges with an excursion last quarter', type: 'SOURCED', detail: '{{SOURCE, YEAR}}' },
    { value: '7.3', unit: 'HRS', label: 'median time from a failure to someone noticing', type: 'SOURCED', detail: '{{SOURCE, YEAR}}' },
    { value: '18', unit: '%', label: 'of doses discarded for heat exposure', type: 'SOURCED', detail: '{{SOURCE, YEAR}}' },
  ],
  targets: [
    { value: '≥ 0.90', label: 'recall of excursions on 30 held-out failure days' },
    { value: '≤ 1/wk', label: 'false alerts per fridge-week' },
    { value: '45 min', label: 'median warning before 8 °C' },
    { value: '< 2 min', label: 'from a reading to a ringing phone' },
  ],
  baselines: { labels: ['Fixed 8 °C alarm', 'Rate-of-change rule', 'VialWatch (target)'], recall: [0.52, 0.71, 0.9] },
};
function deepMerge(a, b) {
  if (Array.isArray(b) || typeof b !== 'object' || b === null) return b;
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = k in a ? deepMerge(a[k], v) : v;
  return out;
}
let FACTS = SAMPLE_FACTS;
const factsPath = opt('--facts');
if (factsPath) {
  try { FACTS = deepMerge(SAMPLE_FACTS, JSON.parse(fs.readFileSync(factsPath, 'utf8'))); }
  catch (e) { console.error(`deck.pptx: cannot read --facts ${factsPath}: ${e.message}`); process.exit(1); }
}

// ---------------------------------------------------------------- roles, contexts, fonts
const ROLE = {
  ground: '071016', groundRaise: '0D1B24', groundLine: '1D303C', groundInk: 'E8F0F3', groundInk2: 'A3B6C2', groundInk3: '62798A',
  paper: 'F3F1EA', paperRaise: 'FFFFFF', paperLine: 'D3D6D0', paperInk: '0F1D27', paperInk2: '42556A', paperInk3: '7F8D99',
  accent: '7DD3F5', accentOnPaper: '1D58A6',
  ok: '43D697', okOnPaper: '0E7C4C', warn: 'F5B544', warnOnPaper: 'A35F00', crit: 'FF5C55', critOnPaper: 'C12F29',
  model: 'B59CFF', modelOnPaper: '6447CF',
};
const DARK = { bg: ROLE.ground, raise: ROLE.groundRaise, line: ROLE.groundLine, ink: ROLE.groundInk, ink2: ROLE.groundInk2, ink3: ROLE.groundInk3,
  hot: ROLE.accent, ok: ROLE.ok, warn: ROLE.warn, crit: ROLE.crit, model: ROLE.model };
const PAPER = { bg: ROLE.paper, raise: ROLE.paperRaise, line: ROLE.paperLine, ink: ROLE.paperInk, ink2: ROLE.paperInk2, ink3: ROLE.paperInk3,
  hot: ROLE.accentOnPaper, ok: ROLE.okOnPaper, warn: ROLE.warnOnPaper, crit: ROLE.critOnPaper, model: ROLE.modelOnPaper };
const FONT_SETS = {
  windows: { display: 'Bahnschrift SemiBold Condensed', body: 'Segoe UI', mono: 'Cascadia Mono' },
  anywhere: { display: 'Arial Narrow', body: 'Arial', mono: 'Courier New' },
  brand: { display: 'Barlow Condensed ExtraBold', body: 'Barlow', mono: 'IBM Plex Mono' },
};
const F = FONT_SETS[FONT_SET];
if (!F) { console.error(`deck.pptx: --fonts must be one of ${Object.keys(FONT_SETS).join(', ')}`); process.exit(2); }

// ---------------------------------------------------------------- text-fit estimator (approximate, warns early)
// average advance in em per face; uppercase letters run wider. Good enough to catch the obvious overflow
// at build time; PowerPoint's own layout (qa-overflow.ps1) is the final word.
const AVG_EM = {
  'Bahnschrift SemiBold Condensed': 0.43, 'Segoe UI': 0.52, 'Cascadia Mono': 0.6, 'Arial Narrow': 0.43, Arial: 0.52,
  'Courier New': 0.6, 'Barlow Condensed ExtraBold': 0.42, Barlow: 0.5, 'IBM Plex Mono': 0.6,
};
const isMono = (face) => /Mono|Courier/.test(face);
function measure(text, face, size, charSpacing = 0) {
  const em = AVG_EM[face] ?? 0.55;
  let units = 0;
  for (const ch of String(text)) {
    if (isMono(face)) units += 0.6;
    else if (ch === ' ') units += em * 0.55;
    else if (/[A-Z0-9]/.test(ch)) units += em * 1.18;
    else if (/[.,:;·'|!i]/.test(ch)) units += em * 0.55;
    else units += em;
  }
  return (units * size) / 72 + (charSpacing * [...String(text)].length) / 72;
}
const FIT = [];
function fitCheck(slide, text, o) {
  const runs = Array.isArray(text) ? text : [{ text, options: {} }];
  const paras = [[]];
  for (const r of runs) {
    paras[paras.length - 1].push(r);
    if (r.options?.breakLine) paras.push([]);
  }
  let need = 0;
  for (const p of paras) {
    if (!p.length) continue;
    const size = Math.max(...p.map((r) => r.options?.fontSize || o.fontSize));
    const width = p.reduce((a, r) => a + measure(r.text, r.options?.fontFace || o.fontFace, r.options?.fontSize || o.fontSize, o.charSpacing || 0), 0);
    const lines = width <= o.w + 0.01 ? 1 : Math.ceil((width * 1.06) / o.w);   // wrapping wastes ~6% of each line
    need += (lines * size * (o.lineSpacingMultiple || 1.15)) / 72;
  }
  const flat = runs.map((r) => r.text).join('');
  if (need > o.h + 0.05) FIT.push(`slide ${slide._n}: needs ~${need.toFixed(2)} in, box ${o.h.toFixed(2)} in · "${flat.slice(0, 60)}"`);
}

// ---------------------------------------------------------------- deck + masters
const pres = new PptxGenJS();
pres.layout = 'LAYOUT_WIDE';                         // 13.333 x 7.5 in
pres.title = `${FACTS.product} · sample deck`;
pres.author = '';                                    // set your team name, or leave empty for anonymous rounds
pres.company = '';
const W = 13.333, H = 7.5, M = 0.6, CW = W - 2 * M, FOOT_Y = 7.02, NUM_W = 1.6;
pres.defineSlideMaster({ title: 'COVER', background: { color: ROLE.ground } });
pres.defineSlideMaster({ title: 'DARK', background: { color: ROLE.ground } });
pres.defineSlideMaster({ title: 'PAPER', background: { color: ROLE.paper } });
pres.defineSlideMaster({ title: 'BLEED', background: { color: ROLE.ground } });     // a full-bleed photo covers it
pres.defineSlideMaster({ title: 'APPENDIX', background: { color: ROLE.ground } });

const slides = [];
function slide(master, ctx, section) {
  if (section && section !== slide.section) { pres.addSection({ title: section }); slide.section = section; }
  const s = pres.addSlide({ masterName: master, sectionTitle: slide.section });
  s._n = slides.length + 1; s._ctx = ctx; s._master = master; s._notes = '';
  slides.push(s);
  return s;
}

// ---------------------------------------------------------------- primitives
function T(s, text, x, y, w, h, o = {}) {
  const opts = { x, y, w, h, margin: 0, valign: 'top', fit: 'none', isTextBox: true, fontFace: F.body, fontSize: 14, color: s._ctx.ink, ...o };
  fitCheck(s, text, opts);
  s.addText(text, opts);
}
function R(s, x, y, w, h, fill, line, o = {}) {
  if (w < 0 || h < 0) throw new Error(`slide ${s._n}: negative rectangle ${w} x ${h} (draw from the top-left corner)`);
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: fill ? { color: fill } : { type: 'none' }, line: line ? { color: line, width: o.lineW || 0.75, dashType: o.dash || 'solid' } : { type: 'none' } });
}
function kicker(s, label, y = 0.5) {
  R(s, M, y + 0.06, 0.13, 0.13, null, s._ctx.hot, { lineW: 1 });                  // motif: a square inside a circle, simplified
  R(s, M + 0.045, y + 0.105, 0.04, 0.04, s._ctx.hot);
  T(s, label.toUpperCase(), M + 0.24, y, 9, 0.26, { fontFace: F.mono, fontSize: 10, bold: true, color: s._ctx.hot, charSpacing: 3 });
}
function title(s, [first, second], y = 0.88, size = 40) {
  const runs = [{ text: first.toUpperCase(), options: { color: s._ctx.ink, breakLine: true } }, { text: second.toUpperCase(), options: { color: s._ctx.hot } }];
  T(s, runs, M, y, CW, (size * 2 * 1.05) / 72 + 0.1, { fontFace: F.display, fontSize: size, lineSpacingMultiple: 0.92 });
}
const STATUS = { IMPLEMENTED: 'filled', PROTOTYPED: 'outline', SIMULATED: 'dashed', FUTURE: 'muted' };
function chip(s, label, x, y) {
  const st = STATUS[label] || 'outline', c = s._ctx;
  const w = measure(label, F.mono, 9, 1.5) + 0.42, h = 0.27;
  const ink = st === 'filled' ? c.bg : st === 'muted' ? c.ink3 : c.ink;
  R(s, x, y, w, h, st === 'filled' ? c.ink : null, st === 'muted' ? c.ink3 : c.ink, { lineW: 0.9, dash: st === 'dashed' ? 'sysDash' : 'solid' });
  R(s, x + 0.12, y + h / 2 - 0.04, 0.08, 0.08, st === 'filled' ? c.bg : st === 'outline' ? c.ink : null, st === 'filled' || st === 'outline' ? null : ink, { lineW: 0.75, dash: st === 'dashed' ? 'sysDot' : 'solid' });
  T(s, label, x + 0.28, y, w - 0.3, h, { fontFace: F.mono, fontSize: 9, bold: true, color: ink, charSpacing: 1.5, valign: 'middle' });
  return x + w + 0.12;
}
// number types, in the repo-wide order: MEASURED, SOURCED, SIMULATED, PROJECTED, TARGET, ILLUSTRATIVE
const NUM_TYPES = { MEASURED: 'ok', SOURCED: 'ink2', SIMULATED: 'ink2', PROJECTED: 'ink2', TARGET: 'hot', ILLUSTRATIVE: 'ink3' };
function numType(s, type, detail, x, y) {
  if (!(type in NUM_TYPES)) throw new Error(`slide ${s._n}: unknown number type ${type}`);
  const c = s._ctx, color = c[NUM_TYPES[type]], text = detail ? `${type} · ${detail}` : type;
  const w = measure(text, F.mono, 7.5, 1) + 0.2;
  if (type !== 'ILLUSTRATIVE') R(s, x, y, w, 0.22, null, color, { lineW: 0.6, dash: type === 'SIMULATED' ? 'sysDash' : type === 'PROJECTED' ? 'sysDot' : 'solid' });
  T(s, text, x + 0.1, y, w - 0.1, 0.22, { fontFace: F.mono, fontSize: 7.5, bold: true, color, charSpacing: 1, valign: 'middle' });
}
function stat(s, x, y, w, f) {
  const c = s._ctx;
  R(s, x, y, w, 0.05, c.crit);
  T(s, [{ text: f.value, options: { fontFace: F.display, fontSize: 54, color: c.ink } }, { text: f.unit ? ` ${f.unit}` : '', options: { fontFace: F.display, fontSize: 22, color: c.ink2 } }],
    x, y + 0.12, w, 0.98, { fontFace: F.display, fontSize: 54, valign: 'bottom', lineSpacingMultiple: 1.0 });
  T(s, f.label, x, y + 1.16, w, 0.5, { fontSize: 13, color: c.ink2, lineSpacingMultiple: 1.05 });
  numType(s, f.type, f.detail, x, y + 1.7);
}
function card(s, x, y, w, h, k, head, body, accent) {
  const c = s._ctx;
  R(s, x, y, w, h, c.raise, c.line);
  if (accent) R(s, x, y, 0.06, h, accent);
  T(s, k.toUpperCase(), x + 0.22, y + 0.18, w - 0.4, 0.22, { fontFace: F.mono, fontSize: 9, bold: true, color: c.hot, charSpacing: 1.5 });
  T(s, head.toUpperCase(), x + 0.22, y + 0.44, w - 0.4, 0.42, { fontFace: F.display, fontSize: 22, color: c.ink });
  T(s, body, x + 0.22, y + 0.92, w - 0.4, h - 1.05, { fontSize: 12, color: c.ink2, lineSpacingMultiple: 1.08 });
}
// arrows in any direction: the box is stored from its top-left corner and flipped, so cx/cy are never negative
// (a negative extent opens with PowerPoint's Repair prompt; python-pptx and most viewers never complain)
function arrow(s, x1, y1, x2, y2, color, width = 1.5) {
  s.addShape(pres.shapes.LINE, {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
    flipH: x2 < x1, flipV: y2 < y1, line: { color, width, endArrowType: 'triangle' },
  });
}
function footer(s, total, onPhoto = false) {
  const c = s._ctx, color = onPhoto ? 'D4DEE4' : c.ink3;
  T(s, `${FACTS.product.toUpperCase()}  ·  ${FACTS.event}`, M, FOOT_Y, 6, 0.22, { fontFace: F.mono, fontSize: 8, color, charSpacing: 1.5, valign: 'middle' });
  T(s, `${String(s._n).padStart(2, '0')} / ${String(total).padStart(2, '0')}`, W - M - NUM_W, FOOT_Y, NUM_W, 0.22, { fontFace: F.mono, fontSize: 9, bold: true, color, align: 'right', valign: 'middle' });
}
// photo credit in the footer band, right-aligned against the page number; throws instead of colliding with it
function credit(s, text, onPhoto = true) {
  const w = measure(text, F.mono, 7.5, 0.5) + 0.1, right = W - M - NUM_W - 0.25;
  if (right - w < M + 4.2) throw new Error(`slide ${s._n}: credit too long for the footer band: ${text}`);
  T(s, text, right - w, FOOT_Y, w, 0.22, { fontFace: F.mono, fontSize: 7.5, color: onPhoto ? 'D4DEE4' : s._ctx.ink3, align: 'right', valign: 'middle', charSpacing: 0.5 });
}
function notes(s, text) { s._notes = text; s.addNotes(text); }

// ================================================================ slides (queued, then built once the count is known)
const BUILD = [];
// 01 · COVER
BUILD.push(() => {
  const s = slide('COVER', DARK, 'Opening');
  T(s, `${FACTS.event}  ·  ${FACTS.track}  ·  ${FACTS.date}`, M, 0.42, 7, 0.26, { fontFace: F.mono, fontSize: 10, bold: true, color: DARK.ink2, charSpacing: 2 });
  T(s, `${FACTS.doc}  ·  FICTIONAL SAMPLE`, W - M - 4.6, 0.42, 4.6, 0.26, { fontFace: F.mono, fontSize: 10, color: DARK.ink2, charSpacing: 2, align: 'right' });
  T(s, FACTS.tagline.toUpperCase(), M, 1.5, 6, 0.3, { fontFace: F.mono, fontSize: 12, bold: true, color: DARK.hot, charSpacing: 4 });
  T(s, [{ text: 'VIAL', options: { color: DARK.ink, breakLine: true } }, { text: 'WATCH', options: { color: DARK.hot } }], M - 0.04, 1.9, 6.4, 3.0,
    { fontFace: F.display, fontSize: 108, lineSpacingMultiple: 0.8 });
  T(s, 'It reads every vaccine fridge every minute, forecasts a failure before the vials warm, and wakes the one nurse who can fix it.',
    M, 5.05, 5.9, 0.95, { fontSize: 15, color: DARK.ink2, lineSpacingMultiple: 1.1 });
  // product-derived hero drawn in native shapes: the safe band, the reading, the forecast, the moment it acts
  const px = 7.15, py = 1.45, pw = 5.58, ph = 3.9;
  R(s, px, py, pw, ph, DARK.raise, DARK.line);
  T(s, 'FRIDGE C-14  ·  CLINIC 07  ·  2–8 °C', px + 0.2, py + 0.14, 4, 0.24, { fontFace: F.mono, fontSize: 9, bold: true, color: DARK.ink2, charSpacing: 1.5 });
  T(s, 'LIVE · 01:20', px + pw - 1.6, py + 0.14, 1.4, 0.24, { fontFace: F.mono, fontSize: 9, bold: true, color: DARK.ok, align: 'right' });
  R(s, px + 0.3, py + 1.7, pw - 0.6, 1.3, '0F2A38');                           // 2-8 °C band
  s.addShape(pres.shapes.LINE, { x: px + 0.3, y: py + 1.7, w: pw - 0.6, h: 0, line: { color: DARK.crit, width: 1.25, dashType: 'dash' } });
  T(s, '8 °C LIMIT', px + pw - 1.5, py + 1.42, 1.2, 0.22, { fontFace: F.mono, fontSize: 9, bold: true, color: DARK.crit, align: 'right' });
  const pts = [[0.3, 2.6], [0.75, 2.52], [1.2, 2.3], [1.6, 2.0], [1.95, 1.78]];
  for (let i = 1; i < pts.length; i++) s.addShape(pres.shapes.LINE, { x: px + pts[i - 1][0], y: py + Math.min(pts[i - 1][1], pts[i][1]), w: pts[i][0] - pts[i - 1][0], h: Math.abs(pts[i][1] - pts[i - 1][1]), flipV: pts[i][1] < pts[i - 1][1], line: { color: DARK.hot, width: 2.5 } });
  arrow(s, px + 1.95, py + 1.78, px + 3.6, py + 0.85, DARK.model, 1.75);                     // forecast, rising to the right
  s.addShape(pres.shapes.OVAL, { x: px + 2.38 - 0.07, y: py + 1.7 - 0.07, w: 0.14, h: 0.14, fill: { color: DARK.warn }, line: { type: 'none' } });
  T(s, 'CROSSES 8 °C ≈ 02:10 · CALLING THE NURSE', px + 2.55, py + 1.86, 2.9, 0.42, { fontFace: F.mono, fontSize: 9, bold: true, color: DARK.warn });
  T(s, [{ text: 'NOW  7.6 °C', options: { color: DARK.ink, breakLine: true } }, { text: 'TREND  +0.7 °C / 10 MIN', options: { color: DARK.warn } }],
    px + 0.3, py + ph - 0.72, 3.4, 0.56, { fontFace: F.mono, fontSize: 10, bold: true });
  numType(s, 'ILLUSTRATIVE', 'concept UI', px + pw - 2.1, py + ph + 0.12);
  T(s, `TEAM  ${FACTS.team}`, M, 6.55, 6, 0.26, { fontFace: F.mono, fontSize: 10, bold: true, color: DARK.ink, charSpacing: 1.5 });
  notes(s, 'VialWatch in one breath: it reads every vaccine fridge every minute, forecasts a failure 45 minutes early and calls the nurse on duty. Say the event and the team, then go straight to the night it fails.\n\nVisual note: the readings and the forecast on this slide are illustrative.');
});

// 02 · PROBLEM
BUILD.push(() => {
  const s = slide('DARK', DARK, 'Problem');
  kicker(s, '01 · The problem');
  title(s, ['A fridge fails at 02:10.', 'Nobody knows until 09:30.']);
  const cw = (CW - 0.6) / 3;
  FACTS.problem.forEach((f, i) => stat(s, M + i * (cw + 0.3), 2.45, cw, f));
  R(s, M, 4.6, CW, 1.36, DARK.raise, DARK.line);
  T(s, [
    { text: '02:10  ', options: { color: DARK.ink3 } }, { text: 'FRIDGE C-14 · 8.4 °C · relay stuck · ', options: { color: DARK.ink2 } }, { text: 'no alarm', options: { color: DARK.crit, bold: true, breakLine: true } },
    { text: '06:15  ', options: { color: DARK.ink3 } }, { text: '17.2 °C · ', options: { color: DARK.ink2 } }, { text: '140 vials above the limit', options: { color: DARK.crit, bold: true, breakLine: true } },
    { text: '09:30  ', options: { color: DARK.ink3 } }, { text: 'nurse reads the paper log · ', options: { color: DARK.ink2 } }, { text: 'discard 140 vials', options: { color: DARK.warn, bold: true } },
  ], M + 0.3, 4.76, CW - 3.2, 1.1, { fontFace: F.mono, fontSize: 12, lineSpacingMultiple: 1.25 });
  T(s, 'ONE NIGHT · RECONSTRUCTED', W - M - 3.0, 4.76, 2.7, 0.24, { fontFace: F.mono, fontSize: 8, color: DARK.ink3, align: 'right', charSpacing: 1.5 });
  T(s, [{ text: 'The fridge measured every minute of it. ', options: { color: DARK.ink } }, { text: 'Nothing was listening.', options: { color: DARK.crit, bold: true } }],
    M, 6.32, CW, 0.4, { fontSize: 18 });
  footer(s, TOTAL);
  notes(s, 'Three numbers, each with its source on the slide. Read the log as a story: 02:10, 06:15, 09:30. Pause after "Nothing was listening."');
});

// 03 · SOLUTION
BUILD.push(() => {
  const s = slide('DARK', DARK, 'Solution');
  kicker(s, '02 · The solution');
  title(s, ['Four verbs.', 'One night shift.']);
  const steps = [['01 · Sense', 'Sense', 'A sensor reads every fridge every 60 s; 7 days kept offline.', 'IMPLEMENTED'],
    ['02 · Forecast', 'Forecast', 'A small model forecasts the next 45 minutes, with a band.', 'PROTOTYPED'],
    ['03 · Wake', 'Wake', 'SMS, then a voice call, then the supervisor.', 'SIMULATED'],
    ['04 · Prove', 'Prove', 'Minutes above 8 °C, logged per vial for the audit.', 'FUTURE']];
  const cw = (CW - 0.9) / 4;
  steps.forEach(([k, h, b, st], i) => {
    const x = M + i * (cw + 0.3);
    card(s, x, 2.45, cw, 2.35, k, h, b, i === 1 ? DARK.model : null);
    chip(s, st, x + 0.22, 4.42);
    if (i < 3) arrow(s, x + cw + 0.02, 3.5, x + cw + 0.28, 3.5, DARK.hot, 1.5);
  });
  arrow(s, W - M - 0.3, 5.2, M + 0.3, 5.2, DARK.ink3, 1);                              // right-to-left: the audit feeds back
  T(s, 'EVERY CALL AND EVERY DECISION FEEDS THE NEXT FORECAST', M + 0.3, 5.3, CW - 0.6, 0.24, { fontFace: F.mono, fontSize: 9, color: DARK.ink3, align: 'center', charSpacing: 1.5 });
  R(s, M, 6.0, 0.06, 0.5, DARK.warn);
  T(s, [{ text: 'The model forecasts. ', options: { color: DARK.ink } }, { text: 'The nurse decides.', options: { color: DARK.warn, bold: true } }], M + 0.25, 6.02, CW - 0.3, 0.46, { fontSize: 18, valign: 'middle' });
  footer(s, TOTAL);
  notes(s, 'Four verbs mapped to the night. The chips say how real each part is today; move them up as features ship, never ahead of the build. The return arrow is the learning loop.');
});

// 04 · HOW IT WORKS (paper)
BUILD.push(() => {
  const s = slide('PAPER', PAPER, 'How it works');
  kicker(s, '03 · How it works');
  title(s, ['Five layers.', 'One phone call.']);
  const layers = [['Ingest', 'every 60 s'], ['Clean', 'door vs drift'], ['Forecast', '45 min ahead'], ['Decide', 'rules, not the model'], ['Call', 'SMS, then voice']];
  const bw = (CW - 4 * 0.35) / 5;
  layers.forEach(([h, d], i) => {
    const x = M + i * (bw + 0.35), hot = i === 3;
    R(s, x, 2.6, bw, 1.5, hot ? PAPER.hot : PAPER.raise, hot ? PAPER.hot : PAPER.ink, { lineW: 1 });
    T(s, `0${i + 1}`, x + 0.18, 2.74, 1, 0.24, { fontFace: F.mono, fontSize: 10, bold: true, color: hot ? 'FFFFFF' : PAPER.hot });
    T(s, h.toUpperCase(), x + 0.18, 3.02, bw - 0.3, 0.42, { fontFace: F.display, fontSize: 24, color: hot ? 'FFFFFF' : PAPER.ink });
    T(s, d, x + 0.18, 3.5, bw - 0.3, 0.42, { fontSize: 12, color: hot ? 'E8F0F3' : PAPER.ink2 });
    if (i < 4) arrow(s, x + bw + 0.03, 3.35, x + bw + 0.32, 3.35, PAPER.ink, 1.5);
  });
  const segs = [['READ · ≤ 60 s', 3, PAPER.ink], ['FORECAST · 40 ms', 1.2, PAPER.model], ['RULES · 5 ms', 1, PAPER.hot], ['SMS · ~8 s', 1.4, PAPER.ink], ['VOICE · ~30 s', 1.8, PAPER.ink]];
  const total = segs.reduce((a, x) => a + x[1], 0);
  let sx = M;
  for (const [label, wgt, color] of segs) {
    const sw = (CW * wgt) / total;
    R(s, sx, 4.75, sw, 0.42, color, 'FFFFFF', { lineW: 0.75 });
    T(s, label, sx, 4.75, sw, 0.42, { fontFace: F.mono, fontSize: 9, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
    sx += sw;
  }
  T(s, 'LATENCY BUDGET · READING TO A RINGING PHONE', M, 5.25, 6, 0.22, { fontFace: F.mono, fontSize: 9, color: PAPER.ink2, charSpacing: 1 });
  T(s, 'UNDER 2 MIN · TARGET', W - M - 3, 5.25, 3, 0.22, { fontFace: F.mono, fontSize: 9, bold: true, color: PAPER.hot, align: 'right', charSpacing: 1 });
  T(s, [{ text: 'Why it holds up: ', options: { bold: true, color: PAPER.ink } }, { text: 'the gateway forecasts and calls over a SIM, so no Wi-Fi and no cloud sit on the critical path; rules decide, so a wrong forecast can change a ranking but never skip a call.', options: { color: PAPER.ink2 } }],
    M, 5.85, CW, 0.75, { fontSize: 15, lineSpacingMultiple: 1.1 });
  footer(s, TOTAL);
  notes(s, 'Point at Decide: it is rules, highlighted on purpose. If a judge asks what happens when the model is wrong, the answer is on this slide: the 8 °C rule still fires.');
});

// 05 · PHOTO (full bleed)
BUILD.push(() => {
  const s = slide('BLEED', DARK, 'Proof');
  // REPLACE the rectangle with: s.addImage({ path: 'assets/photo-graded.jpg', x: 0, y: 0, w: W, h: H, sizing: { type: 'cover', w: W, h: H } })
  // and bake the grade and the dark ramp under the text into the JPEG (no transparency tricks in the file)
  R(s, 0, 0, W, H, '10202B');
  R(s, 0.35, 0.35, W - 0.7, FOOT_Y - 0.55, null, '3A5566', { lineW: 1, dash: 'dash' });
  T(s, 'PHOTO SLOT · REAL, CREDITED, GRADE BAKED IN', M, 2.9, CW, 0.5, { fontFace: F.mono, fontSize: 14, bold: true, color: '9CB1BE', align: 'center', charSpacing: 3 });
  T(s, [{ text: 'THE CAMERAS ARE ALREADY UP.', options: { color: DARK.ink, breakLine: true } }, { text: 'THE FRIDGES ARE NOT.', options: { color: DARK.hot } }], M, 4.6, CW, 1.6, { fontFace: F.display, fontSize: 48, lineSpacingMultiple: 0.92 });
  credit(s, 'PHOTO: {{ARTIST}} · {{SOURCE}} · {{LICENCE}}');
  footer(s, TOTAL, true);
  notes(s, 'A breath between product and proof. Use a real, credited photograph of the setting; never a generated image. The credit sits in the footer band and the build fails if it would hit the page number.');
});

// 06 · PROOF, DECLARED IN ADVANCE (paper)
BUILD.push(() => {
  const s = slide('PAPER', PAPER, 'Proof');
  kicker(s, '04 · Proof, declared in advance');
  title(s, ['Targets set', 'before we build.']);
  const cw = (CW - 0.9) / 4;
  FACTS.targets.forEach((t, i) => {
    const x = M + i * (cw + 0.3);
    R(s, x, 2.45, cw, 1.42, PAPER.raise, PAPER.ink, { lineW: 1 });
    T(s, t.value, x + 0.2, 2.56, cw - 0.4, 0.55, { fontFace: F.display, fontSize: 32, color: PAPER.ink });
    T(s, t.label, x + 0.2, 3.1, cw - 0.4, 0.46, { fontSize: 11, color: PAPER.ink2, lineSpacingMultiple: 1.05 });
    numType(s, 'TARGET', '', x + 0.2, 3.58);
  });
  // a native chart stays editable in PowerPoint; baselines are named, the target is labelled as a target
  s.addChart(pres.charts.BAR, [{ name: 'Recall at ≤ 1 false alert / week', labels: FACTS.baselines.labels, values: FACTS.baselines.recall }], {
    x: M, y: 4.15, w: 7.4, h: 2.55, barDir: 'bar', chartColors: [PAPER.ink3, PAPER.ink3, PAPER.hot], valAxisMinVal: 0, valAxisMaxVal: 1,
    showValue: true, dataLabelFormatCode: '0.00', valAxisLabelFormatCode: '0.0', catAxisOrientation: 'maxMin', dataLabelFontFace: F.mono, dataLabelFontSize: 10, dataLabelColor: PAPER.ink, catAxisLabelFontFace: F.mono,
    catAxisLabelFontSize: 10, catAxisLabelColor: PAPER.ink2, valAxisLabelFontFace: F.mono, valAxisLabelFontSize: 9, valAxisLabelColor: PAPER.ink3,
    valGridLine: { color: PAPER.line, size: 0.5 }, catAxisLineShow: false, showLegend: false, barGapWidthPct: 60,
  });
  T(s, [{ text: 'How we measure it live: ', options: { bold: true, color: PAPER.ink } }, { text: '30 failure days from two fridge models the model never saw, scored by a script in the repo, with both baselines through the same pipeline.', options: { color: PAPER.ink2 } }],
    8.35, 4.3, 4.38, 1.5, { fontSize: 13, lineSpacingMultiple: 1.1 });
  R(s, 8.35, 5.95, 0.06, 0.55, PAPER.hot);
  T(s, 'Hold us to these at the finale.', 8.55, 5.95, 4.2, 0.55, { fontSize: 14, bold: true, color: PAPER.ink, valign: 'middle' });
  footer(s, TOTAL);
  notes(s, 'Targets are declared before the build and measured live. The chart is a native PowerPoint chart: edit the data in PowerPoint or in the facts file, never by drawing bars.');
});

// 07 · CLOSE + THE ASK
BUILD.push(() => {
  const s = slide('DARK', DARK, 'Close');
  T(s, [{ text: 'EVERY DOSE,', options: { color: DARK.ink, breakLine: true } }, { text: 'KEPT COLD.', options: { color: DARK.hot } }], M, 0.8, CW, 2.5, { fontFace: F.display, fontSize: 78, lineSpacingMultiple: 0.86 });
  R(s, 0, 3.45, W, 0.05, DARK.hot);
  T(s, 'THE TEAM', M, 3.8, 3, 0.24, { fontFace: F.mono, fontSize: 10, bold: true, color: DARK.hot, charSpacing: 3 });
  ['{{NAME 1}}', '{{NAME 2}}', '{{NAME 3}}'].forEach((n, i) => T(s, n, M + i * 2.05, 4.15, 1.95, 0.4, { fontFace: F.display, fontSize: 20, color: DARK.ink }));
  R(s, 7.2, 3.8, 5.53, 1.85, DARK.raise, DARK.hot, { lineW: 1.25 });
  T(s, 'THE ASK', 7.45, 3.98, 3, 0.24, { fontFace: F.mono, fontSize: 10, bold: true, color: DARK.hot, charSpacing: 3 });
  T(s, [{ text: 'A table at the finale, two fridges and a power strip. ', options: { color: DARK.ink } }, { text: 'We hand back a cold chain that calls for help.', options: { color: DARK.hot } }],
    7.45, 4.3, 5.05, 1.2, { fontFace: F.display, fontSize: 20, lineSpacingMultiple: 1.0 });
  T(s, 'Note: VialWatch is a fictional sample product; every value in this deck is invented to show the layout.', M, 6.35, CW, 0.26, { fontSize: 10, color: DARK.ink3 });
  footer(s, TOTAL);
  notes(s, 'Land the line, then the ask: small, specific, something the jury can say yes to. Thank them and stop talking.');
});

// 08 · APPENDIX
BUILD.push(() => {
  const s = slide('APPENDIX', DARK, 'Appendix');
  kicker(s, 'Appendix · not part of the timed pitch');
  title(s, ['Every number,', 'and where it came from.'], 0.88, 34);
  const col = (CW - 0.6) / 3;
  const block = (i, head, paras) => {
    T(s, head, M + i * (col + 0.3), 2.35, col, 0.24, { fontFace: F.mono, fontSize: 9, bold: true, color: DARK.hot, charSpacing: 1.5 });
    T(s, paras.map((p, j) => ({ text: p, options: { breakLine: j < paras.length - 1, paraSpaceAfter: 6 } })), M + i * (col + 0.3), 2.68, col, 2.6, { fontSize: 11, color: DARK.ink2, lineSpacingMultiple: 1.05 });
  };
  block(0, 'SOURCES', FACTS.problem.map((p) => `${p.value}${p.unit ? ' ' + p.unit : ''}: ${p.detail}`));
  block(1, 'METHOD', ['eval/score.py: measured results on held-out days.', 'sim/thermal.py: failures from a thermal model, seeds 1–5.']);
  block(2, 'CREDITS', ['Photos: {{ARTIST}} · {{SOURCE}} · {{LICENCE}}, also in photo-credits.json.', 'Illustrative: concept UI and readings on slide 01.']);
  ['MEASURED', 'SOURCED', 'SIMULATED', 'PROJECTED', 'TARGET', 'ILLUSTRATIVE'].forEach((t, i) => numType(s, t, '', M + i * 2.02, 5.75));
  footer(s, TOTAL);
  notes(s, 'Not presented. It is here for the judge who asks where a number came from: point at it.');
});

// ---------------------------------------------------------------- build
const TOTAL = BUILD.length;          // known before any footer is drawn: "NN / TT" never goes stale
BUILD.forEach((build) => build());
const missing = slides.filter((s) => !s._notes);
if (missing.length) {
  console.error(`deck.pptx: FAILED · slides without speaker notes: ${missing.map((s) => s._n).join(', ')}`);
  process.exit(1);
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
await pres.writeFile({ fileName: OUT });
console.log(`deck.pptx · wrote ${OUT} · ${slides.length} slides · fonts: ${FONT_SET} (${F.display} / ${F.body} / ${F.mono})`);
if (FIT.length) {
  console.log(`deck.pptx · FIT WARNINGS (estimated; confirm with qa-overflow.ps1 or a render):\n  ${FIT.join('\n  ')}`);
  if (STRICT) process.exit(1);
} else console.log('deck.pptx · fit check: no estimated overflow');
console.log(`deck.pptx · next: python pptx_kit.py check "${OUT}" --require-notes   then render the slides and look`);
