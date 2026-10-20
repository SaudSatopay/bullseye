# Evals a judge cannot wave away

An eval is evidence only if the set, the split, the gold, the grading and the targets were fixed before the system saw the data. Write [EVAL-PROTOCOL.template.md](../assets/EVAL-PROTOCOL.template.md) first, commit it, then run. Read this for procedure step 6.

## Pick the protocol by product type

| Product type | Unit | Gold from | Headline metric | Harm metric beside it | Floors to beat | Hard negatives |
|:---|:---|:---|:---|:---|:---|:---|
| Classifier or detector | case | labels frozen before the run by someone who did not write the detector | recall and precision on the positive class; PR-AUC against the base rate; recall@top-k and lift for rare events | false positives on benign cases; false reassurance on unjudgeable input | the incumbent rule (single threshold); the brief's own features through the same pipeline | every surface feature of a positive, but safe (an inerted zone with gas, ignition and crew; an OTP delivery message) |
| Ranker, retrieval, RAG | query | expected ids derived from the corpus, leak-filtered | Hit@k, MRR@k, latency | ids that do not exist in the corpus; answers with no supporting span | BM25, dense-only, the organiser's scorer copied verbatim | questions the corpus cannot answer |
| Agent with tools | question or task | answers computed outside the system (plain code, a second library) | accuracy per category with intervals; tool choice and order; share of figures grounded in tool results | confident answers to unanswerable questions; wrong actions taken | the same model with no tools; a rules-only router; a placebo for memory | not in the data; unknown entity; a name that almost matches |
| Forecaster | time window | the held-out future (out of time, not shuffled) | lead time; skill against persistence and climatology | false alarms per quiet period | persistence, climatology, the alarm in use today | quiet periods that must stay silent |
| Generator or conversational agent | conversation with a persona | a ground-truth flag per persona and the outcome from the tool record | the completed action, verified (a booking that exists), not stated intent | pushing an unqualified persona to act | the same model as a plain FAQ bot | personas the right answer declines |

## Sets from different authors

One set written by the person who built the system measures that person's imagination. Build several, each from a different author, and keep their roles apart:

| Set | Author | Role |
|:---|:---|:---|
| Organiser public | organisers | parity with the official scorer; never edit it |
| Synthetic, stratified | an LLM, stratified by corpus section, with a leak filter that rejects any item containing its answer | a proxy for the hidden set; never tune to it |
| Independent private | another agent or model, without repo access | held-out |
| Weird | slang, code-mixed language, typos, negation, the judge's own inbox | held-out |
| Judge-random and private simulation | random picks the way a judge would pick | held-out |
| Frozen blind battery | a repo-blind session (below) | one run, published raw |

> Field note (BIS Compass · Sigma Squad × BIS Hackathon 2026): six sets came from six authors, and the scored ones ranged from 88.89% Hit@3 on 18 LLM-written queries to 100% on the organisers' 10, with 92% on 25 slang, Hinglish and negation queries. The generator of the synthetic set dropped any query that leaked its own standard code.

## Split before any run, with a seed

Generate the set deterministically, assign dev and held-out by group so related items never straddle the split, and commit the file before the first run. `git log` then shows the split predates every result.

```ts
// scripts/eval/split.ts
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export function split<T extends { group: string; category: string }>(items: T[], devShare = 0.3, seed = 20261018) {
  const rand = rng(seed);
  const dev = new Set<string>();
  for (const category of [...new Set(items.map((q) => q.category))].sort()) {
    const groups = [...new Set(items.filter((q) => q.category === category).map((q) => q.group))].sort();
    for (let i = groups.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [groups[i], groups[j]] = [groups[j], groups[i]];
    }
    for (const g of groups.slice(0, Math.round(groups.length * devShare))) dev.add(g);
  }
  return items.map((q) => ({ ...q, split: dev.has(q.group) ? 'dev' : 'heldout' }));
}
```

