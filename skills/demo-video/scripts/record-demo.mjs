#!/usr/bin/env node
// record-demo.mjs: record a scripted demo of a web app with captions drawn into the page, then encode it as
// H.264 MP4 with ffmpeg.
//
// It plays a beats file against a running app in Chromium (Playwright). The caption bar uses the app's own
// fonts and colour variables when the page defines them, and it has pointer-events: none, so it never blocks
// a click. A cursor dot travels to every click so viewers can follow it. Every step's start and end time is
// written to timing.json. A step marked "speed" is sped up in the MP4 and shows a speed badge while it plays.
//
// Usage:
//   node record-demo.mjs <beats.json> [--out <dir>] [--dry-run] [--headed] [--channel chrome|msedge]
//                        [--keep-intro] [--no-mp4] [--crf <n>] [--allow-dev]
//   node record-demo.mjs --help
//
// Writes <out>/raw.webm, <out>/timing.json and, when ffmpeg is on PATH, <out>/demo.mp4 (default out: video/out).
// Playwright is resolved from the project in the current directory ("playwright", then "@playwright/test"),
// then from the PLAYWRIGHT_MODULE environment variable, then from a global npm install.
// --dry-run validates the beats file and prints the plan without starting a browser.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync, spawnSync } from 'node:child_process';

const HELP = `record-demo.mjs: record a scripted demo with in-page captions, then encode H.264 MP4.

Usage:
  node record-demo.mjs <beats.json> [options]

Options:
  --out <dir>        output folder (default: video/out)
  --dry-run          validate the beats file and print the plan; no browser
  --headed           show the browser while it records
  --channel <name>   use an installed browser instead of Playwright's Chromium: chrome or msedge
  --keep-intro       keep the first page load in the MP4 (default: the MP4 starts at step 1)
  --no-mp4           skip the ffmpeg encode (raw.webm and timing.json only)
  --crf <n>          x264 quality 14-30 (default 20; lower is sharper and larger)
  --allow-dev        record even when a dev server is detected (Next.js or Vite)
  -h, --help         show this help

Beats file (JSON):
  {
    "url": "http://localhost:3000",         first page to open (http, https, file or data URL)
    "viewport": { "w": 1280, "h": 720 },    CSS pixels (default 1280x720)
    "deviceScaleFactor": 1.5,               video size = viewport x factor (1280x720 x 1.5 = 1920x1080)
    "colorScheme": "light",                 light | dark | no-preference
    "waitUntil": "load",                    how long goto waits: load | domcontentloaded | networkidle | commit
    "maxSeconds": 170,                      the dry run fails when the holds alone run longer
    "hide": ["#cookie-banner"],             CSS selectors hidden on every page
    "cursor": true,                         draw a cursor dot that travels to each click (default true)
    "captionStyle": { "position": "bottom", "background": "#111", "color": "#fff", "accent": "#e8a13b",
                      "fontFamily": "...", "bodyFontFamily": "...", "fontSize": 28, "maxWidth": 980 },
    "steps": [
      { "id": "hook", "goto": "/?demo=1", "waitFor": "main", "caption": "Title line", "detail": "Second line",
        "fill": { "selector": "#q", "text": "hello", "delay": 40 }, "click": "button:has-text('Run')",
        "press": "Enter", "scroll": "#results", "hold": 4000, "speed": 4, "timeout": 60000,
        "optional": false, "captionAt": "top", "note": "for humans; ignored" }
    ]
  }

  Each step runs in this order: goto, fill, click, press, scroll, waitFor, caption, hold. So a step acts,
  waits for the result, captions the result, then holds. To caption a moment before an action, give the
  step before it the caption and a hold. "caption": "" hides the bar. "waitFor" takes a selector or
  milliseconds. "press" takes a key such as
  "Control+K" or {"key": "Enter", "selector": "#q"}. "scroll" takes pixels or a selector to centre.
  "speed": 4 plays that step 4x faster in the MP4 and shows a "4x speed" badge while it plays.
  Selectors are Playwright selectors: CSS, text=Run, role=button[name="Run"], button:has-text("Run").

Exit codes: 0 ok, 1 invalid beats file or recording failure, 2 usage error.`;

const TOP_KEYS = ['url', 'viewport', 'deviceScaleFactor', 'colorScheme', 'waitUntil', 'maxSeconds', 'hide', 'cursor', 'captionStyle', 'steps', 'title', 'note'];
const STEP_KEYS = ['id', 'note', 'goto', 'waitFor', 'caption', 'detail', 'captionAt', 'fill', 'click', 'press', 'scroll', 'hold', 'speed', 'timeout', 'optional'];
const STYLE_KEYS = ['position', 'background', 'color', 'accent', 'fontFamily', 'bodyFontFamily', 'fontSize', 'maxWidth'];
const ACTION_KEYS = ['goto', 'fill', 'click', 'press', 'scroll', 'waitFor', 'caption', 'hold'];
const DEFAULT_TIMEOUT = 30000;
const MIN_READ_MS = 1500;
const BOM = String.fromCharCode(0xfeff);

// ---------------------------------------------------------------- arguments

function usage(message) {
  console.error(`record-demo: ${message}\nRun with --help for usage.`);
  process.exit(2);
}

