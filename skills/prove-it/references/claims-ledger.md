# Claims ledger, facts file and the judge command

How a number travels from the script that measures it to every place a judge reads it, and how one command proves it still holds. Read this for procedure steps 2 to 4.

## The pipeline

```
measuring scripts (tests, evals, bench, data build)
   |  write
   v
facts.json  ------------------------------->  UI, OG card, deck builder (read at build time, never typed)
   |                                           README, SUBMISSION.md, video script (quote it exactly)
   |
claims.json (exact text + fact key + measure command for every headline claim)
   |
   v
claims-check.mjs  ->  is the text still in each file?  does it equal the fact, the fresh measurement
                      and the independent recomputation?  is a stale copy anywhere?  ->  exit 0 or 1
   |
   v
npm run judge (for judges)  ·  CI step "Every README claim re-checked"  ·  README badge "15/15 claims re-measured"
```

Copy `scripts/claims-check.mjs` from this skill into the project's own `scripts/` folder. It has no dependencies, so a judge's clean clone runs `npm run judge` (or `node scripts/claims-check.mjs claims.json`) with nothing else installed.

## facts.json

The single source of every number. Rules:

1. **Scripts write it, people do not.** Each measuring script merges its own section (`tests`, `eval`, `bench`, `data`). A number with no script stays out of facts.json; in CLAIMS.md it carries a label (SOURCED, PROJECTED, TARGET, ILLUSTRATIVE) instead of a "Measured by" command.
2. **One key per number, unit in the key:** `bench.p95Ms`, `eval.heldout.system`, `data.stations`.
3. **Store the unrounded value.** Round only where it is displayed. claims-check compares "88.1%" with 0.8812 at the precision the text writes.
4. **Provenance per section** under `_meta`: script, command, commit, generatedAt, seed, data version, and the machine for anything hardware-dependent (platform and CPU, never the host name or a home-folder path).
5. **Unknown is `null`, never 0.** A run that did not happen is not a zero.
6. **Commit it.** A judge without your keys or your database checks against the committed facts with `--no-measure`.

A merge helper every writer can share:

```js
// scripts/facts/write-facts.mjs
import fs from 'node:fs';
import { execSync } from 'node:child_process';

export function writeFacts(section, values, meta = {}) {
  const file = 'facts.json';
  const facts = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  let commit = null;
  try { commit = execSync('git rev-parse --short HEAD').toString().trim(); } catch {}
  facts[section] = values;
  facts._meta = { ...facts._meta, [section]: { ...meta, commit, generatedAt: new Date().toISOString() } };
  fs.writeFileSync(file, `${JSON.stringify(facts, null, 2)}\n`);
}
```

Test counts come from the runner's own output, never from a README:

| Runner | Command | Read |
|:---|:---|:---|
| node:test | `node --test --test-reporter=tap` | regex `# pass (\d+)` |
| Vitest | `npx vitest run --reporter=json --outputFile=.out/vitest.json` | `numPassedTests`, `numTotalTests` |
| Jest | `npx jest --json --outputFile=.out/jest.json` | `numPassedTests` |
| pytest | `pytest -q` | regex `(\d+) passed` on the last line |

## UI numbers are derived, never typed

Every number the product shows comes from the built data or facts.json at build time. The Detour pattern: `src/lib/facts.ts` reads the verifier's output and the data build, and a story script builds the landing page's narrative from a recorded real run, so no number in the UI was typed by hand.

```ts
// src/lib/facts.ts
import facts from '../../facts.json';

export const FACTS = {
  tests: facts.tests.count,
  heldoutPct: Math.round(facts.eval.heldout.system * 1000) / 10, // 88.1
  p95Ms: Math.round(facts.bench.p95Ms),
} as const;
```

Images carry numbers too (OG card, deck slides, README GIF, video). Render them from facts at build time and re-render after every change; text checks cannot see inside a PNG. To catch a number typed into a component anyway, add the component files to a drift rule (below).

## Docs quote facts exactly

