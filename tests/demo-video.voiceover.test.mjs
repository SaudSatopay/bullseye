// Tests for skills/demo-video/scripts/voiceover.py. Offline: the dry run never touches the network, and the
// measured-mode test swaps in a stand-in edge_tts module that writes MP3 tones with ffmpeg.
// Run: node --test tests/demo-video.voiceover.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.resolve(here, '..', 'skills', 'demo-video', 'scripts', 'voiceover.py');
const EM = String.fromCharCode(0x2014);
const EN = String.fromCharCode(0x2013);

function findPython() {
  const candidates = process.platform === 'win32' ? [['python'], ['py', '-3'], ['python3']] : [['python3'], ['python']];
  for (const [cmd, ...pre] of candidates) {
    const r = spawnSync(cmd, [...pre, '-c', 'import sys; print(sys.version_info >= (3, 10))'], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim() === 'True') return { cmd, pre };
  }
  return null;
}
const py = findPython();
const noPython = py ? false : 'Python 3.10+ is not on PATH';
const hasFfmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
const hasMeasure = py && (spawnSync(py.cmd, [...py.pre, '-c', 'import mutagen'], { stdio: 'ignore' }).status === 0
  || spawnSync('ffprobe', ['-version'], { stdio: 'ignore' }).status === 0);

function run(args, { cwd, env } = {}) {
  return spawnSync(py.cmd, [...py.pre, script, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8', ...env },
  });
}
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bullseye-vo-'));

function parseSrt(text) {
  return text.trim().split(/\r?\n\r?\n/).map((block) => {
    const lines = block.split(/\r?\n/);
    const m = lines[1].match(/^(\d\d):(\d\d):(\d\d),(\d{3}) --> (\d\d):(\d\d):(\d\d),(\d{3})$/);
    assert.ok(m, `bad timing line: ${lines[1]}`);
    const sec = (h, mi, s, ms) => +h * 3600 + +mi * 60 + +s + +ms / 1000;
    return { n: +lines[0], start: sec(m[1], m[2], m[3], m[4]), end: sec(m[5], m[6], m[7], m[8]), lines: lines.slice(2) };
  });
}

const beats = {
  voice: 'en-US-AndrewNeural',
  display: { 'ninety-eight percent': '98%' },
  beats: [
    { id: 'hook', start: '0:00', window: 9, text: `Two writes. Not atomic. Your agent pays the customer twice ${EM} and every log line is green.` },
    { id: 'proof', start: '0:10', window: 12, text: 'Eight agents raced. One refund left the account, and ninety-eight percent of the retries were the database doing its job. [hold on the zero]' },
    { id: 'close', start: 23, window: 6, text: 'Agent memory is a system of record, not a cache.' },
  ],
};

test('--help prints usage and exits 0', { skip: noPython }, () => {
  const r = run(['--help']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /--dry-run/);
  assert.match(r.stdout, /--display/);
});

test('dry run writes captions from the timeline, offline, with display forms and no clips', { skip: noPython }, () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'beats.json'), JSON.stringify(beats));
  const r = run(['beats.json', '--dry-run', '--srt', 'captions.srt', '--out', 'vo', '--display', 'one refund=1 refund'], { cwd: dir });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /3 OK, 0 OVER/);
  const cues = parseSrt(fs.readFileSync(path.join(dir, 'captions.srt'), 'utf8'));
  assert.ok(cues.length >= 3);
  cues.forEach((c, i) => {
    assert.equal(c.n, i + 1);
    assert.ok(c.end > c.start, `cue ${c.n} has no duration`);
    if (i) assert.ok(c.start >= cues[i - 1].end - 1e-9, `cue ${c.n} overlaps the one before`);
    assert.ok(c.lines.length >= 1 && c.lines.length <= 2, `cue ${c.n} has ${c.lines.length} lines`);
    for (const line of c.lines) assert.ok(line.length <= 42, `line over 42 characters: ${line}`);
  });
  const all = cues.map((c) => c.lines.join(' ')).join(' ');
  assert.match(all, /98%/);
  assert.match(all, /1 refund/);
  assert.doesNotMatch(all, /ninety-eight percent/i);
  assert.ok(!all.includes(EM), 'an em dash reached the captions');
  assert.doesNotMatch(all, /hold on the zero/, 'a [direction] reached the captions');
  // every cue sits inside its beat: hook 0-9 s, proof 10-22 s, close 23-29 s (plus the short tail)
  for (const c of cues) assert.ok([[0, 9.4], [10, 22.4], [23, 29.4]].some(([a, b]) => c.start >= a && c.end <= b), `cue ${c.n} ${c.start}-${c.end} is outside every window`);
  const timeline = JSON.parse(fs.readFileSync(path.join(dir, 'vo', 'timeline.json'), 'utf8'));
  assert.equal(timeline.dryRun, true);
  assert.deepEqual(timeline.beats.map((b) => [b.id, b.estimated, b.status]), [['hook', true, 'OK'], ['proof', true, 'OK'], ['close', true, 'OK']]);
  assert.deepEqual(fs.readdirSync(path.join(dir, 'vo')), ['timeline.json'], 'a dry run must not write clips');
});

