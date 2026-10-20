# BULLSEYE · Tideline · Coastal Data Hack 2026

<!-- A worked example. The event, product, people and numbers are fictional; the shape is what a well-kept control file looks like about 30 hours into a 48-hour online hackathon. -->

status: phase=prove step=3 updated=2026-11-15T16:30+05:30 next="Wire claims-check into CI and fix the stale test count in the README"
deadline: 2026-11-15T23:59-05:00 (2026-11-16 10:29 IST) · internal: 2026-11-16 07:30 IST · T-17:59 to the deadline, T-15:00 to internal
process: private

## Contract

| Fact | Value | Source |
|---|---|---|
| Event / organiser / platform | Coastal Data Hack 2026, run by a fictional ocean-data nonprofit, on Devpost | Event overview page |
| Format and window | Online, 2026-11-14 00:00 to 2026-11-15 23:59 US Eastern (48 h) | Schedule page |
| Team rules and eligibility | 1 to 4 people, 18+, any country | Rules §2 |
| Submission deadline | 2026-11-15 23:59 ET = 2026-11-16 10:29 IST (after midnight on our clock) | Rules §6 |
| Rounds | Online judging, then a 5-minute live finale for the top 8 on 2026-11-22 | Judging page |
| Prizes and side prizes | 3 places plus "Best use of open data" and "Best write-up" (blog) | Prizes page |

**Deliverables (with limits):**
- [x] Public repository with an OSI licence, created after the window opened
- [ ] Demo video, 3:00 maximum, YouTube or Vimeo, public or unlisted
- [ ] Devpost form: tagline (200 chars), description, "How we used open data" (1,500 chars)
- [ ] Live URL that works without login

**Hard rules (verbatim):**
> "Projects must be started during the submission period. Pre-existing libraries and datasets are allowed and must be credited."
> "Use of AI coding assistants is allowed. Describe how you used them in your submission."

**Instant-rejection traps:** a video over 3:00; a repository created before the window; a live URL behind a login.

**Rubric:**

| Criterion | Weight | What wins it | Our evidence | Where it shows | Owner |
|---|---|---|---|---|---|
| Impact | 30 | A named user with a real decision, sized | Harbour-pilot scenario with measured lead time | Video 0:20, README "Why" | A |
| Use of open data | 25 | Data that is load-bearing, credited, fresh | Three public feeds fused; provenance file | Proof page, README "Data" | B |
| Technical execution | 25 | It works, it is fast, it is checked | Golden path green on prod; claims re-measured | README "Evidence" | B |
| Presentation | 20 | Understood in two minutes | 60-second judge path, 2:50 video | README top, video | A |

**Judges:** two oceanographers, a port-operations manager, one sponsor engineer. They reward real decisions and distrust model-only answers.
**Sponsor test:** without the open feeds the product shows nothing, so the data is load-bearing.

## Thesis
- One-liner: Tideline tells a harbour pilot six hours ahead whether a channel will be too shallow to cross, and shows the readings that prove it.
- Problem statement chosen: "Safer small-port operations" (runner-up "coral bleaching alerts": crowded, eleven similar repos found in the scan).
- The moment a judge leans in: the channel turns red on the chart six hours before the tide gauge would have said so, with the three readings that caused it.
- Why we win, per criterion: Impact (a named user and a measured lead time) · Open data (three feeds, credited, fused) · Execution (deterministic engine, re-measured claims) · Presentation (one argument, one moment).
- Dual layer: one pilot's crossing decision as the proof → every small port without a hydrographic office as the point.
- Signature moment: the chart answers (poster first, then the real forecast replaces it in place).
- Out of scope: vessel tracking, accounts, mobile app.

## Owner checklist
- [x] Register every team member; confirm eligibility
- [x] Accounts and API keys created; keys stored in `.env` (never pasted into chat)
- [x] Production keys set on the host
- [x] Repository created; visibility plan: public from the start
- [ ] `gh auth` has the `workflow` scope if CI will run (blocking CI; asked 2026-11-14 14:05 IST)
- [x] Deploy target linked; preview URLs reachable logged-out (checked in a private window)
- [ ] Video hosting decided (YouTube unlisted on the team channel)
- [x] Judge access arranged (no login needed)
- [x] Commit attribution policy decided before the first commit
- [ ] Release tag planned for the submission commit (`v1.0.0`)

## Plan

