---
name: prove-it
description: Make every claim in a hackathon project true, checkable and impossible to drift. Inventories every number and capability statement in the README, deck, video script, form answers and UI, labels each one, writes facts.json from the scripts that measure, a CLAIMS.md ledger and a one-command check (claims-check) that fails on stale numbers, then adds claim-pinning tests, evals with baselines and intervals, latency benchmarks, zero-secret CI and LIMITS.md. Use it when the user says "prove it", "are our numbers right", "add evals", "benchmark this", "judge script", "claims ledger", "stale numbers", "write limits", or before any README, deck, video or submission pass.
argument-hint: "[inventory | facts | ledger | judge | tests | eval | bench | ci | honesty | sweep]"
license: MIT
metadata:
  author: Saud Satopay
  version: "1.0.0"
  part-of: bullseye
---

# Prove it

Measured, not claimed. Every number, superlative and capability statement a judge reads is either re-measurable by one command or labelled for what it is: simulated, projected, a target, sourced from someone else, or illustrative. This skill builds the machinery that makes that true and keeps it true: a `facts.json` written by the scripts that measure, a public `CLAIMS.md` ledger, `claims-check` (one command that re-measures every claim and fails when a document drifts), tests that pin the claims, evals with honest baselines and intervals, benchmarks that state their scope, CI that runs the claims without a single secret, and a `LIMITS.md` that says where the project loses before a judge finds it. Proof was this builder's strongest edge across 30+ hackathons, and the strongest of those projects published their misses beside their wins.

## Inputs

- The project repository, any stack. Existing tests, eval scripts, benchmark output, the independent verifier if `build-sprint` made one.
- Every judge-facing file: README, SUBMISSION.md or form answers, the deck source, the video script, the landing page and UI copy, the blog draft, and the agent briefs (CLAUDE.md, AGENTS.md), which drift too.
- `BULLSEYE.md` if present: the rubric in `## Contract`, the one-liner in `## Thesis`, the deadline on the status line. Without it, ask for the deadline and the product type, nothing else.
- The product type, which picks the eval protocol: classifier or detector, ranker or retrieval or RAG, agent with tools, forecaster, generator or conversational agent.
- Time left. Under 6 hours: run steps 1 to 4 and 12 only, then label everything you could not measure.

In Claude Code: `/bullseye:prove-it [mode]` as a plugin, `/prove-it [mode]` after `npx skills add SaudSatopay/bullseye`. Elsewhere: read this file and follow it.

| Mode | Runs | Mode | Runs |
|:---|:---|:---|:---|
| none | the full procedure, steps 1 to 13 | `eval` | steps 6 and 7 |
| `inventory` | step 1 | `bench` | step 9 |
| `facts` | step 2 | `ci` | step 10 |
| `ledger` | step 3 | `honesty` | steps 8 and 11 |
| `judge` | step 4 | `sweep` | step 12, before a docs, deck or video pass |
| `tests` | step 5 | | |

Every mode ends with step 13.

## Procedure

### 1. Inventory every claim

Read every judge-facing file line by line and list each number, superlative, comparison and capability statement ("works offline", "never invents a price", "first in India"), including behaviour promised in code comments and docstrings. Two searches catch most of them:

```bash
rg -n "[0-9]" README.md SUBMISSION.md docs deck            # every line with a number
rg -n -i "first|only|fastest|best|zero|never|always|guarantee|real-time|validated|proven|production|accurate" README.md SUBMISSION.md docs deck
```

Give each claim a label, the one it can honestly carry today ([honesty.md](references/honesty.md) has the full taxonomy):

| Label | Use when |
|:---|:---|
| MEASURED | a committed script produced it on real inputs |
| SIMULATED | a committed script produced it on generated or replayed inputs |
| PROJECTED | it is derived from other numbers; it carries "only holds if ..." |
| TARGET | it was declared before measuring |
| SOURCED | someone else measured it; link and date beside it |
| ILLUSTRATIVE | UI values, mockups, example amounts |

Capability statements carry IMPLEMENTED (pinned by a test), PROTOTYPED, SIMULATED or FUTURE. Superlatives need a sourced comparison or a stated n, or they go.