function parseArgs(argv) {
  const opts = { file: null, out: 'video/out', dryRun: false, headed: false, channel: null, keepIntro: false, mp4: true, crf: 20, allowDev: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) usage(`${a} needs a value`);
      return v;
    };
    if (a === '-h' || a === '--help') opts.help = true;
    else if (a === '--out') opts.out = value();
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--headed') opts.headed = true;
    else if (a === '--channel') opts.channel = value();
    else if (a === '--keep-intro') opts.keepIntro = true;
    else if (a === '--no-mp4') opts.mp4 = false;
    else if (a === '--crf') opts.crf = Number(value());
    else if (a === '--allow-dev') opts.allowDev = true;
    else if (a.startsWith('-')) usage(`unknown option ${a}`);
    else if (opts.file) usage(`one beats file at a time (got ${opts.file} and ${a})`);
    else opts.file = a;
  }
  if (opts.channel !== null && !['chrome', 'msedge', 'chrome-beta', 'msedge-beta'].includes(opts.channel)) usage('--channel must be chrome or msedge');
  if (!Number.isInteger(opts.crf) || opts.crf < 14 || opts.crf > 30) usage('--crf must be a whole number from 14 to 30');
  return opts;
}

// ---------------------------------------------------------------- validation

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const even = (n) => n - (n % 2);
const short = (s, n) => (s.length > n ? `${s.slice(0, n - 3)}...` : s);

function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
}

function suggest(word, known) {
  let best = null;
  let bestD = 3;
  for (const k of known) {
    const d = lev(word.toLowerCase(), k.toLowerCase());
    if (d < bestD) { bestD = d; best = k; }
  }
  return best ? ` (did you mean "${best}"?)` : '';
}

