import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(root, 'skills', 'missile', 'scripts', 'recon.mjs');

test('recon inventories a small Next.js project and flags design smells', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'recon-'));
  try {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'demo', scripts: { dev: 'next dev', build: 'next build' }, dependencies: { next: '16.3.0', react: '19.2.0' } }));
    fs.mkdirSync(path.join(dir, 'src', 'app'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'src', 'app', 'page.tsx'), 'export default function Page() { return <h1 className="bg-clip-text from-purple-500">Welcome to Demo</h1> }\n');
    const run = spawnSync(process.execPath, [script, dir, '--dry', '--no-arsenal'], { encoding: 'utf8', timeout: 120000 });
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /# Recon: demo/);
    assert.match(run.stdout, /Framework: Next\.js/);
    assert.match(run.stdout, /- typecheck: missing/);
    assert.match(run.stdout, /"Welcome to" 1/);
    assert.match(run.stdout, /purple\/indigo gradients 1/);
    assert.ok(!fs.existsSync(path.join(dir, '.missile', 'recon.json')), '--dry must not write recon.json');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
