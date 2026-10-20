---
name: judge-panel
description: Simulate the jury before the jury sees it. Runs AI judge rounds with no memory of the build (adversarial, verify-fixes, newest-surface, blind) that score contest fit against the event's exact rubric weights, reproduce claims, try abuse inputs and audit honesty, then fact-checks every finding against the code before anything is fixed. Also drills hostile Q&A by jury persona. Use it when the user says "judge this", "score it like the jury", "mock judge", "red-team the submission", "would this win", "blind review", "rehearse Q&A" or "grill me", after the first end-to-end build and before submitting.
argument-hint: "[adversarial | verify-fixes | newest-surface | blind | process <n> | compare <a> <b> | qa | audit]"
license: MIT
allowed-tools: Bash(node "${CLAUDE_SKILL_DIR}/scripts/evidence-pack.mjs" *), Bash(node "${CLAUDE_SKILL_DIR}/scripts/judge-round.mjs" *)
metadata:
  author: Saud Satopay
  version: "1.0.0"
  part-of: bullseye
---

# Judge panel

Put the submission in front of a jury before the jury sees it. Each round hands a judge with no memory of the build an evidence pack (the problem statement verbatim, this event's rubric with exact weights, how to run it and, in informed rounds, the claims to reproduce) and gets back a calibrated, weighted scorecard whose findings each name a file and a fix. The builder fact-checks every finding against the code, fixes what is real, logs what is not, and aims the next round at the newest surface. A blind final scores the submission exactly as a first-time jury would, and a mock Q&A drills the team until the answers are boring.

This is not the missile's critic. The [missile](../missile/SKILL.md) critic scores product craft on ten fixed dimensions. The judge panel scores contest fit against this event's rubric and attacks claims the way a jury does: a polished product that ignores a 25% Business criterion still loses here.

> Field note (Trinetra · ET AI Hackathon 2.0): Six judge rounds, each run in a fresh session with no memory of the build, moved the weighted score 7.3 → 7.6 → 7.7 → 7.9 → 8.0, and the final blind run, given the problem statement, the rubric and the repository but no hints, scored 8.5: the highest of any round.

## Inputs

- **BULLSEYE.md with `## Contract` filled**: the rubric table (criterion and exact weight), the judges line and the deadline, written by sibling skill [brief-decoder](../brief-decoder/SKILL.md). A judge without exact weights cannot calibrate.
- **A build that runs end to end** on its golden path, with a demo mode that needs no network or paid key ([build-sprint](../build-sprint/SKILL.md)). A round spent on a build that does not run is a round spent on the obvious.
- **The official problem statement, verbatim**, saved once to `judging/PS.md`.
- **For informed rounds:** `CLAIMS.md` and `LIMITS.md` from [prove-it](../prove-it/SKILL.md). Without them the judge inventories the README itself, which is slower and noisier.
- **For the Q&A drill:** `QA-BANK.md` from [finale-pitch](../finale-pitch/SKILL.md), plus `facts.json` or `CLAIMS.md`.

Each sibling is optional: install the full set with `npx skills add SaudSatopay/bullseye` if one is missing. This skill states the essential rule inline either way.

## Arguments

In Claude Code the skill runs as `/bullseye:judge-panel <argument>`, or `/judge-panel` when installed with `npx skills add`.

| Argument | Does |
|---|---|
| none | Read `## Judge rounds`, pick the next round type from step 1, build its pack and run it. |
| `adversarial`, `verify-fixes`, `newest-surface`, `blind` | Build that round's pack (step 2) and run the judge (step 3). |
| `process <n>` | Record and process round n (steps 4 and 5). |
| `compare <a.json> <b.json>` | Compare two scorecards from the same round (step 3). |
| `qa` | Build and run the mock Q&A rehearsal (step 7). |
| `audit` | Run the claims audit before a blind round or a submission (step 1). |

## Procedure

### 1. Schedule the rounds

| Round | Run it | Template |
|---|---|---|
| **Adversarial** | after the first end-to-end working build, once the claims exist | [assets/judge-adversarial.md](assets/judge-adversarial.md) |
| **Verify-fixes** | after every major fix pass | [assets/judge-verify-fixes.md](assets/judge-verify-fixes.md) |
| **Newest-surface** | once the core is frozen, after each new exhibit, screen or claim | [assets/judge-newest-surface.md](assets/judge-newest-surface.md) |
| **Blind** | once, near the end, with the submission complete and time left to act on it | [assets/judge-blind.md](assets/judge-blind.md) |

- Budget 3–8 rounds over a multi-day event and 1–2 in a 24 h event (one adversarial at the feature freeze, one blind before the final push). A round costs 30–60 minutes of judge time plus the fixing.
- Follow every fix pass with a verify-fixes round before judging anything new: fixes regress.
- Before the blind round, run the claims audit. In Claude Code: the `bullseye:claims-auditor` subagent, given the project root and the report path `judging/audit-<n>/AUDIT.md`. Elsewhere: build `judging/audit-<n>/PROMPT.md` with `--type claims-audit` (step 2) and paste it into a fresh session. Fix its high rows first; an audit is cheaper than a judge round spent on stale numbers.
- Leave time after the blind round: at least a day in a multi-day event, three hours in a 24 h one.

**Gate to leave this skill:** no open substantiated finding, and the blind round recorded under `## Judge rounds`.

> Field note (Trinetra · ET AI Hackathon 2.0): Both round-2 judges found that a round-1 fix "introduced a worse safety bug than the abstract one it closed": treating an oxygen-starved zone as safe had made it call a vessel with people inside safe, and recommend ventilating it. A verify-fixes round is where that surfaces.

### 2. Build the evidence pack

Once per project:

```
node "${CLAUDE_SKILL_DIR}/scripts/evidence-pack.mjs" . --init
```

It creates `judging/` with `pack.json` (stable facts: persona, run commands with demo mode first, repository and live URL, deliverables, coverage items, project-specific abuse inputs) and a `PS.md` stub, and adds `judging/` to `.gitignore`. Paste the problem statement into `PS.md` verbatim and review `pack.json`. Pick the persona from [references/personas.md](references/personas.md).

Every round:

```
node "${CLAUDE_SKILL_DIR}/scripts/evidence-pack.mjs" . --type adversarial
```

Other agents: run the same script from this skill's folder. It writes `judging/round-<n>/PROMPT-<type>.md` (self-contained and paste-ready), `PACK-<type>.md` (a record of exactly what the judge was given) and `judge-scorecard.schema.json`. The round number is the next one, or the latest round that has no scorecard yet.

| In the pack | Source | Blind round |
|---|---|---|
| Problem statement, verbatim | `judging/PS.md` | yes |
| Rubric with exact weights | BULLSEYE.md `## Contract` (criterion and weight only) | yes |
| Jury persona | `pack.json` `persona`, else the Contract's judges line, else the Thesis jury line | yes |
| Repository, live URL, deliverables | `pack.json`, else the git remote and the tracked README, docs and deck files | yes |
| Run commands and demo mode | `pack.json`, else `package.json` and `.env.example` | yes |
| Coverage items (illustrative builds, evaluation focus) | `pack.json` `coverage`, else "every item the problem statement names" | yes |
| Claims inventory to reproduce | `CLAIMS.md` | no |
| Declared limitations: pressure-test these, do not rediscover them | `LIMITS.md`, else the README's caveats section | no |
| Prior non-issues: do not re-flag | `## Non-issues` of every earlier `triage.md` | no |
| Abuse inputs | `pack.json` `abuse_inputs` plus a default set | no |
| Claimed fixes, each with how to check it | the previous round's `triage.md` `## Fixes` | verify-fixes only |
| Newest surfaces with fair questions to press | the previous round's `triage.md` `## Next round` | newest-surface only |

The pack never contains BULLSEYE.md's thesis, plan, decisions or handoff, MISSILE.md, PRODUCT.md, DESIGN.md, handoff notes or this conversation. Limitations come from the project's public words (LIMITS.md), so the judge tests what the jury will read. The script exits 1 when a required input is missing (a blind round without the problem statement, a verify-fixes round without fixes); fix the input instead of passing `--allow-missing`, which a blind round refuses anyway.

### 3. Run the judge in a fresh context

The judge must have no memory of the build. It sees the prompt and the repository, never the builder's narrative.

- **In Claude Code:** delegate to the `bullseye:hackathon-judge` subagent (`hackathon-judge` when the agents sit in `.claude/agents/`). The delegation message is these three lines and nothing else: no summary, no hints, no "focus on".
  ```
  Read <abs path>/judging/round-<n>/PROMPT-<type>.md and follow it exactly.
  Save the scorecard JSON to <abs path>/judging/round-<n>/scorecard-<type>.json.
  The schema is <abs path>/judging/round-<n>/judge-scorecard.schema.json.
  ```
  Save its reply as `judging/round-<n>/verdict-<type>.md`. The script prints the exact message with the paths filled in.
- **Elsewhere** (Codex, Cursor, Gemini CLI, Copilot, a chat app): open a new session at the repository root, paste `PROMPT-<type>.md` whole, and save the reply as `verdict-<type>.md` and its JSON block as `scorecard-<type>.json`. A different model family catches different things.
- **Two judges in parallel**, recommended for one newest-surface round and for the final: one blind and one informed in the same round, or the same prompt in two fresh sessions (give each its own scorecard path, such as `scorecard-<type>-2.json`). In Claude Code, two subagent calls in one message. Then compare them: `node "${CLAUDE_SKILL_DIR}/scripts/judge-round.mjs" --compare <a.json> <b.json> --project .`, and read the gap with [references/calibration.md](references/calibration.md).
- **The blind final from a clean clone** (`git clone <public url> judge-clone`): the judge meets the cold start a jury meets and cannot see gitignored notes.

> Field note (Trinetra · ET AI Hackathon 2.0): Two parallel runs of the same round converged on the newest surface, 7.7 from a fresh session and 7.9 from one with prior knowledge. The final blind judge gave Business 8.5 where informed reviewers had held it at 7: compare blind and informed before trusting either.

### 4. Read and record the scorecard

A scorecard ([assets/judge-scorecard.schema.json](assets/judge-scorecard.schema.json)) carries:
- each criterion /10 with the evidence that sets it (a command, a file:line, a number), against the bands 9–10 exceptional, would win · 7–8 strong · 5–6 solid but capped · below 5 significant gaps. "7 = strong hackathon project, 9+ = would win. Don't inflate.";
- the weighted total with the exact weights;
- findings ranked by severity (high, medium, low), each with where (file:line or endpoint), the evidence and the fix;
- non-issues: what the judge checked that held up;
- improvements ranked by rubric weight × impact per hour, each with its effort;
- WOW ideas, each marked realistic or aspirational;
- the single biggest thing standing between it and first place, and whether the code is maxed;
- blind rounds: a coverage table of every illustrative build and evaluation-focus item (covered, partial, missing);
- verify-fixes rounds: a verdict per fix (confirmed real, partial, cosmetic, regressed) and the one thing to build next;
- newest-surface rounds: a verdict per surface (honest, mixed, sleight of hand).

Record it, never by hand:

```
node "${CLAUDE_SKILL_DIR}/scripts/judge-round.mjs" . judging/round-<n>/scorecard-<type>.json
```

It validates the scorecard against the schema, recomputes the weighted total with the Contract's weights (never trust a judge's arithmetic), writes the round's row in BULLSEYE.md `## Judge rounds` and a block at the top of `## Log`, prints the delta against the last round and the stop-rule verdict, and creates `judging/round-<n>/triage.md` with one row per finding. A pasted reply that contains one JSON code block works in place of the JSON file. A scorecard rejected for missing evidence is not a score: rerun the round. Read [references/calibration.md](references/calibration.md) before acting on any number.

