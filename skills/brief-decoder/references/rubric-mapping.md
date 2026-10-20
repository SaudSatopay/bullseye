# Rubric mapping

How to read a rubric, what evidence wins each common criterion, the weight sets real events published, and how the weakest criterion writes the backlog. Used in brief-decoder steps 6 and 7, and again whenever the build is re-scored.

## 1. Read the rubric as part of the contract

- Copy criteria and weights verbatim into the Contract. With no weights, write `not published` and build a proxy (section 5).
- Look for stages before scoring. OpenAI Build Week ran a pass/fail Stage 1 (fit with the theme, required tech used) before four scored criteria. Sigma Squad × BIS scored 40 points by an automated metric before any human looked. MUJ HackX 4.0 screened profiles before anyone built.
- Note who judges. The same word means different things to a VC and to a race engineer (section 4).
- Count the non-code share: the criteria a judge scores without reading the code (presentation, impact, feasibility, business case, problem understanding, most of UX).

## 2. Weight sets seen in real events

| Event (project) | Criteria and weights | What it meant for the build |
|---|---|---|
| ET AI Hackathon 2.0 (Trinetra) | Innovation 25 · Business Impact 25 · Technical Excellence 20 · Scalability 15 · UX 15 | Innovation plus business is half the score, judged by founders and VCs, "not metric-graders". The business case and external validity carried as much weight as the engine. |
| NHAI Hackathon 2025 (FaceAttend) | Innovation 30 · Feasibility 30 · Scalability 20 · Presentation 20 | The brief set numbers (3 GB RAM phones, about 20 MB model, over 95% accuracy, under 1 s). Feasibility was answered with a release build on a real phone and measured benchmarks. |
| Sigma Squad × BIS (BIS Compass) | 40 automated (Hit@3 over 80%, MRR@5 over 0.7, latency under 5 s) + six manual criteria at 10 each: relevance, no hallucination, technical excellence, retrieval innovation, usability and impact, presentation | The scored entry point had no network or LLM calls and was guarded by tests; the organiser's scorer ran unedited. |
| MUJ HackX 4.0 (Dhaal) | Innovation · Technical implementation · Feasibility · Presentation · Overall impact (no weights) | 3 of 5 criteria are non-code: a narrow demo that never breaks, one wow, a tight 5-minute story. |
| TrackShift Innovation Challenge 2026 (LINE MARSHAL) | Problem understanding · Innovation · Technical execution · Scalability · Real-world impact · Presentation | Two criteria were "nearly unscoreable for a pure F1 tool": the dual-layer submission. |
| MUSA CodeX 2026 (FLOODLIGHT) | Innovation · Problem Understanding · Technical Implementation · Scalability · Practical Impact · Presentation · UX · Teamwork | Eight criteria with teamwork scored: a roster slide with roles. The problem statement's named twist became the product. |
| OpenAI Build Week (StorePilot) | Stage 1 pass/fail, then four equal: Technological Implementation (depth of Codex usage) · Design (beyond proof-of-concept) · Potential Impact · Quality of Idea | Use of the required tool was itself a criterion: a per-session attribution log and a required README section. |
| NABARD Hackathon @ GFF 2026 (DhanDrishti), Round 1 | Innovation · Feasibility · Relevance · Potential impact | The submission pack mapped each criterion to a concept-note section and a deck slide. |
| SEBI Securities Market TechSprint 2026 (RegSutra) | Market impact · Technology · Feasibility · Scalability · fit with the regulator's mandate (as mapped in the project's architecture doc) | A mandate criterion: the deck closed on fit with the regulator's mandate. |
| MSME Idea Hackathon 6.0 (Smart Retrofit Kit) | The official Do's: novel, useful to society, scalable, reduces cost, improves quality of life, clean and green energy | Candidate ideas were mapped to the theme's own wording before one was picked. |
| Graph Hacks 2026 (Detour) | Not published; a hard rule on the sponsor's tech | A proxy from the organiser's guide, later answered point by point in the README. |

## 3. What wins each common criterion

