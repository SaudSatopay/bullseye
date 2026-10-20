# Prompt cookbook

Copy, fill the angle brackets, paste. Each prompt names the skill it relies on, so it works whether the skills are installed or read from a clone. In Claude Code installed as a plugin, the same skills are also available as `/bullseye:<skill>`.

## Start

```text
Use bullseye for this hackathon: <link to the event page or paste the rules>. Set up BULLSEYE.md,
ask me only what you cannot find yourself, give me the owner checklist, then decode the brief.
```

```text
Use bullseye. I am joining <event> with <team size and skills>. The window is <start> to <end> <timezone>.
Here is the problem statement: <paste>. Pick the strongest problem for win probability, not for comfort.
```

## Intake (brief-decoder)

```text
Use brief-decoder. Read every page of <event link>: rules, judging, prizes, FAQ, resources. Fill the Contract
in BULLSEYE.md with deadlines in my time zone (<timezone>), every deliverable with its limits, the rules
quoted verbatim, and the rubric with weights. Then scan last edition's winners and the competitor repos,
and score the problem statements in a decision matrix.
```

```text
Use brief-decoder. Does our idea pass the sponsor test: would it still work without <sponsor technology>?
If yes, propose how to make the sponsor technology load-bearing.
```

## Idea round (idea-round, pitch-deck)

```text
Use idea-round. The idea submission is due <date time timezone> as <format and limits>. Write the narrative
once, then render a concept brief, an idea deck and the form answers with the same numbers. Label every
number as sourced, simulated, projected, target or illustrative. Run the honesty pass before I submit.
```

```text
Use idea-round and pitch-deck. The organiser requires this template: <path>. Honour it exactly, then
out-build it with validation, data, risks, roadmap and budget. Produce the organiser-format file and a
longer presentation deck separately.
```

## Build (build-sprint)

```text
Use build-sprint. Write PRODUCT.md with the judge as a user, lock the golden path as 6 to 8 numbered beats
with one contrast beat, and write the engine and model split. Then scaffold, deploy a preview within the
first hours, and add the demo layer: labelled live, scripted and recorded modes, a seed with planted
stories, a health endpoint, reset and deep links.
```

```text
Use build-sprint team mode. We are <n> people, each with an agent. Set up lanes by directory, TASKS.md with
claim-by-push locks, and CONTRACTS.md for every API shape and env name. Give me the kickoff message for
the team chat.
```

## Polish (missile)

```text
Fire the missile in polish mode on this project. Keep <what to protect>; push <what to raise>. Sense the
production build at 390 and 1440, score with a separate critic, fix the top fixes, repeat until every
dimension is at 9 or it stalls.
```

## Proof (prove-it)

```text
Use prove-it. Inventory every number in the README, deck, video script and UI. Write facts.json from the
scripts that measure them, CLAIMS.md mapping each claim to its measurement and test, and wire
claims-check so it fails on any drift. Then write LIMITS.md and a "Where we lose" section.
```

```text
Use prove-it. Design the evaluation for this <classifier | retrieval system | agent>: sets from different
authors, a held-out split fixed before any run, the same model without tools and a rules-only floor as
baselines, confidence intervals, and the misses published.
```

## Judging (judge-panel)

```text
Use judge-panel. Build the evidence pack and run an adversarial round against our rubric in a fresh
context. Fact-check every finding against the code before fixing anything, then log the round.
```

```text
Use judge-panel for a blind final round: only the problem statement verbatim, the rubric and the repo.
Then give me the coverage table and the single biggest thing between us and first place.
```

```text
Use judge-panel mock Q&A. Ask me one hostile question at a time as a <founder | banker | engineer |
sponsor> judge, grade my answer against QA-BANK.md, and flag any bluff or number that does not match
facts.json.
```

## Package (submission-pack, demo-video, pitch-deck)

```text
Use submission-pack. Write the README for a judge with two minutes (60-second path with deep links,
evidence table, rubric map, where we lose, run it locally), SUBMISSION.md with paste-ready answers in the
form's order and character budgets, and BRIEFING.md. Then run the final sweep and the claims check.
```

```text
Use demo-video. The cap is <length>. Write a beat sheet that makes one argument, record it from the
production build with captions, generate a voiceover that fits each beat window, and check it muted.
```

## Finale (finale-pitch)

```text
Use finale-pitch. Our slot is <minutes> with <minutes> of Q&A, judged by <who>. Write the runsheet with
exact inputs and expected outputs, a timed script with a 90-second emergency cut, the Q&A bank with
honest limits first, and a T-15 pre-flight with a decision rule for a broken step.
```

## Portfolio (hackathon-tracker)

```text
Use hackathon-tracker. Here are the events I am in: <list or folder>. Verify each status on its official
page today, convert every deadline to <timezone>, and give me the at-a-glance table and the merged
calendar with collisions flagged.
```

## Sessions

```text
Use bullseye status.
```

```text
Use bullseye handoff, then write me a paste-in prompt so I can continue in <another tool>.
```

```text
Read BULLSEYE.md top to bottom and continue from the Handoff section. Roll through the remaining moves
without stopping to ask; build, verify against the production preview, commit, then move to the next.
Stop only if genuinely blocked.
```