### 5. Process the verdict

Work through `judging/round-<n>/triage.md` in this order:

1. **Fact-check every finding against the code before fixing anything.** Open the file:line, rerun the probe, read the test, and write the verdict: substantiated, partial, non-issue, declared (already in LIMITS.md) or duplicate. Judges are wrong at times.
2. **Fix every substantiated item, lows included.** Lows are cheap, and a jury that finds one stale number starts checking all of them. Fix the cause and every place it shows: a headline reworded over an unchanged payload is a cosmetic fix, and the next judge will say so.
3. **Record non-issues explicitly** under `## Non-issues`, each with its proof. The next pack hands them to the judge as "do not re-flag".
4. **Re-run every gate**: the tests, the claims check, the golden path, the production build. Confirm the headline numbers are unchanged, or changed for a reason you state. Fill `## Gates`.
5. **Log the round**: set the `Fixed?` cell of the round's row in `## Judge rounds` (for example "7 of 7 substantiated fixed, 2 non-issues"), add a dated `## Decisions` line for anything deliberately not fixed, and set the status line to `phase=judge` with the next action.
6. **Write the next round**: `## Fixes`, each fix with the one step that shows it (the verify-fixes prompt quotes this), and `## Next round`, the type and then the newest surfaces with two to four fair questions each (the newest-surface prompt quotes this).

