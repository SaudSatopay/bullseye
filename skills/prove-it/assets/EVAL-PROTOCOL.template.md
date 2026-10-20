# Evaluation protocol · {{project}}

Status: {{DRAFT | FROZEN at commit <sha> on <YYYY-MM-DD>}}

<!--
Write this before the first held-out run and freeze it with a commit. After the freeze, changes go under Amendments with a date and never touch results already published. Three kinds of evidence stay separate on purpose: development results show you respond to failure, the regression suite shows nothing fixed can silently return, and only a held-out or blind set measures generalization.
-->

## 1. The claim and how it is scored

- **Claim under test** (as the README will say it): {{"answers 88% of held-out questions correctly, with the path that proves it"}}
- **Unit of evaluation:** {{question | case | query | conversation | time window | request}}
- **Primary metric:** {{name}} = {{exact formula, with the denominator}}
- **Harm metric, reported beside it:** {{false push on unqualified leads | false reassurance on unjudgeable input | false alarms per quiet day | confident answers to unanswerable questions}}
- **Anti-gaming rule:** {{what does NOT count as success. "A booking counts only when the booking tool ran with name and contact captured; stated willingness is recorded but is not the metric."}}
- **Targets, declared now and measured later:** {{metric >= value}}; {{harm metric <= value}}. A missed target is reported as missed, with the number.
- **Smoke run on day 1:** {{date}}, {{n}} items, to find a saturated or broken metric before building on it.

## 2. Sets, each from a different author

| Set | Size | Author and method | Leak filter | Role | Run policy |
|:---|---:|:---|:---|:---|:---|
| Organiser public | {{10}} | the organisers | n/a | scorer parity | any time |
| Synthetic, stratified | {{18}} | an LLM, stratified by {{corpus section}}, hand-checked | drop items that contain the answer: `{{regex}}` (for codes like IS 456: `IS\s*\d{2,5}`) | proxy for the hidden set; never tuned to | any time |
| Independent private | {{20}} | a different agent or model, without repo access | same | held-out | once per release |
| Weird | {{25}} | slang, code-mixed, typos, negation, the inputs a judge pastes from their own inbox | same | held-out | once per release |
| Frozen blind battery | {{120}} | a separate session barred from reading the repo; labels and a rationale per case frozen at authoring | n/a | generalization | ONE run, then reclassified |

## 3. Split, gold and negatives

- **Split:** {{30}}% dev, the rest held-out, by `{{group}}` so related items (same closure, same trip, same document) never straddle the split; seed `{{20261018}}`; committed in `{{sha}}` before any run.
- **Gold** is computed outside the system: {{plain code over the source data | a second library (NetworkX, SciPy) | a human labeller}}. The system's own output is never the gold.
- **Negative categories:** {{not_in_data}} (the answer is not in the data: the right output is a decline), {{unknown_entity}} (a name that does not exist), hard negatives that carry every surface feature of a positive but are safe ({{example}}).

## 4. Arms

| Arm | What runs | The question it answers |
|:---|:---|:---|
| System | {{the shipped pipeline, same config as the demo}} | the headline |
| Same model, no tools | {{same model and prompt style, no tools or retrieval}} | do the tools or the data add anything? |
| Rules-only floor | {{plain code over the same data, no model}} | does the model add anything over rules? |
| Incumbent baseline | {{the brief's own features through the same pipeline | the single-threshold system in use today}} | do we beat what exists? |
| Placebo | {{memory that keeps everything forever | random retrieval}} | is it the mechanism or just more input? |

Every arm runs on the same items, the same day, with the same grader. An arm cut short by a spent quota is left out and reported as left out, never counted as wrong.

## 5. Grading (pre-declared)

- Pass rule: {{predicted class == expected class | numeric answer within 3% | the expected id in the top 3}}. No partial credit.
- External services during the run: {{stubbed off, so the result measures the engine | live, model id and date recorded}}.
- Model settings: {{model id}}, temperature {{0}}, prompt hash `{{sha256 of the prompt files}}`.
- Label disputes are recorded in section 8, counted against us, and never fixed by editing the label after the run.

## 6. Run and publish

1. Run each frozen set once. Write `data/results/{{set}}_{{version}}.json` with the commit, seed, model, date, environment, raw counts, every item's input, expected and predicted value, and caveats.
2. Publish the raw result with every miss verbatim before changing any code.
3. Fixes derived from those misses make the set development data. Its re-run is published as "regression, not unseen accuracy"; the frozen number stands as the last blind measurement until a new blind set runs.
4. Keep every versioned run, including the regressions. A rollback cites the run that justified it.

## 7. Report

- Per arm: n, value, 95% interval (`bootstrap-ci.py`; `--cluster {{group}}` when items share a group), and the paired difference against each other arm on the same items.
- Per category and per slice ({{language, difficulty, source}}).
- Confusion matrix, over-abstention on answerable items, and the harm metric.
- Where the system loses: items a baseline got right and the system got wrong, each with the reason.
- Calibration when the system reports a score or confidence: score buckets with their measured precision, plus the score distribution.

## 8. Results log

| Date | Set | Version | Commit | Arms | Result (with interval) | Read |
|:---|:---|:---|:---|:---|:---|:---|
| {{YYYY-MM-DD}} | {{heldout}} | {{v3}} | {{sha}} | system / no tools / rules | {{88.1% [82.2, 94.1] / 6.9% / 61.4%}} | {{one honest sentence}} |

**Label disputes:**
- {{case id}}: {{the author's label}} vs {{the system's answer}}. {{Why both are defensible.}} Counted against us.

## Amendments

- {{YYYY-MM-DD}}: {{what changed}}, because {{why}}. Results published before this date are unchanged.
