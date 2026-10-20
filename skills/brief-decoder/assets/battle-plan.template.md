# {{Event}}: battle plan

<!--
Internal team brief, written by brief-decoder step 8 into brief/battle-plan.md (gitignored).
Share it privately (team drive, private page, PDF). Never commit it to a public repo.
Fill from the Contract, brief/scan.md and the decision matrix. Delete guidance comments as you go.
-->

Confidential team brief · compiled {{YYYY-MM-DD}} · {{n}} days before {{the first deadline}}

## Deadline

**{{ROUND}} DEADLINE: {{Sat 5 Sep · 23:59 IST (UTC+05:30)}}**, which is **{{Sat 5 Sep · 21:29}}** on your clock.
Internal deadline: **{{Fri 4 Sep · 21:29}}** on your clock ({{24 h}} buffer).
{{If it lands after midnight on your clock: "Treat the evening of <day> as submission night; do not plan around <next day>."}}

<!-- node "<brief-decoder>/scripts/tminus.mjs" "<official deadline with zone>" --buffer 24h -->

## Critical facts

| Fact | Value |
|---|---|
| Format | {{online idea round, then a 24 h onsite finale}} |
| Build window | {{dates and real hours (the schedule, not the branding)}} |
| Team size | {{2–4}} · {{one team per person}} |
| Eligibility | {{who may enter}} |
| Prize pool | {{main}} · side prizes: {{best blog, sponsor prizes}} |
| Field size | {{registrations}} on {{date}} · last edition's finale: {{n teams}} |
| Shortlist waves | {{dates}} |
| Edits after submitting | {{allowed until the deadline / locked on submit}} |
| Updates channel | {{Discord / email / platform notifications}} |
| Support | {{official contact page}} |

## Eligibility check: before anything else

"{{Rule, verbatim}}" ({{source}}). Every named member confirmed: {{yes / pending: who, what}}.
If anyone fails, stop: change the roster or the event before investing another hour.

## What this event actually is

{{Who runs it: organiser, sponsors, implementer. Last edition: field size, finale size, what won. This edition: registrations so far. Seats at the next stage against the field gives the advance rate. Who judges, and what they will see through.}}

<!-- Write this event's version of: "The idea submission is therefore the real elimination round: expect a single-digit advance rate." and "The jury will include people who do this for a living: technical hand-waving will be found out." -->

## The strategic read