When a judge catches your own overclaim, fix it in the open: correct every artifact, say what was wrong, and publish the evidence that replaced it.

> Field note (Trinetra · ET AI Hackathon 2.0): Judges were wrong at times: one called the permit id PTW-7741 "invented" (it was the real id in the scenario data) and another said `retryFetch` was unused (two panels call it); both went under non-issues. A later judge was right where the builder was wrong: a "scale-invariant lead" claim was false. The correction shipped as a published lead-versus-scale sweep, and the next judge called it the ideal outcome.

### 6. Know when to stop

Stop judging code when two consecutive rounds each add less than 0.2 to the weighted total, or when the judge says the code is maxed and the ceiling is something else. `judge-round.mjs` prints STOP when either holds.

Then spend the runway on the ceiling the judges named:
1. **Real-world signal:** an arm's-length practitioner interview, then a design-partner letter of intent, then a paid pilot. Quote people verbatim, attribute them honestly, and call problem validation what it is: not a customer, not an endorsement.
2. **Proof the team did not author:** a public dataset or a recognised third-party model run through the same untuned system, with what is real and what is overlaid stated beside each result.
3. **The pitch:** the demo video, the deck's first three slides and the Q&A (step 7).

Do not build a bigger simulator of your own: "Bigger self-sim = production value, zero credibility gain." Never tune a threshold to the test to win a point back.