When writing README, form answers, deck copy or a video script: open facts.json, copy each number at its display precision, then add the claim to claims.json with that exact text. Never retype a number from memory or from another document; that is how 58 and 59 end up side by side.

## CLAIMS.md: the human ledger

Start from [CLAIMS.template.md](../assets/CLAIMS.template.md). One row per headline claim:

| Column | What goes in it |
|:---|:---|
| Claim | the exact text as the README shows it, bold markers included |
| Label | MEASURED, SIMULATED, PROJECTED, TARGET, SOURCED or ILLUSTRATIVE ([honesty.md](honesty.md)) |
| Measured by | the command and the file it writes |
| Recomputed independently by | a program that shares no code with the system and derives the semantics from the problem, not from your implementation; or where the independent value comes from (seed data, a public dataset, a committed oracle) |
| Pinned by | the test names; a claim with no test rots silently |
| Value now | from facts.json |
| Appears in | every file that carries it; these become the claim's `files` |

Then three short sections: **Beyond the README** (claims the deck, video, proof page or code comments make), **Not recomputable elsewhere** (with the invariant re-checked instead: "throughput depends on the machine; `--bench` reruns it and requires 0 errors and tenant isolation"), and **Tolerances** (why two programs may disagree, by how much, where it is enforced).

> Field note (Detour · Graph Hacks 2026): CLAIMS.md mapped each README headline number (16 checks in `pnpm judge`) to the FalkorDB tool that measured it, an independent NetworkX program that recomputed it (all but the memory and throughput claims), and the test that pinned it. Its Tolerances paragraph named every allowed gap: riders within 1.5 because one side rounds, identical sets, percentages within 1 point, and tie-breaks between equally fast paths.

## claims.json: the executable ledger

Each ledger row becomes one entry. The schema is in the header of `scripts/claims-check.mjs`; a full example that passes the checker is [claims.example.json](../assets/claims.example.json) with [facts.example.json](../assets/facts.example.json). The fields that matter most:

- `text`: copied from the README, exactly. It must sit on one line of the source file. Bold markers are part of it.
- `fact`: the facts.json key. `scale: 100` turns 0.8812 into the "88.1%" the text writes.
- `value`: set it when the number you mean is not the first one in the text ("95% CI 82.2-94.1%" needs `value: 82.2` for the lower bound and a second claim with `value: 94.1`).
- `op`: bounds. "p95 under 200 ms" is `op: "<="`; the hardware may change, the bound must hold.
- `tolerance`: only when the default (half a unit of the last digit written) is wrong, for example `"2%"` for a hardware-dependent throughput.
- `measure`: a command printing JSON (`json`: dot path) or text (`regex`: first capture group), or a committed `file`, or an array of both: the system and the independent check.
- `drift`: patterns that find every other copy of a number. `(\d+)\**\s+tests` also matches "**231** tests". List every judge-facing file: README, SUBMISSION.md, the demo script, the deck source, the landing page, CLAUDE.md, and the CI workflow (step names carry numbers).

## Wiring a domain-specific re-measure

The checker is generic. The domain lives in one project script that re-measures every headline number with the system's own code and prints a single JSON object. Write it once; claims-check runs it once per check, however many claims read it.

**TypeScript (an agent on a database), modelled on Detour's `pnpm judge`:**

```ts
// scripts/judge/remeasure.ts: run the real tools on the README's scenario in a sandbox, print one object.
import { connect } from '../../src/lib/db';
import { closeLine, affectedRiders, measureCapacity } from '../../src/lib/tools';

const db = await connect();
const sandbox = await db.sandbox('judge-run');          // never the shared demo data
await closeLine(sandbox, { routes: ['L'], from: '120', to: '618' });
const impact = await affectedRiders(sandbox, { depth: 4 });
const cap = await measureCapacity(sandbox);
await sandbox.drop();
console.log(JSON.stringify({
  engine: await db.version(),                           // printed with the result: which engine measured it
  displaced: cap.displacedRiders,
  withinOneStop: impact.byDepth[1].riders,
  absorbed: cap.peak.absorbed,
  required: cap.peak.required,
  certified: cap.peak.check.checked,
}));
await db.close();
```

