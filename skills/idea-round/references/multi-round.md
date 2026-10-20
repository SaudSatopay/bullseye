# Multi-round, re-pitch and surprise rounds

Idea rounds rarely stand alone. A shortlist leads to a prototype round, a finale, or a live surprise challenge; strong projects get carried into the next event. This file covers how each round sets up the next one.

## Round arcs

| Round | Its job | The line |
|---|---|---|
| Idea, Round 1 | make promises a jury can hold you to | "Declared now, measured on stage." |
| Prototype, Round 2 | run what Round 1 promised | "Round 1, we promised this. Round 2, it runs." |
| Finale | prove it live, under questions | handled by the sibling `finale-pitch` |

## Write Round 1 promises you can keep

- Every declared metric names how and on what it will be measured, so the next round can turn it into a test. FLOODLIGHT's Round 2 README said "Twenty tests pin what the pitch claims", and all three items of its Round 1 plan were delivered.
- The hour plan becomes the build plan and the pre-mortem becomes the risk list. Hand both to the sibling `build-sprint` as `Accept:` lines on submission day.
- Promise outcomes, not a stack you cannot change. FLOODLIGHT's Round 1 plan named PostGIS; the Round 2 build shipped "deliberately boring" (one server, one event stream, no database for the pilot) and the promised outcomes still held.
- Keep the honest-scope line in Round 1: promise only what the next window holds.

## Start the next round on submission day

DhanDrishti's submission notes held a "Round 2 prep (if shortlisted, start early)" list: a demo-video outline (problem 30 s, dashboard walkthrough 2 min, metrics and roadmap 1 min), an Account Aggregator sandbox integration to replace "simulated" with "sandbox-real" for one enterprise, an SMS nudge prototype, and a one-page deployment guide. NAADI's architecture promised the same move in one line: "Swap-ready: synthetic data today, IDBI sandbox data (July 22) tomorrow, with zero schema changes."

Put the same list in the `▶ STATUS` block that records the submission, with dates.

## Re-entering an existing project

1. **Read the rules on pre-built work.** Vibeathon 2026 said "pre-developed projects allowed". TrackShift 2026 required work "developed during TrackShift 2026" with reuse disclosed. When it is unclear, email the organisers and quote the reply into the Contract: "Get it in writing; disclose everything."
2. **Disclose on the artifact:** what existed before, what is new this round, what open source is reused. FLOODLIGHT's section 09 box (slide 11 of 11), for a fresh build: "Created fresh for MUSA CodeX 2026 Round 1 ... No prior team codebase is reused." A carried-over project writes the same box the other way round, with dates.
3. **Re-measure every number on the current build.** Numbers do not carry forward unrun.
4. **Say the honest position the earlier pitch only implied.** ORCA's Vibeathon deck: "The honest position, said out loud: INCOIS, IMD and MOSDAC publish portals, not open JSON APIs, so ORCA is built behind a provider interface."
5. **Pitch to this event's format, not the last one's.** ORCA came from an SIH problem statement, but at Vibeathon the pitch was built around how its seams would absorb the surprise challenge.

## Surprise-challenge rounds: pre-commit the seams

Some events allow an existing project, then hand each team a surprise challenge to build into it inside a fixed offline window (Vibeathon 2026: 12 hours). The Stage 1 deck promises how the architecture will absorb any challenge; Stage 2 pays the promise off.

The Stage 1 slide (ORCA · Vibeathon 2026), headline "Hand us any challenge. The crew absorbs it.":

| Seam | Line on the slide |
|---|---|
| Add a specialist | A new agent is one file |
| Swap the feed | Provider interface: a new source slots in behind the same interface, zero agent-code changes |
| Change the law | A rule is one config line, visible at `/api/config`, demoable in the same minute |
| Speak new tongues | Language is a table: the next language is an afternoon, not a rewrite |
| Grow a surface | API-first product: an SMS bot, a WhatsApp flow or a kiosk is a new client, not a new system |
| Move the map | Any coast, any tap: a new region is a coordinate, not a data project |

Three proof lines sat under it: proof in one command (the smoke test replays five sea states, pass or fail), the demo cannot die (a LIVE and DEMO toggle that degrades honestly), it runs on the desk (one process, one port, no database, no keys).

The 12-hour playbook on the same slide:

- H 0–1: read the challenge · pick the seam it lands in · post the plan
- H 1–6: build the new agent, provider or rule; the rest untouched
- H 6–9: wire it to the UI · i18n strings · voice line
- H 9–11: smoke test green · demo-mode fixture for the new path
- H 11–12: rehearse twice · present; old demos still green

The ask on the last slide: "Give us the surprise challenge. Watch the crew absorb it in 12 hours."

Rules for seams:

- Each seam must already exist in code with a recipe and a test before Stage 1. ORCA kept a code map with recipes (add an agent, an endpoint, a tab, a string, a scenario, a provider). Never promise a seam you cannot demonstrate.
- Name seams in the judge's terms (a new data source, a new rule, a new language, a new client), not in your module names.

### Stage 2: pay it off, seam by seam

ORCA's 16-page Stage 2 deck, "the project in 3, the hackathon day in 11":

1. The project, compressed into three pages.
2. The mentor's challenge in one sentence, with "WHAT THE MENTOR CHECKS" listing each acceptance check with a tick.
3. Before and after: "Before: confident. After: honest."
4. The change, step by step, each step with its guarantees written as tests.
5. Proof: the real test run, with counts before and after (backend 174 → 284, frontend 703 → 812).
6. How it was built, "TIMES FROM THE GIT LOG": "Brief at 12:05. Shipped by 14:50." (27 commits, +3,213 product lines, +219 tests).
7. Why it fit: "Handed a challenge. The crew absorbed it.", showing the seam each part of the work landed in; "The brief's 'do nots' held"; "The healthy demo, untouched."
8. Try it live, with "What the brief asked us to show" ticked off, each item pointing to a page.

Plan the challenge day before writing code: transcribe the brief, set global constraints (rehearsed numbers unchanged, healthy-path text byte-identical, no new dependencies), list the review focus (inputs the brief implies but does not spell out), break it into tasks with tests, and end with a table mapping every brief item to its task. The sibling `finale-pitch` covers the live delivery.

## Reuse a design system across events

- LINE MARSHAL's A4 brief system (its page classes, Barlow Condensed with IBM Plex, the page grammar) became Fineprint's 13-slide 16:9 deck for the Paytm event, re-themed from carbon and F1 red to wine and neon red. MuleShot's proposal template became Trinetra's proposal.
- Name tokens by role (`--accent`, `--verdict-uncertain`), not by hue: after Fineprint's re-theme, a token named `--cyan` still held a red.
- Keep the generator and its fonts with the project; a re-theme should be a token-file change plus new photography.
- Keep the honesty furniture in the reused system: labels, status chips, the appendix and the disclaimer travel with it.
