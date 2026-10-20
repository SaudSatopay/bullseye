# Concept note templates

<!--
Two shapes. Copy one into idea/CONCEPT-NOTE.md and delete the other.
  A. Eight parts: a government funding or incubation call that evaluates an idea for a 12-month prototype
     (MSME Idea Hackathon pattern). Often anonymous, often with citations forbidden.
  B. Eleven sections: a lender, bank or ministry round that wants a concept note from a team with a working
     prototype (NABARD Hackathon pattern).
Both: A4, plain declarative prose with tables where they help, every number in the Numbers table of
idea/SPINE.md with its label, exported to PDF and looked at page by page. The sibling pitch-deck renders it.
-->

---

## Shape A · Eight-part concept note (funding programme)

<!--
Anonymity, when the rules require it: no name, phone, email, institution, brand or firm name, and no references
to research papers, news articles or any individual or firm, in the note, the block diagram or their metadata.
Size markets in words. Nothing copied. Run form-check.mjs --anon --terms "<names>" on the text before export.
-->

# {{Descriptive title: what it is + what it does + for whom}}

Theme: {{theme name, verbatim}} · Category: {{category}}

### 1. Problem statement

{{The pain in the user's terms, sized: how many units, how much money, time or energy lost, in words when citations are forbidden. Why existing options do not reach them.}}

### 2. Proposed solution and how it works

{{What it is, what is inside it, how it works step by step, what it reports or does, how the user receives it (languages, SMS, offline behaviour).}}

### 3. Novelty compared with what exists

{{Contrast with what exists and whom it was built for. Then the differentiators, numbered, each with a number: install time, price, offline, self-learning. Close: this combination at this price is not available today.}}

### 4. Technical approach and prototype plan (12 months)

| Months | Milestone | Deliverable | How it is measured |
|---|---|---|---|
| {{1-3}} | {{hardware or core v1}} | {{}} | {{}} |
| {{4-6}} | {{firmware, model or software}} | {{}} | {{}} |
| {{7-9}} | {{pilot on N units at M sites}} | {{}} | {{}} |
| {{10-12}} | {{measured impact, unit cost validated}} | {{}} | {{declared targets}} |

### 5. Indicative budget within {{cap}}

| Head | Range | Basis |
|---|---|---|
| {{Components and bill of materials}} | {{Rs x to y}} | {{}} |
| {{Fabrication and enclosures}} | | |
| {{Testing and certification}} | | |
| {{Pilot deployment}} | | |
| {{Contingency}} | | |
| **Total** | {{Rs x to y, within the cap}} | lean by design |

### 6. Impact

{{Cost reduction, quality of life, the clean or green angle, jobs. Each impact typed: TARGET, PROJECTED with its condition, or SOURCED.}}

### 7. Scalability and business model

{{Who pays, the price, the distribution channel, the growth path from the pilot to volume, export headroom.}}

### 8. Risks and mitigation

| Risk | Likelihood | Mitigation |
|---|---|---|
| {{}} | {{low / medium / high}} | {{}} |

<!--
Innovation dimensions, when the programme lists them (MSME: ideation, technology, marketing and branding, social
innovation, open innovation, co-creation, entrepreneurship, business-model innovation): one or two sentences
each, placed where they fit above.
Block diagram: one page, inputs -> modules -> outputs with data and energy flows; no names or logos; vector PDF
with a PNG backup; an alphanumeric file name.
-->

---

## Shape B · Eleven-section concept note (prototype already built)

# {{Name}}: {{tagline}}

Theme: {{theme name, verbatim}}

### 1. Executive summary

{{Two paragraphs. First: what it gives whom, in one sentence a judge can repeat. Second: "We are not submitting only an idea: a working prototype already exists." followed by two or three measured results with their labels (SIMULATED when the data is synthetic).}}

### 2. The problem

- {{Who is hurt, with a sourced number}}
- {{What they lack today}}
- {{When the problem is discovered, and why that is too late}}
- {{The signal that now exists at national scale and that nobody has joined up}}

### 3. What {{Name}} delivers

| Output | What it answers | For whom |
|---|---|---|
| {{output}} | "{{the user's question}}" | {{user}} |

{{The surfaces: dashboard, API, messages, and which are roadmap.}}

### 4. How it works

#### 4.1 Data strategy

| Source | Signal | Access rail |
|---|---|---|
| {{source}} | {{signal}} | {{consented API, open data, MoU}} |

{{Consent and privacy line: what is never collected.}}

#### 4.2 The engine

- {{Model or method, and why it fits the decision}}
- {{Calibration or uncertainty: how the bands are made honest}}
- {{Explainability: how every alert carries its reasons}}
- {{Rules and model: how they can never contradict each other}}

### 5. Already built: working prototype and measured results

| Metric (holdout) | Result |
|---|---|
| {{metric vs a named baseline}} | {{value, label}} |

{{Screenshots, each captioned "Actual prototype output: ...".}}

### 6. Why this is different

- {{Five bullets, each a mechanism, not an adjective}}

### 7. Feasibility and deployment path

{{The stack is deliberately boring where it should be. What a pilot needs: hardware, partners, onboarding. How often it retrains, on what.}}

### 8. Impact

- {{For the lender or operator}}
- {{For the end user}}
- {{For the organiser's mission}}

### 9. Roadmap

| Phase | Scope |
|---|---|
| Prototype (done) | {{}} |
| {{Round 2, dates}} | {{}} |
| {{Pilot}} | {{one site, one partner, N users; what is measured against a control}} |
| {{Scale}} | {{}} |

### 10. Technology stack

{{One paragraph. Mark optional parts "roadmap, not a dependency".}}

### 11. Team

{{Team name, members and roles, contact, unless the round is anonymous.}}

{{Data note when true: "All data in this submission is synthetic; no real enterprise or personal data was used."}}