**Golden path (the demo that must never break):**
1. Open the live URL: the chart of the demo harbour loads with tonight's forecast.
2. Pick the 06:00 crossing: the channel shows amber with the minimum depth and the margin.
3. Scrub to 04:30: the channel turns red; the three readings that caused it are listed with their sources.
4. Open "Why": the engine's arithmetic, step by step, with the feed timestamps.
5. Contrast: pick a calm night; the channel stays green and Tideline says nothing alarming.
6. Ask in plain words, "Can I cross at 05:00?": the model answers only from the engine's numbers and cites them.

| Id | Item | Accept: | Effort | Status | Commit |
|---|---|---|---|---|---|
| F1 | Foundations: typecheck, lint, test, build green | four commands exit 0 | S | done | 3f2a9c1 |
| D1 | Feed ingest with provenance | `data/meta.json` lists source, URL, slice and retrieved date for all three feeds | M | done | 91be0d4 |
| E1 | Depth engine spec + independent verifier | Python verifier agrees with the TypeScript engine on 200 seeded nights | L | done | c07d5e2 |
| U1 | Chart screen with poster-first moment | complete at rest without JavaScript; Lighthouse mobile 90+ | M | done | 5a6e110 |
| A1 | Plain-words question answered from engine numbers only | grounding check rejects any figure not in the tool results | M | done | 2d41f8b |
| P1 | Claims ledger and re-measure command | `claims-check` exits 0 on a clean clone | M | in progress | |
| S1 | Judge README, video, form answers | final sweep green | M | todo | |

## Claims

| Claim as written | Value | Label | Measured by | Pinned by |
|---|---|---|---|---|
| "6 hours of warning" | 6.2 h median lead time on 40 replayed nights | SIMULATED | `npm run eval:lead` | `lead-time.test.ts` |
| "0 false red channels on 40 calm nights" | 0 of 40 | SIMULATED | `npm run eval:calm` | `calm-nights.test.ts` |
| "47 tests" | 51 | measured | `npm test` | facts.json `tests` (README is stale: fix in P1) |

## Judge rounds

| Round | Type | Date | Weighted score | Lowest criterion | Top finding | Fixed? |
|---|---|---|---|---|---|---|
| 1 | Adversarial | 2026-11-15 01:10 IST | 7.4 | Presentation (6) | The README describes the product instead of letting a judge run it in 60 seconds | yes, 1c9e3a7 |
| 2 | Verify fixes | 2026-11-15 13:30 IST | 7.9 | Open data (7) | Feed timestamps were not shown next to the readings | yes, 77ab210 |

## Submission
- [ ] README for judges · [ ] SUBMISSION.md · [ ] deck (not required) · [ ] video · [x] live URL · [x] repo public · [ ] tag
- Final sweep: not yet run
- Submitted: not yet

## Decisions
- 2026-11-14: Dropped "coral bleaching alerts" because the scan found eleven similar repos and no load-bearing use of the sponsor's data.
- 2026-11-14: The model never computes depth; it answers from the engine's numbers, because judges will check the arithmetic.
- 2026-11-14: Recorded mode replays a real run captured at 2026-11-14 23:00 IST when a feed is down, labelled "recorded" on screen.

## Risks

| Risk | Likelihood | Mitigation | Owner |
|---|---|---|---|
| A public feed rate-limits during judging | Medium | Cache whole series; recorded mode labelled | B |
| CI cannot run without the token scope | High | Owner action requested; tests also run locally before tag | A |

## Handoff
**Next session starts here.**
- State: golden path green on the production URL (serving 2d41f8b); 51 tests pass; two judge rounds logged.
- In progress: P1, `claims.json` has 6 of 9 claims; next is the lead-time claim's measure command.
- Next steps (exact): finish `claims.json` → run `claims-check` → fix the README test count from facts.json → judge round 3 (newest surface: the plain-words answers).
- Commands: `pnpm dev` · `pnpm test` · `node <prove-it>/scripts/claims-check.mjs claims.json` · `pnpm build && pnpm start -p 3005`.
- Gotchas already paid for: the preview tool serves the production build, so rebuild after frontend edits; one feed returns local time without an offset, so convert at ingest.

## Log

### ▶ STATUS · judge round 2 fixes · 2026-11-15 16:30 IST
- Changed: feed timestamps shown next to every reading; README judge path added.
- Verified: golden path on production at 390 and 1440, no console errors; 51 tests pass.
- Numbers: lead time 6.2 h median (40 nights); calm nights 0 of 40 false red.
- Next: P1 claims ledger, then round 3.

### ▶ STATUS · golden path complete · 2026-11-15 00:05 IST
- Changed: chart screen, engine, verifier, recorded mode.
- Verified: verifier agrees on 200 seeded nights; Lighthouse mobile 94.
- Numbers: first measurement of lead time 5.8 h (later corrected after a timezone bug at ingest).
- Next: plain-words answers with grounding.