> Field note (Trinetra · ET AI Hackathon 2.0): In the re-check that lifted the score to 7.9, the judge called the engine "maxed for a hackathon": Business was gated on one thing the engine could not produce, external validity. The engine stayed frozen from then on. A third-party dispersion-model exhibit left the score at 7.7 to 7.9, showcase work around the engine (fleet economics, latency percentiles, property tests) reached 8.0, and the blind run scored Business 8.5, which the builder credited to a practitioner's problem-validation quote and the pitch narrative.

### 7. Rehearse the Q&A

1. **Build the bank by persona.** Take the jury's persona from [references/personas.md](references/personas.md) (founders and VCs, bankers and regulators, engineers, scientists, sponsor developer relations, government officials), its typical questions, the universal ones ("Who on the team did what?", "What did the AI build? Say it plainly.", "Are the numbers right?") and the prepared hostile questions from the field. Answers go into `QA-BANK.md`, which sibling skill [finale-pitch](../finale-pitch/SKILL.md) owns along with the runsheet; keep its format.
2. **Build the rehearsal prompt:**
   ```
   node "${CLAUDE_SKILL_DIR}/scripts/evidence-pack.mjs" . --type mock-qa
   ```
   It writes `judging/qa-<n>/PROMPT.md` from QA-BANK.md, facts.json, CLAIMS.md, BRIEFING.md and LIMITS.md, using [assets/mock-qa.md](assets/mock-qa.md). Add `--persona "<persona line>"` to rehearse against a different jury, such as the banker panel in a mixed final.
3. **Run it in a fresh interactive session** (a new `claude` session in another terminal, or any chat app). The rehearsal judge must know only the facts in the prompt, and a subagent cannot hold a conversation. It asks one question at a time and waits.
4. **Answer out loud, then type what you said.** Each answer is graded against the facts in the LIVE / SHOW / IF PUSHED shape: LIVE is 2–5 speakable sentences that answer in the first one, SHOW is the one thing to put on screen, IF PUSHED is the one-line deeper defense. A number that does not match the facts is flagged, and so is any capability the facts do not show.
5. **Write the better answers back into QA-BANK.md.** Repeat until the answers are boring: every question scores 3 in two sessions in a row.