test('reads the beat table and the Say/Show table from a Markdown script', { skip: noPython }, () => {
  const dir = tmp();
  const md = [
    '# Demo script',
    '',
    '| | |',
    '|---|---|',
    '| Cap | 3:00 |',
    '',
    '| # | Time | On screen | Voiceover | Source of every number |',
    '|---|---|---|---|---|',
    `| 1 | 0:00${EN}0:10 | Calm dashboard | "Every team loses a day a week to this. **This is Probe.**" | survey row 3 |`,
    `| 2 | 0:10${EN}0:16 | Title card | (none) | |`,
    `| 3 | 0:16${EN}0:30 | Paste the input | Paste one real log: ninety-eight percent of the noise is gone. | |`,
    `| 4 | 0:30 - 0:36 | Close | Try it at probe dot example dot app. | |`,
    '',
    '| Say (voiceover) | Show (captions) |',
    '|---|---|',
    '| probe dot example dot app | probe.example.app |',
    '| ninety-eight percent | 98% |',
  ].join('\n');
  fs.writeFileSync(path.join(dir, 'demo-script.md'), md);
  const r = run(['demo-script.md', '--dry-run', '--srt', 'c.srt', '--out', 'vo'], { cwd: dir });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const timeline = JSON.parse(fs.readFileSync(path.join(dir, 'vo', 'timeline.json'), 'utf8'));
  assert.deepEqual(timeline.beats.map((b) => [b.id, b.start, b.window]), [['b01', 0, 10], ['b03', 16, 14], ['b04', 30, 6]]);
  assert.equal(timeline.beats[0].text, 'Every team loses a day a week to this. This is Probe.');
  const srt = fs.readFileSync(path.join(dir, 'c.srt'), 'utf8');
  assert.match(srt, /probe\.example\.app/);
  assert.match(srt, /98% of the noise/);
  assert.match(r.stdout, /b03: says a number but its Source cell is empty/);
});

test('the shipped beat-sheet template is recognized, refused while unfilled, and parses once filled', { skip: noPython }, () => {
  const template = path.resolve(here, '..', 'skills', 'demo-video', 'assets', 'VIDEO-SCRIPT.template.md');
  const raw = run([template, '--dry-run', '--out', tmp()]);
  assert.equal(raw.status, 1);
  assert.match(raw.stderr, /table row 1 .*fill the \{\{placeholder\}\} first/);
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'demo-script.md'), fs.readFileSync(template, 'utf8').replace(/\{\{[^}]*\}\}/g, 'Sample words here'));
  const filled = run(['demo-script.md', '--dry-run', '--out', 'vo'], { cwd: dir });
  assert.equal(filled.status, 0, filled.stdout + filled.stderr);
  const timeline = JSON.parse(fs.readFileSync(path.join(dir, 'vo', 'timeline.json'), 'utf8'));
  assert.deepEqual(timeline.beats.map((b) => b.window), [10, 10, 25, 35, 25, 25, 25, 15]);
  assert.equal(timeline.beats.at(-1).start + timeline.beats.at(-1).window, 170, 'the template targets 2:50');
});

test('fails on a banned word, an overrun and an unfilled placeholder', { skip: noPython }, () => {
  const dir = tmp();
  const bad = { beats: [
    { id: 'a', start: 0, window: 8, text: 'We leverage a seamlessly powerful pipeline.' },
    { id: 'b', start: 10, window: 2, text: 'This line has far too many words to fit inside a two second window at any sane speaking rate.' },
  ] };
  fs.writeFileSync(path.join(dir, 'bad.json'), JSON.stringify(bad));
  const r = run(['bad.json', '--dry-run', '--out', 'vo'], { cwd: dir });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /banned word "leverage"/);
  assert.match(r.stdout, /banned word "seamlessly"/);
  assert.match(r.stdout, /banned word "powerful"/);
  assert.match(r.stdout, /EST OVER\s+b /);
  assert.match(r.stdout, /cut about \d+ words/);

  fs.writeFileSync(path.join(dir, 'todo.md'), `| # | Time | Voiceover |\n|---|---|---|\n| 1 | 0:00${EN}0:10 | {{hook line}} |\n`);
  const p = run(['todo.md', '--dry-run'], { cwd: dir });
  assert.equal(p.status, 1);
  assert.match(p.stderr, /placeholder/);
});

