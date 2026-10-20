# Proof before pitch

At the idea stage most teams describe what they will build. Proving the core first changes the conversation from "will it work?" to "here is where it already works": "We did not write theory." This file covers three paths: the organiser gave you data, there is no data, and the round forbids prototypes.

## Path A: the organiser gave you data

Prove the core on it before you write the pitch. The method is MuleShot's (BOI × IIT Hyderabad 2026: 9,082 accounts, 3,923 anonymised features, 81 mules), generalised.

### Layout

```text
proof/
  01_profile.py          rows, positives and base rate, missingness, column types
  02_leakage_audit.py    naive model first, then the audit, with evidence printed per leak
  03_hardened_cv.py      out-of-fold scores, rare-event metrics, operating points
  04_interval.py         per-fold spread and a bootstrap 95% CI on the headline
  05_brief_baseline.py   the brief's own listed features through the same pipeline
  06_latency.py          single-row and batch timing, scope stated
  07_proxy_<name>.py     a roadmap capability on a public proxy dataset, labelled
  results/*.json         every number the pitch uses
data/                    the organiser's file (gitignored when its licence forbids sharing)
```

Each script starts with a docstring (purpose, run command, honest scope), reads data by a relative path, fixes its seed, prints its evidence and writes JSON.

### Steps

1. **Bring the data in.** Copy the organiser's file into `data/`, record its name, size and SHA-256, and use relative paths. MuleShot's scripts read a downloads folder by absolute path, and every path broke when the project moved.
2. **Profile it:** rows, positives and the base rate ("0.89%, one in 112"), missingness (MuleShot: about 28%, itself predictive), column types. Never blind-coerce text columns to numbers. A numeric coercion made MuleShot's month column read as empty, which hid a perfect leak until a second model reviewed the scripts.
3. **Run the naive model on everything** and keep its score. It is the trap you will show (MuleShot: ROC-AUC 0.9998).
4. **Audit for leakage,** printing the evidence for each leak before you drop it:
   - target proxies: a column that is near-perfect on its own (F3912: about 1 for 97.5% of mules and 0 for every legitimate account; univariate AUC 0.987);
   - time proxies: month codes, dates and batch ids that separate the classes (F2230: the 81 rows not coded "Oct25" were exactly the 81 mules, "100% recall @ 100% precision (perfect leak)");
   - the row index and identifiers;
   - empty or constant columns (359 of them).
   Keep legitimate categoricals, encoded, rather than dropping them.
5. **Train the hardened model with out-of-fold predictions only:** stratified 5-fold, shuffled, a fixed seed, class weight set to negatives over positives inside each fold.
6. **Report rare-event metrics, never accuracy:** recall in the top 1, 2 and 5%, precision at the same cuts, lift over the base rate, PR-AUC against the random baseline, ROC-AUC with its fold spread. Say why in one line: "A model that calls everyone legitimate scores 99.1% accuracy and catches zero."
7. **Put an interval on the headline:** per-fold minimum and maximum, plus a 2,000-resample bootstrap 95% CI on the pooled out-of-fold metric, "so the headline 90% is reported with an honest interval, not a naked point." (MuleShot: 90.1%, CI 83.5–96.5%, folds 81–94%.) The sibling `prove-it` has `bootstrap-ci.py` for any per-item results file.
8. **Beat the brief's own baseline in the same pipeline.** When the problem statement lists the features the organiser already uses, train on exactly those, with the same code and an `assert not missing`, and report the ratio. MuleShot's 18 listed features reached 45.7% recall at the top 5% against 90.1% for the full model: "~2× the recall of the bank's own 18 features". That number began as a figure someone typed in, and was made reproducible from the brief before it went on the page.
9. **Show the operating points:** for each cut, accounts reviewed, caught, precision and recall. "Threshold tunes to the bank's review capacity." The same table tells the false-positive cost story.
10. **Measure the real-time claim:** 100 warm-up calls, then 3,000 single-row predictions on one core for the median and p99, plus batch throughput. State the scope: "Model latency only (not the full ingest pipeline; that's the Phase-2 build)." MuleShot measured about 2 ms per account and about 26,000 accounts a second. For an HTTP endpoint, `prove-it`'s `latency-bench.mjs` does the same with the scope printed beside the number.
11. **Prove roadmap capabilities on a labelled proxy** when the organiser's data cannot show them. MuleShot's data had no transaction edges, so a public Bitcoin anti-money-laundering graph, with structure-only features, showed graph detection at ROC-AUC 0.78 and 3.7× lift, captioned "Bitcoin proxy, not BoI data".
12. **Write PROVEN vs OPEN RISKS.** Proven: the model on the provided data, explainability, beating the brief's baseline. Open: real-time serving end to end, drift and adversaries, and the small number of positives ("81 positives: wide CI; validate out-of-time"). Say when a clean dataset may flatter the score.
13. **Review the scripts with a second model family** before any number reaches a page.

