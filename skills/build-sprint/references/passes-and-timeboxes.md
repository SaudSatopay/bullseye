# Passes and timeboxes

Time is the one resource nobody can buy mid-event. Three rules sit under every table below: the golden path is deployed early, features freeze at 65 to 70 percent of the window, and everything is submitted 30 minutes before the deadline (24 hours before on government portals). The tables give the hours; the passes give the order of work inside them.

## 1. The day-1 order

Spec, then verifier, then product, then the shipped skeleton, then the first critic pass. Each step protects the next one.

| Time | What landed (one build, as committed) |
|---|---|
| 19:17 | Scaffold with typecheck, lint, test and build scripts |
| 19:25 | The network data built from the public sources |
| 19:28 | The model spec: the exact computation every implementation follows |
| 19:34 | An independent verifier in another language, results committed |
| 19:47 | The typed tools over the engine |
| 19:55 | Map, design tokens and the CI harness |
| 20:01 to 21:06 | Pages and the MCP endpoint |
| 21:27 | The deploy failure fixed |
| 21:35 | README for judges, social card, robots and sitemap |
| 21:39 to 21:59 | Eval harness, demo recorder, keep-alive cron |
| 22:00 | First critic iteration |

Why this order:

- The spec comes before code, so two implementations have something to agree on.
- The verifier comes before the product, so headline numbers are checked from the first run, not the last night.
- The deploy comes before features, so hosting, build and environment failures surface while there is time to fix them.
- The critic comes early, so the design is scored while it is still cheap to change.

## 2. The named passes

| Pass | Goal | Done when |
|---|---|---|
| core | the golden path on seed data | every beat runs locally, and the smoke test passes |
| deploy + proof | public URL, health endpoint, smoke test in CI, a deployment proof screenshot | a logged-out phone completes the golden path |
| wow | the 3 to 5 most demo-able moments, the money shot first | the money shot lands inside 60 seconds of opening the URL |
| stacked | closed loops: approve, act, record; revise, pay, ledger | every action has a visible consequence on screen |
| parity | the second language or voice, end to end | every beat works in every language the product claims |
| polish | states, copy, favicon, metadata, hero; then hand to `missile` | no placeholder text; loading, empty and error states designed |
| assets | architecture diagram, thumbnail, gallery, OG image | every asset at the platform's exact sizes |

Rules for every pass:

- It ends with the four commands green, the smoke test green, the golden path walked on the deployed URL, and a `▶ STATUS · <pass> · <date time TZ>` block in `BULLSEYE.md`.
- Write the submission copy at about hour 2 (one-liner, form answers, demo script outline) and refresh it in the polish pass. The copy then shapes the build instead of describing it afterwards.
- Record screen clips as each feature lands, as separate clips. Leaving every recording to the last evening means recording tired, against whatever happens to work then.

> Field note (VyaparAI · Global AI Hackathon Series with Qwen Cloud): the submission copy (form answers, demo script, blog post) was written at hour 2 of a 52-hour build, then each named pass appeared as its own commit: "Wow pass", "Stacked pass", "Full English parity", "Polish pass".

## 3. Hour tables

H0 is the moment the problem statements are released or the clock starts. Shift the rows when the window starts late in the day, but keep the percentages.

### 8 hours onsite

| Hours | Work | Gate |
|---|---|---|
| 0:00 to 0:30 | read the brief, pick the problem, lock the golden path | 6 to 8 beats written, money shot and negative beat marked |
| 0:30 to 1:30 | scaffold, four commands, hello world deployed, launcher | the preview URL loads logged out |
| 1:30 to 4:30 | core pass: engine, seed, golden-path screens | every beat runs on seed data |
| 4:30 to 5:30 | demo layer and one wow moment | the network-off run passes |
| 5:30 | **freeze** (69 percent) | freeze commit logged |
| 5:30 to 6:30 | golden-path and honesty fixes, backup recording | smoke test green on the deployed URL |
| 6:30 to 7:30 | README, deck, two rehearsals | the runsheet strings work verbatim |
| 7:30 | **submit** | submission time recorded |

### 18 to 24 hours overnight

| Phase | 18 h | 24 h | Work |
|---|---|---|---|
| Triage | H0 to 0:45 | H0 to 1 | score problems on team fit × demo-ability × differentiation in a 45-minute budget; lock the golden path |
| Skeleton | to H3 | to H3 | contracts, scaffold, hello world deployed by H3, launcher, README stub |
| Core | H3 to H8 | H3 to H10 | MVP end to end on seed data; deploy + proof |
| Wow and stacked | H8 to H12 | H10 to H16 | the wow layer, then closed loops |
| **Freeze** | **H12** | **H16** | only golden-path and honesty fixes after this |
| Harden | H12 to H15 | H16 to H20 | hourly golden-path walks, the backup video, real numbers for the deck |
| Present | H15 to H17:30 | H20 to H23:30 | deck, README, three rehearsals |
| **Submit** | **H17:30** | **H23:30** | everything, 30 minutes early |

Sleep goes in shifts after the freeze. One person owns the pitch and one owns the demo, and the presenter does not pull the all-nighter.

### 36 to 48 hours