```python
import random

def split(items, dev_share=0.3, seed=20261018):
    rng = random.Random(seed)
    dev = set()
    for category in sorted({q["category"] for q in items}):
        groups = sorted({q["group"] for q in items if q["category"] == category})
        rng.shuffle(groups)
        dev.update(groups[: round(len(groups) * dev_share)])
    return [{**q, "split": "dev" if q["group"] in dev else "heldout"} for q in items]
```

Develop on dev only. Held-out runs are for releases.

## Gold outside the system, and negative categories

Compute every expected answer with code that is not the system: plain functions over the source data, a second library, the verifier from the build. The system's own output is never gold.

Add the categories where the right answer is "no": `not_in_data` (the question is well formed but the data cannot answer it) and `unknown_entity` (a station, product or person that does not exist). Score declines on them, and score false declines on everything else.

## Arms: system, same model without tools, rules floor, placebo

```ts
const ARMS = {
  system: (q) => runAgent(q, { tools: ALL_TOOLS }),
  noTools: (q) => runModel(q, { tools: [], prompt: BASELINE_PROMPT }), // same model: do the tools add anything?
  rules: (q) => rulesRouter(q),                                       // plain code: does the model add anything?
  // placebo: (q) => runAgent(q, { memory: keepEverythingForever }),  // for memory: is it the mechanism or more data?
};
for (const q of heldout) for (const [arm, run] of Object.entries(ARMS)) {
  const answer = await run(q);
  results.push({ qid: q.id, group: q.group, category: q.category, arm, correct: grade(q, answer), answer });
}
```

Report every arm, including where the system loses. Detour's held-out run showed 26 of 28 with the graph against 2 of 28 for the same model without tools, and a rules router that answered all 101 template questions; the README said plainly that on those questions the model adds no accuracy over plain rules. A memory eval there kept a placebo arm (memory that keeps every record forever): 66.3% time-aware, 61.8% placebo, 50.2% none.

An arm stopped by a spent free quota is left out and labelled as left out, never counted as wrong. Run evals where the keys live (the deployment), make the runner pause and resume on quota, and checkpoint every finished item.

## Intervals

No headline number without an interval. Write one row per item, then:

```bash
python scripts/bootstrap-ci.py data/results/heldout_v3.jsonl --col correct                        # rows independent
python scripts/bootstrap-ci.py data/results/heldout_v3.jsonl --col correct --cluster group        # items share a closure, a station, a conversation
python scripts/bootstrap-ci.py data/results/heldout_v3.jsonl --col correct --by category --json   # per category, for facts.json
```

Paired difference between two arms on the same items: write a column `diff` = system correct minus baseline correct (1, 0 or -1) per item, and bootstrap its mean. An interval that excludes 0 supports "beats"; one that straddles 0 supports "no measurable difference", and the README says that.

When items are not independent, use `--cluster`. Twenty stations with ten decisions each carry the information of twenty stations, and a row bootstrap claims more certainty than the data holds.

## Version every run

`data/results/<set>_<version>.json` for every run, with commit, seed, model id, prompt hash, date, environment, raw counts and each item's input, expected and predicted value. Keep regressions: BIS Compass kept twelve named runs, including one where bootstrap Hit@3 fell to 72.22% before recovering to 88.89%, so every rollback cited a run.

## Ablation registry

A list of variants, one script that runs them all on the same sets, a JSON file and a Markdown table generated from it:

```python
VARIANTS = {
    "bm25_only":         dict(dense=False, rerank=False),
    "hybrid_rrf":        dict(dense=True, rerank=False),
    "full":              dict(dense=True, rerank=True),                     # production default
    "full_phrase_boost": dict(dense=True, rerank=True, phrase_boost=True),  # opt-in flag, off by default
}
# for each set and variant: Hit@3, MRR@5, latency -> data/results/ablation.json and docs/ablation.md
```

Losers stay as opt-in flags, off by default, so the regression is reproducible. Null results are labelled null ("ColBERT: +50 ms, zero metric change, kept and documented as null"). Feed the "Things that did not work: Idea | What happened | Lesson" table in the agent brief from this file.

## Failure analysis per miss

For every miss: the expected answer, where it ranked (or "not in top 25"), the top results with each score component (rerank, fusion, boosts), and a one-line cause. Publish it as `docs/failure_analysis.md` plus JSON. A per-miss table is the fastest way to find the one fix that moves the metric, and judges read it as rigor.

