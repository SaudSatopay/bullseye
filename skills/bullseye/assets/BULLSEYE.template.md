# BULLSEYE · {{project}} · {{event}}

status: phase=intake step=0 updated={{ISO timestamp}} next="Decode the brief (brief-decoder)"
deadline: label="{{what}}" official="{{deadline in the organiser's zone}}" yours="{{same moment on your clock}}" internal="{{official minus buffer}}" buffer={{24h}} tminus="{{T-…}}" asof={{ISO}}
<!-- Generated, never typed: node <brief-decoder>/scripts/tminus.mjs "<label>=<deadline with zone>" --buffer 24h --line -->

process: {{private | public}} <!-- private: this file, MISSILE.md, PRODUCT.md, DESIGN.md, judging/ stay gitignored. CLAIMS.md and LIMITS.md are always public. -->

<!--
This is the control file for one hackathon. Every BULLSEYE skill reads it first and writes its own section.
Rules: update the status line at the end of every session; never delete history in Log; dates are absolute (2026-10-18, not "Saturday").
-->

## Contract
<!-- Owner: brief-decoder. Filled from brief-decoder/assets/contract.template.md, which has the full slots and filling rules. Facts carry a source and a read date; rules are quoted verbatim; "not published" is an answer, a blank is not. -->

### Facts

| Fact | Value | Source |
|---|---|---|
| Event | {{name}} · {{organiser}} · {{platform}} | |
| Format | {{online / onsite}} · {{build window}} | |
| Team and eligibility | {{size}} · "{{eligibility rule}}" · {{member PASS / ASK}} | |
| Prizes | {{main}} · side prizes: {{blog, sponsor tracks}} | |
| Edits after submitting | {{allowed until the deadline / locked on submit}} | |

### Deadlines

| What | Official (organiser zone) | Your clock | Internal | Note |
|---|---|---|---|---|
| {{Final submission}} | | | | |

### Rounds

| Round | What is judged | Dates | Who judges | Advance |
|---|---|---|---|---|

### Deliverables and limits

| Deliverable | Exact limit | Format and naming | Where it goes | Source |
|---|---|---|---|---|

### Hard rules (verbatim)

- {{topic}}: "{{rule as written}}" ({{source}}, read {{date}})

### Disqualifiers and traps

- {{trap}}: {{how we avoid it}}

### Requirements gate
<!-- One line per deliverable and hard rule, exact shape (submission-pack lints it):
- [ ] R<n> [hard|scored] <requirement> · check: cmd: <command> (pass: <result>) | manual: <one line> · source: <where>, read <date> -->

- [ ] R1 [hard] {{requirement}} · check: {{cmd or manual}} · source: {{where}}, read {{date}}

### Judging

| Criterion | Weight | What wins it | Our evidence | Where it shows | Owner |
|---|---|---|---|---|---|

Non-code share: {{n of m criteria}}. Implication: {{one line}}.

### Sponsor-tech test

Required: {{tech}}. If we removed it, {{what stops working}}. A judge sees it at {{where}}.

## Thesis
<!-- Owner: brief-decoder. -->
- **One-liner (a claim, not a greeting):**
- **Problem statement:** {{id}} · runner-up: {{id}} · why this one:
- **The moment:**
- **Dual layer:** proof: {{event domain}} · point: {{real-world problem}}
- **Why we win, per criterion:**
- **Signature moment:**
- **Jury:** {{who}}; weight what they reward:
- **Out of scope, on purpose:**

## Owner checklist
<!-- Owner: bullseye. Things only a human can do. Do them on day 1; they cap the "shipped" score when left to the end. -->
- [ ] Register every team member; confirm eligibility
- [ ] Accounts and API keys created; keys stored in `.env` (never pasted into chat)
- [ ] Production keys set on the host (Vercel / Render / other)
- [ ] Repository created; visibility plan (public at submission?)
- [ ] `gh auth` has the `workflow` scope if CI will run
- [ ] Deploy target linked; preview URLs reachable logged-out
- [ ] Video hosting decided (YouTube unlisted / Drive public)
- [ ] Judge access arranged (sandbox invites accepted, demo credentials)
- [ ] Commit attribution policy decided before the first commit
- [ ] Release tag planned for the submission commit

## Plan
<!-- Owner: build-sprint. Golden path first, then items. Every item has an Accept line and an effort (S < 30 min, M < 2 h, L). -->

**Golden path (the demo that must never break):**
1. {{beat}}
2. {{beat}}
3. {{beat}}

| Id | Item | Accept: | Effort | Status | Commit |
|---|---|---|---|---|---|
| F1 | Foundations: typecheck, lint, test, build green | four commands exit 0 | S | | |

## Claims
<!-- Owner: prove-it. Headline numbers only; the ledger lives in CLAIMS.md, the values in facts.json. -->

| Claim as written | Value | Label | Measured by | Pinned by |
|---|---|---|---|---|

## Judge rounds
<!-- Owner: judge-panel. -->

| Round | Type | Date | Weighted score | Lowest criterion | Top finding | Fixed? |
|---|---|---|---|---|---|---|

## Submission
<!-- Owner: submission-pack. -->
- [ ] README for judges · [ ] SUBMISSION.md · [ ] deck · [ ] video · [ ] live URL · [ ] repo public · [ ] tag
- Final sweep: {{result and date}}
- Submitted: {{time with timezone, or "not yet"}}

## Decisions
<!-- All skills. One dated line each, with the why. -->
- {{YYYY-MM-DD}}: {{decision}}, because {{reason}}.

## Risks

| Risk | Likelihood | Mitigation | Owner |
|---|---|---|---|

## Handoff
<!-- Owner: bullseye. Rewrite at the end of every session. A fresh session must be able to continue from this block alone. -->
**Next session starts here.**
- State:
- In progress:
- Next steps (exact):
- Commands:
- Gotchas already paid for:

## Log
<!-- All skills. Newest first. One block per pass. -->

### ▶ STATUS · {{pass name}} · {{YYYY-MM-DD HH:MM TZ}}
- Changed:
- Verified:
- Numbers:
- Next:
