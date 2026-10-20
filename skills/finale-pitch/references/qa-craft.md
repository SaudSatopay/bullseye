# Q&A craft

How to answer judges so the answers are short, true and checkable. Q&A is where a jury tests whether the team understands what it built.

## The answer shape

Write every bank answer in three parts and rehearse it aloud:

- **LIVE:** 2 to 5 speakable sentences. The first sentence answers the question: yes, no, a number, or a name.
- **SHOW:** the one thing to put on screen right now (a trace, a test run, the proof page, the provenance file).
- **IF PUSHED:** one line of deeper defense for the follow-up.

For deep technical calls, also keep a DEEP version: one to three speakable paragraphs. Aim for 30 seconds per answer, and stop early when the judge nods.

Delivery in the room: one person answers each question; the others stay quiet. Hand a question to the teammate who built that part by name. When you do not know, say so, say how you would find out, and offer to follow up. Keep the product on the screen during Q&A; showing beats telling.

## Honest limits first

List 3 to 5 limits and say them before the judges find them, each with its roadmap line: "Raw photos are not yet stored in the pod; the column exists and storage is on the roadmap." A limit you announce reads as engineering judgement; the same limit discovered by a judge reads as a hidden flaw.

Keep the wording exact, because judges notice the difference:

| Say | Not |
|---|---|
| prepared, not yet run | tested |
| reconstructed from the inquiry | validated |
| no known risk | safe |
| in simulation | in the field |
| a recorded run from <date> | live |
| illustrative values | our results |
| a practitioner described the problem | a customer endorsed it |

## Concede, then pivot

Stay calm, concede what is true, and pivot to what is strong. "Yes, the model is small and the data is synthetic. That is why every score shows its reasons and its confidence band, and why the held-out results are published with the misses." Never argue with a judge's premise before granting the part that is right.

## Numbers and caveats

- Never quote a number without the caveats printed beside it in CLAIMS.md: the set, its size, how it was measured, and what it does not prove.
- Every number in an answer matches `facts.json` today. Re-verify the numbers line on the day.
- Every answer points at something committed: a file, a test, a command. If it is not in the repo, it is a plan, and you say "plan".
- Keep one dense line of numbers at a glance at the top of the bank, for example: `4 tables · 1 agent · 2 functions · 1 workflow · 0 servers · severity 78 (pothole) and 39 (hairline) on live runs`.

> Field note (NAADI · IDBI Innovate 2026): The README and deck promised "a replayable agentic run with real pipeline timings", but the code replayed fixed millisecond values. A judge's "are those timings real?" would have had only one honest answer. Check every claim in the bank against the code before the round.

## Hostile patterns and answer shapes

| Question | What it tests | Answer shape | Show |
|---|---|---|---|
| "Is this real data?" | provenance | the layers, each labelled: live, reconstructed, scripted | the live tab, the provenance file |
| "Where do the agents actually run? Show me they're real." | wrapper suspicion | run it live, right now | the terminal or the trace |
| "How is this more than a CRUD app with a chatbot?" | depth | what reasons, what is deterministic, where a human signs | the workflow with its approval step |
| "Does it still work without <sponsor tech>?" | load-bearing sponsor use | what breaks without it, and why nothing else does that job | the query or feature that needs it |
| "What friction did you hit with <sponsor>? Be honest." | real use | two specific issues and the workaround; the primitives that held | the workaround in the code |
| "What breaks at 10,000 a day?" | scale honesty | the real limit, the fix, why the data model already supports it | the code path with the limit |
| "What's your accuracy?" | rigour | metric, set, size, misses published, the caveat | the eval page or EVAL.md |
| "Why won't it cry wolf?" | false positives | the contrast case and the hard negatives | the negative case, live |
| "Why not ML, or a bigger model?" | judgement | one-sentence explanations for the person who must trust it at 2 a.m. "We'd rather be inspectable than impressive." | one verdict and its two numbers |
| "What's mocked right now?" | honesty | the exact list, and the flag that marks it on the wire | `mocked: true` in a response |
| "What if the AI is rate-limited mid-demo?" | reliability | it degrades to vetted cached output and says so | the badge |
| "What did the AI build?" | understanding | plainly: which parts an assistant wrote, how each was verified | the build table in the bank |
| "Who did what?" | the team | one factual line per person | the commit history |
| "Are the numbers right? Is that realistic?" | claims | the one command that re-measures them | its output |
| "What's the business model?" | viability | who pays, and what it costs them today without you | the cost they already bear |

Jury-specific questions and what each jury rewards are in the judge-panel skill's personas reference, linked from SKILL.md.

## What did the AI build?

The answer is part of the integrity story. "What did the AI build? Say it plainly … Judges check that you understand it, so know every row on this page." Keep a table in the bank (Part | Written by | Verified by) and answer in its shape: an assistant wrote the first version of <part>; we wrote <part>; <how each was verified>. Use the same words as the README's AI disclosure.

## Rehearse, never relay

Rehearse the bank with a mock judge in a fresh session that knows only the project's facts and asks one question at a time (the judge-panel skill's `qa` mode builds that prompt). Score each answer: answered in the first sentence, under 30 seconds, number with its caveat, pointed at something showable, no claim beyond the repo. Log misses in the bank and fix the answer, then drill again until the answers are boring.

Never put an AI between the judges and the team during the round. A tool that listens to the call and drafts answers was built once and taken out of BULLSEYE on purpose: the event's rules may forbid it, the judges are assessing the team's own understanding, and a judge who notices discounts everything else. Notes you wrote yourself on a second screen are cue cards; an assistant answering live is not. If any assistive tool is used during judging (captions, translation, accessibility), disclose it and follow the event's rules.

> Field note (Dhaal · MUJ HackX 4.0): The run-sheet answered "what's your accuracy?" with a pointer, not a number: open the eval doc with its frozen blind batteries and published misses. "Never quote a number without the caveats printed there."
