#!/usr/bin/env node
/**
 * latency-bench.mjs: HTTP latency and throughput benchmark that states its own scope. Part of the
 * prove-it skill. Zero dependencies, Node 20+ (global fetch).
 *
 * Usage
 *   node latency-bench.mjs --url http://127.0.0.1:3000/api/health
 *   node latency-bench.mjs --url http://127.0.0.1:8000/api/check --method POST \
 *        --body '{"text":"hello"}' --n 300 --concurrency 4 --json > data/proof/latency.json
 *
 * Options
 *   --url <url>                 required; the query string is never printed or saved (it may hold a key)
 *   --method <verb>             GET (default), POST, PUT, PATCH, DELETE
 *   --body <text>               request body; --body-file <path> reads it from a file instead
 *   --header "name: value"      repeatable; only header names are printed or saved, never values
 *   --warmup <n>                requests sent first and discarded (default 20): cold caches, JIT, connections
 *   --n <n>                     measured requests (default 200)
 *   --concurrency <n>           requests in flight at once (default 1)
 *   --timeout <ms>              per request (default 10000); a timeout is an error
 *   --max-errors <n>            exit 1 when more measured requests fail (default 0)
 *   --max-p95 <ms>              exit 1 when p95 is over this budget (same for --max-p99)
 *   --scope <text>              what the number covers, printed and saved with it
 *   --json                      JSON output, ready to merge into facts.json
 *
 * What it measures: for each measured request, the wall time from sending it to reading the full response
 * body, on reused keep-alive connections. Percentiles (nearest rank) and the mean cover requests that
 * returned a status below 400. A status of 400 or more, a network error or a timeout is an error: errors are
 * counted and named, never timed. Throughput is successful measured requests divided by the wall time of the
 * measured phase. The machine (platform, CPU model and count, Node version) is recorded so the number always
 * says where it was measured; the host name and user name are not.
 *
 * Exit codes: 0 pass, 1 errors over --max-errors or a budget missed, 2 bad arguments.
 */

import fs from 'node:fs';
import os from 'node:os';

const HELP = `latency-bench: HTTP latency (p50/p95/p99/max/mean) and throughput, with its scope stated.

Usage
  node latency-bench.mjs --url <url> [--method POST] [--body <text> | --body-file <path>]
                         [--header "name: value"]... [--warmup 20] [--n 200] [--concurrency 1]
                         [--timeout 10000] [--max-errors 0] [--max-p95 <ms>] [--max-p99 <ms>]
                         [--scope <text>] [--json]

Timing is send to full response body per request. Errors (status >= 400, network, timeout) are counted,
never timed. Exit 0 pass, 1 errors or budget missed, 2 bad arguments.
`;

function usage(message) {
  process.stderr.write(`latency-bench: ${message}\n`);
  process.exit(2);
}

const opts = { method: 'GET', headers: {}, warmup: 20, n: 200, concurrency: 1, timeout: 10000, maxErrors: 0, json: false };
const argv = process.argv.slice(2);
const intFlags = { '--warmup': 'warmup', '--n': 'n', '--concurrency': 'concurrency', '--timeout': 'timeout', '--max-errors': 'maxErrors' };
for (let i = 0; i < argv.length; i++) {
  let a = argv[i];
  let inline;
  if (a.startsWith('--') && a.includes('=')) [a, inline] = [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)];
  const value = () => {
    const v = inline ?? argv[++i];
    if (v === undefined) usage(`${a} needs a value`);
    return v;
  };
  if (a === '--help' || a === '-h') { process.stdout.write(HELP); process.exit(0); }
  else if (a === '--json') opts.json = true;
  else if (a === '--url') opts.url = value();
  else if (a === '--method') opts.method = value().toUpperCase();
  else if (a === '--body') opts.body = value();
  else if (a === '--body-file') opts.bodyFile = value();
  else if (a === '--scope') opts.scope = value();
  else if (a === '--header') {
    const h = value();
    const at = h.indexOf(':');
    if (at < 1) usage(`--header "${h}" must look like "name: value"`);
    opts.headers[h.slice(0, at).trim().toLowerCase()] = h.slice(at + 1).trim();
  } else if (a === '--max-p95' || a === '--max-p99') {
    const v = Number(value());
    if (!Number.isFinite(v) || v <= 0) usage(`${a} needs a positive number of milliseconds`);
    opts[a === '--max-p95' ? 'maxP95' : 'maxP99'] = v;
  } else if (intFlags[a]) {
    const v = Number(value());
    const min = a === '--warmup' || a === '--max-errors' ? 0 : 1;
    if (!Number.isInteger(v) || v < min) usage(`${a} needs a whole number of at least ${min}`);
    opts[intFlags[a]] = v;
  } else usage(`unknown option ${a} (see --help)`);
}

if (!opts.url) usage('--url is required (see --help)');
let target;
try {
  target = new URL(opts.url);
} catch {
  usage(`--url ${opts.url} is not a valid URL`);
}
if (!['http:', 'https:'].includes(target.protocol)) usage('--url must be http or https');
if (opts.body !== undefined && opts.bodyFile !== undefined) usage('use --body or --body-file, not both');
let body = opts.body;
if (opts.bodyFile !== undefined) {
  if (!fs.existsSync(opts.bodyFile)) usage(`--body-file ${opts.bodyFile} not found`);
  body = fs.readFileSync(opts.bodyFile);
}
if (body !== undefined && ['GET', 'HEAD'].includes(opts.method)) usage(`${opts.method} requests cannot carry a body; add --method POST`);
const notes = [];
if (body !== undefined && !opts.headers['content-type']) {
  try {
    JSON.parse(String(body));
    opts.headers['content-type'] = 'application/json';
    notes.push('content-type: application/json (body parses as JSON)');
  } catch {
    /* leave it unset */
  }
}

