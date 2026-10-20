Paste into a fresh session with no memory of the build; it will evaluate cold.

# Judge round {{round}} · verify the fixes · {{project}}

<!-- Template for scripts/evidence-pack.mjs (--type verify-fixes). Run it after every major fix pass. The claimed fixes come from the previous round's triage.md "## Fixes" section, each with the one step that shows it. -->

> Self-contained. Internal red-team tool: keep it in the gitignored `judging/` folder. Today: {{date}}. Deadline: {{deadline}}. Runway left: {{runway}}. The goal of this round is different from the last: **verify that the last round of fixes is real (not cosmetic), re-score, find what is new, and name the one thing to build next.**

You are an expert judge for **{{event}}** (the jury is {{jury_persona}}). I am the builder. A previous independent review graded this project **{{prior_score}}/10** (lowest criterion: {{prior_lowest}}) and I spent a session acting on it. I now want a second, independent, ruthless review that does four things: (1) **verify** the fixes are substantive, not window-dressing; (2) **re-score** it; (3) find **new** bugs, issues and loopholes; (4) say what to **build next**. Assume nothing I tell you is true until you have checked it in the code, the tests and the running app. Try to break it.

## The project

{{project_summary}}

Problem statement: {{ps_title}}.

- Repository: {{repo}}
- Live URL: {{live_url}}

Deliverables:

{{artifacts}}

## The official rubric (use these exact weights)

{{rubric_table}}

Calibrate hard: 7 = strong hackathon project, 9+ = would win. Don't inflate; don't deflate.

## How to run it

{{run_commands}}

Demo mode: {{demo_mode}}.

## Part 1 · Verify last round's fixes (confirm, don't trust)

I claim I fixed these. For each, independently confirm it is **substantive**, and flag anything cosmetic, regressed or still overclaiming. Then push harder: did the fix open a new hole of its own? A fix that closes an abstract risk by creating a concrete one is a regression. A headline reworded over an unchanged payload is cosmetic.

{{claimed_fixes}}

**Regression check.** Do these claims still reproduce, unchanged?

{{claims_inventory}}

## Part 2 · Attack it anew (find what the last round missed)

- **Methodology, again.** Is the evaluation genuinely held out, or the same generator with a different seed? Are the negatives discriminating? Is anything tuned to its own test?
- **The new code.** Stress everything the fixes touched: crashes, hangs, races, state that goes stale between screens.
- **Honesty audit across artifacts.** Any number that disagrees between the README, the deck sources, the demo script, the diagrams and the UI; any claim the code does not back.
- **Demo-day failure modes.** What makes it crash or look bad live in front of this jury?
- **Abuse inputs:**

{{abuse_inputs}}

## Limitations it already declares (pressure-test these; do not just "discover" them)

{{declared_limitations}}

## Non-issues from earlier rounds (do not re-flag)

{{prior_non_issues}}

## Part 3 · What I want back (fixed format)

1. **Fix verification**: for each fix in Part 1: *confirmed real* / *partial* / *cosmetic* / *regressed*, with the evidence you gathered (commands, files, outputs).
2. **Re-scored scorecard**: each criterion /10 with one line of justification, then the weighted total /10. **State plainly whether it moved from {{prior_score}} and why.**
3. **New findings**, ranked: severity (high / medium / low), title, where (file:line or endpoint), why it matters, fix. Include anything Part 1 or Part 2 surfaced, and list what you checked that held up.
4. **Improvements**: the 5–8 highest-leverage changes to what exists, ranked by rubric weight × impact per hour; mark the quick wins.
5. **Build next**: if you had to pick ONE thing to build before the deadline, what is it, which criterion does it move, and how long does it take?
6. **Verdict**: one paragraph: where it places with this jury today, the single biggest thing between it and first place, and whether the trajectory from the last round is convincing.
7. **Scorecard JSON** in one fenced block, in this shape. One `criteria` entry per rubric criterion, named exactly as the rubric names it; `fix_verification` status is confirmed, partial, cosmetic or regressed. If you can write files, save it to `{{scorecard_path}}`.

```json
{
  "round": {{round}},
  "type": "verify-fixes",
  "judge": { "persona": "the jury named above", "runner": "fresh session" },
  "prior_score": 7.3,
  "criteria": [
    { "name": "Technical Excellence", "weight": 20, "score": 8, "evidence": "fault-injection probe on the new gate held: alert still fires (tests/test_faults.py::test_single_bad_reading)", "moved": "up from 7.5: the safety fix is real at runtime" }
  ],
  "weighted_total": 7.6,
  "verdict": "One paragraph, including whether the trajectory is convincing.",
  "fix_verification": [
    { "fix": "Response modal now says prepared, not sent", "status": "cosmetic", "evidence": "the header changed but the payload still returns status: sent (api/response.py:77)" }
  ],
  "findings": [
    { "severity": "high", "category": "correctness", "title": "The new gate suppresses a real alert when one sensor reads low", "where": "src/engine/gate.ts:52", "evidence": "injected one low reading at t=8; the alert vanished", "fix": "Treat a lone outlier as a suspect sensor, never as a reason to stand down" }
  ],
  "non_issues": [
    { "checked": "a helper the last judge called unused", "result": "two panels call it (src/panels/Memory.tsx:14)" }
  ],
  "improvements": [
    { "rank": 1, "change": "Make the payload match the new wording", "criterion": "Technical Excellence", "impact": "medium", "effort": "S", "quick_win": true }
  ],
  "build_next": "One replay on public data the team did not author, through the same untuned engine.",
  "biggest_gap": "No outside data.",
  "code_maxed": false,
  "ceiling": ""
}
```

Tell me the uncomfortable things, including if any of my "fixes" are superficial. I would rather hear it from you than from the jury.