> Field note (FLOODLIGHT · MUSA CodeX 2026): The Q&A ammo said an onboarding script "road-snaps a new ward" from OpenStreetMap "in about a minute"; no such script was committed. A rehearsal judge grading answers against the project's facts flags that before a real judge asks to see it.

### 8. Keep it internal and honest

- Judge prompts, packs, verdicts, triage sheets and Q&A transcripts live in `judging/`, which stays gitignored: "a real jury never sees 'how to judge me'; this file is an internal red-team tool." `evidence-pack.mjs` warns when `judging/` is not ignored.
- **Never use an AI to answer real judges live.** BULLSEYE ships the rehearsal half only: no tool here listens to a judging call or drafts answers during it. A hidden assistant can break the event's rules and the judges' trust, and a judge who notices discounts everything else. If any assistive tool is used during judging (captions, translation, accessibility), disclose it and follow the event's rules.
- The judge never edits the product. Fixes happen in the builder's session, after the fact-check.
- Never tune a threshold, a seed or a test to please a judge. "Untuned" is the claim; if a number is small, report it small.

## Outputs

- `judging/` (gitignored): `pack.json` and `PS.md`; for each round `round-<n>/` with `PROMPT-<type>.md`, `PACK-<type>.md`, `judge-scorecard.schema.json`, `verdict-<type>.md`, `scorecard-<type>.json` and `triage.md`; `qa-<n>/PROMPT.md`; `audit-<n>/PROMPT.md` and `AUDIT.md`.
- BULLSEYE.md: one `## Judge rounds` row per round and one `## Log` block per recorded scorecard (both written by `judge-round.mjs`); the `Fixed?` cell, `## Decisions` lines and the status line (by hand, step 5).
- QA-BANK.md: the improved answers from the rehearsal.

## Rules

- A score without a command, a file:line or a number behind it is not a score. Do not argue with a score; produce evidence that changes it.
- One judge, one fresh context. A session that has seen the build, this conversation or an earlier verdict is not a fresh judge.
- The judge scores this event's rubric with the Contract's exact weights. When the event publishes no weights, every criterion weighs the same and the pack says so.
- Declared limitations are pressure-tested, not rediscovered; non-issues are not re-flagged; claims are reproduced, not trusted.
- Every fix pass is followed by a verify-fixes round before new surfaces are judged.

## Reference map

- [references/personas.md](references/personas.md): jury types, what each rewards, its typical questions and what loses it, plus the prepared hostile questions seen in the field with the answer shapes that held up. Read before choosing a persona and before the Q&A drill.
- [references/calibration.md](references/calibration.md): the bands, inflation, blind versus informed divergence, weighted-total arithmetic, reading "the biggest gap", when to trust a finding, how AI judges differ from human juries, and what a judge cannot see. Read before acting on a scorecard.
- [assets/judge-adversarial.md](assets/judge-adversarial.md), [assets/judge-verify-fixes.md](assets/judge-verify-fixes.md), [assets/judge-newest-surface.md](assets/judge-newest-surface.md), [assets/judge-blind.md](assets/judge-blind.md): the round prompts, with `{{slots}}` that `evidence-pack.mjs` fills.
- [assets/mock-qa.md](assets/mock-qa.md): the rehearsal judge prompt.
- [assets/claims-audit.md](assets/claims-audit.md): the claims auditor's procedure as a paste-ready prompt, for agents without subagents.
- [assets/triage.template.md](assets/triage.template.md): the fact-check sheet `judge-round.mjs` creates for each round.
- [assets/judge-scorecard.schema.json](assets/judge-scorecard.schema.json): the scorecard contract shared by the judges and the recorder.
- [scripts/evidence-pack.mjs](scripts/evidence-pack.mjs): sets up `judging/` and builds each round's prompt (`--help` lists the options).
- [scripts/judge-round.mjs](scripts/judge-round.mjs): validates and records a scorecard, compares two, applies the stop rule.
- [scripts/judging-lib.mjs](scripts/judging-lib.mjs): shared helpers; a module, not a command.
- Subagents (Claude Code plugin): `hackathon-judge` runs a round read-only and writes only its scorecard; `claims-auditor` compares every claim in the artifacts with the evidence and writes only its report.