**Gate:** every claim has a label and a planned source. A claim that can be neither measured nor sourced is rewritten or cut.

### 2. One source for every number: facts.json

1. Each measuring script merges its own section into `facts.json`: test counts from the runner's output, eval results, benchmark results, dataset sizes. Store unrounded values, units in the key names (`bench.p95Ms`), provenance under `_meta` (script, command, commit, time, seed, machine), and `null` for unknown, never 0. Example: [facts.example.json](assets/facts.example.json).
2. UI numbers are derived from facts or the built data at build time, never typed (Detour's `facts.ts` and its story builder). Images that show numbers (OG card, deck slides, GIF) are rendered from facts.
3. Documents copy each number from facts.json at its display precision.

The merge helper, the test-count recipes and the derived-UI pattern are in [claims-ledger.md](references/claims-ledger.md).

**Gate:** re-running the writers reproduces facts.json (timestamps aside), and no headline number is typed into a component.

> Field note (kasauti · SerpApi India Hackathon 2026): the test count read 51 in the submission copy, the architecture doc and the video script, 65 on the landing page and 68 in the README. The form copy would have shipped stale.

### 3. The CLAIMS.md ledger

Copy [CLAIMS.template.md](assets/CLAIMS.template.md) to the project root. One row per headline claim: the claim exactly as the README writes it, its label, measured by (command and file), recomputed independently by (a program that shares no code and derives the semantics from the problem), pinned by (test names), current value, and where it appears. Add the Tolerances paragraph (why two programs may disagree and by how much), the "Not recomputable elsewhere" rows with the invariant re-checked instead ("throughput depends on the machine; 0 errors and isolation are re-checked"), and "Beyond the README" for claims only the deck, video or code comments make. CLAIMS.md is public, whatever the process-file policy.

**Gate:** every MEASURED and SIMULATED row has "Measured by" and "Pinned by"; every other row's label is shown where the number appears.

### 4. The judge command

1. Copy the checker into the project so a judge's clean clone can run it with nothing installed: `mkdir -p scripts && cp "${CLAUDE_SKILL_DIR}/scripts/claims-check.mjs" scripts/`.
2. Write `claims.json`, one entry per ledger row: the exact text, the files it appears in, the facts key, and a measure command or a committed oracle file. Start from [claims.example.json](assets/claims.example.json); the schema is in the script's header.
3. Wire the domain re-measure: one project script that runs the system's own code on the README's scenario and prints a JSON object, plus the independent verifier's output as a second measure ([claims-ledger.md](references/claims-ledger.md) has worked TypeScript and Python versions).
4. Add drift rules for every number that is repeated: test counts, set sizes, the badge count, CI step names.
5. Add the command judges run (`"judge": "node scripts/claims-check.mjs claims.json"`) and say it in the README: "Re-measure everything yourself: `npm run judge`".

```bash
node "${CLAUDE_SKILL_DIR}/scripts/claims-check.mjs" claims.json                # re-measure and compare
node "${CLAUDE_SKILL_DIR}/scripts/claims-check.mjs" claims.json --no-measure   # committed facts and oracle files only
node "${CLAUDE_SKILL_DIR}/scripts/claims-check.mjs" claims.json --json         # for CI artifacts
```

Other agents: run the same script from this skill's folder.

An excerpt of a real run on the example pair, with one stale fact and one stale deck count planted:

```
claims-check  claims.json  (facts: facts.json, 15 claims, 4 drift rules, --no-measure)

  ok        tests                231                     fact 231          README.md, SUBMISSION.md, docs/demo-script.md; measured: not run (--no-measure)
  MISMATCH  heldout-system       88.1%                   fact 86.11        fact 86.11 is not 88.1 (off by 1.99; the text allows 0.05); re-scored: not run (--no-measure)
  ok        p95                  <= 200                  fact 118.6        README.md; measured: not run (--no-measure)
  ok        busiest-link         "Harbor Rd"             fact "Harbor Rd"  README.md
  DRIFT     drift:tests          "58 tests"              fact 231          deck/deck.html:2
  ok        drift:heldout-n      /(\d+) held-out quest~  fact 101          3 found in README.md, SUBMISSION.md

14/15 claims ok, 1 stale number found. FAIL
```

**Gate:** it exits 0. Then change one README number on purpose, see it exit 1 with `MISMATCH` or `DRIFT`, and revert. A judge command that cannot fail is decoration.

> Field note (Detour · Graph Hacks 2026): `pnpm judge` re-measured 16 README claims on FalkorDB and an independent NetworkX program and exited 1 on any mismatch, behind a README badge. It still missed a counting error, because the verifier had copied the same counting; a human reviewer found it after the deadline. Independent checks need independent semantics.

### 5. Tests that pin the claims

Every MEASURED claim and every capability claim gets a test whose name reads as the claim (`test_sea_tap_is_honestly_out_of_coverage`). Use the techniques in [claims-as-tests.md](references/claims-as-tests.md):

- assert against the real system when the claim is about it: "The test suite that would pass against a mock is the test suite that lets the double-refund through";
- non-vacuity: prove the stress happened (conflicts occurred, the primary failed, the duplicate arrived);
- assert the plan, the trace or the budget when results cannot reveal the failure;
- canary tests that pin a known limit, investigated rather than silenced when they flip;
- drift tests between duplicated facts (config and SQL, browser and scorer, UI and CLI);
- tri-state results: unknown is `None`, never a green `False`;
- write the test with the input the previous test avoided, and bury the target under noise;
- footguns fail fast with an explanation, pinned by a test;
- live failures become named regression tests;
- every new test must fail if its fix is removed: break the behaviour, watch it fail, restore.

**Gate:** every ledger row names a test, and each new test was seen failing with its behaviour removed.

> Field note (engram · CockroachDB × AWS Build with Agentic Memory): the race test asserted exactly one refund across 8 and 16 racing agents and also at least one serialization conflict: "zero 40001s -- the agents never actually raced, so this run is not evidence".

### 6. Evals

Pick the protocol for the product type from the table in [evals.md](references/evals.md), then write `EVAL-PROTOCOL.md` from [EVAL-PROTOCOL.template.md](assets/EVAL-PROTOCOL.template.md) and commit it before the first held-out run: metric and anti-gaming rule, harm metric beside it, targets declared now, sets, split, gold, arms, grading. Then:

1. **Sets from different authors:** organiser public; LLM-synthesised and stratified, with a leak filter; an independent agent's private set; an adversarial "weird" set; judge-random picks; a frozen blind battery. Synthetic sets are proxies, never tuning targets.
2. **Split dev and held-out before any run**, by group, with a seed, committed. Gold computed outside the system. Negative categories (not in the data, unknown entity) scored as declines.
3. **Arms:** the system, the same model with no tools, a rules-only floor, a placebo when testing memory, and the incumbent baseline through the same pipeline. Report where the system loses.
4. **Intervals on every headline number**, cluster bootstrap when items share a group:

   ```bash
   python "${CLAUDE_SKILL_DIR}/scripts/bootstrap-ci.py" data/results/heldout_v3.jsonl --col correct --cluster group --by category
   ```

   It prints the line to paste ("88.1% (95% CI 82.2-94.1%, n=101 in 40 clusters, 2000 cluster bootstrap resamples)") and `--json` for facts.json. Use `python3` on macOS and Linux.
5. **Version every run** as `data/results/<set>_<version>.json` with commit, seed, model and raw counts. Keep an ablation registry (losers stay as opt-in flags, null results labelled), a per-miss failure analysis with score components, and calibration buckets with the score distribution.
6. **Frozen blind battery:** cases written by a session that cannot read the repo, labels frozen, grading pre-declared, run once, published raw with misses before any tuning, then reclassified as regression data.
7. **Agents that persuade or sell:** A/B against the same model as a plain baseline with simulated personas, a completed action as the metric (never stated intent), a harm metric beside it, a tiny eval on day 1, a paid key for the final run, and a results page that shows the methodology until results exist.
8. **Rare events:** never raw accuracy. Recall at top-k, lift, PR-AUC against the base rate, out-of-fold predictions, a leakage audit told as trap, audit, truth.
9. **Measure your own checks:** feed a grounding check or validator random input and publish how much noise it passes.

**Gate:** the protocol commit predates every results file; every headline eval number has n, an interval and at least one baseline beside it; misses are published.

> Field note (SunPath · FlowZint AI Hackathon 2026): the first metric, stated willingness, saturated: the FAQ baseline beat the agent by 8 points while the agent's false-push rate was 33%. The redesigned eval then stalled on free-tier quota, so the results page shipped as methodology only. Define the metric and its harm twin before building, and run a tiny eval on day 1.

### 7. The negative case as proof

Find the case where the right output is silence, a decline or "not covered", and make it a demo beat: replay it across a matrix, pin it with a test, show it in the README with its numbers. Run a control group (the same scenario with the guard removed) beside the real run, and write "What this demo does not prove" next to both. FLOODLIGHT's quiet-day replay alerted no healthy street in any of its 8 areas, while the blocked drain was caught in all 32 area-by-storm replays; engram's `--unsafe` run refunded eight times where the guarded run refunded once.

**Gate:** a test pins the silence, and the README shows it with numbers and its narrower honest claim.

### 8. External validity

A bigger simulator you build yourself adds production value and zero credibility, because you authored both the data and the detector. Climb the ladder in [honesty.md](references/honesty.md) instead: hard negatives and held-out seeds; real incidents reconstructed from public inquiries with an honest-mapping note; public datasets replayed through the same untuned engine with provenance headers and a sensitivity sweep; a recognised third-party model generating the inputs; a labelled public proxy for a roadmap capability; one practitioner quote, verbatim, as problem validation and never as an endorsement, with no invented name or title. When a sponsor's algorithm returns something cheap to check, certify every answer and fall back to your own computation (Detour's max-flow certificate and Dinic solver), and credit the team that found the bug. Verifiers derive their semantics from the problem, not from your code.