test('--cap fails when the last line ends after the cap', { skip: noPython }, () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'beats.json'), JSON.stringify(beats));
  const r = run(['beats.json', '--dry-run', '--out', 'vo', '--cap', '20'], { cwd: dir });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /after the 0:20.0 cap/);
});

test('without edge-tts it prints the install hint instead of a traceback', { skip: noPython }, () => {
  const dir = tmp();
  fs.mkdirSync(path.join(dir, 'fake', 'edge_tts'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'fake', 'edge_tts', '__init__.py'), 'raise ImportError("simulated: edge-tts is not installed")\n');
  fs.writeFileSync(path.join(dir, 'beats.json'), JSON.stringify(beats));
  const r = run(['beats.json', '--out', 'vo'], { cwd: dir, env: { PYTHONPATH: path.join(dir, 'fake') } });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /pip install edge-tts/);
  assert.doesNotMatch(r.stderr, /Traceback/);
});

test('measured mode: clips are timed, reused when unchanged, retaken with --only, and overruns fail', { skip: noPython || (!hasFfmpeg && 'ffmpeg is not on PATH') || (!hasMeasure && 'neither mutagen nor ffprobe is available') }, () => {
  const dir = tmp();
  // Stand-in for edge-tts: a real MP3 tone, 2.5 words a second at +0% (150 words a minute).
  fs.mkdirSync(path.join(dir, 'fake', 'edge_tts'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'fake', 'edge_tts', '__init__.py'), [
    'import re, shutil, subprocess',
    'class Communicate:',
    '    def __init__(self, text, voice, rate="+0%", **kw):',
    '        self.text, self.rate = text, rate',
    '    async def save(self, path):',
    '        pct = int(re.fullmatch(r"([+-]\\d+)%", self.rate).group(1))',
    '        seconds = len(self.text.split()) / 2.5 / (1 + pct / 100)',
    '        subprocess.run([shutil.which("ffmpeg"), "-v", "error", "-y", "-f", "lavfi", "-i", f"sine=frequency=220:duration={seconds:.2f}",',
    '                        "-ac", "1", "-ar", "24000", "-b:a", "48k", "-f", "mp3", str(path)], check=True)',
    '',
  ].join('\n'));
  const env = { PYTHONPATH: path.join(dir, 'fake') };
  fs.writeFileSync(path.join(dir, 'beats.json'), JSON.stringify(beats));

  const first = run(['beats.json', '--out', 'vo', '--srt', 'c.srt'], { cwd: dir, env });
  assert.equal(first.status, 0, first.stdout + first.stderr);
  assert.match(first.stdout, /3 to synthesize, 0 reused/);
  assert.match(first.stdout, /ffmpeg -i video\.mp4 .*adelay=10000:all=1.*amix=inputs=3:normalize=0/);
  const timeline = JSON.parse(fs.readFileSync(path.join(dir, 'vo', 'timeline.json'), 'utf8'));
  for (const b of timeline.beats) {
    assert.equal(b.estimated, false);
    assert.equal(b.status, 'OK');
    assert.ok(Math.abs(b.duration - b.words / 2.5) < 0.6, `${b.id}: measured ${b.duration} s for ${b.words} words`);
  }
  assert.deepEqual(fs.readdirSync(path.join(dir, 'vo')).sort(), ['close.mp3', 'hook.mp3', 'proof.mp3', 'timeline.json']);

  const again = run(['beats.json', '--out', 'vo'], { cwd: dir, env });
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /0 to synthesize, 3 reused/);

  const retake = run(['beats.json', '--out', 'vo', '--only', 'proof'], { cwd: dir, env });
  assert.equal(retake.status, 0, retake.stderr);
  assert.match(retake.stdout, /1 to synthesize, 2 reused/);

  const tight = structuredClone(beats);
  tight.beats[2].window = 2;
  fs.writeFileSync(path.join(dir, 'tight.json'), JSON.stringify(tight));
  const over = run(['tight.json', '--out', 'vo'], { cwd: dir, env });
  assert.equal(over.status, 1);
  assert.match(over.stdout, /\bOVER\s+close/);
});
