# {{Product}} · agent design note

<!--
Owner: build-sprint (step 0, agentic products only). One page that fixes the loop before any code.
Process file: private by default. Each section is short; if a section runs long, the scope is too big.
-->

{{One paragraph: what is reused (the problem, the real scoring or cost logic, the narrative) and what is built on the platform (tables, agent, functions, workflow, approval, surfaces).}}

## Problem and users

{{The problem in one sentence with one number, and its source.}} The users:

- **{{Role 1}}**: {{what they do in the loop}}.
- **{{Role 2}}**: {{reviews, approves the money step, watches the queue}}.
- **{{Role 3}}**: {{is acted on, assigned, notified, held accountable}}.

**Unit of work:** a `{{record}}`, with the lifecycle `{{new}} → {{triaged}} → {{pending_approval}} → {{dispatched}} → {{resolved}}` (plus `{{rejected}}`).

## Hero moment (the 60-second "oh")

{{What arrives, what the system does on its own, what the screen shows seconds later (with the real numbers: score, cost now versus cost if ignored, forecast), and where the critical case is already waiting for a human. Nobody clicks a form to make the judgment happen.}}

## Data

- **{{table or collection}}**: {{the unit of work's fields, including the agent's analysis, the computed numbers, status, workflow run id}}.
- **{{table}}**: {{the accountability or reference data}}.
- **{{events table}}**: {{audit timeline: record id, kind, note, actor}}.
- **Knowledge files**: `{{rubric.md}}`: {{the scoring rubric and cost tables the agent grounds on, ported verbatim from the deterministic engine}}.

## Agent (judgment)

`{{agent-name}}`. Input: {{the record, or its id to read first}}. It reads {{the photo, the text, the knowledge files}} and returns a structured result with exactly these fields: `{{type}}`, `{{severity 0-100}}`, `{{label}}`, `{{confidence 0-1}}`, `{{summary}}`, `{{forecast}}`, `{{recommended_action}}`. Permissions: read-only on {{the record and the knowledge files}}.

## Functions (deterministic)

- **`{{score_record}}`**: from the agent's classification, compute {{cost now, cost if ignored, plan, priority}}, write them onto the record, and move status to `{{triaged}}`. A faithful port of {{the engine}}.
- **`{{dispatch}}`**: on approval, assign, update counts, write an event row, move status to `{{dispatched}}`.
- **`{{resolve}}`**: close the record and recompute the accountability score.

## Workflow

```text
trigger: new {{record}}
AGENT {{agent-name}} → FUNCTION {{score_record}} → DECISION ({{label}} == "{{critical}}")
  ├─ {{critical}} → FORM {{approval}} (a human approves the money step) → FUNCTION {{dispatch}} → END
  └─ otherwise    → FUNCTION {{dispatch}} (automatic) → END
```

The form is the human approval at the money step. It is the hero of the loop, not a formality.

## Surfaces

- **{{Primary demo surface}}**: {{how a record enters: chat, upload, a form}}.
- **{{Production-equivalent channel}}**: {{wired if an account is available; otherwise named as the production path}}.
- **{{The app}}**: {{the queue with severity and cost, the approval inbox, the accountability board, the record detail with the agent's analysis}}.

## Seed (so it demos itself)

{{About N reference rows and M records across severities and statuses; one critical record parked at the approval form; the board populated; the knowledge files uploaded.}} Leave one fresh record unprocessed for the hero beat to triage live.

## Deliberately not built

{{The tempting features left out, with one line each on why.}} Judges reward a tight real loop, not feature sprawl. {{The scoring and cost logic}} is ported faithfully, because that is the credible core.

## Success criteria (the final smoke test)

Create a record → it is triaged with {{severity, cost and forecast}} → the critical one shows an approval form in the reviewer's inbox → approve → status `{{dispatched}}`, assignee set, counts updated → the app shows the whole journey.

## Build order

{{tables}} → {{knowledge files}} → {{functions}} → {{agent}} → {{workflow}} → {{surface}} → {{app}} → {{seed}} → verify. Verify each layer before starting the next.

## Agent instruction (template)

```markdown
# {{Agent name}}

You are the {{role}} for {{Product}}. Given {{the input}}, you {{classify and score}} so that {{the people}} can {{prioritise and act}}.
You judge; you do not write to the database (a function persists your output).

## Your input
{{The fields you receive, or the id to read first.}}

## How to work
1. Read the input carefully. Base your judgment on {{these fields}}.
2. Ground every score in {{the rubric file}}. Read it; do not invent weights or costs.
3. Classify `{{type}}` as exactly one of: {{enum}}.
4. Score {{severity}} with the rubric's formula. Set `{{label}}`: {{thresholds}}.
5. Forecast honestly from the evidence. State the basis; never claim a precise date you can't support.
6. Recommend one action in one line.

## Output
Return the structured fields only: {{field list}}. Keep `summary` to one plain line.

## Boundaries
- Do not write to any table or send any message; you only assess.
- If the input clearly is not what you assess ({{a selfie, a meme, an unrelated document}}), set `{{type}}: other`, score it low, and say so. Don't inflate it.
- Be calibrated: reserve `{{critical}}` for genuinely dangerous cases, not cosmetic ones.
```