**Gate:** every external exhibit states what is real and what is overlaid; no threshold was tuned to an exhibit. A measurement that needs a human step (a desktop tool, real data) stays marked pending until it happens; never fill the slot with plausible numbers.

### 9. Benchmarks

Measure the latency the sentence means. In-process for model latency (warm-up, one core, median and p99 over thousands of calls, batch throughput apart); over HTTP for the product:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/latency-bench.mjs" --url http://127.0.0.1:3000/api/check --method POST \
  --body-file bench/check.json --warmup 20 --n 500 --concurrency 4 --max-p95 200 --json > data/proof/latency.json
```

It reports count, errors by kind, p50/p95/p99/max/mean and throughput, records the machine without the host name, never records query strings or header values, prints a scope line (override with `--scope "model latency only"`), and exits 1 on errors or a missed budget. Commit concurrency benchmarks to `data/proof/bench.json` with invariants (0 errors, isolation held) as the claim. Keep a cross-hardware matrix with measured and projected rows labelled apart. Write each report from [benchmark-report.template.md](assets/benchmark-report.template.md). Details: [benchmarks-and-ci.md](references/benchmarks-and-ci.md).

**Gate:** every speed claim points at a committed JSON file with machine, warm-up, n and scope; hardware-dependent claims are bounds (`op: "<="` in claims.json).

### 10. CI that runs the claims, with zero secrets

1. Day 1: `gh auth status` must list the `workflow` scope (`gh auth refresh -s workflow`).
2. Copy [ci-claims.workflow.yml](assets/ci-claims.workflow.yml) to `.github/workflows/claims.yml`. No secrets anywhere; step names carry the claims ("Tests (231 passing, offline: no API keys, no credits spent)") and each such step exits non-zero when its claim fails; `shell: bash` for pipefail; service containers pinned to the measured engine version; proof uploaded as an artifact.
3. Offline-first harness: an autouse fixture that forces offline mode, deletes every key and runs in a temp folder (vitest: stub env and make `fetch` throw). Expensive model tests opt-in by environment variable.
4. Every output carries `offline`, `llm_used`, `provider` and `mode`, and tests assert them, so a silent fallback cannot pass.
5. Before submitting: one live smoke run with real keys on the deployed build, PASS or FAIL per step, logged in BULLSEYE.md. Fixtures miss upstream shape changes and silent fallbacks.

**Gate:** a green run on the remote (open the Actions tab), the workflow file in a drift rule, and the live smoke run logged.

> Field note (Detour · Graph Hacks 2026): the CI workflow never ran because the push token lacked the workflow scope, so the proof page's "Run on every change" line was not true. Check the scope on day 1 and confirm a run on the remote.

### 11. Honesty docs

1. `LIMITS.md` from [LIMITS.template.md](assets/LIMITS.template.md): §0 "What this document got wrong about itself", known limits with a status each, the hostile-reader bug list with file and line, what the demo does not prove, and "Things we did not build", so a reader can tell a decision from an oversight. Public.
2. A README "Where we lose" section, linked from the top, with measured losses as specific as the wins.
3. Wording: prepared is not executed, reconstructed is not validated, "no known risk" is not "safe", targets say "target" inside the chart, simulated numbers say "in simulation", mockups say "illustrative" on screen.

**Gate:** LIMITS.md exists with §0; "Where we lose" has at least one measured loss; the wording search in step 1 comes back clean.

### 12. Drift sweep, before every docs, deck or video pass

1. Re-run every facts writer, then `claims-check` (with measurement).
2. Search for the counts that drift in nearly every project: tests, eval set sizes, scenario counts, languages, tools, routes. `rg -n "[0-9]+ (tests|questions|queries|scenarios|cases|languages|tools|routes)" .` and compare each hit with facts.json.
3. Adversarial review by a reader with no stake, including code comments and docstrings. In Claude Code: the `bullseye:claims-auditor` subagent. Elsewhere: a fresh session with the auditor prompt in [honesty.md](references/honesty.md). Fact-check each finding, fix every substantiated one including the small ones, record the rest as "checked, holds".
4. Re-run `claims-check` and the tests.

**Gate:** `claims-check` passes, the count search matches facts.json everywhere, and every auditor finding is fixed or recorded.

> Field note (BIS Compass · Sigma Squad × BIS Hackathon 2026): the agent brief said 30 pytest cases while the suite had 37, and the demo script promised "60-plus stratified queries" for an 18-query set. Both would have reached judges without a sweep.

### 13. Update BULLSEYE.md

Under `## Claims`, headline numbers only, in the template's columns; CLAIMS.md holds the rest:

```markdown
| Claim as written | Value | Label | Measured by | Pinned by |
|---|---|---|---|---|
| "**88.1%** of 101 held-out questions" | 0.8812 (95% CI 0.822-0.941) | MEASURED | `npm run eval` → data/results/heldout_v3.json | `test_heldout_split_predates_every_run` |
```

Then a `## Log` block, and one `## Decisions` line per call made (dropped a claim, changed a metric, reclassified a set):

```markdown
### ▶ STATUS · prove-it: claims ledger · 2026-10-18 14:30 IST
- Changed: facts.json writers for tests, eval, bench; CLAIMS.md (15 rows); claims.json; LIMITS.md §0 to §4
- Verified: claims-check 15/15 PASS; deliberate README edit caught as MISMATCH; 10/10 claim tests fail when their fix is removed
- Numbers: 231 tests · 88.1% held-out (95% CI 82.2-94.1%, n=101) · p95 118.6 ms on the CI runner
- Next: blind battery v1 authored by a repo-blind session; live smoke run with real keys
```

## Outputs

In the user's project:
- `facts.json` (written by scripts), `claims.json`, `CLAIMS.md`, `LIMITS.md`, `EVAL-PROTOCOL.md`: public.
- `scripts/claims-check.mjs`, and when used `scripts/latency-bench.mjs` and `scripts/bootstrap-ci.py`, copied from this skill; the project's own re-measure script; a `judge` command in the package scripts.
- `data/results/<set>_<version>.json`, `docs/ablation.md`, `docs/failure_analysis.md`, `docs/benchmarks/*.json` with their report pages, `data/proof/bench.json`.
- Tests named as claims; `.github/workflows/claims.yml`; a README "Where we lose" section, the "re-measure it yourself" line and the claims badge.
- `BULLSEYE.md`: `## Claims` (this skill owns it), `## Log`, and lines under `## Decisions` and `## Risks`.

