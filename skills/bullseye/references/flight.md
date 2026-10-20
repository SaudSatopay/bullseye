# Flight procedure

Eight phases, each owned by one skill, each leaving a trace in `BULLSEYE.md`. A phase ends at its gate, not at a time. When the clock forces a move before the gate, write the open items under `## Risks` and move on; never pretend a gate passed.

## Phase 0 · Intake (`brief-decoder`)

Inputs: event pages, problem statement documents, rules, FAQ, judging page, templates, announcements.

1. Fill `## Contract`: facts with sources, deliverables with exact limits, hard rules quoted verbatim, instant-rejection traps, the rubric with weights, the judges.
2. Convert every deadline to the user's local time and set the internal deadline (official minus buffer).
3. Run the competitive scan: last edition's winners, competitor repositories, the sponsor guide's demo apps, blog-prize entries.
4. Score the candidate problem statements and pick one for win probability.
5. Write `## Thesis` and the battle plan.

Gate: a teammate could read `## Contract` and know every file to submit, every limit and every way to be disqualified. The chosen problem has a reason and a runner-up.

Hand-off: to `idea-round` if there is an idea gate, otherwise to `build-sprint`.

## Phase 1 · Idea gate (`idea-round`, rendered by `pitch-deck`)

Many events cut most teams before anyone writes code. Treat the idea submission as the real elimination round.

1. Confirm the exact format: document, deck, form essays, template, video, anonymity, naming, size.
2. Build evidence even at idea stage: prove the core on the organiser's data if any is provided, or record a thin vertical prototype.
3. Write the narrative once and render it three ways (brief, deck, form essays) with the same numbers.
4. Run the honesty pass: every number typed (sourced, simulated, projected, target, illustrative), unverified claims removed, competitors rated fairly.
5. Produce the organiser-format cut separately from any longer presentation deck.
6. Submit early when edits are allowed; shortlisting can happen in waves.

Gate: submitted, with the timestamp recorded, and every deliverable checked against the Contract.

## Phase 2 · Build (`build-sprint`)

1. Write `PRODUCT.md` with the judge listed as a user and a must-never-break list.
2. Lock the golden path: 6 to 8 numbered beats, the money shot, and one contrast beat that proves the product stays quiet when it should.
3. Write the split between engine and model (who computes what, and why).
4. Day-1 skeleton: scaffold with the four commands, data build, written spec of the core computation, an independent verifier for anything that produces headline numbers, then tools, screen skeletons and a deployed preview.
5. Build the demo layer: labelled modes (live, scripted, recorded), seeded data with planted stories, health endpoint, reset, deep links, failover.
6. Work in named passes: core, deploy and proof, wow, stacked (close the loops), parity, polish, assets.
7. Freeze features at about 65 to 70 percent of the window.

Gate: the golden path runs end to end on the deployed URL in demo mode, with no console errors, on a phone and a laptop.

## Phase 3 · Polish (`missile`)

1. Extract or choose the design direction into `DESIGN.md` (three directions with risks; one chosen).
2. Build the signature moment poster-first.
3. Run the guidance loop: sense (screenshots at 390 and 1440, Lighthouse, the four commands, console, keyboard walk), score with a separate critic, record, fix the top fixes, repeat.

Gate: every craft dimension at 9 or above, or a stall with each remaining gap written down. Any redesign re-shoots README media and the OG image in the same change.

## Phase 4 · Prove (`prove-it`)

1. Inventory every claim; give each a label and a source.
2. Write `facts.json` from the scripts that measure, and `CLAIMS.md` mapping each README claim to its measurement, its independent recomputation and its pinning test.
3. Run the evals the product type needs (held-out split fixed before any run, honest baselines, intervals, negative cases).
4. Write `LIMITS.md` and the README's "Where we lose".

Gate: `claims-check` passes; every headline number reproduces from a clean clone with the documented commands.

## Phase 5 · Judge (`judge-panel`)

1. Assemble the evidence pack (problem statement verbatim, rubric with weights, run commands, claims, declared limits, prior non-issues).
2. Run a judge in a fresh context. Fact-check each finding against the code. Fix every substantiated item, including the small ones. Record non-issues.
3. Rotate the next round onto the newest surfaces. End with a blind round that sees only the problem statement, the rubric and the repo.

