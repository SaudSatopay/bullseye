<!--
The two BULLSEYE.md blocks owned by brief-decoder: ## Contract and ## Thesis.
Paste both into the project's BULLSEYE.md, replacing any empty versions. Filling rules:
- Every fact carries a source and a read date. "not published" is an answer; a blank is not.
- Quote rules verbatim, in quotation marks. Never paraphrase a rule.
- Times come from tminus.mjs: official (organiser zone), your clock, internal (official minus the buffer).
  node "<brief-decoder>/scripts/tminus.mjs" "<deadline with zone>" --buffer 24h
  Paste its --line output under the status line at the top of BULLSEYE.md.
- Requirements gate lines keep their exact shape: submission-pack lints them before submission.
Delete these comments as you fill the blocks.
-->

## Contract

Sources: `brief/sources.md` · last full read {{YYYY-MM-DD}} · run `refresh` at check-in and before submitting.

### Facts

| Fact | Value | Source |
|---|---|---|
| Event | {{name}} · {{organiser}} · {{platform}} | {{URL}} |
| Format | {{online / onsite / hybrid}} · {{build window and real hours}} | {{page}} |
| Team | {{size range}} · {{one team per person?}} · {{cross-institution allowed?}} | {{page}} |
| Eligibility | "{{rule, verbatim}}" · {{member A PASS · member B ASK}} | {{page}} |
| Prizes | {{main prizes}} · side prizes: {{best blog post, sponsor prizes}} | {{page}} |
| Field | {{registrations}} on {{date}} · last edition's finale: {{n teams}} | {{page}} |
| Edits after submitting | {{allowed until the deadline / locked on submit}} | {{page}} |
| Updates channel | {{Discord channel / email / platform updates}} | {{page}} |

### Deadlines

<!-- One row per round. Buffer: at least 24 h for online portals, at least 30 min onsite. Flag after-midnight landings. -->

| What | Official (organiser zone) | Your clock | Internal | Note |
|---|---|---|---|---|
| {{Idea submission}} | {{Sat 2026-09-05 23:59 Asia/Kolkata (UTC+05:30)}} | {{Sat 2026-09-05 21:29 Asia/Riyadh (UTC+03:00)}} | {{Fri 2026-09-04 21:29}} | {{edits allowed until the deadline: submit v1 early}} |
| {{Final submission}} | {{...}} | {{...}} | {{...}} | {{lands after midnight on your clock?}} |

### Rounds

| Round | What is judged | Dates | Who judges | Advance |
|---|---|---|---|---|
| {{1 · idea}} | {{concept PDF, 1 MB cap}} | {{dates}} | {{panel}} | {{n of N}} |
| {{2 · build}} | {{prototype, deck, video}} | {{dates}} | {{panel}} | {{n of N}} |
| {{finale}} | {{live pitch and Q&A, minutes}} | {{dates}} | {{jury}} | {{prizes}} |

### Deliverables and limits

| Deliverable | Exact limit | Format and naming | Where it goes | Source |
|---|---|---|---|---|
| Demo video | {{at most 3:00}} | {{public YouTube with audio / Drive link}} | {{form field}} | {{FAQ}} |
| Deck | {{n slides · at most 10 MB · fonts embedded}} | {{TeamName_Institution_Category.pptx}} | {{upload}} | {{rules}} |
| Repo | {{public at submission}} · licence {{MIT or Apache-2.0}} | {{history inside the window}} | {{form field}} | {{rules}} |
| README | required sections: "{{...}}" | | {{repo}} | {{rules}} |
| Live URL | {{works logged-out, seeded}} | | {{form field}} | {{rules}} |
| Form | {{Title at most 100 chars · Description at most 1,500 chars}} | {{plain text: the boxes do not render Markdown}} | {{portal}} | {{form}} |
| {{Other}} | {{no limit stated (checked <page>)}} | | | |

### Hard rules (verbatim)

