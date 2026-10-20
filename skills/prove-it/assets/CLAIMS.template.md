# Claims and how to check them

<!-- Public file. Commit it. Every headline number a judge can read (README, SUBMISSION.md, deck, video, landing page, UI) has a row here. Keep the wording of the "Claim" column identical to the README: claims.json holds the same text and claims-check fails when the two drift apart. -->

Every headline number in {{project}}, the code that measures it, the independent program that recomputes it, and the test that pins it. One command re-checks all of them:

```bash
{{npm run judge}}                   # re-measure every claim, then compare
{{npm run judge}} -- --no-measure   # no keys, no services: compare against the committed facts and verifier output
```

`{{npm run judge}}` runs `scripts/claims-check.mjs claims.json`. For each claim it confirms the exact text is still in every file that carries it, compares the number in that text with `facts.json` and with a fresh measurement, scans the listed documents for stale copies of the same number, prints one line per claim and exits 1 on any `MISMATCH`, `MISSING-TEXT` or `DRIFT`. {{What a judge needs locally, in one sentence: "Node 20 and nothing else" or "a local Postgres 16: docker run -p 5432:5432 postgres:16".}}

{{Scope of the numbers, in one sentence: scenario, units, data version and date. "All rider counts are riders an hour at 8 a.m. on a weekday, from the 2025 origin-destination estimate."}}

| Claim (exactly as the README says it) | Label | Measured by | Recomputed independently by | Pinned by | Value now | Appears in |
|:---|:---|:---|:---|:---|:---|:---|
| **{{231}}** tests | MEASURED | `{{npm test}}` → `facts.json` `tests.count` | not recomputable elsewhere: the count is the suite itself | CI step "Tests ({{231}} passing)" | {{231}} | README, SUBMISSION, demo script |
| **{{88.1%}}** of {{101}} held-out questions ({{95% CI 82.2-94.1%}}) | MEASURED | `{{scripts/eval/run.mjs}}` → `data/results/{{heldout_v3}}.json` → `facts.json` `eval.heldout` | gold answers computed by `{{scripts/eval/gold.py}}`, which shares no code with the system | `{{test_heldout_split_was_committed_before_the_first_run}}` | {{88.1%}} | README, SUBMISSION, deck slide {{7}} |
| p95 under {{200}} ms | MEASURED | `latency-bench.mjs` on {{the CI runner}} → `facts.json` `bench.p95Ms` | not recomputable elsewhere: depends on the machine | CI step "Latency (p95 under {{200}} ms, 0 errors)" | {{118.6}} ms | README |
| {{0}} false alerts on {{32}} quiet-day replays | SIMULATED | `{{scripts/eval/quiet-replays.mjs}}` ({{8 areas x 4 quiet days, seed 42}}) | {{the replay inputs are public rain records: data/raw/README.md}} | `{{test_quiet_day_sends_no_street_alerts}}` | {{0 of 32}} | README, deck, video |
| {{28,000 schools}} could use it | SOURCED | {{source, with link and date, in docs/sources.md}} | n/a | n/a | {{28,000}} | deck slide {{2}} |
| {{3x faster reviews}} at a pilot site | TARGET | declared {{2026-10-18}}; measured live at the pilot | n/a | n/a | not yet measured | deck slide {{9}}, labelled "target" on the chart |

<!--
Labels (say the label where the number is shown, not only here):
  MEASURED      a committed script produced it on real inputs; re-runnable
  SIMULATED     a committed script produced it on generated or replayed inputs; seeds and assumptions stated
  PROJECTED     derived from other numbers; "only holds if ..." written next to it
  TARGET        declared before measuring; shown as a target, never as a result
  SOURCED       someone else measured it; link and date beside it
  ILLUSTRATIVE  UI values, mockups, overlays; labelled on screen
A row without "Measured by" must carry one of the last four labels.
-->

## Beyond the README

Claims the deck, video, proof page or code comments make that the README does not.

| Claim | Where | Checked by |
|:---|:---|:---|
| {{Every external answer is certified or recomputed}} | {{src/lib/flow.ts}} | {{flow.test.ts (300 random networks)}} |

## Not recomputable elsewhere

| Claim | Why no second program can check it | What is re-checked instead |
|:---|:---|:---|
| {{7,195}} reads a second | throughput depends on the machine | `{{npm run judge -- --bench}}` reruns it and requires 0 errors and tenant isolation |

## Tolerances

{{Why two programs may disagree, by how much, and where that is enforced. "The system rounds riders to whole numbers and the verifier keeps floats, so rider counts agree within 1.5. Sets of stations must be identical. Percentages agree within 1 point. Ties between equally fast paths are resolved differently by the two programs; the system's result must lie inside the range the verifier finds over 8 random tie-breaks."}} Documents write numbers at a stated precision; `claims-check` accepts half a unit of the last digit written unless a claim sets its own tolerance.

## Adding or changing a claim

1. Measure it with a committed script that writes `facts.json`. No script, no MEASURED label.
2. Copy the number into the document at its display precision, from `facts.json`, never from memory.
3. Add the row here and the entry in `claims.json` with the exact text, the fact key and the measure command.
4. Write the test that pins it, named as the claim, and check that it fails when the behaviour behind it is removed.
5. Run `{{npm run judge}}` and commit the green run with the number in the commit message.
