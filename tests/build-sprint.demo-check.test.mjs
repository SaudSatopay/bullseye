// Tests for skills/build-sprint/scripts/demo-check.mjs against local HTTP servers built in the test. No network.
// Run: node --test tests/build-sprint.demo-check.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'skills', 'build-sprint', 'scripts', 'demo-check.mjs');

const HTML = '<!doctype html><title>demo</title>' +
  '<link rel="stylesheet" href="/assets/app-9c8b7a6d5e.css">' +
  '<script type="module" src="/assets/app-3f9a1c2b7d.js"></script>' +
  '<footer>b·3f9a1c2 2026-10-18 21:14Z</footer>';

const healthy = () => ({
  '/': { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }, body: HTML },
  '/?demo=hero': { headers: { 'content-type': 'text/html' }, body: HTML },
  '/assets/app-3f9a1c2b7d.js': { headers: { 'content-type': 'text/javascript', 'cache-control': 'public, max-age=31536000, immutable' }, body: 'export {}' },
  '/assets/app-9c8b7a6d5e.css': { headers: { 'content-type': 'text/css', 'cache-control': 'public, max-age=31536000, immutable' }, body: 'body{}' },
  '/api/health': {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    body: JSON.stringify({ ok: true, mode: 'demo', model: null, build: 'b·3f9a1c2', counts: { stations: 445, segments: 1459 } }),
  },
});

// Serves a route table keyed by path plus query (or path alone); anything else is a 404.
function serve(routes) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const route = routes[req.url] ?? routes[new URL(req.url, 'http://x').pathname];
      if (!route) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('not found'); return; }
      const send = () => { res.writeHead(route.status ?? 200, route.headers ?? {}); res.end(route.body ?? ''); };
      if (route.delayMs) setTimeout(send, route.delayMs); else send();
    });
    server.listen(0, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) }));
  });
}

// Runs the CLI asynchronously, so the in-process server keeps answering while it runs.
function check(...args) {
  return new Promise((resolve) => {
    execFile(process.execPath, [SCRIPT, ...args], { timeout: 30000 }, (error, stdout, stderr) => {
      resolve({ code: error ? (typeof error.code === 'number' ? error.code : 1) : 0, stdout, stderr });
    });
  });
}

test('a healthy demo passes every check and prints the health summary', async () => {
  const s = await serve(healthy());
  try {
    const r = await check(s.url, '--link', '/?demo=hero', '--stamp', '3f9a1c2');
    assert.equal(r.code, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /PASS {2}reachable {4}200 in \d+ ms, no login wall/);
    assert.match(r.stdout, /PASS {2}entry-cache {2}no-store/);
    assert.match(r.stdout, /PASS {2}asset +\/assets\/app-3f9a1c2b7d\.js text\/javascript/);
    assert.match(r.stdout, /PASS {2}asset +\/assets\/app-9c8b7a6d5e\.css text\/css/);
    assert.match(r.stdout, /mode=demo · model=none · build=b·3f9a1c2 · counts: stations=445, segments=1459/);
    assert.match(r.stdout, /PASS {2}link +\/\?demo=hero 200/);
    assert.match(r.stdout, /PASS {2}stamp/);
    assert.match(r.stdout, /0 warn, 0 fail/);
  } finally { await s.close(); }
});

test('a redirect to a login page fails as a login wall', async () => {
  const s = await serve({ '/': { status: 302, headers: { location: 'https://vercel.com/login?next=%2Fsso-api' } } });
  try {
    const r = await check(s.url);
    assert.equal(r.code, 1);
    assert.match(r.stdout, /FAIL {2}reachable .*login wall/);
  } finally { await s.close(); }
});

test('a 401 entry fails because judges cannot open it', async () => {
  const s = await serve({ '/': { status: 401, headers: { 'content-type': 'text/html' }, body: 'Authentication Required' } });
  try {
    const r = await check(s.url);
    assert.equal(r.code, 1);
    assert.match(r.stdout, /FAIL {2}reachable +HTTP 401: the demo needs credentials/);
  } finally { await s.close(); }
});

test('entry HTML cached for a year fails, and an asset served as HTML fails', async () => {
  const routes = healthy();
  routes['/'].headers['cache-control'] = 'public, max-age=31536000';
  routes['/assets/app-3f9a1c2b7d.js'] = { headers: { 'content-type': 'text/html' }, body: HTML };
  const s = await serve(routes);
  try {
    const r = await check(s.url);
    assert.equal(r.code, 1);
    assert.match(r.stdout, /FAIL {2}entry-cache .*stale tab keeps the old bundle for 31536000 s/);
    assert.match(r.stdout, /FAIL {2}asset +\/assets\/app-3f9a1c2b7d\.js served as text\/html: a fallback served the HTML page/);
  } finally { await s.close(); }
});

