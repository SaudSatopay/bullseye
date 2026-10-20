# Event formats

The format decides the strategy before the problem statement does. Find the event's row, then read its section. Used in brief-decoder steps 2 and 8 (the battle plan's hour table).

| Format | Seen in | What decides it | Front-load |
|---|---|---|---|
| 8 h onsite | Paytm Build for India (Fineprint) | The pre-built idea deck and a scope of one journey | Deck, data, sandbox access, an hour plan by clock time |
| Overnight onsite, 18–36 h | MUJ HackX 4.0 (Dhaal), TrackShift finale (LINE MARSHAL), ISRO BAH finale (SURYA) | A narrow demo that never breaks, one wow, a rehearsed 5-minute story | War chest, rehearsed deploy, roles, sleep shifts |
| Online, 48–72 h | Graph Hacks 2026 (Detour), Global AI Hackathon Series with Qwen Cloud (VyaparAI) | Proof and polish on a live URL, with the sponsor's tech load-bearing | Preview deploy within 2 h, submission copy at hour 2 |
| Online, multi-week | ET AI Hackathon 2.0 Phase 2 (Trinetra), OpenAI Build Week (StorePilot) | Depth: evidence, external validity, judge rounds | A rubric-driven backlog, clips recorded as features land |
| Idea round, then build | TrackShift, SIH (ORCA), BOI × IIT Hyderabad (MuleShot), MUSA CodeX (FLOODLIGHT), ISRO BAH (SURYA) | The idea gate, often a single-digit advance rate | The exact form fields, proof before pitch, an early v1 |
| Profile shortlist | MUJ HackX 4.0 Round 1 | GitHub, LinkedIn and registration answers | A profile pass for every member |
| Multi-stage with a surprise challenge | Vibeathon 2026 (ORCA) | Seams in the architecture that absorb an unknown task | A Stage 1 deck that promises the seams |
| Government funding programme | MSME Idea Hackathon 6.0 (Smart Retrofit Kit) | Eligibility, choices that lock, anonymity, portal rules | Five decisions locked on day 1 |
| Sponsor-platform hackathon | Graph Hacks (FalkorDB), Gappy AI (Lemma SDK), Qwen Cloud (Alibaba Cloud), CockroachDB × AWS (engram), Slack Agent Builder (Bridge), SerpApi India (kasauti) | The sponsor's tech doing work nothing else could | The rare primitive; the guide's demo apps to avoid |
| Automated scorer | Sigma Squad × BIS (BIS Compass) | The metric on hidden inputs | A sacred scored path; the organiser's scorer unedited |
| Contribution event | Mergetober (a WeMakeDevs campaign) | Merged PRs that meet the maintainers' bar | The bar from a merged PR; assignment before code |

## 8 h onsite

- Teams are small (Paytm: 1–2) and the clock is short, so the idea deck wins the seat and the build proves one journey.
- Plan the build by clock time and ask for what it needs in advance. Fineprint's deck carried "The 8-hour build by clock time", targets declared before the build, a demo script and a three-risk pre-mortem, and closed on a small ask: "A table on Oct 3. NHCX sandbox credentials. Eight hours."
- Hour table, scaled from the 18 h plan below (no 8 h hour log survives in the notes):

| Hours | Share | Do |
|---|---|---|
| H0–H0.5 | 0–6% | Re-read the brief and rules at check-in; confirm the one journey and its golden path |
| H0.5–H1.5 | 6–19% | Skeleton deployed; sandbox credentials tested |
| H1.5–H5 | 19–62% | The one journey end to end |
| H5 | 62% | Feature freeze |
| H5–H6.5 | 62–81% | Demo data, a failure drill, the backup recording |
| H6.5–H8 | 81–100% | Deck numbers from the build, two rehearsals, submit 30 minutes early |

## Overnight onsite, 18–36 h

- Read the real build hours off the schedule, not the branding: MUJ HackX 4.0 was "branded 36-hour" but listed about 18 overnight hours (check-in 11:59, build until 06:00).
- You cannot build from zero overnight. The prep week decides it: generic boilerplate (re-check the rules on pre-written code at check-in), a rehearsed deploy, an AI toolkit tested end to end, pitch machinery, one 6–8 h mock sprint on an invented problem, offline installers and cached models, a hotspot.
- Roles: MUJ's three lanes were Product (frontend, demo, owns the deck from H12), Engine (backend, AI) and Glue (deploys, demo data, golden-path QA, backup video). One pitch owner and one demo owner: "the presenter does not pull the all-nighter".
- Sleep in rotating solo shifts of about 2 h so two people are always on, and the freeze holds.
- Mentor sessions are visibility: mentors talk to judges.