### How it shows on the page

MuleShot's proof page, headline "We already validated it on your data.":

- a three-step strip: Step 1 The trap (0.9998) → Step 2 The audit (the named leaks) → Step 3 The truth (90%);
- the operating-point matrix, the brief-baseline bars and the leak chips;
- headline metadata: "95% CI 83.5–96.5%, 5-fold 81–94%, ROC-AUC 0.98 (sd .01), PR-AUC 0.85";
- a Methods block at the end: "each reproducible from runnable scripts".

### Other problem shapes, the same five moves

| Move | Rare-event tabular | Forecasting | Vision or detection | Language and agents |
|---|---|---|---|---|
| Audit the data | target and time proxies, ids | features that peek ahead | frames shared between train and test | questions that contain their answer |
| Validate out of sample | out-of-fold CV | temporal holdout | held-out sessions, seeds or laps | a held-out set split before any run |
| Use the decision's metric | recall at k, PR-AUC, lift | skill over seasonal-naive, interval coverage | per-class precision and recall, latency | cited-answer rate, trap questions |
| Beat the honest baseline | the brief's own features | seasonal-naive, persistence, climatology | the manual process and its time | the same model without tools |
| State interval and scope | bootstrap CI | coverage after calibration | per condition | per question category |

Seen in: DhanDrishti reported forecast error 25% below seasonal-naive, and coverage of its P10 to P90 band moved from 0.715 to 0.80 after conformal calibration; SURYA charted its target against persistence and climatology; LINE MARSHAL declared recall and precision on held-out simulator laps with exact ground truth; Fineprint declared 100% clause citation on a 200-question eval that carries 50 trap questions.

## Path B: no organiser data

"Evidence beats promises, even at idea stage."

1. **Build a thin vertical prototype:** one input end to end (one clip, one session, one document). Capture screenshots, a 90-second screen recording and a public repo link if the form takes links.
2. **Simulate the claim on real public data** when the real system cannot run yet. WasteOS put 240 simulated bins on a real OpenStreetMap street graph and ran 28 days × 5 seeds against a fixed collection schedule; every result was labelled SIMULATED and the weaker comparison was disclosed.
3. **Plant ground truth in synthetic data** so accuracy can be measured. DhanDrishti generated 200 enterprises × 104 weeks with engineered distress ramps, "so accuracy is measurable, honestly", and labelled the data synthetic everywhere.
4. **Script the concept demo** when there is no model yet, and label it. SBI Saarthi streamed scripted multi-agent traces beside a phone mock-up, with "Prototype simulation · synthetic personas · figures illustrative." under it
5. **Precompute model outputs into JSON** so a static demo cannot fail on a judge's machine (NAADI baked its demo population and sensitivity curves through the real model).

## Path C: the round forbids prototypes or links

MuleShot's Round 1 accepted one PDF of at most 1 MB and no prototype until the shortlist. The proof scripts ran anyway; the PDF cited their numbers and a Methods block pointed to runnable scripts. Commit the scripts so the next round starts from them.

## Labels for proof

- On the organiser's real data: MEASURED, with the script name.
- On synthetic or simulated data: SIMULATED, with seeds and assumptions.
- On a public proxy: SOURCED data, MEASURED method, and the proxy named inside the callout ("Bitcoin proxy, not BoI data").
- Not built yet: TARGET, with how and on what it will be measured.

## Pitfalls

- Tuning a threshold to the test set. "Never tune a threshold to the test." (Trinetra)
- A near-perfect score taken at face value. Run the leakage audit before you believe it.
- A benchmark someone typed in. Reproduce it from the source, or drop it.
- One model reviewing its own scripts. Get a second model family.
- Absolute paths, data outside the repo, unsaved commands. The next session cannot rerun what it cannot find.
