#!/usr/bin/env node
// demo-check.mjs: probe a running demo the way a judge's browser meets it, and print PASS / WARN / FAIL per check.
//
// Usage:
//   node demo-check.mjs <base-url> [--health /api/health] [--link <path>]... [--stamp <text>]
//                                  [--timeout 10000] [--slow 3000] [--json]
//
// Checks: the entry page loads without a login wall; the entry HTML is not cacheable (a stale tab would run
// yesterday's bundle); same-origin scripts and stylesheets answer 200 with the right MIME type, and hashed ones
// are cacheable; the health endpoint answers JSON (its mode, build and counts are printed); every --link answers
// 200; the --stamp text appears in the page or the health JSON; public hosts use HTTPS; the first load is not slow.
// Exit codes: 0 when nothing FAILs, 1 on any FAIL, 2 on bad usage. Zero dependencies, Node 20 or newer.
// Part of BULLSEYE build-sprint (skills/build-sprint/scripts/demo-check.mjs).

import process from 'node:process';

const HELP = `demo-check: probe a running demo the way a judge's browser meets it.

Usage:
  node demo-check.mjs <base-url> [options]

Options:
  --health <path>   health endpoint to check (default /api/health)
  --link <path>     a deep link that must answer 200; repeat for every golden-path beat
  --stamp <text>    build stamp (for example a commit SHA) that must appear in the page or the health JSON
  --timeout <ms>    per-request timeout (default 10000)
  --slow <ms>       warn when the entry page takes longer than this (default 3000)
  --json            print the results as JSON
  -h, --help        show this help

Example:
  node demo-check.mjs https://your-app.vercel.app --link "/?demo=hero" --link "/?autorun=1" --stamp 3f9a1c2

Exit codes: 0 nothing failed, 1 at least one FAIL, 2 bad usage.`;

const LOGIN_WALL = /login|signin|sign-in|\bsso\b|sso-api|\/auth\b|oauth|accounts\.google|vercel\.com|github\.com\/login|okta|auth0/i;
const HASHED = /[.-][A-Za-z0-9_]{8,}\.(?:m?js|css)$|\/_next\/static\/|\/assets\//;
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\]|::1|0\.0\.0\.0)$|\.(local|localhost|test)$/i;

function parseArgs(argv) {
  const opts = { url: null, health: '/api/health', links: [], stamp: null, timeout: 10000, slow: 3000, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      return v;
    };
    if (a === '-h' || a === '--help') opts.help = true;
    else if (a === '--health') opts.health = value();
    else if (a === '--link') opts.links.push(value());
    else if (a === '--stamp') opts.stamp = value();
    else if (a === '--timeout') opts.timeout = Number(value());
    else if (a === '--slow') opts.slow = Number(value());
    else if (a === '--json') opts.json = true;
    else if (a.startsWith('--')) throw new Error(`unknown option ${a}`);
    else if (!opts.url) opts.url = a;
    else throw new Error(`unexpected argument ${a}`);
  }
  for (const p of [opts.health, ...opts.links]) {
    // Git Bash (MSYS) rewrites an argument that starts with "/" into a Windows path before Node sees it.
    if (/^[A-Za-z]:[\\/]/.test(p)) {
      throw new Error(`got "${p}": the shell rewrote a leading "/" into a Windows path. Rerun with MSYS_NO_PATHCONV=1, or pass full URLs`);
    }
  }
  if (!Number.isFinite(opts.timeout) || opts.timeout <= 0) throw new Error('--timeout must be a positive number of milliseconds');
  if (!Number.isFinite(opts.slow) || opts.slow <= 0) throw new Error('--slow must be a positive number of milliseconds');
  return opts;
}

async function request(url, timeout) {
  const t0 = performance.now();
  const res = await fetch(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(timeout),
    headers: { 'user-agent': 'bullseye-demo-check/1.0', accept: 'text/html,application/json;q=0.9,*/*;q=0.8' },
  });
  const body = await res.text();
  return { status: res.status, headers: res.headers, body, ms: Math.round(performance.now() - t0), url };
}

// Follows redirects on the same host (including an http to https upgrade); stops at the first one that leaves it.
async function follow(url, timeout) {
  const start = new URL(url);
  const notes = [];
  let current = url;
  let total = 0;
  for (let hop = 0; hop < 6; hop++) {
    const r = await request(current, timeout);
    total += r.ms;
    const location = r.headers.get('location');
    if (r.status >= 300 && r.status < 400 && location) {
      const next = new URL(location, current);
      if (next.host !== start.host) return { ...r, ms: total, notes, offHost: next.href };
      if (next.protocol !== new URL(current).protocol) notes.push(`redirected to ${next.protocol.replace(':', '').toUpperCase()}`);
      current = next.href;
      continue;
    }
    return { ...r, ms: total, notes, finalUrl: current };
  }
  throw new Error('more than 5 redirects');
}