{{Quote the organiser's own framing. Name the tension between what the brief literally asks and what the criteria reward. State the winning shape in one paragraph.}}

<!-- Example shape (dual layer): build the domain tool exactly as the brief specifies (proof of concept, real data, measurable accuracy) and demonstrate the same engine on one concrete real-world deployment. Criteria such as scalability and real-world impact are nearly unscoreable for a pure-domain tool; the dual layer hits all of them. -->

## Criteria grid

| Criterion | Weight | Evidence that hits it |
|---|---|---|
| {{Problem understanding}} | {{weight or not published}} | {{Quantify the pain with real incidents and numbers}} |
| {{Innovation}} | | {{The mechanism nobody else shows}} |
| {{Technical execution}} | | {{Working pipeline on real data, metrics reported by submission day}} |
| {{Scalability}} | | {{Named deployment path with market numbers}} |
| {{Real-world impact}} | | {{A measurable outcome: lives, money, hours}} |
| {{Presentation}} | | {{Tight deck, live demo, 90-second video, rehearsed}} |

Non-code share: {{3 of 5}}. Implication: {{a narrow end-to-end demo that never breaks, one genuine wow moment, a tight 5-minute story with impact numbers}}.

## Last edition and the field

- Winning formula: {{4 to 6 traits}} ({{source}})
- Crowded clusters to avoid: {{cluster: n of N repos}}
- Sponsor guide demo apps (not our core idea): {{...}}
- Sponsor tech that is load-bearing for us: {{primitive}}. Without it, {{what stops working}}.
- Blog or side-prize field: {{n posts, median reactions, the strongest titles}}

## Problem statement decision matrix

<!-- Decide in one sitting: 45 minutes inside a build window, the same day before one. Optimize for win probability, not existing strengths. -->

| PS / theme | What you build | Data reality | Demo power | Differentiation | Team fit | Risk | Win probability | Call |
|---|---|---|---|---|---|---|---|---|
| {{PS 1}} | {{one line}} | {{free, real, reproducible?}} | {{High: judges see it work}} | {{uncrowded}} | {{...}} | {{the hard part, scoped}} | {{High}} | **Primary pick** |
| {{PS 2}} | | | | | | | | Pick if {{condition}} |
| {{PS 3}} | | | | | | | | Only with {{capability}} |

## Why the pick

- {{The incident that writes the opening slide.}}
- {{The data unlock or unfair advantage most teams will not have.}}
- {{The brief's deliverables we hit almost mechanically.}}
- {{The real-world layer: the same engine on one named deployment.}}

Runner-up: {{PS}}. Switch if {{trigger}}.

## Decisions to lock today

1. {{Problem statement}} (exactly one; duplicate or similar ideas can disqualify)
2. {{Track(s) entered, and where each one shows}}
3. {{Roster and roles: one pitch owner, one demo owner}}
4. {{Anything locked at submission: category, host institute, applicant}}
5. {{Stack, sponsor tech first}}

## The plan

### P0 Grid position · {{today}}

- [ ] Confirm the eligibility of every member; finalise the roster.
- [ ] Every member registers (owner action), before the registration deadline: {{date}}.
- [ ] Open the submission form. Copy out the exact fields, limits, and whether links and files are allowed. We draft to the template, not to a generic deck.
- [ ] Lock the problem statement with the matrix above. Decide today; the calendar has no slack.
- [ ] Set up the private repo, the shared drive and the data path for the pick.

### P1 Qualifying: the idea gate · {{dates}}

- [ ] Lock the one-page concept: quantified problem, architecture sketch, dual-layer impact, build-window scope, roles. If edits are allowed, submit v1 immediately: early entries may get two reads across shortlist waves.
- [ ] Build a thin vertical prototype: screenshots, a 90-second recording, the repo link if the form takes links. Evidence beats promises, even at idea stage.
- [ ] Rewrite against the criteria, one paragraph each. Name the metrics you will report.
- [ ] Final submit by the internal deadline. Do not ride the official one.

### P2 Pit prep · {{dates}}

- [ ] Ask the organisers in writing what pre-built work may come into the build. Get it in writing; disclose everything.
- [ ] War chest: generic boilerplate, a rehearsed deploy, cached models and installers, a QR to the live demo, one mock sprint on an invented problem.
- [ ] Offline fallbacks: datasets downloaded, models cached, a recorded demo video. Assume venue Wi-Fi fails.
- [ ] Deck skeleton mapped to the criteria; two full demo rehearsals.
- [ ] Logistics: travel, IDs, laptops, chargers, hotspot, power bank.

### P3 The race · {{start}} to {{end}}

<!-- Scale the shares to the real window; references/event-formats.md has tables for 8 h, 12 h, 18 h, 24 h and 48–72 h. -->

| Hours ({{18 h}} window) | Share | Do |
|---|---|---|
| H0–H1 | 0–5% | Read the PS twice. Score candidates on team fit, demo power and differentiation; pick within 45 minutes. Write the 6–8 golden-path beats. |
| H1–H3 | 5–15% | Lock architecture and contracts, split the work, deploy a hello-world. Build features into a live app, not toward a scary final deploy. |
| H3–H8 | 15–45% | Golden path end to end. Integrate hourly; never diverge for more than two hours. |
| H8–H12 | 45–65% | The wow layer: one differentiator only. |
| H12 | 65% | Feature freeze. After it, only golden-path and honesty fixes. |
| H12–H15 | 65–85% | Demo data, error-proof the golden path, record the backup video. |
| H15–H18 | 85–100% | Deck, README, three rehearsals, submit everything 30 minutes early. |

Sleep in rotating shifts so two people are always on. One pitch owner, one demo owner: the presenter does not pull the all-nighter.

Pitch arc: {{the incident}} → {{the tool, live}} → {{the numbers}} → {{the real-world layer}} → {{the ask}}.

## Quality bar

Idea doc: numbers in the problem statement · architecture diagram · named data sources · declared metrics · a real-world deployment path with market size · honest build-window scope. If any is missing, it is not done.

Build: the golden path never breaks · one wow · every external call has a mocked fallback · backup video in two places · every number on a slide reproduces from a command.

## Risks and open items

| Item | Status | Action |
|---|---|---|
| {{Exact submission form fields}} | Unknown | {{Behind login: pull them at registration, then draft to them}} |
| {{Member eligibility}} | Unverified | {{Confirm before any further investment}} |
| {{Pre-built work allowed in the build}} | Ambiguous | {{Email the organisers; disclose every pre-built component}} |
| {{Schedule inconsistencies between pages}} | Noted | {{Trust the official page; record both readings}} |
| {{Footage or data licensing}} | Mitigated | {{Own recordings, open data with provenance}} |

Status tags: Unknown · Unverified · Ambiguous · Noted · Mitigated.

## After submission

{{The evaluation chain: stage, who, what they check, when.}} Record "SUBMITTED {{time}}, under review" and the next gates in the project README and in BULLSEYE.md. Do not edit after the deadline.

## Verified links

Official only, checked {{date}}: {{event page}} · {{rules}} · {{FAQ}} · {{submission portal}} · {{updates channel}}.

If anyone asks for money to register, to guarantee a slot or to submit for you, it is not the organiser. Use only the links above.
