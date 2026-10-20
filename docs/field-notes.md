# Field notes

The builds BULLSEYE was distilled from, grouped by the lesson each one teaches best. Results are stated only where the event announced them; most of these entries are here for what they did, not where they placed.

## Aim: read the brief, pick the problem, find the angle

### Detour · Graph Hacks 2026 (WeMakeDevs × FalkorDB)
- **Built:** agents on a graph of the New York subway that answer what the network can still carry when a line breaks, using max flow, min cut and forked graphs to test shuttle plans. Two people, about 52 hours, 100 commits to the submission tag.
- **Steal this:** four parallel research passes before the idea, including a scan of about 351 competitor repositories; roughly a fifth cloned the organiser's sample app, so the concept moved to a problem where the algorithm is the product. The organiser's own test ("if the product still works without FalkorDB, the graph counts as decoration") was answered head-on in the README.
- **Scar:** the "shipped" score stayed at 6 or 7 for seven iterations because keys, the release tag, analytics and the CI token scope all needed the owner. Hence the day-1 owner checklist.

### Trinetra · ET AI Hackathon 2.0
- **Built:** an industrial-safety engine that catches the dangerous combination no single sensor flags ("three green lights, one lethal combination"), with a control-room interface, solo. Passed Phase 1; Phase 2 submitted.
- **Steal this:** the problem was chosen by reverse-engineering the previous winner (a solo builder who beat teams of four with a visceral human-stakes problem, multimodal fusion, an instant tangible demo and multilingual output), with the explicit rule to optimise for win probability rather than existing strengths.

### LINE MARSHAL · TrackShift Innovation Challenge 2026
- **Built:** an idea submission for AI line-calling in motor racing, with the same engine pointed at stop-line and wrong-side violations on Indian roads.
- **Steal this:** a battle plan written before anything else, treating the idea gate as the real elimination round; a dual-layer framing (motorsport as the proof, Indian roads as the point) that scores on impact and scalability where a pure racing tool cannot; submit version one early because shortlists come in waves.

### Smart Retrofit Kit · MSME Idea Hackathon 6.0
- **Built:** a funding-programme idea submission for a plug-in kit that makes legacy machines smart.
- **Steal this:** eligibility checked first, five decisions locked on day one, essays written to 91 to 97 percent of each field's character budget, an anonymisation pass that included file metadata.
- **Scar:** the portal's sanitiser stripped percent signs, apostrophes and semicolons from stored answers, and the stored text could not be edited. Write portal-safe text and read back what was stored.

## Build: the demo path first, a demo that cannot die

### Dhaal · MUJ HackX 4.0
- **Built:** a "check before you pay" scam detector with Hindi and English verdicts, voice, a community blocklist and a WhatsApp bot. Three people each driving a Claude Code session on one repository, 130 commits inside the 18-hour build window. Reached the on-campus round.
- **Steal this:** lanes by directory, contract-first API changes, claiming a task by pushing a `[WIP-name]` marker, a golden path locked at kickoff, hello-world deployed by hour three, feature freeze at hour twelve; a runsheet where every beat has a paste-ready input; "the verdict is computed by deterministic scoring; the model can narrate but never change it".
- **Scar:** sponsor services changed under the team mid-event (a trial expired, a voice model was deprecated); every external call needed a mocked fallback behind a flag.

### StorePilot · OpenAI Build Week
- **Built:** an AI store manager that reads sales and stock every morning and drafts the three messages that need sending, solo in about four days, with Codex required by the rules.
- **Steal this:** a prompt pack where every prompt ends in "Done when …"; a seed with planted stories ("same seed, same stories, every time"); facts-first generation where the model rewrites a deterministic draft under a strict schema and falls back to it on failure.
- **Scar:** the requirements checklist was not enforced at the end, so a mandatory README section was missing and a test badge was stale. Hence the final sweep.

### RegSutra · SEBI Securities Market TechSprint 2026
- **Built:** a staged agent pipeline that turns regulatory circulars into grounded obligations, a regulatory diff, rules as code and a hash-chained audit trail.
- **Steal this:** one event contract with two backends, live and replay, so judges reproduce the exact demo with no keys; a required verbatim span on every extracted obligation ("no span, no obligation").
- **Scar:** a hero screenshot captured from the dev server showed the framework's dev indicator. Capture from the production build.