function validate(data) {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);
  if (!isObj(data)) {
    err('the beats file must hold one JSON object with "url" and "steps"');
    return { errors, warnings, plan: null };
  }
  for (const k of Object.keys(data)) if (!TOP_KEYS.includes(k)) err(`unknown key "${k}"${suggest(k, TOP_KEYS)}`);

  let base = null;
  if (typeof data.url !== 'string' || !data.url.trim()) err('"url" is required: the first page to open, for example "http://localhost:3000"');
  else {
    try {
      base = new URL(data.url);
      if (!['http:', 'https:', 'file:', 'data:'].includes(base.protocol)) {
        err(`"url" must be an http, https, file or data URL (got ${base.protocol})`);
        base = null;
      }
    } catch {
      err(`"url" is not a valid URL: ${data.url}`);
    }
  }

  const vp = data.viewport ?? { w: 1280, h: 720 };
  const w = isObj(vp) ? vp.w ?? vp.width : undefined;
  const h = isObj(vp) ? vp.h ?? vp.height : undefined;
  if (!Number.isInteger(w) || !Number.isInteger(h) || w < 320 || w > 3840 || h < 240 || h > 2160) {
    err('"viewport" must be {"w": 320-3840, "h": 240-2160} in CSS pixels, for example {"w": 1280, "h": 720}');
  } else if (Math.abs(w / h - 16 / 9) > 0.02) {
    warn(`viewport ${w}x${h} is not 16:9; players will letterbox it (1280x720 or 1920x1080 avoids that)`);
  }
  const dsf = data.deviceScaleFactor ?? 1;
  if (typeof dsf !== 'number' || !(dsf >= 1 && dsf <= 3)) err('"deviceScaleFactor" must be a number from 1 to 3');
  if (data.colorScheme !== undefined && !['light', 'dark', 'no-preference'].includes(data.colorScheme)) err('"colorScheme" must be "light", "dark" or "no-preference"');
  if (data.waitUntil !== undefined && !['load', 'domcontentloaded', 'networkidle', 'commit'].includes(data.waitUntil)) err('"waitUntil" must be load, domcontentloaded, networkidle or commit');
  if (data.waitUntil === 'networkidle') warn('"waitUntil": "networkidle" never settles on pages with live streams (SSE, websockets); "load" plus a waitFor step is safer');
  if (data.maxSeconds !== undefined && !(typeof data.maxSeconds === 'number' && data.maxSeconds > 0)) err('"maxSeconds" must be a positive number of seconds');
  if (data.hide !== undefined && !(Array.isArray(data.hide) && data.hide.every((s) => typeof s === 'string' && s.trim()))) err('"hide" must be a list of CSS selectors');
  if (data.cursor !== undefined && typeof data.cursor !== 'boolean') err('"cursor" must be true or false');
  const style = data.captionStyle ?? {};
  if (!isObj(style)) err('"captionStyle" must be an object');
  else {
    for (const k of Object.keys(style)) if (!STYLE_KEYS.includes(k)) err(`captionStyle: unknown key "${k}"${suggest(k, STYLE_KEYS)}`);
    if (style.position !== undefined && !['top', 'bottom'].includes(style.position)) err('captionStyle.position must be "top" or "bottom"');
    for (const k of ['background', 'color', 'accent', 'fontFamily', 'bodyFontFamily']) {
      if (style[k] !== undefined && (typeof style[k] !== 'string' || !style[k].trim())) err(`captionStyle.${k} must be a non-empty string`);
    }
    if (style.fontSize !== undefined && !(typeof style.fontSize === 'number' && style.fontSize >= 14 && style.fontSize <= 72)) err('captionStyle.fontSize must be 14-72 (pixels)');
    if (style.maxWidth !== undefined && !(typeof style.maxWidth === 'number' && style.maxWidth >= 200)) err('captionStyle.maxWidth must be at least 200 (pixels)');
  }

  const steps = [];
  if (!Array.isArray(data.steps) || data.steps.length === 0) err('"steps" must be a non-empty list');
  else {
    const ids = new Set();
    data.steps.forEach((raw, i) => {
      const n = i + 1;
      const where = `step ${n}${isObj(raw) && typeof raw.id === 'string' ? ` (${raw.id})` : ''}`;
      if (!isObj(raw)) {
        err(`${where}: must be an object`);
        return;
      }
      for (const k of Object.keys(raw)) if (!STEP_KEYS.includes(k)) err(`${where}: unknown key "${k}"${suggest(k, STEP_KEYS)}`);
      if (!ACTION_KEYS.some((k) => raw[k] !== undefined)) err(`${where}: does nothing; give it at least one of ${ACTION_KEYS.join(', ')}`);
      const s = { index: n, id: `step${String(n).padStart(2, '0')}`, where };
      if (raw.id !== undefined) {
        if (typeof raw.id !== 'string' || !/^[A-Za-z0-9._-]+$/.test(raw.id)) err(`${where}: "id" may use letters, digits, dot, dash and underscore`);
        else if (ids.has(raw.id)) err(`${where}: duplicate id "${raw.id}"`);
        else { ids.add(raw.id); s.id = raw.id; }
      }
      if (raw.goto !== undefined) {
        if (typeof raw.goto !== 'string' || !raw.goto.trim()) err(`${where}: "goto" must be a URL or a path`);
        else if (base) {
          try { s.goto = new URL(raw.goto, base).href; } catch { err(`${where}: "goto" is not a URL or a path: ${raw.goto}`); }
        }
      }
      if (raw.waitFor !== undefined) {
        if (typeof raw.waitFor === 'string' && raw.waitFor.trim()) s.waitFor = raw.waitFor;
        else if (typeof raw.waitFor === 'number' && raw.waitFor >= 0 && raw.waitFor <= 600000) s.waitFor = raw.waitFor;
        else err(`${where}: "waitFor" must be a selector or a number of milliseconds`);
      }
      if (raw.caption !== undefined) {
        if (raw.caption !== null && typeof raw.caption !== 'string') err(`${where}: "caption" must be text ("" hides the bar)`);
        else {
          s.caption = raw.caption ?? '';
          if (s.caption.length > 80) warn(`${where}: the caption is ${s.caption.length} characters; keep one idea on screen (about 60 at most)`);
          if (s.caption.includes('{{')) warn(`${where}: the caption still holds a {{placeholder}}`);
        }
      }
      if (raw.detail !== undefined) {
        if (typeof raw.detail !== 'string') err(`${where}: "detail" must be text`);
        else if (!raw.caption) err(`${where}: "detail" needs a "caption" in the same step`);
        else {
          s.detail = raw.detail;
          if (raw.detail.length > 160) warn(`${where}: the detail line is ${raw.detail.length} characters; viewers read about 15 characters a second`);
          if (raw.detail.includes('{{')) warn(`${where}: the detail line still holds a {{placeholder}}`);
        }
      }
      if (raw.captionAt !== undefined) {
        if (!['top', 'bottom'].includes(raw.captionAt)) err(`${where}: "captionAt" must be "top" or "bottom"`);
        else s.captionAt = raw.captionAt;
      }
      if (raw.fill !== undefined) {
        const f = raw.fill;
        if (!isObj(f) || typeof f.selector !== 'string' || !f.selector.trim() || typeof f.text !== 'string') {
          err(`${where}: "fill" must be {"selector": "#q", "text": "what to type", "delay": 40}`);
        } else if (f.delay !== undefined && !(typeof f.delay === 'number' && f.delay >= 0 && f.delay <= 500)) {
          err(`${where}: fill.delay must be 0-500 ms per character`);
        } else {
          for (const k of Object.keys(f)) if (!['selector', 'text', 'delay'].includes(k)) err(`${where}: fill has an unknown key "${k}"`);
          s.fill = { selector: f.selector, text: f.text, delay: f.delay ?? 0 };
        }
      }
      if (raw.click !== undefined) {
        if (typeof raw.click !== 'string' || !raw.click.trim()) err(`${where}: "click" must be a selector`);
        else s.click = raw.click;
      }
      if (raw.press !== undefined) {
        const p = raw.press;
        if (typeof p === 'string' && p.trim()) s.press = { key: p };
        else if (isObj(p) && typeof p.key === 'string' && p.key.trim() && (p.selector === undefined || (typeof p.selector === 'string' && p.selector.trim()))) s.press = { key: p.key, selector: p.selector };
        else err(`${where}: "press" must be a key such as "Enter" or "Control+K", or {"key": "Enter", "selector": "#q"}`);
      }
      if (raw.scroll !== undefined) {
        if (typeof raw.scroll === 'number' && Number.isFinite(raw.scroll)) s.scroll = raw.scroll;
        else if (typeof raw.scroll === 'string' && raw.scroll.trim()) s.scroll = raw.scroll;
        else err(`${where}: "scroll" must be pixels (positive scrolls down) or a selector to bring to the centre`);
      }
      if (raw.hold !== undefined) {
        if (typeof raw.hold !== 'number' || raw.hold < 0 || raw.hold > 120000) err(`${where}: "hold" must be 0-120000 ms`);
        else s.hold = raw.hold;
      }
      if (raw.speed !== undefined) {
        if (typeof raw.speed !== 'number' || raw.speed < 1 || raw.speed > 16) err(`${where}: "speed" must be 1-16 (4 plays the step 4x faster, with a badge)`);
        else s.speed = raw.speed;
      }
      if (raw.timeout !== undefined) {
        if (typeof raw.timeout !== 'number' || raw.timeout < 1000 || raw.timeout > 600000) err(`${where}: "timeout" must be 1000-600000 ms`);
        else s.timeout = raw.timeout;
      }
      if (raw.optional !== undefined) {
        if (typeof raw.optional !== 'boolean') err(`${where}: "optional" must be true or false`);
        else s.optional = raw.optional;
      }
      s.hold = s.hold ?? 0;
      s.speed = s.speed ?? 1;
      s.timeout = s.timeout ?? DEFAULT_TIMEOUT;
      s.optional = s.optional ?? false;
      if (s.speed > 1 && s.caption) warn(`${where}: a caption set in a sped-up step shows for only hold/speed; set it in the step before`);
      steps.push(s);
    });
  }

  // A caption stays up until a later step sets "caption" again. Holds are the floor of how long it is seen.
  steps.forEach((s, i) => {
    if (!s.caption) return;
    let seen = 0;
    for (let j = i; j < steps.length && (j === i || steps[j].caption === undefined); j++) seen += steps[j].hold / steps[j].speed;
    if (seen < MIN_READ_MS) warn(`${s.where}: the caption has ${(seen / 1000).toFixed(1)} s of hold time; give it at least ${MIN_READ_MS / 1000} s so it can be read`);
  });

  const holdMs = steps.reduce((t, s) => t + s.hold, 0);
  const outMs = steps.reduce((t, s) => t + s.hold / s.speed, 0);
  if (typeof data.maxSeconds === 'number' && outMs / 1000 > data.maxSeconds) {
    err(`the holds alone run ${(outMs / 1000).toFixed(1)} s after speed-ups, over "maxSeconds" ${data.maxSeconds}; cut a beat or shorten holds`);
  }
  const plan = errors.length
    ? null
    : {
        url: base.href,
        viewport: { w, h },
        dsf,
        video: { w: even(Math.round(w * dsf)), h: even(Math.round(h * dsf)) },
        colorScheme: data.colorScheme,
        waitUntil: data.waitUntil ?? 'load',
        maxSeconds: data.maxSeconds,
        hide: data.hide ?? [],
        cursor: data.cursor ?? true,
        captionStyle: style,
        steps,
        holdMs,
        outMs,
      };
  return { errors, warnings, plan };
}

