# Honesty, out loud

Judges trust a project that says where it loses. Every number carries its label where it is shown, limits are written down before a judge finds them, and the demo includes the case where the right answer is silence. Read this for procedure steps 1, 7, 8, 11 and 12.

## The number taxonomy

Label every number in the artifact itself (deck chip, chart annotation, README sentence, narration), not only in a footnote.

| Label | Meaning | How to show it |
|:---|:---|:---|
| MEASURED | a committed script produced it on real inputs; re-runnable | the command beside it, or a CLAIMS.md row |
| SIMULATED | a committed script produced it on generated or replayed inputs | "in simulation", with the seed and the assumptions; narration says "in simulation" before the number |
| PROJECTED | derived from other numbers | "only holds if ..." in the same sentence |
| TARGET | declared before measuring | the word "target" inside the chart or table, next to the bar |
| SOURCED | someone else measured it | link and date beside it; judges search for it, so say it exactly as the source does |
| ILLUSTRATIVE | UI values, mockups, overlays, example amounts | an on-screen label ("illustrative", "presentation mockup, not a live push") |

Capability claims get a status instead: IMPLEMENTED (pinned by a test), PROTOTYPED, SIMULATED, FUTURE. Set each chip to what the build can honestly claim today and move it up as features ship. Superlatives ("first", "only", "fastest", "100%") need a sourced comparison, or a stated n ("100% on 10 public queries"), or they go.

Placeholders refuse to lie: "PROTOTYPE PHOTO GOES HERE" beats a stock image that implies hardware exists.

## Wording rules

| Say | Not |
|:---|:---|
| prepared, not yet run | tested, validated |
| reconstructed from the public inquiry | validated on the real incident |
| no known risk found | safe |
| recommends a hold, a human approves | freezes the account |
| drafts the report | files the report |
| in simulation, 32 replays, seed 42 | proven |
| target: 90% | achieves 90% |
| 88.1% (95% CI 82.2-94.1%, n=101) | 88% accuracy |
| model latency only, one CPU core | real-time |
| illustrative | (an unlabelled mockup) |

Engine-level rules from the projects: "the LLM writes prose, never numbers"; a narration step "can never change the verdict"; a verdict label the product never renders ("never render the word 'safe'"). Say these in the README exactly as the code enforces them, and pin each with a test.

## LIMITS.md

Start from [LIMITS.template.md](../assets/LIMITS.template.md). Its sections, from engram's `docs/limits.md`:

- **§0 What this document got wrong about itself.** Written last, kept forever.
- **Known limits**, each with a status: fundamental, fixable but not fixed, deliberate trade-off, demo affordance.
- **Bugs a hostile reader found**, with file and line, what the repo claimed and what the code did, the fix and the pinning test.
- **What the demo does not prove.**
- **Things we did not build**, "named so you can tell the difference between a decision and an oversight".

> Field note (engram · CockroachDB × AWS Build with Agentic Memory): an earlier limits doc confessed no bugs, only flattering "learnings". A hostile review then found 12 bugs with file names, including a column the docs said existed and did not, and 11 citations to files that did not exist. The rewritten doc opens with what it got wrong about itself: "Honesty had been applied exactly where it would be graded."

## The README's "Where we lose"

A section in the README, linked from the top, listing results that went against you, with numbers, as specifically as the wins. Detour's listed a counting error fixed after the deadline ("The submitted v1.0.0 still has the error"), the free models, the model against plain rules, a ranking where a placebo memory beat its own memory (72% against 60%), the controller's plan choice (best on 11 of 15 closures, worst gap 33%), bus sizing that got worse on two lines, tie-breaks between equally fast paths, a 100% that measured templates rather than open language, and the free database's outages.

## The negative case is half the proof

Show silence when silence is right, across a matrix, and pin it with a test. "Zero false alarms" on a slide is a claim; a replay of a quiet day with zero alerts, in the demo, is evidence.

> Field note (FLOODLIGHT · MUSA CodeX 2026): the "Quiet Tuesday" replay sent zero street alerts while still dispatching the drain crew to the blocked drain. A test matrix of 8 areas x 4 storms (32 replays) pinned both halves, and the replay was the team's answer to the alert-fatigue question.

## A control group in the demo, and what it does not prove