test('JavaScript served as text/plain fails; a hashed asset without long caching warns', async () => {
  const routes = healthy();
  routes['/assets/app-3f9a1c2b7d.js'] = { headers: { 'content-type': 'text/plain' }, body: 'export {}' };
  routes['/assets/app-9c8b7a6d5e.css'].headers['cache-control'] = 'public, max-age=60';
  const s = await serve(routes);
  try {
    const r = await check(s.url);
    assert.equal(r.code, 1);
    assert.match(r.stdout, /FAIL {2}asset +\/assets\/app-3f9a1c2b7d\.js served as text\/plain: browsers refuse it/);
    assert.match(r.stdout, /WARN {2}asset +\/assets\/app-9c8b7a6d5e\.css looks hashed but is not cached for long/);
  } finally { await s.close(); }
});

test('no-cache-header entry warns, and s-maxage alone does not count as browser caching', async () => {
  const routes = healthy();
  delete routes['/'].headers['cache-control'];
  const s1 = await serve(routes);
  const routes2 = healthy();
  routes2['/'].headers['cache-control'] = 's-maxage=31536000, stale-while-revalidate';
  const s2 = await serve(routes2);
  try {
    const r1 = await check(s1.url);
    assert.equal(r1.code, 0);
    assert.match(r1.stdout, /WARN {2}entry-cache +no Cache-Control on the entry HTML/);
    const r2 = await check(s2.url);
    assert.equal(r2.code, 0);
    assert.match(r2.stdout, /WARN {2}entry-cache +s-maxage=31536000, stale-while-revalidate: no browser max-age/);
  } finally { await s1.close(); await s2.close(); }
});

test('a missing health endpoint fails with the fix in the message', async () => {
  const routes = healthy();
  delete routes['/api/health'];
  const s = await serve(routes);
  try {
    const r = await check(s.url);
    assert.equal(r.code, 1);
    assert.match(r.stdout, /FAIL {2}health +HTTP 404 at \/api\/health: add a health endpoint that returns mode, build and counts/);
  } finally { await s.close(); }
});

test('health that is not JSON, or says ok:false, fails', async () => {
  const a = healthy();
  a['/api/health'] = { headers: { 'content-type': 'text/html' }, body: '<p>ok</p>' };
  const b = healthy();
  b['/api/health'] = { headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'db down' }) };
  const sa = await serve(a);
  const sb = await serve(b);
  try {
    const ra = await check(sa.url);
    assert.equal(ra.code, 1);
    assert.match(ra.stdout, /FAIL {2}health +\/api\/health did not return a JSON object/);
    const rb = await check(sb.url, '--health', '/api/health');
    assert.equal(rb.code, 1);
    assert.match(rb.stdout, /FAIL {2}health +\/api\/health reports a failure/);
  } finally { await sa.close(); await sb.close(); }
});

test('a broken deep link fails and a missing stamp fails', async () => {
  const routes = healthy();
  routes['/?demo=broken'] = { status: 500, body: 'boom' };
  const s = await serve(routes);
  try {
    const r = await check(s.url, '--link', '/?demo=hero', '--link', '/?demo=broken', '--stamp', 'deadbee');
    assert.equal(r.code, 1);
    assert.match(r.stdout, /PASS {2}link +\/\?demo=hero 200/);
    assert.match(r.stdout, /FAIL {2}link +\/\?demo=broken returned HTTP 500/);
    assert.match(r.stdout, /FAIL {2}stamp +"deadbee" is in neither the page nor the health JSON/);
  } finally { await s.close(); }
});

test('a slow first load warns', async () => {
  const routes = healthy();
  routes['/'].delayMs = 400;
  const s = await serve(routes);
  try {
    const r = await check(s.url, '--slow', '150');
    assert.equal(r.code, 0);
    assert.match(r.stdout, /WARN {2}latency +the entry took \d+ ms: open it two minutes before judging/);
  } finally { await s.close(); }
});

test('--json prints a parseable report with a summary', async () => {
  const s = await serve(healthy());
  try {
    const r = await check(s.url, '--json');
    assert.equal(r.code, 0);
    const report = JSON.parse(r.stdout);
    assert.equal(report.url, s.url);
    assert.equal(report.summary.FAIL, 0);
    assert.ok(report.results.some((x) => x.check === 'health' && x.status === 'PASS'));
  } finally { await s.close(); }
});

test('a server that is down fails with the connection error', async () => {
  const s = await serve(healthy());
  const url = s.url;
  await s.close();
  const r = await check(url);
  assert.equal(r.code, 1);
  assert.match(r.stdout, /FAIL {2}reachable +cannot load .*ECONNREFUSED/);
});

test('usage errors exit 2 and --help exits 0', async () => {
  const help = await check('--help');
  assert.equal(help.code, 0);
  assert.match(help.stdout, /Usage:/);
  assert.equal((await check()).code, 2);
  assert.equal((await check('http://127.0.0.1:9', '--bogus')).code, 2);
  assert.equal((await check('ftp://example.test')).code, 2);
  const mangled = await check('http://127.0.0.1:9', '--link', 'C:/Program Files/Git/demo');
  assert.equal(mangled.code, 2);
  assert.match(mangled.stderr, /rewrote a leading "\/" into a Windows path/);
});
