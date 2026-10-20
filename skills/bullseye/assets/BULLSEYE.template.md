# BULLSEYE · {{project}} · {{event}}

status: phase=intake step=0 updated={{ISO timestamp}} next="Decode the brief (brief-decoder)"
deadline: {{official deadline, ISO with offset}} ({{same moment in local time}}) · internal: {{official minus buffer}} · {{T-minus}}
process: {{private | public}} <!-- private: this file, MISSILE.md, PRODUCT.md, DESIGN.md, judging/ stay gitignored. CLAIMS.md and LIMITS.md are always public. -->

<!--
This is the control file for one hackathon. Every BULLSEYE skill reads it first and writes its own section.
Rules: update the status line at the end of every session; never delete history in Log; dates are absolute (2026-10-18, not "Saturday").
-->

## Contract
<!-- Owner: brief-decoder. Facts only, with the source of each. Quote rules verbatim. -->

| Fact | Value | Source |
|---|---|---|
| Event / organiser / platform | | |
| Format and window | <!-- online/onsite, start → end with timezone --> | |
| Team rules and eligibility | | |
| Submission deadline | <!-- official, then local time --> | |
| Rounds | <!-- idea gate → shortlist → build → finale, with dates --> | |
| Prizes and side prizes | <!-- include blog prizes, sponsor tracks --> | |

**Deliverables (with limits):**
- [ ] {{deliverable}}: {{format, length or size cap, naming rule, where it is uploaded}}

**Hard rules (verbatim):**
> {{rule as written by the organiser}}

**Instant-rejection traps:** {{anonymity, pre-existing work, file limits, eligibility, AI disclosure}}

**Rubric:**

| Criterion | Weight | What wins it | Our evidence | Where it shows | Owner |
|---|---|---|---|---|---|
| | | | | product / deck / video / README | |

**Judges:** {{who, and what they reward}}
**Sponsor test:** does the product still work without {{sponsor tech}}? {{answer; if yes, the tech is decoration}}

## Thesis
<!-- Owner: brief-decoder. -->
- One-liner (a claim, not a greeting):
- Problem statement chosen, and why (runner-up and why not):
- The moment a judge leans in:
- Why we win, per criterion:
- Dual layer: {{event domain as proof}} → {{real-world problem as the point}}
- Signature moment:
- Out of scope:

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