function printPlan(plan, file) {
  const { w, h } = plan.viewport;
  console.log(`plan: ${plan.steps.length} steps from ${file}`);
  console.log(`  ${short(plan.url, 70)} | viewport ${w}x${h} at ${plan.dsf}x -> video ${plan.video.w}x${plan.video.h}${plan.colorScheme ? ` | ${plan.colorScheme}` : ''}`);
  for (const s of plan.steps) {
    const acts = ACTION_KEYS.filter((k) => s[k] !== undefined && k !== 'hold').join(' ') || '-';
    const speed = s.speed > 1 ? ` x${s.speed}` : '';
    const cap = s.caption ? `  "${short(s.caption, 46)}"` : s.caption === '' ? '  (caption off)' : '';
    console.log(`  ${String(s.index).padStart(2)} ${s.id.padEnd(14)} ${acts.padEnd(30)} hold ${(s.hold / 1000).toFixed(1).padStart(5)} s${speed}${cap}`);
  }
  const cap = plan.maxSeconds ? ` (maxSeconds ${plan.maxSeconds})` : '';
  console.log(`holds: ${(plan.holdMs / 1000).toFixed(1)} s recorded, ${(plan.outMs / 1000).toFixed(1)} s after speed-ups${cap}; waits and actions add to this`);
}

// ---------------------------------------------------------------- browser side (serialized into the page)