The independent program (here Python with NetworkX, sharing no code) writes its own file, and each claim reads both:

```json
{
  "id": "displaced",
  "text": "**23,445** riders an hour",
  "fact": "scenario.displaced",
  "measure": [
    { "cmd": "npx tsx scripts/judge/remeasure.ts", "json": "displaced", "label": "system" },
    { "cmd": "uv run --with networkx python scripts/verify/verify.py data out/verify", "file": "out/verify/l.json", "json": "displaced", "label": "independent" }
  ]
}
```

With `--no-measure` the commands are skipped and the committed `out/verify/l.json` is still read: the same switch Detour offered as `--no-python` for judges without uv.

**Python (a retrieval system with an organiser scorer), modelled on BIS Compass:**

```python
# scripts/remeasure.py: score the held-out set through the shipped entry point, print one JSON object.
import json, math, subprocess, sys
from pathlib import Path

out = Path(".out/heldout.json")
out.parent.mkdir(exist_ok=True)
subprocess.run([sys.executable, "inference.py", "--input", "data/heldout.json", "--output", str(out)], check=True)
rows = json.loads(out.read_text(encoding="utf-8"))
norm = lambda s: "".join(s.split()).lower()

def rank(row):
    want = {norm(c) for c in row["expected_standards"]}
    got = [norm(c) for c in row["retrieved_standards"]]
    return next((i + 1 for i, c in enumerate(got) if c in want), None)

ranks = [rank(r) for r in rows]
latencies = sorted(r["latency_seconds"] for r in rows)
print(json.dumps({
    "n": len(rows),
    "hit3": sum(1 for k in ranks if k and k <= 3) / len(rows),
    "mrr5": sum(1 / k for k in ranks if k and k <= 5) / len(rows),
    "p95_s": latencies[max(0, math.ceil(0.95 * len(latencies)) - 1)],  # nearest rank
}))
```

```json
{ "id": "hit3", "text": "Hit@3 **88.9%**", "fact": "eval.heldout.hit3", "scale": 100,
  "measure": { "cmd": "python scripts/remeasure.py", "json": "hit3", "label": "re-scored" } }
```

Then add the command judges run, and say it in the README:

```json
"scripts": { "judge": "node scripts/claims-check.mjs claims.json" }
```

```markdown
Re-measure everything yourself: `npm run judge` re-checks the README's 15 headline claims and fails on any mismatch ([CLAIMS.md](CLAIMS.md)).
```

The badge number ("15/15 claims re-measured") is a claim too: have a facts writer store the count of claims in claims.json, and give the badge text a drift rule.

## Gotchas the projects hit

- **A typed constant inside a "measured" number.** NAADI's README promised real pipeline timings while the trace function hardcoded the milliseconds; FaceAttend's recognition total added a fixed 0.2 ms match time "measured separately". Every component of a measured number is measured in the same run or read from a committed file with provenance.
- **A verifier that copies the system's semantics agrees with the system's bugs.** Rewrite the semantics from the problem statement, in another language or library, ideally by another person or a fresh session. See "Independent semantics" in [honesty.md](honesty.md).
- **Numbers that live only in images** (OG card, deck PNG, GIF) cannot be text-checked. Generate them from facts; re-shoot README media and the OG image in the same change as a redesign or a number change.
- **Hardware-dependent numbers.** Claim a bound (`op: "<="`), record the machine, and re-check the invariants that do not depend on hardware (0 errors, isolation held).
- **Code comments and docstrings make claims.** Include the files whose comments state behaviour ("recorded on every decision row") in the adversarial review, not only the prose.
- **Absolute paths and machine names in committed artifacts** (a results JSON with a local model path, scripts reading a dataset from a Downloads folder): make paths relative to the repo, and keep inputs inside it.
