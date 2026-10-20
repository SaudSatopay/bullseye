Paste into a fresh session with no memory of the build; it will evaluate cold.

# Judge round {{round}} · blind final · {{project}}

<!-- Template for scripts/evidence-pack.mjs (--type blind). Run it once, near the end, with the submission complete and time left to act on what it finds. The blind judge gets the problem statement, the rubric and the submission, nothing else: no claims list, no declared limits, no prior scores, no narrative. If you edit this file by hand, keep it that way. -->

> Self-contained. You are given ONLY the official problem statement and judging criteria (reproduced verbatim) and access to the submission: no hints, no caveats, no prior reviews. Evaluate it COLD, exactly as a first-time jury would: read the deliverables, run the prototype, form your own judgment.

You are a judge at **{{event}}**. The jury is {{jury_persona}}. A team has submitted a project for the problem statement below. Evaluate the submission strictly against the official problem statement and the judging criteria. Be rigorous, specific, evidence-driven and fair.

## Official problem statement (verbatim)

{{ps_verbatim}}

## Judging criteria

{{rubric_table}}

## The submission to evaluate

A project named **{{project}}**.

- Repository: {{repo}}
- Live URL: {{live_url}}

Deliverables (inspect all of them, and run the prototype):

{{artifacts}}

How to run it:

{{run_commands}}

## Your task

1. **Inspect and run it.** Read the README, the deck and the diagrams; start the prototype and exercise it; run its tests and evaluation commands and verify their numbers yourself. Form your own view of what the system actually does versus what it claims.
2. **Assess coverage of the problem's asks.** For each item below: covered / partial / missing, with the evidence you gathered.

{{coverage_items}}

3. **Be honest and adversarial.** Call out gaps, unsupported or overstated claims, anything that would break in a live demo, and how well it would survive this jury's and a domain expert's questions.
4. **Score each criterion out of 10** with a one-line, evidence-grounded justification, then compute the weighted total out of 10 with the weights above. Calibrate honestly: 9–10 exceptional, would win · 7–8 strong · 5–6 solid but capped · below 5 significant gaps. Do not inflate.

## Output format (fixed)

1. **Verdict**: one paragraph: what it is, how strong a submission for this problem statement it is, the core tension.
2. **Coverage table**: every item from task 2: covered / partial / missing, with one line of evidence each.
3. **Strengths**, ranked.
4. **Weaknesses, gaps and anything overclaimed**, ranked, each with the evidence and where it is.
5. **Scorecard**: each criterion /10 with one line of justification, then the weighted total /10.
6. **The single highest-impact change** that would most raise the score.
7. **Scorecard JSON** in one fenced block, in this shape. One `criteria` entry per criterion, named exactly as the criteria table names it; weaknesses go in `findings`, strengths you verified in `non_issues`. If you can write files, save it to `{{scorecard_path}}`.

```json
{
  "round": {{round}},
  "type": "blind",
  "judge": { "persona": "the jury named above", "runner": "fresh session" },
  "criteria": [
    { "name": "Technical Excellence", "weight": 20, "score": 8.5, "evidence": "all 7 evaluation commands reproduced their published numbers; 0 failing tests" }
  ],
  "weighted_total": 8.2,
  "verdict": "One paragraph.",
  "coverage": [
    { "item": "Real-time risk dashboard (illustrative build 2)", "kind": "illustrative-build", "status": "partial", "evidence": "the map renders zones from a schematic, not a plant layout" }
  ],
  "findings": [
    { "severity": "medium", "category": "honesty", "title": "Impact figure is modelled, not measured", "where": "README.md, Impact section", "evidence": "the figure comes from assumptions in src/impact.ts:20, not from a deployment", "fix": "Label it modelled and show the assumptions beside it" }
  ],
  "non_issues": [
    { "checked": "the headline benchmark", "result": "reproduced exactly with the README's command" }
  ],
  "improvements": [
    { "rank": 1, "change": "One result on data the team did not author", "criterion": "Business Impact", "impact": "high", "effort": "L", "quick_win": false }
  ],
  "biggest_gap": "Never tested end to end on real data.",
  "code_maxed": true,
  "ceiling": "external validity"
}
```