function cacheVerdict(cacheControl) {
  if (!cacheControl) return ['WARN', 'no Cache-Control on the entry HTML, so browsers may cache it heuristically; send no-store'];
  const cc = cacheControl.toLowerCase();
  if (/no-store|no-cache/.test(cc)) return ['PASS', cacheControl];
  const maxAge = cc.match(/(?:^|[,\s])max-age=(\d+)/);
  if (maxAge) {
    return Number(maxAge[1]) <= 60
      ? ['PASS', cacheControl]
      : ['FAIL', `${cacheControl}: a stale tab keeps the old bundle for ${maxAge[1]} s; serve the entry HTML with no-store`];
  }
  return ['WARN', `${cacheControl}: no browser max-age and no no-store; send no-store`];
}

function assetRefs(html, base) {
  const origin = new URL(base).origin;
  const refs = new Set();
  for (const m of html.matchAll(/<(script|link)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    if (m[1].toLowerCase() === 'link' && !/rel\s*=\s*["']?(?:stylesheet|modulepreload|preload)/i.test(m[0])) continue;
    let u;
    try { u = new URL(m[2], base); } catch { continue; }
    if (u.origin !== origin || !/\.(?:m?js|css)$/i.test(u.pathname)) continue;
    refs.add(u.href);
  }
  return [...refs].slice(0, 4);
}

function healthSummary(json) {
  const parts = [];
  const mode = json.mode ?? json.data_mode ?? (json.mock_mode !== undefined ? (json.mock_mode ? 'mock' : 'live') : undefined) ?? json.demo;
  if (mode !== undefined) parts.push(`mode=${mode}`);
  const modelKey = ['model', 'provider', 'llm'].find((k) => k in json); // null means no model is configured
  if (modelKey) parts.push(`model=${json[modelKey] ?? 'none'}`);
  if (json.build !== undefined) parts.push(`build=${json.build}`);
  const counts = json.counts && typeof json.counts === 'object' ? json.counts : json;
  const numbers = Object.entries(counts).filter(([, v]) => typeof v === 'number').slice(0, 8);
  if (numbers.length) parts.push(`counts: ${numbers.map(([k, v]) => `${k}=${v}`).join(', ')}`);
  return parts.length ? parts.join(' · ') : 'answers JSON (add mode, build and counts so a glance tells the state)';
}

async function run(opts) {
  const results = [];
  const add = (check, status, detail) => results.push({ check, status, detail });
  let base;
  try { base = new URL(opts.url); } catch { throw new Error(`not a URL: ${opts.url}`); }
  if (!/^https?:$/.test(base.protocol)) throw new Error('the URL must start with http:// or https://');

  // 1. The entry page, as a stranger meets it.
  let entry;
  try {
    entry = await follow(base.href, opts.timeout);
  } catch (e) {
    const why = e.cause?.code ?? (e.name === 'TimeoutError' ? `timed out after ${opts.timeout} ms` : e.message);
    add('reachable', 'FAIL', `cannot load ${base.href}: ${why}`);
    return results;
  }
  if (entry.offHost) {
    const wall = LOGIN_WALL.test(entry.offHost);
    add('reachable', wall ? 'FAIL' : 'WARN', wall
      ? `HTTP ${entry.status} to ${entry.offHost}: the demo sits behind a login wall; judges see a sign-in page`
      : `HTTP ${entry.status} to another host (${entry.offHost}); hand judges the final URL`);
    if (wall) return results;
  } else if (entry.status === 401 || entry.status === 403) {
    add('reachable', 'FAIL', `HTTP ${entry.status}: the demo needs credentials; judges cannot open it`);
    return results;
  } else if (entry.status !== 200) {
    add('reachable', 'FAIL', `HTTP ${entry.status} from ${entry.finalUrl}`);
    return results;
  } else {
    add('reachable', 'PASS', [`200 in ${entry.ms} ms`, ...entry.notes, 'no login wall'].join(', '));
  }

  const isHtml = /text\/html/i.test(entry.headers.get('content-type') ?? '');
  if (entry.status === 200 && isHtml) {
    const [status, detail] = cacheVerdict(entry.headers.get('cache-control'));
    add('entry-cache', status, detail);
    const assets = assetRefs(entry.body, entry.finalUrl);
    if (!assets.length) add('assets', 'INFO', 'no same-origin script or stylesheet referenced in the entry HTML');
    for (const href of assets) {
      const path = new URL(href).pathname;
      try {
        const a = await request(href, opts.timeout);
        const type = a.headers.get('content-type') ?? 'none';
        const isJs = /\.m?js$/i.test(path);
        const typeOk = isJs ? /javascript|ecmascript/i.test(type) : /text\/css/i.test(type);
        const cc = a.headers.get('cache-control') ?? '';
        const maxAge = Number(cc.match(/(?:^|[,\s])max-age=(\d+)/i)?.[1] ?? 0);
        if (a.status !== 200) add('asset', 'FAIL', `${path} returned HTTP ${a.status}`);
        else if (!typeOk) add('asset', 'FAIL', `${path} served as ${type}${/html/i.test(type) ? ': a fallback served the HTML page for a missing asset' : ': browsers refuse it'}`);
        else if (HASHED.test(path) && !/immutable/i.test(cc) && maxAge < 86400) {
          add('asset', 'WARN', `${path} looks hashed but is not cached for long (Cache-Control: ${cc || 'none'})`);
        } else add('asset', 'PASS', `${path} ${type}`);
      } catch (e) {
        add('asset', 'FAIL', `${path}: ${e.message}`);
      }
    }
  } else if (entry.status === 200) {
    add('entry-cache', 'INFO', `the entry is not HTML (${entry.headers.get('content-type') ?? 'no content-type'}); cache check skipped`);
  }

  // 2. The health endpoint.
  let healthJson = null;
  try {
    const h = await follow(new URL(opts.health, base).href, opts.timeout);
    if (h.status === 404) add('health', 'FAIL', `HTTP 404 at ${opts.health}: add a health endpoint that returns mode, build and counts`);
    else if (h.status !== 200) add('health', 'FAIL', `HTTP ${h.status} at ${opts.health}`);
    else {
      try { healthJson = JSON.parse(h.body); } catch { healthJson = undefined; }
      if (healthJson === undefined || healthJson === null || typeof healthJson !== 'object') add('health', 'FAIL', `${opts.health} did not return a JSON object (${h.headers.get('content-type') ?? 'no content-type'})`);
      else if (healthJson.ok === false || healthJson.status === 'error') add('health', 'FAIL', `${opts.health} reports a failure: ${JSON.stringify(healthJson).slice(0, 160)}`);
      else add('health', 'PASS', `${h.ms} ms · ${healthSummary(healthJson)}`);
    }
  } catch (e) {
    add('health', 'FAIL', `${opts.health}: ${e.message}`);
  }

  // 3. Every deep link a judge will be handed.
  for (const link of opts.links) {
    try {
      const l = await follow(new URL(link, base).href, opts.timeout);
      if (l.offHost) add('link', 'FAIL', `${link} leaves the site (HTTP ${l.status} to ${l.offHost})`);
      else if (l.status === 200) add('link', 'PASS', `${link} 200 in ${l.ms} ms`);
      else add('link', 'FAIL', `${link} returned HTTP ${l.status}`);
    } catch (e) {
      add('link', 'FAIL', `${link}: ${e.message}`);
    }
  }

  // 4. The build stamp, HTTPS and the first load's speed.
  if (opts.stamp) {
    const inPage = entry.body.includes(opts.stamp);
    const inHealth = healthJson && JSON.stringify(healthJson).includes(opts.stamp);
    add('stamp', inPage || inHealth ? 'PASS' : 'FAIL', inPage || inHealth
      ? `"${opts.stamp}" found in the ${inPage ? 'page' : 'health JSON'}`
      : `"${opts.stamp}" is in neither the page nor the health JSON: the deploy may not have landed, or the browser holds a stale build`);
  }
  if (base.protocol === 'http:' && !LOCAL.test(base.hostname)) {
    add('https', 'WARN', 'a public host on plain HTTP: judges get a warning, and microphone or voice features will not run');
  }
  if (entry.ms > opts.slow) {
    add('latency', 'WARN', `the entry took ${entry.ms} ms: open it two minutes before judging, or keep the host warm`);
  }
  return results;
}

function print(url, results, asJson) {
  const counts = { PASS: 0, WARN: 0, FAIL: 0, INFO: 0 };
  for (const r of results) counts[r.status]++;
  if (asJson) {
    console.log(JSON.stringify({ url, results, summary: counts }, null, 2));
    return counts;
  }
  console.log(`demo-check · ${url}`);
  for (const r of results) console.log(`${r.status.padEnd(5)} ${r.check.padEnd(12)} ${r.detail}`);
  console.log(`\ndemo-check: ${counts.PASS} pass, ${counts.WARN} warn, ${counts.FAIL} fail`);
  return counts;
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`demo-check: ${e.message}\n\n${HELP}`);
    return 2;
  }
  if (opts.help) {
    console.log(HELP);
    return 0;
  }
  if (!opts.url) {
    console.error(`demo-check: give the base URL of the running demo\n\n${HELP}`);
    return 2;
  }
  let results;
  try {
    results = await run(opts);
  } catch (e) {
    console.error(`demo-check: ${e.message}`);
    return 2;
  }
  const counts = print(opts.url, results, opts.json);
  return counts.FAIL ? 1 : 0;
}

process.exitCode = await main();
