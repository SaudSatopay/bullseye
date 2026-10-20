// Tests for skills/submission-pack/scripts/readme-preview.mjs. Offline: they use --html with a fixture in the
// shape GitHub's Markdown API returns, so neither the GitHub CLI, the network nor Playwright is needed.
// Run from the repo root: node --test tests/submission-pack.readme-preview.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(here, '..', 'skills', 'submission-pack', 'scripts', 'readme-preview.mjs');
const { previewPage, repoFromRemote } = await import(pathToFileURL(SCRIPT).href);

const env = { ...process.env, GIT_CEILING_DIRECTORIES: os.tmpdir() };
const dirs = [];
test.after(() => {
  for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
});
const tmp = () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'readme-preview-'));
  dirs.push(d);
  return d;
};

// The shape of GitHub's rendered Markdown: a Mermaid block arrives as a section holding a pre[lang=mermaid].
const BODY = [
  '<h1 dir="auto">Demo</h1>',
  '<p dir="auto"><img src="docs/hero.png" alt="The demo home page"></p>',
  '<section class="js-render-needs-enrichment" data-type="mermaid"><div class="js-render-enrichment-target">',
  '<pre lang="mermaid" aria-label="Raw mermaid code">flowchart LR\n  A --&gt; B\n</pre>',
  '</div></section>',
].join('\n');

test('wraps GitHub-rendered HTML in light and dark pages that resolve images from the README folder', () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'README.md'), '# Demo\n');
  fs.writeFileSync(path.join(dir, 'body.html'), BODY);
  const out = path.join(dir, 'out');
  const r = spawnSync(process.execPath, [SCRIPT, 'README.md', '--html', 'body.html', '--out', out], { cwd: dir, encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /light: file:\/\//);
  assert.match(r.stdout, /dark: file:\/\//);
  const light = fs.readFileSync(path.join(out, 'readme-preview-light.html'), 'utf8');
  const dark = fs.readFileSync(path.join(out, 'readme-preview-dark.html'), 'utf8');
  assert.match(light, /github-markdown-light\.min\.css/);
  assert.match(dark, /github-markdown-dark\.min\.css/);
  assert.match(light, /mermaid@\d+\.\d+\.\d+\/dist\/mermaid\.min\.js/);
  assert.match(dark, /theme: 'dark'/);
  assert.ok(light.includes('<pre lang="mermaid"'), 'the rendered body is embedded as is');
  assert.ok(light.includes(`<base href="${pathToFileURL(dir + path.sep).href}">`), 'images resolve from the README folder');
  assert.match(light, /window\.previewDone = true/);
});

test('previewPage escapes the title and keeps the body untouched', () => {
  const html = previewPage('<p>a ${b} `c`</p>', 'light', 'file:///tmp/x/', 'A <README> & "notes"');
  assert.match(html, /<title>A &lt;README&gt; &amp; &quot;notes&quot; \(light\)<\/title>/);
  assert.ok(html.includes('<p>a ${b} `c`</p>'));
});

test('repoFromRemote reads owner/name from an origin remote', (t) => {
  if (spawnSync('git', ['--version'], { env }).status !== 0) return t.skip('git is not installed');
  const dir = tmp();
  const git = (...args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8', env });
  git('init', '-q');
  assert.equal(repoFromRemote(dir), null, 'no origin yet');
  git('remote', 'add', 'origin', 'git@github.com:team-x/demo.app.git');
  assert.equal(repoFromRemote(dir), 'team-x/demo.app');
  git('remote', 'set-url', 'origin', 'https://github.com/team-x/demo');
  assert.equal(repoFromRemote(dir), 'team-x/demo');
});

test('--shoot without Playwright names the three places it looked', (t) => {
  const dir = tmp();
  try {
    createRequire(path.join(dir, 'noop.js')).resolve('playwright');
    return t.skip('a Playwright install above the temp folder would be found first');
  } catch {
    // expected: nothing resolvable from the temp folder
  }
  fs.writeFileSync(path.join(dir, 'README.md'), '# Demo\n');
  fs.writeFileSync(path.join(dir, 'body.html'), BODY);
  // A PLAYWRIGHT_MODULE that does not exist is a candidate that fails to load, so the global folder is not tried.
  const r = spawnSync(process.execPath, [SCRIPT, 'README.md', '--html', 'body.html', '--out', path.join(dir, 'out'), '--shoot'], {
    cwd: dir,
    encoding: 'utf8',
    env: { ...env, PLAYWRIGHT_MODULE: path.join(dir, 'no-such-playwright') },
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Playwright was not found \(looked in the project at .+, PLAYWRIGHT_MODULE and the global npm folder\)/);
  assert.match(r.stderr, /npm i -D playwright && npx playwright install chromium/);
  assert.ok(fs.existsSync(path.join(dir, 'out', 'readme-preview-light.html')), 'the pages are written before the shoot');
});

test('bad usage exits 2', () => {
  const dir = tmp();
  const missing = spawnSync(process.execPath, [SCRIPT, 'NOPE.md'], { cwd: dir, encoding: 'utf8', env });
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /no Markdown file/);
  fs.writeFileSync(path.join(dir, 'README.md'), '# Demo\n');
  const badRepo = spawnSync(process.execPath, [SCRIPT, 'README.md', '--repo', 'not a repo'], { cwd: dir, encoding: 'utf8', env });
  assert.equal(badRepo.status, 2);
  assert.match(badRepo.stderr, /owner\/name/);
});