function overlayFn({ style, state, op, x, y }) {
  const doc = document;
  let o = window.__bullseyeOverlay;
  if (!o || !doc.documentElement.contains(o.wrap)) {
    const cs = getComputedStyle(doc.documentElement);
    const cv = doc.createElement('canvas');
    cv.width = 1;
    cv.height = 1;
    const g = cv.getContext('2d', { willReadFrequently: true });
    const rgb = (v) => {
      g.clearRect(0, 0, 1, 1);
      g.fillStyle = '#000';
      g.fillStyle = v;
      g.fillRect(0, 0, 1, 1);
      const d = g.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2]];
    };
    const lum = (c) => {
      const f = (v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
    };
    const contrast = (a, b) => {
      const la = lum(rgb(a));
      const lb = lum(rgb(b));
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    };
    const pick = (names) => {
      for (const name of names) {
        const raw = cs.getPropertyValue(name).trim();
        if (!raw) continue;
        for (const value of [raw, `hsl(${raw})`, `rgb(${raw})`]) if (CSS.supports('color', value)) return { name, value };
      }
      return null;
    };
    const fontVar = (names) => {
      for (const name of names) {
        const v = cs.getPropertyValue(name).trim();
        if (v) return v;
      }
      return '';
    };
    const bodyFont = doc.body ? getComputedStyle(doc.body).fontFamily : '';
    const heading = doc.querySelector('h1, h2, h3');
    const headFont = heading ? getComputedStyle(heading).fontFamily : bodyFont;
    let bg = style.background;
    let fg = style.color;
    let source = 'captionStyle';
    if (!bg || !fg) {
      const b = pick(['--caption-bg', '--ink', '--foreground', '--fg', '--text', '--color-ink', '--color-foreground']);
      const f = pick(['--caption-fg', '--paper', '--background', '--bg', '--color-paper', '--color-background']);
      if (b && f && contrast(b.value, f.value) >= 4.5) {
        bg = bg || b.value;
        fg = fg || f.value;
        source = `page variables ${b.name} / ${f.name}`;
      } else {
        bg = bg || '#111318';
        fg = fg || '#f6f4ef';
        source = b && f ? 'default (page colours under 4.5:1 contrast)' : 'default (no page colour variables found)';
      }
    }
    const a = pick(['--caption-accent', '--signal', '--brand', '--primary', '--accent', '--color-primary', '--color-accent']);
    const accent = style.accent || (a ? a.value : fg);
    const display = style.fontFamily || fontVar(['--font-display', '--font-heading', '--font-title']) || headFont || 'system-ui, sans-serif';
    const body = style.bodyFontFamily || fontVar(['--font-sans', '--font-body', '--font-text']) || bodyFont || 'system-ui, sans-serif';
    const mono = fontVar(['--font-mono', '--font-code']) || 'ui-monospace, Consolas, monospace';
    const size = style.fontSize || 28;
    const wrap = doc.createElement('div');
    wrap.id = '__bullseye_overlay';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';
    const cap = doc.createElement('div');
    cap.style.cssText = `position:absolute;left:50%;transform:translateX(-50%);box-sizing:border-box;max-width:min(${style.maxWidth || 980}px,88vw);padding:14px 22px 16px;border-radius:6px;background:${bg};color:${fg};border-left:4px solid ${accent};box-shadow:0 10px 30px rgba(0,0,0,.25);opacity:0;transition:opacity 200ms ease-out`;
    const tEl = doc.createElement('div');
    tEl.style.cssText = `font-family:${display};font-weight:700;font-size:${size}px;line-height:1.15`;
    const dEl = doc.createElement('div');
    dEl.style.cssText = `font-family:${body};font-size:${Math.round(size * 0.62)}px;line-height:1.4;margin-top:6px;opacity:.88`;
    cap.append(tEl, dEl);
    const badge = doc.createElement('div');
    badge.style.cssText = `position:absolute;top:18px;right:18px;display:none;padding:7px 11px;border-radius:4px;background:${bg};color:${fg};font:700 15px/1 ${mono};letter-spacing:.04em`;
    const cur = doc.createElement('div');
    cur.style.cssText = `position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:${bg};box-shadow:0 0 0 2px ${fg},0 2px 8px rgba(0,0,0,.35);display:none;transition:transform 380ms cubic-bezier(.2,.8,.2,1)`;
    wrap.append(cap, badge, cur);
    (doc.body || doc.documentElement).appendChild(wrap);
    o = {
      wrap, cap, tEl, dEl, badge, cur, accent,
      pos: { x: Math.round(innerWidth / 2), y: Math.round(innerHeight * 0.6) },
      resolved: { background: bg, color: fg, accent, fontFamily: display, bodyFontFamily: body, source },
    };
    cur.style.transform = `translate(${o.pos.x}px,${o.pos.y}px)`;
    window.__bullseyeOverlay = o;
  }
  o.tEl.textContent = state.title || '';
  o.dEl.textContent = state.detail || '';
  o.dEl.style.display = state.detail ? 'block' : 'none';
  o.cap.style.top = state.at === 'top' ? '28px' : 'auto';
  o.cap.style.bottom = state.at === 'top' ? 'auto' : '28px';
  o.cap.style.opacity = state.title ? '1' : '0';
  o.badge.style.display = state.speed > 1 ? 'block' : 'none';
  o.badge.textContent = `${state.speed}× speed`;
  if (op === 'cursor') {
    o.cur.style.display = 'block';
    o.pos = { x, y };
    o.cur.style.transform = `translate(${x}px,${y}px)`;
  } else if (op === 'ripple') {
    const r = doc.createElement('div');
    r.style.cssText = `position:absolute;left:${o.pos.x}px;top:${o.pos.y}px;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid ${o.accent}`;
    o.wrap.appendChild(r);
    r.animate([{ transform: 'scale(.4)', opacity: 1 }, { transform: 'scale(1.5)', opacity: 0 }], { duration: 450, easing: 'ease-out' }).onfinish = () => r.remove();
  }
  return o.resolved;
}

function hideFn(selectors) {
  const css = selectors.map((s) => `${s}{display:none !important}`).join('\n');
  const add = () => {
    if (document.getElementById('__bullseye_hide')) return;
    const el = document.createElement('style');
    el.id = '__bullseye_hide';
    el.textContent = css;
    (document.head || document.documentElement).appendChild(el);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add);
  else add();
}

function devProbe() {
  const has = (sel) => !!document.querySelector(sel);
  return {
    next: has('nextjs-portal') || has('script[src*="react-refresh"]') || has('script[src*="hmr-client"]'),
    vite: has('script[src*="/@vite/client"]'),
  };
}

// ---------------------------------------------------------------- recording

// The project first, then PLAYWRIGHT_MODULE, then a global npm install (including the copy bundled with
// @playwright/cli), so an agent that already has Playwright globally can record without a new dependency.
function loadPlaywright() {
  const candidates = [];
  const fromProject = createRequire(path.join(process.cwd(), 'noop.js'));
  for (const name of ['playwright', '@playwright/test']) {
    try {
      candidates.push({ name, path: fromProject.resolve(name) });
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND') throw e;
    }
  }
  if (process.env.PLAYWRIGHT_MODULE) candidates.push({ name: `PLAYWRIGHT_MODULE ${process.env.PLAYWRIGHT_MODULE}`, path: process.env.PLAYWRIGHT_MODULE });
  if (!candidates.length) {
    let root = null;
    try {
      root = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'], timeout: 20000, windowsHide: true }).toString().trim();
    } catch {
      // npm is not on PATH
    }
    for (const sub of root ? ['playwright', '@playwright/test', '@playwright/cli/node_modules/playwright'] : []) {
      const dir = path.join(root, sub);
      if (fs.existsSync(path.join(dir, 'package.json'))) candidates.push({ name: `global ${sub}`, path: dir });
    }
  }
  const load = createRequire(import.meta.url);
  for (const c of candidates) {
    try {
      const mod = load(c.path);
      if (mod && mod.chromium) return { mod, name: c.name };
    } catch {
      // try the next candidate
    }
  }
  return null;
}