// What gets printed and saved: never the query string, never header values.
const shownUrl = `${target.origin}${target.pathname}`;
if (target.search) notes.push('query string not recorded');

async function once() {
  const started = performance.now();
  try {
    const res = await fetch(target, { method: opts.method, headers: opts.headers, body, signal: AbortSignal.timeout(opts.timeout) });
    await res.arrayBuffer();
    const ms = performance.now() - started;
    return res.status < 400 ? { ok: true, ms } : { ok: false, kind: `HTTP ${res.status}` };
  } catch (e) {
    const timeout = e?.name === 'TimeoutError' || e?.name === 'AbortError';
    return { ok: false, kind: timeout ? 'timeout' : `network (${e?.cause?.code ?? e?.message ?? 'error'})` };
  }
}

async function phase(count) {
  const results = new Array(count);
  let next = 0;
  const worker = async () => {
    for (let i = next++; i < count; i = next++) results[i] = await once();
  };
  const started = performance.now();
  await Promise.all(Array.from({ length: Math.min(opts.concurrency, count) }, worker));
  return { results, wallMs: performance.now() - started };
}

const nearestRank = (sorted, p) => sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)];
const round = (x) => (x === null || x === undefined ? null : Math.round(x * 100) / 100);

if (opts.warmup) await phase(opts.warmup);
const { results, wallMs } = await phase(opts.n);

const okTimes = results.filter((r) => r.ok).map((r) => r.ms).sort((a, b) => a - b);
const errorsByKind = {};
for (const r of results) if (!r.ok) errorsByKind[r.kind] = (errorsByKind[r.kind] ?? 0) + 1;
const errors = results.length - okTimes.length;
const latency = okTimes.length
  ? {
      p50: round(nearestRank(okTimes, 50)),
      p95: round(nearestRank(okTimes, 95)),
      p99: round(nearestRank(okTimes, 99)),
      max: round(okTimes[okTimes.length - 1]),
      mean: round(okTimes.reduce((s, x) => s + x, 0) / okTimes.length),
      min: round(okTimes[0]),
    }
  : { p50: null, p95: null, p99: null, max: null, mean: null, min: null };

const failures = [];
if (!okTimes.length) failures.push('no request succeeded');
if (errors > opts.maxErrors) failures.push(`${errors} errors (allowed ${opts.maxErrors})`);
if (opts.maxP95 && latency.p95 !== null && latency.p95 > opts.maxP95) failures.push(`p95 ${latency.p95} ms is over the ${opts.maxP95} ms budget`);
if (opts.maxP99 && latency.p99 !== null && latency.p99 > opts.maxP99) failures.push(`p99 ${latency.p99} ms is over the ${opts.maxP99} ms budget`);

const cpus = os.cpus();
const machine = { platform: process.platform, arch: process.arch, cpus: cpus.length, cpuModel: cpus[0]?.model?.trim() ?? 'unknown', node: process.version };
const scope =
  opts.scope ??
  `HTTP round trip from this machine to ${target.host}: send to full response body on keep-alive connections, server and network time included, client rendering excluded`;

const report = {
  tool: 'latency-bench',
  measuredAt: new Date().toISOString(),
  url: shownUrl,
  method: opts.method,
  headers: Object.keys(opts.headers),
  machine,
  warmup: opts.warmup,
  n: opts.n,
  concurrency: opts.concurrency,
  timeoutMs: opts.timeout,
  count: results.length,
  ok: okTimes.length,
  errors,
  errorsByKind,
  latencyMs: latency,
  throughputRps: round(okTimes.length / (wallMs / 1000)),
  wallMs: round(wallMs),
  scope,
  methodNote: 'nearest-rank percentiles over successful measured requests; warm-up discarded; errors counted, never timed',
  notes,
  pass: failures.length === 0,
  failures,
};

if (opts.json) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  const ms = (x) => (x === null ? '-' : x.toFixed(2));
  const errText = errors ? `, ${errors} errors (${Object.entries(errorsByKind).map(([k, v]) => `${k} x${v}`).join(', ')})` : ', 0 errors';
  const lines = [
    `latency-bench  ${opts.method} ${shownUrl}`,
    `  machine      ${machine.platform} ${machine.arch}, ${machine.cpus} x ${machine.cpuModel}, node ${machine.node}`,
    `  warm-up      ${opts.warmup} requests, discarded`,
    `  measured     ${opts.n} requests, concurrency ${opts.concurrency}, ${(wallMs / 1000).toFixed(2)} s wall`,
    `  result       ${okTimes.length} ok${errText}`,
    `  latency ms   p50 ${ms(latency.p50)} | p95 ${ms(latency.p95)} | p99 ${ms(latency.p99)} | max ${ms(latency.max)} | mean ${ms(latency.mean)} | min ${ms(latency.min)}`,
    `  throughput   ${report.throughputRps} req/s`,
    `  scope        ${scope}`,
    ...notes.map((n) => `  note         ${n}`),
    failures.length ? `FAIL: ${failures.join('; ')}` : 'PASS',
  ];
  process.stdout.write(`${lines.join('\n')}\n`);
}
process.exit(failures.length ? 1 : 0);