MUJ HackX 4.0, about 18 h:

| Hours | Do |
|---|---|
| H0–H1 | Triage: score candidates on team fit × demo-ability × differentiation; pick in 45 minutes or less; write down the one golden-path flow that must work |
| H1–H3 | Architecture lock, work split, hello-world deployed by H3 |
| H3–H8 | Core build: golden-path MVP end to end by H8 |
| H8–H12 | The wow layer: one differentiator only |
| H12–H15 | Demo data, polish, error-proof the golden path, record a backup demo video |
| H15–H18 | Deck, three pitch rehearsals, README and repo cleanup, submit everything 30 minutes early |

TrackShift finale, 24 h:

| Hours | Do |
|---|---|
| H0–H2 | Set up, re-scope to what is demoable, agree the cut line |
| H2–H12 | Two workstreams in parallel (engine; demo UI). Integrate hourly, never diverge for more than two |
| H12–H16 | Integration freeze, run the metrics, fix only what the demo path touches |
| H16–H20 | Polish the demo, record the backup video, finish the real-world segment |
| H20–H24 | Deck and pitch, rehearsed three times |

> Field note (Dhaal · MUJ HackX 4.0): The freeze was declared at H12, yet hardening ran to 05:35 with judging at 11:00 (130 commits inside the 18-hour build window). After the freeze, allow only golden-path and honesty fixes.

## Online, 48–72 h

- Deploy a preview within about 2 hours of the scaffold; it catches build failures on day 1 instead of deadline day.
- Write the submission copy at hour 2 and refresh it in polish (VyaparAI did, over a 52-hour build). Then run named passes: core, deploy and proof, a wow pass, a stacked pass that closes loops, a parity pass (second language or voice), a polish pass, an asset pass.
- Decide the tracks at intake. Detour entered all three, but added the third on deadline day; its tag landed 39 minutes before the deadline, and its strongest evidence work came after it and did not count.
- Free tiers will bite: budget a hardening track for quotas, size caps, permissions and retired models, and label every degraded mode.

| Share of window | Do |
|---|---|
| 0–4% | Decode, pick, scaffold (this skill) |
| 4–8% | Preview deploy live; submission copy v1 |
| 8–50% | Data, tools and the golden path; the proof harness on day 1 |
| 50–70% | Wow pass and stacked pass |
| 70–85% | Polish pass, README, media |
| 85–95% | Video, form answers, final sweep |
| 95–100% | Buffer: the internal deadline sits here |

> Field note (Detour · Graph Hacks 2026): The first production build failed on Vercel about 2 hours after the scaffold; because the preview went up that early, the bisect and the fix took 13 minutes on the first day of the build.

## Online, multi-week

- Build the core early, then spend the window on depth. Trinetra's 30-day Phase 2 had its six work packages built in the first session; the rest went to eight AI judge rounds (7.3 to 8.0 to 8.5 on the final blind run), external validity, a deck and a proposal.
- Run it day by day with a cut line: StorePilot's plan built "in this order, cut from the bottom" and froze features a day before the buffer day.
- Record demo clips as features land, not on the last day.
- Re-derive every number before each docs pass: Trinetra's artifacts drifted apart (71% vs 67%, 25 vs 29 scenarios).
- Watch for secondary deadlines that close first: Build Week's free credits form closed days before submission, after midnight on the builder's clock.
- For a 3-week window on a sponsor platform, learn the platform before the window opens so the weeks go to building.

## Idea round, then build

- "The idea submission is therefore the real elimination round: expect a single-digit advance rate." TrackShift had 2,444 registrations for a finale expected to match the previous edition's, about 50 teams.
- P0: copy out the exact fields, limits, and whether links and files are allowed; draft to the template. P1: lock a one-page concept and submit v1 immediately when edits are allowed; build a thin vertical prototype ("Evidence beats promises, even at idea stage"); rewrite against the criteria; never ride the deadline.
- Prove the core before pitching it. MuleShot's Round 1 was an idea PDF of at most 1 MB, and it still reported results on the organiser's own data from runnable scripts: a leakage audit, a bootstrap interval, and a baseline built from the brief's own features through the same pipeline.
- Round 2 pays off Round 1's promises: "Round 1, we promised this. Round 2, it runs." (FLOODLIGHT qualified from Round 1.)
- Hand the gate to the sibling skill `idea-round`.

## Profile shortlist

- MUJ HackX 4.0's Round 1 judged LinkedIn, GitHub and registration answers for every member: "a 70–90% cut that happens before any code is written".
- Every member: pin 4–6 repos with real READMEs and live links, show recent activity, fix the bio. Registration answers are an application essay: specifics beat adjectives. Register before the last day and save every confirmation.

