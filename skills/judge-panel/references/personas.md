# Jury personas

Who sits on the panel decides how the rubric is read. Two events can both weight Business Impact at 25% and reward different things: a VC reads it as a market, a bank reads it as risk removed, a ministry reads it as cost per district. Pick the persona from the event page, the judges list and last year's winners (BULLSEYE.md `## Contract` records them), blend two when the panel is mixed, and put its one-line brief in `judging/pack.json` as `persona`. The judge prompts and the mock Q&A both read it.

Write the persona the way the organiser describes the jury, plus what that implies. "Founders and VCs, not metric-graders" tells a judge more than "industry experts".

Each persona below has: the line to paste, what it rewards, the questions it asks, and what loses it. Build the Q&A bank from the persona's questions plus the universal ones at the end, then answer each in the LIVE / SHOW / IF PUSHED shape.

## Founders and VCs

**Persona line:** founders and VCs, not metric-graders: they back a business, not a demo.

**Reward:** a painful problem with a number on it; a buyer, a wedge and a moat; unit economics with the basis stated beside the number; evidence from outside the team (a practitioner, a dataset, a pilot); a founder with a reason to own this problem.

**Typical questions:**
- "Who buys this, and who signs the check?"
- "What's the ROI, and what is it based on?"
- "Why can't the incumbent ship this in a quarter?"
- "What have you validated outside your own team?"
- "Would it have caught a real one?"

**What loses them:** an evaluation the team authored end to end (the answer to every number becomes "you authored the data"); an ROI multiple with no probability behind it; "autonomous" where the code prepares and a person sends; a testimonial dressed up as a customer.

**The ladder they look for:** an arm's-length practitioner interview, then a design-partner letter of intent, then a paid pilot. Name the rung you are on and do not imply the next one. A quote from someone who confirms the problem is problem validation: not demand, not an endorsement of the product, not a customer.

> Field note (Trinetra · ET AI Hackathon 2.0): With a founder and VC jury, Business held at 7 across the informed rounds because the core evaluation was self-authored and no real plant had supplied data, and the judges named the ceiling as external validity. An early review's plan had already replaced a 116× per-incident ROI with an expected-value 7.7× at a stated 1-in-15-year probability.

## Bankers and regulators

**Persona line:** senior bankers, risk and compliance officers: every automated action must be explainable, reversible and logged.

**Reward:** governance first (maker-checker, a person approving at the money step, an audit log nobody can edit); a reason code per decision; data that never leaves the bank; rare-event metrics at the bank's review capacity (recall in the top 5% reviewed, precision at top-k), never plain accuracy; a fit with the stack the bank already runs ("we ingest the incumbent's alerts").

**Typical questions:**
- "What stops a wrong AI score from spending money?"
- "Who approves the action, and where is that recorded?"
- "Does customer data leave the bank?"
- "What does a false positive cost us at our volume?"
- "Which regulation does this satisfy, and which does it not?"

**What loses them:** a GenAI feature in the spotlight while governance is a footnote; "freezes" or "blocks" where the honest verb is "recommends a hold"; accuracy on an imbalanced problem ("A model that calls everyone legitimate scores 99.1% accuracy and catches zero"); a mandate or regulation nobody verified.

> Field note (MuleShot · BOI × IIT Hyderabad 2026): Acting on a mock-judge critique, the proposal replaced the analyst cockpit's GenAI panel with a decision-governance panel (score, explain, maker-checker, audit log, "never auto-frozen") and demoted GenAI to one line that drafts the report for analyst review, because a banking jury scores governance.

## Engineers

**Persona line:** senior engineers who will open the code: technical hand-waving will be found out.

**Reward:** an architecture they can trace in the repository; measured latency and load (p50, p99, and the machine it ran on); failure handling a demo can show (timeouts, retries, a degraded mode the screen labels); tests that pin the claims; a run that works from a fresh clone.

**Typical questions:**
- "Where do the agents actually run? Show me they're real."
- "How is this more than a CRUD app with a chatbot?"
- "What breaks at 10,000 reports a day?"
- "What happens when the model API is down or rate-limited?"
- "Show me the trace behind that answer."

**What loses them:** fixed pipeline stages sold as autonomous agents; a number with no command behind it; a demo that only runs on the presenter's laptop; a fallback that silently replaced the model and nothing on screen says so.

> Field note (LINE MARSHAL · TrackShift Innovation Challenge 2026): The battle plan read the jury before the brief, race engineers, and wrote down the consequence: "technical hand-waving will be found out". Its answer was to plan a thin working prototype even for the idea round: "Evidence beats promises, even at idea stage."

## Scientists and domain experts

**Persona line:** researchers and domain experts: they judge the method first, then the number.

**Reward:** a baseline run through the same pipeline; an ablation that shows which part earns its keep; data split before any tuning; hard negatives (every factor present, the right answer still no); confidence intervals; null results reported as null; the leak you found and how you found it.

**Typical questions:**
- "What is the baseline, and is the comparison fair?"
- "Is the test set from the same generator you tuned on?"
- "Are the negatives too easy?"
- "Was any threshold tuned to the test?"
- "What's the confidence interval on that number?"
- "Why didn't you use ML?"

**What loses them:** one number with no baseline; "validated" for a reconstruction; a self-authored benchmark presented as external; plain accuracy on a rare-event problem.