- Pre-existing work: "{{...}}" ({{source}}, read {{date}})
- AI use and disclosure: "{{...}}" ({{source}}, read {{date}})
- Open source and licences: "{{...}}" ({{source}}, read {{date}})
- Sponsor tech: "{{...}}" ({{source}}, read {{date}})
- Data: "{{...}}" ({{source}}, read {{date}})
- Anonymity and identity: "{{...}}" ({{source}}, read {{date}})
- IP and ownership: "{{...}}" ({{source}}, read {{date}})
- Written answers from the organisers: "{{our question}}" answered "{{their answer}}" ({{channel}}, {{date}})

### Disqualifiers and traps

- {{Identity details inside an anonymous document or its file metadata}}: {{anonymisation pass before every upload}}
- {{A video over the cap}}: {{cut to the cap minus 10 s; check with ffprobe}}
- {{A required README section missing}}: {{R line plus a grep check}}

### Requirements gate

<!--
One line per deliverable and per hard rule, in this exact shape (submission-pack lints it):
- [ ] R<n> [hard|scored] <requirement> · check: cmd: <command> (pass: <result>) | manual: <one line a person verifies> · source: <where>, read <date>
[hard] disqualifies when missed; [scored] costs points. Number from R1 and never renumber.
-->

- [ ] R1 [hard] Every member meets the eligibility rule: {{rule}} · check: manual: each member confirmed in writing · source: {{rules}}, read {{date}}
- [ ] R2 [hard] Submitted before the internal deadline {{internal}} · check: manual: confirmation saved in brief/ · source: Deadlines
- [ ] R3 [hard] {{Demo video at most 3:00, public, with audio}} · check: cmd: ffprobe -v error -show_entries format=duration -of csv=p=0 {{video}} (pass: 180 or less); manual: link opens in a private window · source: {{FAQ}}, read {{date}}
- [ ] R4 [hard] {{Repo public with an MIT licence}} · check: cmd: gh repo view --json visibility,licenseInfo (pass: PUBLIC, mit) · source: {{rules}}, read {{date}}
- [ ] R5 [hard] {{README section "<name>"}} · check: cmd: grep -in "{{name}}" README.md (pass: a heading matches) · source: {{rules}}, read {{date}}
- [ ] R6 [scored] {{The sponsor tech does real work}} · check: manual: the README answers "does it still work without it?" with a no and a reason · source: {{rules}}, read {{date}}

### Judging

Judges: {{who they are, and what they will see through}}. Weights: {{published | not published | proxy built from <source>}}. Screening before scoring: {{pass/fail stage, automated metric, profile screen, none}}.

| Criterion | Weight | What wins it | Our evidence | Where it shows | Owner |
|---|---|---|---|---|---|
| {{Innovation}} | {{25}} | {{a mechanism nobody else shows}} | {{...}} | {{product · deck · video · README}} | {{lane}} |
| {{Business impact}} | {{25}} | {{buyer, sized market, expected-value ROI}} | {{...}} | {{deck · form}} | {{lane}} |
| {{Technical}} | {{20}} | {{works live, numbers reproduce}} | {{...}} | {{repo · README Evidence}} | {{lane}} |

Non-code share: {{3 of 5 criteria, 60%}}. Implication: {{narrow demo that never breaks + one wow + a tight 5-minute story with impact numbers}}.

### Sponsor-tech test

Required: {{tech}}. If we removed it, {{what stops working}}. A judge sees it at {{screen, README section, video beat}}.

## Thesis

**One-liner (a claim):** {{what it does, for whom, with the number that makes it checkable}}

**Problem statement:** {{id · title}} · runner-up: {{id}} · why this one: {{one line}} · matrix in `brief/battle-plan.md`

**The moment:** {{the real scene the product exists for, with a date and a number}}

**Dual layer:** proof: {{the event's domain}} · point: {{the real-world or national problem}}

**Why we win, per criterion:**
- {{Criterion (weight)}}: {{evidence, one line}}
- {{Criterion (weight)}}: {{evidence, one line}}

**Signature moment:** {{what a judge sees on screen within 10 seconds}}

**Jury:** {{who}}. Weight what they reward: {{governance over flash / business case / rigour / load-bearing sponsor tech}}

**Out of scope, on purpose:** {{feature}} ({{why}}) · {{feature}} ({{why}})