## Multi-stage with a surprise challenge

- Vibeathon 2026 allowed pre-developed projects, then gave each team in the 12-hour offline round a mentor's surprise challenge to build into its existing project.
- Stage 1 set up the payoff: a slide read "Hand us any challenge. The crew absorbs it." and listed six seams (a new agent is one file, a provider interface, a rule is one config line, language is a table, API-first surfaces, any coast). It also showed the playbook: "H 0–1 Read the challenge · pick the seam it lands in · post the plan → H 1–6 Build … the rest of ORCA untouched → H 6–9 Wire it to the UI · i18n strings · voice line → H 9–11 smoke_test green · demo-mode fixture for the new path → H 11–12 Rehearse twice · present, old demos still green".
- Stage 2 compressed the project and expanded the day ("the project in 3, the hackathon day in 11"): the mentor's brief with "WHAT THE MENTOR CHECKS" mirrored, before and after, a git-log timeline (12:05 to 14:50, 27 commits), tests before and after, and the old demo kept byte-identical.
- Screens before the build count as deliverables too: ET AI Hackathon 2.0 opened with an AI-proctored MCQ round that had to be passed before the build sprint.

## Government funding programme

- "A funding-and-incubation program, not a weekend coding event": MSME Idea Hackathon 6.0 offered up to ₹15 lakh plus incubation through a host institute, with four review stages (host-institute panel, ministry document check, domain expert committee, approval board).
- Eligibility first: citizenship, age on a set date, a category that cannot change later.
- Five decisions to lock on day 1: the idea (exactly one; duplicates disqualify), the theme, the category, the host institute (consult it first; it locks on submit), the applicant.
- The concept note in eight parts: problem sized, solution, novelty, technical approach with 12-month milestones, budget within the cap, impact, scalability and business model, risks. Plus a one-page block diagram.
- An anonymisation pass before upload, form-safe characters, and submission at least 24 h early. "Submit only if you intend to build it." See `platforms.md` for the portal rules.

## Sponsor-platform hackathon

- Apply the load-bearing test to every idea (Graph Hacks' rules: if the product still works once FalkorDB is taken out, the graph is decoration), and answer it in the README.
- Cover every named sponsor tool where it fits (engram used all 4 of 4 named tools) and show each one: a primitives table (primitive, where, what it does), "why this is meaningful use, not a wrapper", "what we did not have to build".
- Deploy where the rules say: VyaparAI had to run on Alibaba Cloud with Qwen APIs, and captured a deployment-proof screenshot.
- Licence rules can be specific: the CockroachDB × AWS rules required MIT or Apache, so engram shipped Apache 2.0.
- Give the sponsor specific technical feedback in the form; enter the blog prize if there is one.

## Automated scorer

- Sigma Squad × BIS scored 40 points automatically (Hit@3, MRR@5, latency) before six manual criteria.
- Keep the scored entry point sacred: no network or LLM calls, a try/except per input, exactly one output per input, a test that runs it offline and asserts the schema and a quality floor. Copy the organiser's scorer verbatim and never edit it; the setup script self-scores on the judge's machine. Depth in the sibling skill `prove-it`.
- CTF qualifiers belong here too: a tracked CTF required a write-up after the 48-hour qualifier, and a missing write-up could void qualification. Put the write-up in the requirements gate.

## Contribution event

- Mergetober: derive the bar from a merged PR, the maintainers' issue text and the review fixes on another PR. Propose an issue, get assigned, then build; no code before assignment.
- At most 5 open PRs, no pinging maintainers, DCO sign-off and no AI trailers; every new test must fail if its fix is removed; an independent review pass before the PR; a walkthrough so the human can defend every line ("AI-generated PRs" get people banned); a public blog post per PR in the contributor's own words.
- Hacktoberfest-style events have the same shape.

## Solo or team

- Solo can win: last edition's ET winner was a solo builder who beat teams of four, and Trinetra, StorePilot, BIS Compass and RegSutra were solo builds. Solo means one golden path, agents as parallel lanes, AI judge rounds as the second pair of eyes, and an owner checklist so human-only actions do not stall the ship.
- Teams need a protocol: Dhaal ran three lanes, each in its own Claude Code session on one repo, with one branch, contracts first, claim-before-build locks, a runnable main and a freeze at H12 (team mode in the sibling skill `build-sprint`).
- Some events check every named member (TrackShift: active UG or PG students in India, teams of 2–4); confirm all of them in step 2.