> Field note (Trinetra · ET AI Hackathon 2.0): An adversarial judge round showed that every negative in the benchmark dropped one factor, so a perfect score only proved that "the engine implements its own rule". Cases where every factor is present but the zone is physically safe made the evaluation discriminating, and that case became the demo's answer to "is your eval rigged?".

## Sponsor developer relations

**Persona line:** the sponsor's developer-relations team: they reward load-bearing use of their technology and honest feedback.

**Reward:** the sponsor's technology doing work nothing else in the stack could do; every named sponsor tool used where it fits; specific friction notes with feature requests; something they can show other developers (a clear README section, a blog post, an MCP server).

**Typical questions:**
- "Does it work without <sponsor tech>?"
- "What friction did you hit with <sponsor>? Be honest."
- "Which of our features did you use, and why those?"
- "What should we build next?"

**What loses them:** a thin wrapper; sponsor technology as decoration; vague praise; not knowing where their product is weak.

> Field note (Detour · Graph Hacks 2026): The organiser's rule went into the plan on day one (a product that still works once FalkorDB is taken out leaves the graph as decoration), and the briefing answered it in one word, "No", followed by the list of work only the graph does.

## Government officials

**Persona line:** government officials and programme officers: they fund what can run at district scale on a public budget.

**Reward:** feasibility on existing infrastructure (offline, low-end phones, local languages); a cost per unit (per ward, per district, per machine) and who pays after the pilot; a path from pilot to state to national; compliance and data sovereignty; who operates and maintains it.

**Typical questions:**
- "What does it cost per district, and who pays after the pilot?"
- "Does it work offline, on a low-end phone, in the local language?"
- "How does it connect to the systems we already run?"
- "Where is citizen data stored?"
- "What happens at 3 a.m. with no reports coming in?"
- "What's the business model? Who pays?"

**What loses them:** cloud-only dependencies; English-only screens; no cost estimate; a pilot claim with no named owner.

> Field note (FLOODLIGHT · MUSA CodeX 2026): The Q&A ammo answered "What happens when there are no citizen reports at 3 a.m.?" with the degraded mode (rain gauges plus the model still warn; diagnosing a blocked drain waits for observations) and a low-cost sensor per chronic choke point, and answered "What's the business/deployment model?" with a budget the city already spends, blindly.

## Every panel

Some questions come from every jury in some form:
- "Who on the team did what?"
- "What did the AI build? Say it plainly."
- "Are the numbers right?"
- "Is this real data?"
- "Why won't people ignore the alerts?"
- "How accurate is it, and against what baseline?"

Answer the AI question plainly: what the coding agent did, under whose direction, and how the team verified it. The README's disclosure says the same thing. "Judges check that you understand it, so know every row on this page."

## Prepared hostile questions from the field

These were written down before real judging calls. The right column is the answer shape that held up; fill in your own facts.

| Question | Source | The answer shape that held up |
|---|---|---|
| "Where do the agents actually run? Show me they're real." | CrackWatch · Gappy AI Hackathon 2026 | Name the runtime in one sentence, then run one live from the terminal. Never describe what you can show. |
| "What stops a wrong AI score from spending money?" | CrackWatch · Gappy AI Hackathon 2026 | The person who approves at the money step, a schema-constrained model output, and a deterministic function that recomputes the amount. |
| "How is this more than a CRUD app with a chatbot?" | CrackWatch · Gappy AI Hackathon 2026 | Name what the backend decides that a CRUD app cannot: grounded judgment, an event-triggered workflow, a gate a person signs. |
| "What breaks at 10,000 reports a day?" | CrackWatch · Gappy AI Hackathon 2026 | The real bottleneck first (list caps, client-side aggregation), then the fix path. Never "it scales". |
| "What friction did you hit with <sponsor>? Be honest." | CrackWatch · Gappy AI Hackathon 2026 | Three concrete frictions with the workaround for each, then what held up. |
| "Who on the team did what?" | CrackWatch · Gappy AI Hackathon 2026 | One line per person, by component. |
| "Does it work without <sponsor tech>?" | Detour · Graph Hacks 2026 | "No", then the list of work only the sponsor technology does; without it, only a labelled replay remains. |
| "Are the numbers right?" | Detour · Graph Hacks 2026 | An independent recomputation that agrees, and the command that runs it. |
| "What did the AI build? Say it plainly." | Detour · Graph Hacks 2026 | Plainly, matching the README's disclosure, then show you know every component. |
| "Is this real data?" | FLOODLIGHT · MUSA CodeX 2026 | Three layers, each labelled: what is reconstructed from real events, what is live right now, what is scripted. |
| "Why won't people ignore the alerts?" | FLOODLIGHT · MUSA CodeX 2026 | The quiet day: silence is a tested feature, so when it speaks it has earned belief. |
| "How accurate is it, and against what baseline?" | FLOODLIGHT · MUSA CodeX 2026 | The model's job and the baseline it is measured against; a simple model that is wrong in a useful direction beats a precision claim you cannot back. |
| "What happens at 3 a.m. with no reports coming in?" | FLOODLIGHT · MUSA CodeX 2026 | What degrades, what still works, and what restores it. |
| "What's the business model? Who pays?" | FLOODLIGHT · MUSA CodeX 2026 | The budget line it replaces or makes smarter. |
| "Why didn't you use ML?" | FLOODLIGHT · MUSA CodeX 2026 | Trust: an officer has to act on it at 2 a.m. "We'd rather be inspectable than impressive." |

Every answer still needs the project's own numbers, from facts.json or CLAIMS.md. An answer shape with an invented number in it is a bluff.
