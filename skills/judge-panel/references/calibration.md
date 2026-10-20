# Calibration

A judge round is only useful if its numbers mean the same thing every time. This page is how to read a scorecard, when to trust it, and when to stop listening to it.

## The bands

| Score | Band | What it looks like at a hackathon |
|---|---|---|
| 9–10 | exceptional, would win | the claims reproduce on a cold run; the demo survives abuse inputs; one moment the jury will remember; something outside the team backs the result |
| 7–8 | strong | a working, honest product in which a judge can still name two or three gaps |
| 5–6 | solid but capped | it works, but one criterion is structurally weak: no business case, no evidence, a generic interface |
| below 5 | significant gaps | the golden path breaks, a deliverable is missing, or the code contradicts a headline claim |

"7 = strong hackathon project, 9+ = would win. Don't inflate." Every judge template carries that line; keep it when you edit one.

What a trajectory looks like: a first end-to-end build usually lands between 6.5 and 7.5. A round of fixing what a judge substantiated moves it by 0.1 to 0.4. It flattens out around 8 when what is left is not code.

> Field note (Trinetra · ET AI Hackathon 2.0): 7.3 → 7.6 → 7.7 → 7.9 → 8.0 across the informed rounds, then 8.5 from the blind final. Most steps came from fixing what a judge had substantiated, never from arguing with a score.

## Inflation

Signs that a scorecard is inflated:
- every criterion sits within half a point of the others;
- praise with no command, file or number behind it ("impressive architecture");
- a score that rose although nothing changed since the last round;
- the judge repeats the README's own claims back as evidence, without having run them.

Causes: the judge was handed the builder's narrative (the thesis, "why we win", chat history), or the prompt asked for encouragement instead of a verdict. Countermeasures: pass only the evidence pack; require an evidence string per criterion (the schema rejects a criterion without one); run the blind round; read the lowest criterion's evidence before the highest.

Deflation happens too. A judge that could not start the app scores everything from source and punishes a UX it never saw. If the scorecard says it judged from source, fix the run commands and rerun before acting on the UX score.

## Blind versus informed

Informed judges get the claims, the declared limits and the history. They find more, faster, and they anchor on earlier scores. Blind judges get the problem statement, the rubric and the repository, like the real jury. They find less, and they score only what the submission explains on its own.

Read the gap between them:
- **Blind higher than informed:** the informed judges are anchored on a limitation the submission now answers, or they weigh declared limits as if they were discoveries. Trust the blind number for the pitch; keep fixing what the informed judges substantiated.
- **Blind lower than informed:** the narrative in the informed prompt was carrying the score, and the submission does not explain itself. Fix the README's first screen, the deck's first three slides and the demo's first minute, not the code.
- **Within half a point:** both are probably right.

> Field note (Trinetra · ET AI Hackathon 2.0): Two parallel runs of the same round converged on the newest surface (7.7 from a fresh session, 7.9 from one with prior knowledge). The final blind judge, reading the same repository cold, scored Business 8.5 where the informed reviewers had held it at 7. Compare before trusting either.

## Weighted totals

- Total = sum of (score × weight) ÷ sum of weights, with the Contract's exact weights. Never trust a judge's arithmetic or its weights: `scripts/judge-round.mjs` recomputes both and records the corrected total.
- What a point is worth: +1 on a 25% criterion adds 0.25 to the total; +1 on a 15% criterion adds 0.15. Two criteria at 25% are half the score.
- The binding constraint is the lowest-scored heavy criterion. Rank work by weight × expected score gain ÷ hours, not by what is easiest to build.
- Unpublished weights: score every criterion and weight them equally, and say so in the pack. Never invent weights.

Worked example: Innovation 25 · Business 25 · Technical 20 · Scalability 15 · UX 15, scored 8 · 7 · 8.5 · 8 · 8, gives (200 + 175 + 170 + 120 + 120) ÷ 100 = 7.85. Raising Business from 7 to 8 adds 0.25; raising UX from 8 to 9 adds 0.15. A week on UX polish buys less than one outside data point that moves Business.

## Reading "the biggest gap"

Every scorecard names the single biggest thing between the submission and first place. Read it three ways:
1. **It is code.** It goes to the top of the fix list, weighted like any finding.
2. **It is outside the repository** (real users, outside data, a pilot, the pitch). No amount of code moves it. When two rounds name the same outside gap, that gap is the ceiling: stop judging code and spend the runway on it.
3. **It is a declared limitation.** The judge read the limitation as the main weakness. Either it truly is the ceiling, or it is stated so loudly that it frames the whole submission; then move it from the headline to the caveats section, stated once, plainly, with what would close it.

## When to trust a finding

Trust it when you can reproduce it: the file:line exists and says what the judge quotes, the command prints what the judge reports, the screen shows what the judge saw.

Doubt it when the judge did not run the app; the file:line is missing or says something else; the "bug" is a limitation the README already declares; it contradicts a test you can run; or it rests on a library behaviour the judge assumed without checking.

> Field note (Trinetra · ET AI Hackathon 2.0): One judge called a permit id "invented" (it was the scenario data's real id); another said a retry helper was unused (two panels call it). Each was checked against the code, went under non-issues and was left alone.

Severity, calibrated:
- **high:** breaks the demo, a correctness or safety property, or a headline claim;
- **medium:** an honesty or coherence gap on a surface a judge sees;
- **low:** drift in a secondary document, a stale comment, a nit.

Fix every substantiated item, lows included. They are cheap, and a jury that finds one stale number starts checking all of them.

## How AI judges differ from human juries

| | AI judge | Human jury |
|---|---|---|
| Time spent | reads every file and runs every command | about two minutes on the README, three on the demo |
| Rewards | reproducibility, documentation, honesty sections | a story, one moment that lands, a team that knows its numbers |
| Blind to | the room, timing, delivery, the first thirty seconds | most of the code, most of the numbers |
| Bias | anchors on what the prompt tells it; over-rewards thoroughness | swayed by the opening and by how the Q&A goes |
| Consistency | stable for a given prompt; shifts when the prompt shifts | varies by judge, by slot and by hour |

Use an AI round to find what is wrong and to learn what a careful reader concludes. Do not use it to predict the podium: a 9 from an AI judge is necessary, not sufficient. Juries reward a narrow demo that never breaks, one genuine moment and a tight story; teams that build ten features and demo them badly lose to teams that build three and pitch them well.

## What a judge cannot see

Stage presence; the room and its energy; the projector and the venue Wi-Fi; whether the demo fits a three-minute slot; how the speaker holds up under a hostile question; the other teams; the jury's mood at the end of a long day. Rehearse those with people and with this skill's mock Q&A. Score presentation criteria from the artifacts and label them "estimated from artifacts" in the scorecard's evidence.