Run the same scenario with the guard removed (engram's `--unsafe` flag: eight agents, eight refunds, zero conflicts) beside the guarded run (eight agents, one refund). Then write "What this demo does not prove" next to it. engram's review caught that the control removed two independent guards at once, and either guard alone prevents the double refund, so the README narrowed the claim in the same place it was made.

## External validity beats a bigger self-built simulator

If you author both the data and the detector, the circularity critique still applies however large the simulator grows: "Bigger self-sim = production value, zero credibility gain." Climb this ladder instead, and state for every exhibit what is real and what is overlaid:

1. **Hard negatives and held-out seeds** in your own benchmark (necessary, not sufficient).
2. **Real incidents reconstructed from public inquiries**, each with an honest-mapping note on what the record gives and what you supplied.
3. **Public datasets replayed through the same untuned engine**, the raw slice committed so anyone can diff it against the source, with provenance in the file header and a sensitivity sweep published beside the headline.
4. **A recognised third-party model** generating the inputs (an EPA dispersion model, a standard simulator), every run parameter in the file's provenance header, with a sweep showing where the system is correctly silent.
5. **A public proxy for a roadmap capability**, labelled as a proxy ("Bitcoin proxy, not the bank's data").
6. **One practitioner problem-validation quote** (rules below).
7. **Real data, a letter of intent, a pilot.** Usually outside the hackathon window; say what the ask is.

Never tune a threshold to the exhibit: "untuned" is the whole claim. If the lead time is small, report it small.

> Field note (Trinetra · ET AI Hackathon 2.0): after six judge rounds the master plan said the code was essentially maxed, that the Business score was gated on external validity, and that a bigger self-built simulator was not to be built. The exhibits were two incidents reconstructed from official inquiries, a public CO dataset with a lead-versus-scale sweep and, after the plan, an EPA ALOHA methane run through the same frozen engine.

## Practitioner quotes

- Quote verbatim. Bold for emphasis is allowed; changing words is not.
- It is problem validation, not demand, not an endorsement, not a letter of intent. The copy must not imply the person is a customer, endorsed the product or would buy it.
- Attribute by credentials the person approved. Never invent a name, title or company; use a placeholder like `[Name or initials, Role, years in the field]` until the user fills it in.
- Your own bridge line ("that experience, encoded") stays visually distinct and is never attributed to them.

## Certify what you did not compute

When a sponsor's algorithm or a third-party service returns an answer that is cheap to check, check it on every call, fall back to your own computation when the check fails, and say so in the output. Detour checked every `algo.maxFlow` answer with a max-flow/min-cut certificate (feasible, no augmenting path, value equals cut capacity) and recomputed with its own Dinic solver on failure; a reproduction showed the engine wrong on 13 of 100 random networks, and the certificate caught all 13. The team that first reported the engine bug was credited in the README, the model doc and the blog.

## Independent semantics for verifiers

"An independent check needs independent semantics. Reimplementing the same spec catches typos, not wrong ideas." Detour's NetworkX verifier shared no code with the product and still agreed with a counting error, because it copied the same counting: both directions of a bus leg summed against one direction's capacity. A human reviewer found it after the deadline. Write the verifier's semantics from the problem statement, not from your implementation, ideally in a fresh session that has not read the product code, and add an adversarial reader on top.

## Draft to final: the claim-change table

Before submitting, run a hard-critic pass and a cross-model check, and keep a table of every claim that changed. MuleShot's:

| Draft | Final |
|:---|:---|
| 78/81 mules caught (96%), about 19x lift | 73/81 (90%), about 18x, after a month-code leak was found |
| one leak | two leaks, a date proxy and 359 dead columns, evidence printed |
| an unverified government mandate by a date | deleted |
| "freezes the proceeds" | "recommends a real-time hold, maker-checker, audit-logged" |
| seat pricing | dropped (IP co-owned); impact and deployment instead |

The leak was hidden by a type coercion and caught by a second model reviewing the work.

## Adversarial review before every docs, deck or video pass

A reader with no stake in the score audits every claim, including code comments and docstrings. In Claude Code: delegate to the `bullseye:claims-auditor` agent with the repo path, CLAIMS.md and the list of judge-facing files. Elsewhere: paste this into a fresh session that did not build the project.

```text
You are auditing the claims of a hackathon project you did not build. You have no stake in its score.
Assume nothing in the README, CLAIMS.md, SUBMISSION.md, deck, video script, landing page, UI copy or
code comments is true until you have checked it against the code or a run.

1. List every claim: numbers, superlatives, capability statements ("works offline", "never invents a
   price"), comparisons with competitors, and behaviour promised in code comments and docstrings.
2. For each, find the code that would make it true and the command that measures it. Run what you can.
   Status: VERIFIED (ran it, matches) | SUPPORTED (code backs it, not run) | STALE (differs from the
   current measurement) | OVERCLAIM (true but narrower than stated) | UNSUPPORTED (no code backs it) |
   CONTRADICTED (the code does the opposite).
3. Compare the same quantity across every artifact. Any two values that differ are a finding.
4. Check the wording: prepared vs executed, reconstructed vs validated, simulated vs measured, target vs
   result, "no known risk" vs "safe", mockups and illustrative values labelled where they are shown.
5. For every test cited as proof: would it fail if the behaviour were removed? Does it avoid the input
   that would break it?
Output: a table (claim | where | status | evidence as file:line or command output | fix), then the three
findings that would embarrass the team most in front of a judge, then "checked, holds" for everything
you verified, so it is not re-flagged next round.
```

The builder fact-checks every finding before fixing it (reviewers are sometimes wrong), fixes every substantiated one including the small ones, and records the non-issues so the next round does not rediscover them.

## After the deadline

Tag the submitted commit. Later work goes under an "After the deadline" heading with a compare link, and every correction says what the submitted version still gets wrong. Never let post-deadline work pass as submitted.
