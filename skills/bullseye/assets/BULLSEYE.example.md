# BULLSEYE · Tideline · Coastal Data Hack 2026

<!-- A worked example. The event, product, people and numbers are fictional; the shape is what a well-kept control file looks like about 30 hours into a 48-hour online hackathon. -->

status: phase=prove step=3 updated=2026-11-15T16:30+05:30 next="Wire claims-check into CI and fix the stale test count in the README"
deadline: label="Submission" official="Sun 2026-11-15 23:59 America/New_York (UTC-05:00)" yours="Mon 2026-11-16 10:29 Asia/Kolkata (UTC+05:30)" internal="Mon 2026-11-16 07:29" buffer=3h tminus="T-0d 17:59" asof=2026-11-15T11:00:00Z
process: private

## Contract

### Facts

| Fact | Value | Source |
|---|---|---|
| Event | Coastal Data Hack 2026 · a fictional ocean-data nonprofit · Devpost | Overview page, read 2026-11-13 |
| Format | Online · 2026-11-14 00:00 to 2026-11-15 23:59 US Eastern (48 h) | Schedule page, read 2026-11-13 |
| Team and eligibility | 1 to 4 people · "Participants must be 18 or older" · both members PASS | Rules §2, read 2026-11-13 |
| Prizes | 3 places · side prizes: "Best use of open data", "Best write-up" (blog) | Prizes page, read 2026-11-13 |
| Edits after submitting | Allowed until the deadline | FAQ, read 2026-11-13 |

### Deadlines

| What | Official (organiser zone) | Your clock | Internal | Note |
|---|---|---|---|---|
| Submission | Sun 2026-11-15 23:59 America/New_York (UTC−05:00) | Mon 2026-11-16 10:29 Asia/Kolkata | Mon 2026-11-16 07:30 | Lands after midnight on our clock; submit v1 early, edits allowed |
| Finale (top 8) | 2026-11-22 18:00 America/New_York | 2026-11-23 04:30 Asia/Kolkata | n/a | 5-minute live pitch |

### Rounds

| Round | What is judged | Dates | Who judges | Advance |
|---|---|---|---|---|
| 1 · online | Repo, live URL, video, form | 2026-11-16 to 2026-11-20 | Panel of four | Top 8 |
| Finale | Live pitch and Q&A, 5 + 3 min | 2026-11-22 | Same panel | Prizes |

### Deliverables and limits

| Deliverable | Exact limit | Format and naming | Where it goes | Source |
|---|---|---|---|---|
| Demo video | At most 3:00 | YouTube or Vimeo, public or unlisted | Form field | FAQ |
| Repo | Public, OSI licence, created inside the window | GitHub | Form field | Rules §4 |
| Live URL | Works without login | | Form field | Rules §5 |
| Form | Tagline 200 chars · "How we used open data" 1,500 chars | Plain text | Devpost | Submission form |

### Hard rules (verbatim)

- Pre-existing work: "Projects must be started during the submission period. Pre-existing libraries and datasets are allowed and must be credited." (Rules §4, read 2026-11-13)
- AI use: "Use of AI coding assistants is allowed. Describe how you used them in your submission." (Rules §7, read 2026-11-13)

### Disqualifiers and traps

- A video over 3:00: cut to 2:50 and check with ffprobe.
- A repository created before the window: new repository, created after 2026-11-14 00:00 ET.
- A live URL behind a login: check in a private window after every deploy.

### Requirements gate

- [x] R1 [hard] Both members meet the age rule · check: manual: confirmed in the team chat · source: Rules §2, read 2026-11-13
- [x] R2 [hard] Every form answer within its limit (tagline 200 chars, "How we used open data" 1,500 chars) · check: manual: form-check.mjs reports 0 FAIL on idea/SUBMISSION-FORM.md · source: Submission form, read 2026-11-13
- [ ] R3 [hard] Demo video at most 3:00 · check: cmd: ffprobe -v error -show_entries format=duration -of csv=p=0 demo.mp4 (pass: 180 or less) · source: FAQ, read 2026-11-13
- [x] R4 [hard] Repo public with an OSI licence · check: cmd: gh repo view --json visibility,licenseInfo (pass: PUBLIC and mit) · source: Rules §4, read 2026-11-13
- [ ] R5 [hard] README describes how AI assistants were used · check: cmd: grep -in "AI assistance" README.md (pass: a heading matches) · source: Rules §7, read 2026-11-13
- [x] R6 [hard] Live URL works without login · check: manual: opens in a private window with demo data · source: Rules §5, read 2026-11-13
- [ ] R7 [scored] Open data is load-bearing and credited · check: manual: README "Data" names every feed with its licence · source: Judging page, read 2026-11-13

### Judging

Judges: two oceanographers, a port-operations manager and a sponsor engineer; they will see through model-only answers and uncredited data. Weights: published. Screening before scoring: none.

| Criterion | Weight | What wins it | Our evidence | Where it shows | Owner |
|---|---|---|---|---|---|
| Impact | 30 | A named user with a real decision, sized | Harbour-pilot scenario with measured lead time | Video 0:20, README "Why" | A |
| Use of open data | 25 | Data that is load-bearing, credited, fresh | Three public feeds fused; provenance file | Proof page, README "Data" | B |
| Technical execution | 25 | It works, it is fast, it is checked | Golden path green on prod; claims re-measured | README "Evidence" | B |
| Presentation | 20 | Understood in two minutes | 60-second judge path, 2:50 video | README top, video | A |

Non-code share: Impact and Presentation, 50 points of 100. Implication: one argument, one moment, a demo that never breaks.

### Sponsor-tech test

Required: the event's open feeds. If we removed them, the chart would show nothing: the data is load-bearing. A judge sees it on the chart, in "Why", and in the README's Data section.

## Thesis
- **One-liner (a claim, not a greeting):** Tideline tells a harbour pilot six hours ahead whether a channel will be too shallow to cross, and shows the readings that prove it.
- **Problem statement:** "Safer small-port operations" · runner-up: "coral bleaching alerts" · why this one: the scan found eleven similar bleaching repos and no load-bearing use of the open feeds.
- **The moment:** the channel turns red on the chart six hours before the tide gauge would have said so, with the three readings that caused it.
- **Dual layer:** proof: one pilot's crossing decision · point: every small port without a hydrographic office.
- **Why we win, per criterion:** Impact (a named user and a measured lead time) · Open data (three feeds, credited, fused) · Execution (deterministic engine, re-measured claims) · Presentation (one argument, one moment).
- **Signature moment:** the chart answers (poster first, then the real forecast replaces it in place).
- **Jury:** two oceanographers, a port-operations manager, a sponsor engineer; weight what they reward: real decisions, provenance, no model-only answers.
- **Out of scope, on purpose:** vessel tracking, accounts, a mobile app.

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
| "47 tests" | 51 | MEASURED | `npm test` | facts.json `tests` (README is stale: fix in P1) |

## Judge rounds

| Round | Type | Date | Weighted score | Lowest criterion | Top finding | Fixed? |
|---|---|---|---|---|---|---|
| R1 | adversarial | 2026-11-15 | 7.40 | Presentation 6 | The README describes the product instead of letting a judge run it in 60 seconds (high) | 5 of 5 substantiated fixed, 1 non-issue · 1c9e3a7 |
| R2 | verify-fixes | 2026-11-15 | 7.90 (+0.50) | Use of open data 7 | Feed timestamps were not shown next to the readings (medium) | 3 of 3 substantiated fixed · 77ab210 |

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