## Rules

- No number without a script or a label. A measured number is never typed by hand into a README, deck, video script, form or component; re-run the measurement instead.
- Never tune a threshold, a prompt or a filter on the held-out or blind set. Report the number at the threshold fixed before the run, and a missed target as missed.
- Unknown is not zero, and not measured is not ok: `null` in facts, SKIP in claims-check, `None` in tri-state results.
- A check that cannot fail proves nothing: the judge command, every claim test, every CI step named after a claim and every validator you cite must be seen failing once.
- Keep each eval's three kinds of evidence apart: development results, regression results, held-out or blind results. Only the last measures generalization.
- Never fabricate a measurement, a tool output, a quote, a name or a title. A slot waiting on a human step stays pending.
- Paths in committed artifacts are relative; no host names, user names, keys, query strings or header values.
- Tag the submitted commit. After the deadline, corrections say what the submitted version still gets wrong.
- Sibling skills: `build-sprint` builds the independent verifier and the provenance fields this skill relies on; `judge-panel` hands CLAIMS.md to its judges as the claims inventory to reproduce; `submission-pack` runs claims-check in its final sweep; `pitch-deck` and `demo-video` read numbers from facts.json. Install the full set with `npx skills add SaudSatopay/bullseye` if any is missing.

## Reference map