function installHint() {
  return [
    `Playwright was not found (looked in the project at ${process.cwd()}, PLAYWRIGHT_MODULE and the global npm folder).`,
    'Install it here, then run again:',
    '  npm i -D playwright && npx playwright install chromium',
    'With pnpm: pnpm add -D playwright && pnpm exec playwright install chromium',
    'No Node project? Record by hand with OBS (route B in the demo-video skill).',
  ].join('\n');
}

const firstLine = (m) => (String(m || 'unknown error').split('\n').find((l) => l.trim()) || 'unknown error').trim().replace(/\.+$/, '');

async function launch(chromium, opts) {
  const channels = opts.channel ? [opts.channel] : [null, 'chrome', 'msedge'];
  let last;
  for (const channel of channels) {
    try {
      const browser = await chromium.launch({ headless: !opts.headed, ...(channel ? { channel } : {}) });
      return { browser, label: channel ? `${channel} ${browser.version()}` : `chromium ${browser.version()}` };
    } catch (e) {
      last = e;
      const missing = /Executable doesn't exist|not found at|playwright install|is not installed|Failed to launch .*(chrome|msedge)/i.test(String(e.message));
      if (!missing) break;
      if (channel === null && !opts.channel) console.log("Playwright's Chromium is missing here; trying an installed Chrome, then Edge");
    }
  }
  const error = new Error(firstLine(last && last.message));
  error.launch = true;
  throw error;
}

async function overlay(page, ctx, extra = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await page.evaluate(overlayFn, { style: ctx.style, state: ctx.state, op: extra.op || 'set', x: extra.x, y: extra.y });
    } catch (e) {
      const transient = /context was destroyed|navigat|Cannot find context/i.test(String(e.message));
      if (!transient || attempt === 2) throw e;
      await page.waitForLoadState('domcontentloaded').catch(() => {});
    }
  }
  return null;
}

const target = (page, selector) => page.locator(selector).locator('visible=true').first();

async function pointAt(page, ctx, loc, timeout) {
  await loc.waitFor({ state: 'visible', timeout });
  await loc.scrollIntoViewIfNeeded({ timeout }).catch(() => {});
  if (!ctx.cursor) return;
  const box = await loc.boundingBox();
  if (!box) return;
  const x = Math.round(box.x + box.width / 2);
  const y = Math.round(box.y + box.height / 2);
  await overlay(page, ctx, { op: 'cursor', x, y });
  await page.mouse.move(x, y, { steps: 10 });
  await page.waitForTimeout(420);
}

async function settleScroll(page) {
  await page.waitForTimeout(150);
  let last = null;
  for (let i = 0; i < 20; i++) {
    const y = await page.evaluate(() => window.scrollY).catch(() => null);
    if (y === last) return;
    last = y;
    await page.waitForTimeout(100);
  }
}

async function runStep(page, s, ctx) {
  const timeout = s.timeout;
  ctx.state.speed = s.speed;
  if (s.goto) await page.goto(s.goto, { waitUntil: ctx.waitUntil, timeout });
  await overlay(page, ctx);
  if (s.fill) {
    const loc = target(page, s.fill.selector);
    await pointAt(page, ctx, loc, timeout);
    if (s.fill.delay > 0) {
      await loc.click({ timeout });
      await loc.fill('', { timeout });
      await page.keyboard.type(s.fill.text, { delay: s.fill.delay });
    } else {
      await loc.fill(s.fill.text, { timeout });
    }
  }
  if (s.click) {
    const loc = target(page, s.click);
    await pointAt(page, ctx, loc, timeout);
    if (ctx.cursor) await overlay(page, ctx, { op: 'ripple' });
    await loc.click({ timeout });
  }
  if (s.press) {
    if (s.press.selector) await target(page, s.press.selector).press(s.press.key, { timeout });
    else await page.keyboard.press(s.press.key);
  }
  if (s.scroll !== undefined) {
    if (typeof s.scroll === 'number') await page.evaluate((top) => window.scrollBy({ top, behavior: 'smooth' }), s.scroll);
    else await target(page, s.scroll).evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), undefined, { timeout });
    await settleScroll(page);
  }
  if (typeof s.waitFor === 'number') await page.waitForTimeout(s.waitFor);
  else if (s.waitFor) await page.locator(s.waitFor).locator('visible=true').first().waitFor({ state: 'visible', timeout });
  if (s.caption !== undefined) {
    ctx.state.title = s.caption;
    ctx.state.detail = s.caption ? s.detail || '' : '';
    ctx.state.at = s.captionAt || ctx.defaultAt;
  } else if (s.captionAt) ctx.state.at = s.captionAt;
  await overlay(page, ctx);
  if (s.hold > 0) await page.waitForTimeout(s.hold);
}

function hasTool(name) {
  const r = spawnSync(name, ['-version'], { stdio: 'ignore' });
  return r.status === 0;
}

