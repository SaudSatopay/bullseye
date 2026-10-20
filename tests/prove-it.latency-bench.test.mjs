// Tests for skills/prove-it/scripts/latency-bench.mjs against a local server started in each test.
// Run: node --test (from the repo root)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(ROOT, 'skills', 'prove-it', 'scripts', 'latency-bench.mjs');
const execFileP = promisify(execFile);

/** The bench must run as an async child: a blocking spawn would freeze the server it measures. */
async function bench(args) {
  try {
    const { stdout, stderr } = await execFileP(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', timeout: 60000 });
    return { code: 0, out: stdout, err: stderr };
  } catch (e) {
    return { code: e.code, out: e.stdout ?? '', err: e.stderr ?? '' };
  }
}

async function serve(handler) {
  const timers = new Set();
  const later = (ms, fn) => {
    const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
    timers.add(t);
  };
  const server = http.createServer((req, res) => handler(req, res, later));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => {
      for (const t of timers) clearTimeout(t);
      server.closeAllConnections();
      return new Promise((resolve) => server.close(resolve));
    },
  };
}

test('sends the warm-up and the measured requests and reports ordered percentiles', async () => {
  let seen = 0;
  const s = await serve((req, res, later) => {
    seen++;
    later(3, () => res.end('ok'));
  });
  try {
    const r = await bench(['--url', `${s.url}/health`, '--n', '40', '--warmup', '5', '--concurrency', '4', '--json']);
    assert.equal(r.code, 0, r.out + r.err);
    const report = JSON.parse(r.out);
    assert.equal(seen, 45, 'the warm-up requests were really sent, and discarded');
    assert.equal(report.count, 40);
    assert.equal(report.ok, 40);
    assert.equal(report.errors, 0);
    const l = report.latencyMs;
    assert.ok(l.min <= l.p50 && l.p50 <= l.p95 && l.p95 <= l.p99 && l.p99 <= l.max, JSON.stringify(l));
    assert.ok(l.p50 >= 2, 'the server waits 3 ms, so the median cannot be under 2 ms');
    assert.ok(report.throughputRps > 0);
    assert.match(report.scope, /127\.0\.0\.1/);
    assert.ok(report.machine.cpus >= 1 && report.machine.node.startsWith('v'));
    assert.equal(r.out.includes(os.hostname()), false, 'the host name is never recorded');
    assert.equal(report.pass, true);
  } finally {
    await s.close();
  }
});

test('POST carries the body and headers on every request; header values and the query string are never recorded', async () => {
  let matched = 0;
  let total = 0;
  const s = await serve((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      total++;
      if (req.method === 'POST' && body === '{"text":"hi"}' && req.headers['x-api-key'] === 'secret-123' && req.headers['content-type'] === 'application/json') matched++;
      res.end('{}');
    });
  });
  try {
    const r = await bench(['--url', `${s.url}/check?key=abc123`, '--method', 'POST', '--body', '{"text":"hi"}', '--header', 'x-api-key: secret-123', '--n', '10', '--warmup', '2', '--json']);
    assert.equal(r.code, 0, r.out + r.err);
    assert.equal(total, 12);
    assert.equal(matched, 12, 'every request carried the body, the header and the inferred content type');
    const report = JSON.parse(r.out);
    assert.equal(report.url, `${s.url}/check`);
    assert.deepEqual(report.headers.sort(), ['content-type', 'x-api-key']);
    assert.equal(r.out.includes('abc123'), false);
    assert.equal(r.out.includes('secret-123'), false);
    assert.ok(report.notes.some((n) => /query string not recorded/.test(n)));
  } finally {
    await s.close();
  }
});

test('errors are counted and named, never timed, and fail the run unless allowed', async () => {
  let n = 0;
  const s = await serve((req, res) => {
    n++;
    res.statusCode = n % 3 === 0 ? 500 : 200;
    res.end('x');
  });
  try {
    const r = await bench(['--url', s.url, '--n', '30', '--warmup', '0', '--json']);
    assert.equal(r.code, 1);
    const report = JSON.parse(r.out);
    assert.equal(report.errors, 10);
    assert.equal(report.ok, 20);
    assert.deepEqual(report.errorsByKind, { 'HTTP 500': 10 });
    assert.match(report.failures.join(' '), /10 errors \(allowed 0\)/);
    n = 0;
    const allowed = await bench(['--url', s.url, '--n', '30', '--warmup', '0', '--max-errors', '10', '--json']);
    assert.equal(allowed.code, 0, allowed.out);
  } finally {
    await s.close();
  }
});

test('a timeout is an error, and a run with no success fails', async () => {
  const s = await serve((req, res, later) => later(400, () => res.end('late')));
  try {
    const r = await bench(['--url', s.url, '--timeout', '50', '--n', '3', '--warmup', '0', '--json']);
    assert.equal(r.code, 1);
    const report = JSON.parse(r.out);
    assert.deepEqual(report.errorsByKind, { timeout: 3 });
    assert.equal(report.latencyMs.p95, null, 'nothing is timed when nothing succeeded');
    assert.match(report.failures.join(' '), /no request succeeded/);
  } finally {
    await s.close();
  }
});

test('--max-p95 fails a run that misses its budget', async () => {
  const s = await serve((req, res, later) => later(25, () => res.end('ok')));
  try {
    const r = await bench(['--url', s.url, '--n', '5', '--warmup', '1', '--max-p95', '1']);
    assert.equal(r.code, 1);
    assert.match(r.out, /FAIL: p95 [\d.]+ ms is over the 1 ms budget/);
  } finally {
    await s.close();
  }
});

test('the text report states the machine, the percentiles and the scope', async () => {
  const s = await serve((req, res) => res.end('ok'));
  try {
    const r = await bench(['--url', s.url, '--n', '20', '--warmup', '2', '--scope', 'API latency only (no model call)']);
    assert.equal(r.code, 0, r.out + r.err);
    assert.match(r.out, /machine\s+\S+ \S+, \d+ x /);
    assert.match(r.out, /p50 [\d.]+ \| p95 [\d.]+ \| p99 [\d.]+ \| max [\d.]+ \| mean [\d.]+/);
    assert.match(r.out, /scope\s+API latency only \(no model call\)/);
    assert.match(r.out, /^PASS$/m);
  } finally {
    await s.close();
  }
});

test('bad arguments exit 2', async () => {
  assert.equal((await bench([])).code, 2);
  assert.equal((await bench(['--url', 'not a url'])).code, 2);
  assert.equal((await bench(['--url', 'http://127.0.0.1:9/', '--body', 'x'])).code, 2, 'a GET cannot carry a body');
  assert.equal((await bench(['--url', 'http://127.0.0.1:9/', '--n', '0'])).code, 2);
  assert.equal((await bench(['--url', 'http://127.0.0.1:9/', '--frobnicate'])).code, 2);
  const help = await bench(['--help']);
  assert.equal(help.code, 0);
  assert.match(help.out, /Usage/);
});