| File | Use it for |
|:---|:---|
| [references/claims-ledger.md](references/claims-ledger.md) | facts.json rules and writers, derived UI numbers, the CLAIMS.md columns, claims.json, worked TypeScript and Python re-measure scripts wired into claims-check (steps 2 to 4) |
| [references/evals.md](references/evals.md) | protocols by product type, sets from different authors, split-before-run code, arms, intervals, versioned runs, ablation, failure analysis, calibration, blind batteries, A/B with personas, rare events, check strictness (step 6) |
| [references/claims-as-tests.md](references/claims-as-tests.md) | fourteen claim-pinning techniques with pytest and vitest examples (step 5) |
| [references/honesty.md](references/honesty.md) | the label taxonomy, wording rules, LIMITS.md, Where we lose, control groups, the external-validity ladder, practitioner quotes, certificates, the claims auditor prompt (steps 1, 7, 8, 11, 12) |
| [references/benchmarks-and-ci.md](references/benchmarks-and-ci.md) | latency harnesses, concurrency benches, cross-hardware matrices, offline-first harnesses, zero-secret CI, the live smoke run (steps 9 and 10) |
| [scripts/claims-check.mjs](scripts/claims-check.mjs) | the judge command: text, value and drift checks with an aligned table, `--json`, `--no-measure`; schema in its header |
| [scripts/bootstrap-ci.py](scripts/bootstrap-ci.py) | per-item results to a statistic with a seeded percentile or cluster bootstrap interval, per group, JSON for facts.json |
| [scripts/latency-bench.mjs](scripts/latency-bench.mjs) | HTTP latency and throughput with warm-up, percentiles, error kinds, budgets and a scope line |
| [assets/CLAIMS.template.md](assets/CLAIMS.template.md) · [assets/claims.example.json](assets/claims.example.json) · [assets/facts.example.json](assets/facts.example.json) | the ledger and a passing example pair |
| [assets/LIMITS.template.md](assets/LIMITS.template.md) | the honesty document |
| [assets/EVAL-PROTOCOL.template.md](assets/EVAL-PROTOCOL.template.md) | the frozen protocol: claim, sets, split, arms, grading, run-and-publish rules, report |
| [assets/benchmark-report.template.md](assets/benchmark-report.template.md) | System · Protocol · Results · Interpretation (honest) · Scope · Reproduce |
| [assets/ci-claims.workflow.yml](assets/ci-claims.workflow.yml) | the GitHub Actions template with claims in the step names |
