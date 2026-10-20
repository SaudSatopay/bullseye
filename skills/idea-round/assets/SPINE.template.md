# {{Product}} · idea spine

<!--
Private working file: strategy, numbers and the hardening log. Keep it out of the public repo under the
process-file policy, like BULLSEYE.md. The brief, the deck and the form essays are written from this file,
and every number lives in the Numbers table below: a changed number changes here first.
Facts about the event (limits, rules, dates) live in BULLSEYE.md ## Contract, not here.
-->

status: {{draft | locked YYYY-MM-DD | submitted YYYY-MM-DD HH:MM TZ}}
event: {{event}} · round: {{round}} · internal deadline: {{YYYY-MM-DD HH:MM TZ}}

## 1. Round plan

| Artifact | Meets | Limit (from the Contract) | Built by | Status |
|---|---|---|---|---|
| {{Concept brief, A4, about 8 pages}} | {{R1, R2}} | {{PDF, at most 10 MB}} | pitch-deck | {{todo / draft / final}} |
| {{Idea deck, 16:9, speaker notes}} | {{R3}} | {{slides, MB, fonts}} | pitch-deck | |
| {{Organiser-template cut}} | {{R4}} | {{exact slide count, naming rule}} | pitch-deck | |
| {{Form pack: idea/SUBMISSION-FORM.md}} | {{R5}} | {{fields and limits}} | idea-round | |
| {{90-second recording}} | {{R6}} | {{length, host, public}} | demo | |

Rhythm: {{v1 early, then resubmit after hardening | one submission at the internal deadline, at least 24 h early}}
Route: {{government gate (step 9) · template (step 8) · re-pitch or staged rounds (step 10) · organiser data (step 4)}}
Unconfirmed facts: {{each one also in BULLSEYE.md ## Risks with its action}}

## 2. Quality bar

- [ ] Numbers in the problem statement
- [ ] Architecture diagram
- [ ] Named data sources
- [ ] Declared metrics
- [ ] Real-world deployment path with market size
- [ ] Honest scope for the build window

| Criterion (weight) | What wins it | Our evidence | Where it shows |
|---|---|---|---|
| {{Innovation (25)}} | {{}} | {{}} | {{brief p. 3 · deck 5 · form Q1}} |

Dual layer: the proof is {{the event's domain}}; the point is {{the real-world problem}}.
This jury scores: {{what they weight most}}, so it gets the most room on {{pages or slides}}.

## 3. The spine

<!-- Headlines are claims, usually in two beats. Read the 14 headlines aloud with nothing under them: they must argue the case. -->

| # | Part | Headline (a claim) | What goes on it | Numbers | Chip |
|---|---|---|---|---|---|
| 1 | Cover | {{NAME}} / {{3 to 5 word tagline}} | event · theme · date · team · DOC {{id}} · REV {{n}} · photo with a labelled overlay | | |
| 2 | Problem | | one dated incident: {{}} · three numbers · a log or a cascade | N1 N2 N3 | |
| 3 | Gap and why now | | solved elsewhere: {{field year}} · {{field year}} · {{ours}} STILL MANUAL {{year}} · rails now live · the empty seat | | |
| 4 | Reframe and solution | | reframe: {{one line}} · verbs: {{3 to 6}} · principle: {{one line}} | | |
| 5 | Product mock | | featured case: {{the uncertain one, its confidence, handed to a human}} · ILLUSTRATIVE label | | {{PROTOTYPED}} |
| 6 | How it works | | layers: {{}} · budget: {{latency or cost}} · why it holds up | | |
| 7 | Unfair advantage | | Everyone else: {{}} Us: {{}} · the arithmetic | | |
| 8 | Proof declared in advance | | targets: {{3 or 4}} · how measured, on what · baselines | | |
| 9 | Impact | | typed numbers · not yet counted: {{}} | | |
| 10 | Transfer and scale ladder | | rungs: {{NOW · NEXT · THEN}} · invariant: {{same engine}} · market size | | |
| 11 | Business model or sponsor fit | | {{or: not used, because}} | | |
| 12 | Execution | | hour plan · demo chain · backup video · pre-mortem | | |
| 13 | Close | {{tagline}} | the ask: {{small, specific}} · roster · sources · disclaimer | | |
| 14 | Appendix | Every number, and where it came from. | sources · method · credits | all | |

- [ ] Read-aloud check passed: the 14 headlines alone argue the case.

## 4. Numbers

<!-- One row per number, exactly as written in the artifacts. Labels: SOURCED, MEASURED, SIMULATED, PROJECTED, TARGET, ILLUSTRATIVE.
     form-check.mjs --numbers reads this table. -->

| id | As written | Label | Source or script | Date | Appears in |
|---|---|---|---|---|---|
| N1 | {{1,200+}} | {{SOURCED}} | {{publisher, title}} | {{year}} | {{brief p. 2 · deck 2 · form Q1}} |
| N2 | {{90%}} | {{MEASURED}} | {{proof/03_hardened_cv.py on the provided file}} | {{YYYY-MM-DD}} | {{}} |
| N3 | {{<2 s}} | {{TARGET}} | {{measured live at the finale, crossing to alert}} | | {{}} |

## 5. Proven and open risks

| Proven (script or evidence) | Open risk (and the plan) |
|---|---|
| {{the core on the organiser's data: proof/...}} | {{real-time serving end to end: Phase 2}} |

## 6. Claims changed in hardening

| # | Draft | Final | Why | Caught by |
|---|---|---|---|---|
| 1 | {{"freezes the proceeds"}} | {{"recommends a hold, maker-checker, audit-logged"}} | {{autonomy overclaim}} | {{critic / second model / self}} |

## 7. Disclosure of existing work

{{What existed before this event, what is new in this round, which open source is reused. The same text goes on the artifact.}}

## 8. Next round

{{The promises this submission makes, each with the test that will prove it, and the prep list with dates.}}