function probeSeconds(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' });
  const v = parseFloat(r.stdout);
  return r.status === 0 && Number.isFinite(v) ? v : null;
}

// Cut the raw recording into contiguous segments, one per run of steps with the same speed.
function buildEdit(steps, rawMs, keepIntro) {
  const to = Math.min(rawMs ?? Infinity, steps[steps.length - 1].endMs + 250);
  const segs = [];
  if (keepIntro && steps[0].startMs > 0 && steps[0].speed !== 1) segs.push({ from: 0, speed: 1 });
  for (const s of steps) {
    const last = segs[segs.length - 1];
    if (last && last.speed === s.speed) continue;
    if (last) last.to = s.startMs;
    segs.push({ from: last ? s.startMs : keepIntro ? 0 : s.startMs, speed: s.speed });
  }
  segs[segs.length - 1].to = to;
  const segments = segs.filter((g) => g.to - g.from > 30);
  const map = (t) => {
    let out = 0;
    for (const g of segments) {
      if (t <= g.from) break;
      out += (Math.min(t, g.to) - g.from) / g.speed;
      if (t <= g.to) break;
    }
    return Math.round(out);
  };
  return { segments, map, fromMs: segments.length ? segments[0].from : 0, toMs: to };
}

function encode(webm, mp4, segments, crf) {
  const parts = segments.map((g, i) => `[0:v]trim=start=${(g.from / 1000).toFixed(3)}:end=${(g.to / 1000).toFixed(3)},setpts=(PTS-STARTPTS)/${g.speed}[v${i}]`);
  const graph = `${parts.join(';')};${segments.map((_, i) => `[v${i}]`).join('')}concat=n=${segments.length}:v=1:a=0,fps=30,format=yuv420p[out]`;
  const args = ['-y', '-v', 'error', '-i', webm, '-filter_complex', graph, '-map', '[out]', '-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf), '-movflags', '+faststart', '-an', mp4];
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${firstLine(r.stderr || (r.error && r.error.message))}`);
}

const rel = (p) => path.relative(process.cwd(), p).split(path.sep).join('/') || '.';

async function record(plan, opts, file, warnings) {
  const loaded = loadPlaywright();
  if (!loaded) {
    console.error(installHint());
    process.exit(1);
  }
  const outDir = path.resolve(opts.out);
  fs.mkdirSync(outDir, { recursive: true });
  const recDir = fs.mkdtempSync(path.join(outDir, '.rec-'));
  let launched;
  try {
    launched = await launch(loaded.mod.chromium, opts);
  } catch (e) {
    fs.rmSync(recDir, { recursive: true, force: true });
    console.error(`Could not start a browser: ${e.message}`);
    console.error('Install Chromium for this project with: npx playwright install chromium (or pass --channel chrome or --channel msedge)');
    process.exit(1);
  }
  const { browser, label } = launched;
  console.log(`recording with ${label} (Playwright from ${loaded.name})`);
  const ctx = {
    style: plan.captionStyle,
    cursor: plan.cursor,
    waitUntil: plan.waitUntil,
    defaultAt: plan.captionStyle.position || 'bottom',
    state: { title: '', detail: '', at: plan.captionStyle.position || 'bottom', speed: 1 },
  };
  const timings = [];
  let failed = null;
  let resolved = null;
  let video = null;
  let t0 = 0;
  let closeAt = 0;
  let context;
  try {
    context = await browser.newContext({
      viewport: { width: plan.viewport.w, height: plan.viewport.h },
      deviceScaleFactor: plan.dsf,
      ...(plan.colorScheme ? { colorScheme: plan.colorScheme } : {}),
      recordVideo: { dir: recDir, size: { width: plan.video.w, height: plan.video.h } },
    });
    if (plan.hide.length) await context.addInitScript(hideFn, plan.hide);
    const page = await context.newPage();
    video = page.video();
    t0 = Date.now();
    await page.goto(plan.url, { waitUntil: plan.waitUntil, timeout: 60000 });
    await page.waitForTimeout(600);
    const dev = await page.evaluate(devProbe).catch(() => ({}));
    if (dev.next || dev.vite) {
      const what = dev.next ? 'a Next.js dev server (the dev overlay is on the page)' : 'a Vite dev server (/@vite/client is loaded)';
      const fix = dev.next ? 'next build && next start' : 'vite build && vite preview';
      if (opts.allowDev) warnings.push(`recorded from ${what}; judges will see dev-only behaviour`);
      else failed = { step: 0, message: `${plan.url} is served by ${what}. Record a production build (${fix}) or the deployed URL; pass --allow-dev to record anyway.` };
    }
    if (!failed) {
      resolved = await overlay(page, ctx);
      for (const s of plan.steps) {
        const startMs = Date.now() - t0;
        let error = null;
        try {
          await runStep(page, s, ctx);
        } catch (e) {
          error = firstLine(e.message);
        }
        const endMs = Date.now() - t0;
        timings.push({ index: s.index, id: s.id, caption: ctx.state.title || null, speed: s.speed, startMs, endMs, ok: !error, ...(error ? { error } : {}) });
        console.log(`  ${String(s.index).padStart(2)}/${plan.steps.length} ${s.id.padEnd(14)} ${(startMs / 1000).toFixed(1).padStart(6)} s -> ${(endMs / 1000).toFixed(1).padStart(6)} s  ${error ? `FAILED: ${error}` : 'ok'}`);
        if (error) {
          if (s.optional) warnings.push(`step ${s.index} (${s.id}) failed and was skipped: ${error}`);
          else {
            failed = { step: s.index, message: `step ${s.index} (${s.id}) failed: ${error}. Fix the selector or the wait (try it in the browser first), raise "timeout", or mark the step "optional": true.` };
            break;
          }
        }
      }
    }
  } finally {
    closeAt = Date.now() - t0;
    if (context) await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }

  let rawFile = null;
  if (video) {
    const recorded = await video.path().catch(() => null);
    if (recorded && fs.existsSync(recorded)) {
      rawFile = path.join(outDir, 'raw.webm');
      fs.rmSync(rawFile, { force: true });
      fs.renameSync(recorded, rawFile);
    }
  }
  fs.rmSync(recDir, { recursive: true, force: true });

  // Step times are milliseconds since the page was created, which is when the video starts; measured against
  // a clock drawn in the page they match positions in raw.webm to within about 0.1 s.
  const rawSeconds = rawFile && hasTool('ffprobe') ? probeSeconds(rawFile) : null;
  const steps = timings;
  let edit = null;
  let mp4File = null;
  let mp4Seconds = null;
  if (!failed && steps.length) {
    edit = buildEdit(steps, rawSeconds ? rawSeconds * 1000 : null, opts.keepIntro);
    if (!opts.mp4) console.log('skipping the MP4 (--no-mp4)');
    else if (!rawFile) warnings.push('no raw video was written, so there is no MP4');
    else if (!hasTool('ffmpeg')) warnings.push('ffmpeg is not on PATH, so only raw.webm was written; install ffmpeg (winget install Gyan.FFmpeg, brew install ffmpeg or apt install ffmpeg) and run again for demo.mp4');
    else {
      mp4File = path.join(outDir, 'demo.mp4');
      encode(rawFile, mp4File, edit.segments, opts.crf);
      mp4Seconds = hasTool('ffprobe') ? probeSeconds(mp4File) : null;
    }
  }
  const timing = {
    tool: 'record-demo.mjs',
    recordedAt: new Date().toISOString(),
    beats: rel(path.resolve(file)),
    url: plan.url,
    browser: label,
    viewport: plan.viewport,
    deviceScaleFactor: plan.dsf,
    video: plan.video,
    caption: resolved,
    trimStartMs: edit ? edit.fromMs : null,
    rawDurationMs: rawSeconds ? Math.round(rawSeconds * 1000) : null,
    outputDurationMs: mp4Seconds ? Math.round(mp4Seconds * 1000) : edit ? edit.map(edit.toMs) : null,
    note: 'startMs/endMs are positions in raw.webm (within about 0.1 s); outStartMs/outEndMs are positions in demo.mp4 after the trim and speed-ups',
    steps: steps.map((s) => ({ ...s, outStartMs: edit ? edit.map(s.startMs) : null, outEndMs: edit ? edit.map(s.endMs) : null })),
    warnings,
    failed: failed ? failed.message : null,
    files: { raw: rawFile ? 'raw.webm' : null, mp4: mp4File ? 'demo.mp4' : null },
  };
  const timingFile = path.join(outDir, 'timing.json');
  fs.writeFileSync(timingFile, `${JSON.stringify(timing, null, 2)}\n`);

  for (const w of warnings.slice(plan.warningsShown || 0)) console.log(`warn  ${w}`);
  if (failed) {
    console.error(`FAILED ${failed.message}`);
    console.error(`kept for debugging: ${rawFile ? rel(rawFile) : '(no video)'} and ${rel(timingFile)}`);
    process.exit(1);
  }
  console.log(`recorded ${steps.length} steps in ${(closeAt / 1000).toFixed(1)} s`);
  if (rawFile) console.log(`  raw     ${rel(rawFile)}`);
  if (mp4File) console.log(`  mp4     ${rel(mp4File)} (${plan.video.w}x${plan.video.h} H.264${mp4Seconds ? `, ${mp4Seconds.toFixed(1)} s` : ''})`);
  console.log(`  timing  ${rel(timingFile)}`);
  if (resolved) console.log(`  caption style: ${resolved.source}`);
}

// ---------------------------------------------------------------- main

const opts = parseArgs(process.argv.slice(2));
if (opts.help) {
  console.log(HELP);
  process.exit(0);
}
if (!opts.file) usage('give the beats file, for example: node record-demo.mjs video/beats.json --dry-run');
let text;
try {
  text = fs.readFileSync(opts.file, 'utf8');
} catch (e) {
  console.error(`record-demo: cannot read ${opts.file}: ${e.code === 'ENOENT' ? 'no such file' : e.message}`);
  process.exit(1);
}
if (text.startsWith(BOM)) text = text.slice(1);
let data;
try {
  data = JSON.parse(text);
} catch (e) {
  console.error(`record-demo: ${opts.file} is not valid JSON: ${e.message}`);
  process.exit(1);
}
const { errors, warnings, plan } = validate(data);
if (plan) printPlan(plan, opts.file);
for (const w of warnings) console.log(`warn  ${w}`);
for (const e of errors) console.log(`FAIL  ${e}`);
if (errors.length) {
  console.log(`\n${errors.length} error${errors.length === 1 ? '' : 's'} in ${opts.file}`);
  process.exit(1);
}
if (opts.dryRun) {
  console.log(`\nOK: ${plan.steps.length} steps valid (dry run; no browser started)`);
  process.exit(0);
}
plan.warningsShown = warnings.length;
await record(plan, opts, opts.file, [...warnings]);