| Hours | Work |
|---|---|
| H0 to 3 | the day-1 order from section 1, ending with the first critic pass |
| H3 to 12 | core and deploy + proof passes; tiny eval on day 1 so a saturated metric shows up early |
| H12 to 20 | sleep, then the wow pass |
| H20 to 30 | stacked and parity passes; the polish loop starts (`missile`) |
| H30 to 32 | **freeze** (about 67 percent of 48) |
| H32 to 44 | claims and evals (`prove-it`), judge rounds (`judge-panel`), video, deck |
| H44 to 47 | final sweep, fresh-clone run, submit; tag the submission commit |

Set an internal deadline a few hours before the official one and treat it as the real one.

### 72 hours

Run the 48-hour table for the build, freeze near H48, and give the last day to proof: held-out evals with honest baselines, the claims ledger, a blind judge round, the video and the deck. Submit by H70 with the tag in place; the buffer exists for the thing that breaks.

### Multi-week windows

| Window share | Work |
|---|---|
| first 20 percent | the whole product to a demo: golden path deployed, demo layer, one wow |
| next 25 percent | judge rounds in fresh sessions, fixing every substantiated finding |
| next 20 percent | external validity: a real incident reconstructed, a public dataset slice with provenance, a third-party model, one practitioner's view of the problem |
| freeze at about 65 percent | after this, only proof, pitch and honesty work |
| last 35 percent | deck, video, rehearsals, the organiser-format cut, submit at least 24 hours early |

When judges start calling the code maxed, more engine work stops moving the score; spend the runway on external validity and the pitch.

> Field note (Trinetra · ET AI Hackathon 2.0): a 30-day window had the product built in its first six days; judge rounds in fresh sessions then moved the internal score from 7.3 to 8.5, and the master plan's argument was that business credibility was gated on external validity, not a bigger self-built simulator.

### 12-hour surprise round on an existing project

| Hours | Work |
|---|---|
| H0 to 1 | read the challenge, pick the seam it lands in, post the plan |
| H1 to 6 | build the new path; the rest of the product stays untouched |
| H6 to 9 | wire it into the UI, the strings, the voice line |
| H9 to 11 | smoke test green, a demo fixture for the new path |
| H11 to 12 | rehearse twice; the old demos still pass byte for byte |

Pre-pitch the seams in the earlier round ("a new agent is one file, a rule is one config line, a language is a table"), so the surprise round pays off a promise instead of improvising one.

> Field note (ORCA · Vibeathon 2026): the Stage 1 deck had promised the architecture would absorb any challenge through named seams. In the offline round the mentor brief arrived at 12:05 and the new safety gate shipped by 14:50, with 27 commits, 3,213 product lines and 219 new tests, and the old demo untouched.

## 4. Freeze points

Freeze at 65 to 70 percent because the last third has a full job list of its own: hardening, proof, video, deck, rehearsal and submission. At many events those carry most of the score.

After the freeze, allowed:

- fixes on the golden path, with a regression test where one fits;
- honesty fixes: labels, wording, limits, claims that do not match the code;
- demo preparation: runsheet strings, the backup recording, deep links, warm caches;
- performance work that does not change behaviour.

After the freeze, not allowed: new features, new dependencies, schema changes, framework upgrades, "quick" redesigns. Additive contract changes only, when a team is involved.

## 5. Sleep and roles

- Teams sleep in shifts after the freeze, with someone awake who can redeploy.
- One pitch owner, one demo owner. The presenter sleeps before the pitch.
- Solo builders sleep before the final rehearsal and the recording, not after; a tired take costs more time than it saves.

## 6. Submitting early

- Hackathon platforms: everything in 30 minutes before the deadline, leaving room for an upload that fails or a form field nobody read.
- An internal deadline hours before the official one, written in `BULLSEYE.md` with both timezones.
- Government portals: 24 hours early. Do not trust a portal under last-hours load.
- When the form allows edits, submit a complete first version immediately and update it; shortlists can be read in waves.
- Record the submission time with its timezone, tag the submission commit, and keep later work visibly separate.

> Field note (Detour · Graph Hacks 2026): a third track was added on deadline day and the submission tag landed 39 minutes before the deadline; the strongest evidence work (held-out evals, a flow certificate, the claims command) came after the deadline and was not part of the submitted entry.

## 7. Prompt packs when another tool must write the code

Some events judge the use of a specific coding tool. Then the plan becomes a prompt pack: one prompt per plan item, run in order, each ending with an acceptance test.

```text
<n>. <Name>: "<What to build, with concrete nouns, files and data>. Done when <a command passes or a thing is observable>."
```

- "Done when the seed fills the database and /api/health returns row counts."
- "Done when a stockout card turns into a ready-to-send reorder message in 2 clicks."
- "Done when the production URL works logged-out on a phone."

Keep a per-session log (date, prompt, result) committed with the work. It becomes the README's collaboration section and the video's closing beat, and the public history becomes the evidence of in-window work.

## 8. When the clock runs short

Cut from the bottom of the plan, in this order: assets, parity, the stacked loops, all but one wow moment. Never cut the deploy, the demo layer, the smoke test or the negative beat: those are what keep the remaining features demonstrable.