### SunPath · FlowZint AI Hackathon 2026
- **Built:** an agentic solar sales rep with six typed tools, one generated interface card per tool, and provider failover with a 12-second start budget.
- **Steal this:** forgiving tool schemas that steer instead of throwing; a failure ledger in the README where every row is a real failure that became a defence and a regression test.
- **Scar:** the first evaluation metric saturated and the plain FAQ bot beat the agent, with a 33 percent false-push rate. Define the success metric and a harm metric before building, and run a small evaluation on day one.

### Bridge · Slack Agent Builder Challenge
- **Built:** an in-Slack accessibility agent (translate, simplify, digest, cite) on Bolt, the Claude Agent SDK and Slack's MCP server, with 59 tests.
- **Steal this:** a single-instance lock, event dedupe, retries with jitter, hard timeouts and a boot health check shown in the app; a live integration script that prints PASS or FAIL per step against the real platform.
- **Scar:** judges had to be active members of the sandbox workspace, and the submission could not be edited after the deadline. Judge access is a deliverable.

### VyaparAI · Global AI Hackathon Series with Qwen Cloud
- **Built:** a WhatsApp-style desk where a Qwen tool-calling agent turns Hinglish orders into tax-correct quotes and standards-shaped e-invoices, live on the sponsor's cloud.
- **Steal this:** a money guard at the tool boundary (the model chooses items; catalogue prices are snapped in code); work in named passes (core, deploy and proof, wow, stacked, parity, polish, assets) with submission copy written at hour two.

### NAADI · IDBI Innovate 2026 and DhanDrishti · NABARD Hackathon 2026
- **Built:** a financial-health score for small businesses (NAADI) and a rural cash-flow forecast with early warnings (DhanDrishti).
- **Steal this:** precompute model outputs into JSON so the console is static and cannot fail live; "the LLM writes prose, never numbers"; a "why teams lose this track, and how we win it" table in the pitch.
- **Scar:** a platform video cap (3:00) and a PDF size cap (10 MB) were noticed late: the video script needed a shorter cut, and a deck PDF that grew to 45 MB in an HTML rebuild had to be recompressed under 10 MB. Read the limits before making artifacts.

### FaceAttend · NHAI Hackathon 2025
- **Built:** offline face recognition with liveness checks for remote highway sites: a mobile app, a Python proof of concept with benchmarks, and a sync server.
- **Steal this:** a handoff that scored the build honestly against each criterion and named most of the next tasks after the criterion they would raise; benchmarks measured under eleven degraded capture conditions.
- **Scar:** release-only bugs on deadline day (a startup blocked on fonts, an entrance animation hiding a whole screen, a pixel-scaling bug that made every face match). Build the release artifact on a real device on day one.

## Proof: numbers that survive a skeptic

### BIS Compass · Sigma Squad × Bureau of Indian Standards
- **Built:** an offline retrieval system that finds the applicable standards for a product in under a second.
- **Steal this:** the judge-scored entry point kept free of network and model calls and guarded by a test; six evaluation sets from different authors (organiser, generated with a leak filter, an independent agent, adversarial phrasing); every run saved by name; ablations with null results labelled; per-miss failure analysis; a one-command setup that scores itself on the judge's machine.

### engram · CockroachDB × AWS Agentic Memory Hackathon
- **Built:** a memory of record for agents that act, where the decision, the memory and the side effect commit in one transaction.
- **Steal this:** README claims written as tests against the real database, with non-vacuity checks ("zero conflicts means the agents never raced, so this run is not evidence") and canary tests that pin known limits; a demo with a control group; a limits document that opens with what it previously got wrong about itself.

### kasauti · SerpApi India Hackathon 2026
- **Built:** a fact-checker for forwarded messages with a polite correction drafted in the forward's language, reachable as a web app, a CLI, a Python API and an MCP server.
- **Steal this:** offline-first tests that delete every API key and run with zero credits; guardrails that cap the model's confidence by evidence quality and show each intervention; a search-budget counter on every result.