## Calibration

When the product shows a confidence, bucket (score, correct) pairs and report measured precision per bucket, and print the score distribution next to it. BIS Compass found HIGH (score at least 0.55) 85.7% correct and MEDIUM 13.3%, and also that every score fell between 0.40 and 0.70, so the bands were fragile; both facts belong in the docs.

## Frozen blind battery

The strongest single eval protocol in the projects. A separate session that cannot read the repo writes the cases from domain knowledge alone, with a label and a rationale per case, frozen at authoring. Grading is declared in the runner before it runs. External services are stubbed, so the run measures the engine. It runs once, and the raw result is published with every miss verbatim before any tuning. Fixes derived from those misses make it development data: the re-run is labelled "regression, not unseen accuracy", and only a new blind battery can claim more.

In Claude Code, author the battery in a fresh session or a subagent told not to open project files; elsewhere, a new chat with only the problem statement. Record label disputes and count them against yourself.

> Field note (Dhaal · MUJ HackX 4.0): battery v5 (120 cases, repo-blind author) scored 84/120 once, with harmful recall 30/48 (62.5%) against a 90% target, published as missed. After fixes, the re-run scored 105/120 and was labelled a regression measurement, not unseen accuracy.

## A/B against a baseline, with simulated personas

For agents that persuade, sell, support or onboard:

1. **Define the metric and its anti-gaming rule before building.** Count completed actions verified from the tool record (a booking that exists, with contact captured), not stated willingness.
2. **Put a harm metric next to it:** false push on personas who should be declined.
3. **Same model, same lead simulator, same protocol for both arms**, so the rep is the only difference.
4. **Run a tiny eval on day 1** (4 personas) to find a saturated metric while there is time to change it.
5. **Budget a paid key or a high-limit model for the final run.** Free tiers stall long runs.
6. **Engineer the runner for interruption:** a checkpoint after every conversation, cache keys namespaced by metric version and model pair, a run lock against a second process, retries that honour the provider's "try again in" hint, and a results file written only when every conversation finished.
7. **The results page degrades to methodology:** before results exist it explains the protocol and why the naive metric was rejected.

> Field note (SunPath · FlowZint AI Hackathon 2026): the first metric, stated willingness, saturated: the FAQ baseline scored 8 points higher than the agent, whose false-push rate was 33% against the baseline's 0%. The redesigned completed-booking eval then stalled on free-tier quota with 8 of 32 conversations done, so the results page shipped as methodology only.

## Rare events and leakage

When positives are rare, accuracy is a broken yardstick: a model that calls everyone legitimate scores 99.1% and catches nobody. Report recall at top-k, precision at that k, lift, and PR-AUC against the base rate, from out-of-fold predictions, with a bootstrap interval on the headline.

Audit for leakage before believing a good number: print the evidence for each suspect column (a month code that alone separated every positive), drop target and time proxies, and keep the before/after as the story. MuleShot's naive model scored 0.9998; after the audit the defensible number was 90.1% recall at the top 5% (95% CI 83.5 to 96.5%), and the proposal told it as trap, audit, truth.

Run the brief's own baseline features through the same pipeline, with an assertion that none is missing, so "about 2x the recall of the bank's own 18 features" is a measurement.

## Measure the strictness of your own checks

A check that passes noise proves nothing. After writing a grounding check (every figure in the model's answer must appear in the tool results), feed it random figures and count how many pass. Detour's check passed 8 of 400 random figures between 100 and 30,000; that number goes beside the check wherever the check is cited.

The same applies to any validator, guard or detector you cite as a safety property: measure its false-pass rate on random or adversarial input, and publish it.

## Thresholds

- Never tune a threshold on the test set. "Untuned" is the whole external-validity claim; if a lead is small, report it small.
- Fix the operating threshold before the run and report accuracy at it. If a best-threshold-on-this-data number is shown, label it, and never make it the headline. FaceAttend reported 98.3% at the fixed 0.45 threshold beside 98.7% at the best one.