| Criterion | What judges look for | Evidence that wins it | Where it shows |
|---|---|---|---|
| Innovation, novelty | A mechanism nobody else in the room has | The one-liner as a claim; a named mechanism ("compound risk", "intent mismatch"); a "typical entry vs ours" table; the closest prior art named by you, rated fairly | Thesis, deck slides 3–4, README top |
| Technical implementation, excellence | It works, it is non-trivial, it is sound | A live run on real or seeded data; tests that pin each claim; numbers that reproduce from a command; a deterministic core with the LLM narrating, never deciding | Repo, README Evidence, CI step names |
| Feasibility | Could this ship next quarter | A working MVP; the deployment path ("a connector, not a rewrite"); a cost estimate within any cap; runs on the target hardware | Deck feasibility slide, README deploy section, budget table |
| Scalability | Does it hold at 10× and across sites | Measured throughput; a scale ladder (NOW, NEXT, THEN) with "same engine, zero rebuilds"; per-tenant design; a cost curve | Deck, README performance section |
| Business, market impact | Who pays, how big, why now | Buyer, wedge and pricing; a sized market with sources; ROI as expected value, not the best case; the validation ladder (interview, LOI, paid pilot) | Deck, form answers |
| Problem understanding | The team understands the pain | One concrete incident with three sourced numbers; the problem quoted as the organiser stated it; the brief's named twist solved head-on | Deck slide 2, README problem section |
| Real-world, practical, social impact | A measurable outcome | Typed numbers (measured, sourced, simulated, projected, target, illustrative); a "not yet counted" line; the negative case (no false alarm) shown | Deck impact slide, video close |
| UX, design | A coherent product beyond a proof of concept | A domain-native identity; one signature moment; empty, loading and error states; legible on a phone and a projector | Live app, screenshots, video |
| Presentation | Clarity under time pressure | A timed script rehearsed three times; one speaker and one driver; numbers spoken as the pitch; a backup video | Finale, demo video |
| Teamwork | Real roles | Roster with lanes; commit history per lane; who did what, said plainly | Deck team slide, README |
| Sponsor tech usage | Load-bearing, not decoration | "Does it still work without it?" answered no, with the reason; a primitives table; specific feedback to the sponsor | README, form, video |
| No hallucination, grounding | Answers only from evidence | Verbatim source spans, tool-only numbers, "no tool, no answer", a grounding check with its own measured strictness | Product UI, README Evidence |
| Depth of tool usage (AI-tool events) | The required tool did the work | A per-commit attribution log, session IDs, public history inside the window | README section, video beat |

## 4. Weight what this jury scores

| Jury | What moves them | What loses them |
|---|---|---|
| Founders and VCs (ET AI Hackathon 2.0) | The business case, a named buyer, external validity: real incidents reconstructed, public data, one honest practitioner quote | A bigger self-built simulator ("production value, zero credibility gain") |
| Domain engineers (TrackShift: "people who do race engineering for a living") | Rigour, error bars, honest scope | Hand-waving: "technical hand-waving will be found out" |
| Bankers and regulators (MuleShot, NAADI) | Governance: maker-checker, audit trails, explainability, a complement to the incumbent system | Autonomous actions, GenAI flash, "90% accuracy" on a rare event |
| Sponsor engineers (Graph Hacks, OpenAI Build Week) | Their tech doing work nothing else could; candid friction feedback | The official guide's demo app, re-skinned |
| Government panels (MSME, SIH) | Feasibility, cost within the cap, a deployment path, every form rule honoured | Missing documents, identity or citations where they are forbidden |
| Automated scorers (Sigma Squad × BIS) | The metric on hidden inputs, then the manual criteria | Anything that can break the scored path |

> Field note (Trinetra · ET AI Hackathon 2.0): The master plan called the code "essentially maxed" and the business score gated on the one thing the engine could not produce, external validity. The external evidence was two real incidents reconstructed and a public dataset, built before the plan, then a third-party physics model and one practitioner quote, each with its limits stated.

## 5. When no rubric is published

- Build a proxy from the organiser's own words: the official guide and its reference architecture, the hard rules, FAQ answers, the judging page, and what last edition's winners had in common. Label every proxy row `proxy` with its source.
- Graph Hacks published no criteria ("Judging criteria, weights and judges: not published"). The README later carried "The judging guidance, point by point": what the organisers' guide asks for, and where the product shows it.
- For product quality on top of the event's criteria, use the rubric of the sibling skill `missile` (its ten dimensions score the product, not the event's criteria).

## 6. Self-score honestly, then let the weakest criterion write the backlog

1. Score each criterion 1–10 from evidence only. Calibration: 7 is a strong hackathon project, 9 or more would win. Do not inflate.
2. Weighted total = the sum of weight × score / 10.
3. Name each criterion's weakness in one line.
4. Rank the gaps by weight × (10 − score) ÷ effort. The top three become next tasks, each named after the criterion it raises, each with an `Accept:` line.
5. Put the criterion in the commit title; re-score after each task.
6. For an outside view, run the sibling skill `judge-panel` (a fresh context with no memory of the build).

| Criterion | Weight | Score | Weakness | Next task, named after it |
|---|---|---|---|---|
| {{Innovation}} | {{30}} | {{7.5}} | {{liveness is a single layer}} | {{Add a passive anti-spoof layer and its eval (Innovation)}} |
| {{Scalability}} | {{20}} | {{7}} | {{no evidence across conditions}} | {{Add a diverse-conditions robustness eval (Scalability)}} |

> Field note (FaceAttend · NHAI Hackathon 2025): The handoff self-scored about 82–90 of 100 against Innovation 30, Feasibility 30, Scalability 20 and Presentation 20 and named the weak spots. Three of the next four tasks shipped as commits named after the criterion they raised, such as "Add int8 quantization demo (Innovation/compression)".

## 7. Where the rubric map is used later

- README: a "How it maps to the rubric" table (criterion, weight, evidence with a file path), written by the sibling skill `submission-pack`.
- SUBMISSION.md: "How this scores against the evaluation criteria", one section per criterion with its weight and evidence.
- Deck: each slide's claim tied to a criterion (sibling `pitch-deck`).
- Demo video: beats ordered by weight (sibling `demo-video`).
- Judge rounds: scored against these exact weights (sibling `judge-panel`).