Gate: no open substantiated finding, and the blind score recorded under `## Judge rounds`. When two rounds move the score by less than 0.2, stop judging code and spend the remaining time on what the judge names as the ceiling.

## Phase 6 · Package (`submission-pack`, `demo-video`, `pitch-deck`)

1. README for judges, `SUBMISSION.md` with paste-ready answers, one-page briefing.
2. Demo video under the cap, recorded against the production build.
3. Deck and organiser-format cut.
4. Media: OG image from the tokens, screenshots from production, thumbnails at the platform's sizes, QR codes.
5. Final sweep, claims check, fresh-clone run, judge-access check.
6. Submit early, record the time, tag the submission commit.

Gate: submitted and tagged; the sweep is green; the live URL works logged out on a phone.

## Phase 7 · Finale (`finale-pitch`)

1. Pitch script for the slot length, with an emergency 90-second cut.
2. Runsheet with exact inputs and expected outputs, a skeptic's tour and a contrast beat.
3. QA bank with honest limits first; mock Q&A rounds with `judge-panel`.
4. Pre-flight at T-15 with a decision rule for a broken step.

Gate: rehearsed until boring, backup video in two places, devices on a hotspot.

## Loops that run inside phases

- **Proof loop.** Every time a number changes, re-run the measurement, update `facts.json`, run `claims-check`. Before any docs, deck or video pass, re-derive every number first.
- **Judge loop.** A judge round after the first end-to-end build, after each major pass, and one blind round at the end.
- **Craft loop.** The missile guidance loop during polish; one critic pass after any visual change late in the event.
- **Copy loop.** Submission copy is drafted at hour 2 and refreshed after each pass, so the final package is an edit, not a blank page.

## Hour tables

These are starting points; adjust them to the Contract and write the result into the battle plan.

### 8 hours onsite

| Time | Work |
|---|---|
| H0:00–0:30 | Intake, problem choice, golden path, roles |
| H0:30–1:30 | Scaffold, data, deploy hello-world, demo mode switch |
| H1:30–4:30 | Core loop and the money shot; record clips as features land |
| H4:30–5:30 | Polish the golden path screens; seeded data; fallback |
| H5:30–6:30 | Claims, README, one judge round, fixes |
| H6:30–7:30 | Video or deck, rehearsal twice |
| H7:30–8:00 | Submit early; buffer |

### 18 to 36 hours overnight

| Time | Work |
|---|---|
| H0–1 | Triage the brief within 45 minutes; pick; lock the golden path |
| H1–3 | Scaffold and deploy a hello-world |
| H3–8 | Minimum viable golden path working end to end |
| H8–12 | The wow moment; first judge round |
| H12 | Feature freeze |
| H12–16 | Proof, polish, README, backup video |
| H16–end | Deck, rehearsal three times, submit 30 minutes early; the presenter sleeps |

### 48 to 72 hours online

| Day | Work |
|---|---|
| Day 1 | Intake and scan (2 h), spec and verifier, skeleton deployed, core loop, first critic pass, judge README stub |
| Day 2 | Features in named passes, demo layer, evals, judge round 1, polish flight |
| Day 3 | Proof complete, blind judge round, video, deck, form answers, final sweep, submit with 3 hours of buffer |

### Multi-week

| Week | Work |
|---|---|
| 1 | Intake, scan, thesis, skeleton deployed, independent verifier, first eval |
| 2 | Core and demo layer complete; judge rounds weekly; polish flight |
| 3 | Proof, external validity (real incidents, public datasets, a practitioner's problem validation), package drafts |
| Final days | Blind round, freeze, package, sweep, submit a full day early |

## When the clock wins

When time runs out before a gate:
1. Protect the golden path and the honesty of every claim above all else.
2. Cut features from the bottom of the plan, never the proof of the top one.
3. Write what is missing under `## Risks` and say it out loud in the README's limits section.
4. Submit what works. A narrow product that never breaks beats a wide one that fails on stage.