### MuleShot · Bank of India × IIT Hyderabad Hackathon 2026
- **Built:** an eleven-page idea proposal for explainable mule-account detection, under a 1 MB limit.
- **Steal this:** proof at the idea stage on the organiser's own data: a leakage audit as the hero story, recall with a bootstrap confidence interval, the brief's own features as the baseline through the same pipeline, measured latency with honest scope. A print pipeline with font subsetting, a size gate and zoomed visual QA.
- **Scar:** the first draft's 96 percent became 90 percent after a second model caught a leak hidden by type coercion. The honest number made the stronger story.

### FLOODLIGHT · MUSA CodeX 2026
- **Built:** a street-level flood warning system that tells a rain overload from a blocked drain. Qualified from Round 1.
- **Steal this:** the negative case as proof ("Quiet Tuesday" sends zero alerts and still catches the blocked drain), pinned by tests across eight areas and four storms; a presenter script with actions in brackets, a 90-second emergency cut and a numbers cheat card. "Round 1, we promised this. Round 2, it runs."

### ReviewLens · NLP course project
- **Built:** aspect-based sentiment analysis measured rung by rung on a public benchmark, deployed with a Streamlit dashboard that does not look like Streamlit.
- **Steal this:** every rung has to beat a number, not a vibe; colour reserved for meaning and checked for colour-blind safety.

## Craft: a look from the subject's own world

### ORCA · Smart India Hackathon 2026, then Vibeathon 2026
- **Built:** multi-agent marine decision support for fisherfolk in three languages with voice, a phone app and a judge-facing challenge page. Re-entered at Vibeathon and reached the offline Stage 2.
- **Steal this:** the generic dark-glass interface replaced by a living nautical chart; design rules enforced by unit tests (no literal colours, transform-only motion, translation parity); a poster-first signature moment running on the real pipeline. At the surprise round, the stage-one deck had pre-committed the seams where any challenge would land, and the brief handed over at 12:05 shipped by 14:50.

### CrackWatch · NIRMAN 2026, then Gappy AI Hackathon 2026
- **Built:** citizen pothole reporting with in-browser detection and a government repair console, rebuilt for Gappy AI on a single Lemma pod. Reached the top 25.
- **Steal this:** a sponsor-platform story told as subtraction ("what we did not have to build"); a judge-legible money number ("an ignored pothole is a 6× invoice"); a finalist brief drawn as an engineering drawing with the git revision on every sheet; a judge brief with honest limits, a pre-flight, a decision rule and a question bank.
- **Scar:** the first version's dark-glass look, emoji headings and feature sprawl. Decide the hero loop and the deliberate omissions early.

### WasteOS · 2nd OneEarth International Hackathon 2026
- **Built:** a pitch for an operating system for urban waste, with a deck and a 100-second launch film generated entirely from code.
- **Steal this:** every number typed as sourced, simulated, projected, target or illustrative; real OpenStreetMap data for the route map and the digital twin; a voiceover verified by transcription until word-perfect; the organiser's five-slide format planned as a separate cut from the longer talk.

### Fineprint · Paytm Build for India AI Hackathon
- **Built:** a pitch for an agentic health-insurance claims companion.
- **Steal this:** the featured mock case is the uncertain one, handed to a human ("Agents draft. Humans fire."); the user's own sentence in their own language beside each agent; a small, specific ask on the last slide.

### Project SURYA · ISRO Bharatiya Antariksh Hackathon 2026
- **Built:** an idea submission for solar-flare forecasting from Aditya-L1 data.
- **Steal this:** honour the template, then out-build it: the organiser's art and section order kept exactly, then validation against named baselines, data availability, risks, roadmap and a lean budget added.
- **Scar:** the folder holds the finished deck and its PDF but no generator script. Keep every generator in the repository.

## Contribution events

### MERGETOBER · open-source connectors for cognee
- **Steal this:** derive the quality bar from a pull request that was actually merged; validate the API live before promising anything; tests that fail if their fix is removed; a walkthrough so the human can defend every line; the human owns accounts and keys, and the key checker prints only OK or FAIL.
