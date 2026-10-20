---
name: build-sprint
description: Build the hackathon product demo-path first, with a demo layer that cannot die and AI that is honest by construction. Writes PRODUCT.md (the judge as a user, a must-never-break list), locks 6 to 8 golden-path beats with a money shot and a quiet negative beat, splits engine from model, deploys a day-1 skeleton, seeds planted stories, adds labelled live, scripted and recorded modes, and grounds every AI number in tool results. Use it when the user says "build it", "start the build", "build the MVP", "make the demo bulletproof", "add the AI part", "stop the hallucinations" or "split the work across the team", or once brief-decoder has written the Contract.
argument-hint: "[plan | skeleton | demo | ai | pass <name> | freeze | team] [notes]"
license: MIT
metadata:
  author: Saud Satopay
  version: "1.0.0"
  part-of: bullseye
---

# Build sprint

Build the product the judges will see, in the order they will see it. The golden path comes first and is deployed on day 1. The demo layer makes it survive no network, no keys, spent quotas and a stale browser tab. The AI layer is honest because the schema and the code leave it no room to invent. Everything else is cut from the bottom of the plan. This skill stops at the feature freeze and hands the product to `missile` for polish and `prove-it` for claims.

## Inputs

- `BULLSEYE.md` with `## Contract` and `## Thesis` filled (sibling skill [brief-decoder](../brief-decoder/SKILL.md); install the full set with `npx skills add SaudSatopay/bullseye` if missing). Without it, ask for the problem statement, the rubric with weights, the deadline with its timezone, the deliverables and any required stack, and write those facts into `BULLSEYE.md` before step 0.
- The window length and the team size. They pick the timebox in [passes-and-timeboxes.md](references/passes-and-timeboxes.md).
- An empty folder or an existing repository. On an existing one, read it before planning and keep its stack.

## Modes

| Argument | Runs |
|---|---|
| none | The full procedure, resuming from the `status:` line in `BULLSEYE.md`. |
| `plan` | Steps 0 to 3: product contract, golden path, engine split, stack. |
| `skeleton` | Steps 4 and 5: the day-1 skeleton and the seeded data. |
| `demo` | Step 6 only: audit and build the never-break layer on what exists. |
| `ai` | Step 7 only: audit every AI feature against the patterns and fix the gaps. |
| `pass <name>` | One named pass from step 8. |
| `freeze` | Step 11: freeze, then hand off to polish and proof. |
| `team` | Team mode setup from [team-mode.md](references/team-mode.md). |

Any other words are the user's direction for this sprint. Quote them under `## Decisions` and honour them above the default plan.

## Procedure

Every step ends at a gate. When the clock forces a move before a gate passes, write the open item under `## Risks` in `BULLSEYE.md` and move on. Never record a gate as passed when it is not.

### 0. Product contract

1. Read `## Contract` and `## Thesis`. Note the sponsor test (does the product still work without the sponsor's technology?) and every pass/fail rule.
2. Write `PRODUCT.md` from [PRODUCT.template.md](assets/PRODUCT.template.md): the one-liner as a claim; who it is for, with the judge listed as a user "with two minutes and a laptop, who needs to see that this is a reasoning system and not a chatbot"; the three jobs; the signature moment; what it is not; out of scope; and **Must never break**.
3. Must never break holds the rehearsed scenarios with their exact numbers, demo mode with no network and no key, the one-command launch, parity for every language the product speaks, "nothing a judge must read hides behind an animation that might not run", and the disclaimer line. Write each scenario's numbers the first time the engine produces them. After that, a change to one is a decision with a logged reason.
4. For an agentic product, also write `AGENT-DESIGN.md` from [AGENT-DESIGN.template.md](assets/AGENT-DESIGN.template.md): the unit of work and its lifecycle, what the agent judges, what deterministic functions do, the human approval at the money step, and what is deliberately not built.

Gate: `PRODUCT.md` exists, the judge is a named user, and every rehearsed scenario is listed.

> Field note (ORCA · SIH 2026): the product file pinned five rehearsed scenarios with their numbers ("Goa 9 LOW, Mumbai 06:00 70 HIGH, Paradip 92 EXTREME"), and a smoke test asserted them on every change, so no edit could quietly move the demo.

### 1. Lock the golden path

1. Write 6 to 8 numbered beats a judge will see, one line each: what the judge does, what appears. Under each beat keep the exact input to paste. Nobody improvises inputs on stage.
2. Mark one beat as the money shot: the frame that proves the thesis in one look.
3. Add one contrast beat where the product correctly stays quiet while still catching the real fault. The negative case is half the product: it answers "does it cry wolf?" before a judge asks.
4. Write the beats into `BULLSEYE.md` under `## Plan`, **Golden path**, then the plan items in its table (Id, Item, `Accept:` line, effort S under 30 min, M under 2 h, L longer, Status, Commit). Group items as Foundations (F), Data (D), Engine and tools (T), AI (A), Screens (U), Demo layer (R), Proof (P), Ship (S). Order them so the bottom can be cut, and draw the cut line.

Gate: every beat maps to at least one plan item, the money shot and the negative beat are marked, and the cut line exists.

> Field note (FLOODLIGHT · MUSA CodeX 2026): the "Quiet Tuesday" replay had to send zero alerts while still catching the one blocked drain. It was tested across 8 areas × 4 storms (32 replays), demoed live, and became the answer to the alert-fatigue question.

### 2. The engine decides, the model narrates

1. Anything a judge can check (money, scores, verdicts, routes, counts, dates, ids) is computed by deterministic code. The model picks tools, parses messy language, classifies, and writes prose around facts it was given. Its output carries zero weight in any verdict.
2. Write the split at the end of `PRODUCT.md` under `## Who decides what`, as a table: Layer | Who does it | Why. Give the money step to a human whenever the product spends, sends or publishes.
3. Make the sponsor's technology load-bearing. It should do the core computation, not decorate it. If the product works the same with it removed, change the design now, and plan the README line that says what it does that nothing else here could.

Gate: no row hands the model a number a judge sees, and the sponsor test has a written answer.

> Field note (Dhaal · MUJ HackX 4.0): the plan stated the law in one sentence and told the team to say exactly that to judges: the verdict comes from deterministic scoring over detected signals, and the model can narrate it but can never change it.

### 3. Stack

1. A stack the event requires (a sponsor's cloud, model, database or coding tool) is a pass/fail rule. Use it, and make it visible.
2. Otherwise take the defaults in [stack.md](../missile/references/stack.md) (sibling skill `missile`). Choose boring on purpose: the fewest services that run on a judge's laptop and a free host. Every extra service is one more thing that can be down at judging.
3. Write against the installed versions, not memory. Read the versions in `package.json` and the lockfile before writing an API call, read the version-matched docs the package ships (a Next.js 16 scaffold writes an `AGENTS.md` that says to read `node_modules/next/dist/docs/` before writing code), and use a docs tool for the installed major version.
4. Lock the stack under `## Decisions`, one line per layer with the reason. An upgrade after day 1 needs a reason that beats its risk.

Gate: one Decisions line per layer, and no API call written from memory against a major version nobody has read.

> Field note (FLOODLIGHT · MUSA CodeX 2026): the Round 1 plan named PostGIS. The Round 2 build shipped "deliberately boring": FastAPI, one server-sent-event stream, Leaflet, no build step and no database for the pilot, running on a college laptop and a free host.

### 4. Day-1 skeleton

Within about three hours of the scaffold, in this order:

1. Scaffold with `typecheck`, `lint`, `test` and `build` scripts that pass. Commit.
2. Data build: one script turns the sources into the app's data, deterministically, and writes the provenance file (step 5).
3. Write the spec of the core computation in `docs/model.md`: inputs, formulas, units, tie-breaks and tolerances. It is the exact computation every implementation follows.
4. Build an independent verifier for every headline number: a different language or library, sharing no code, and re-deriving the semantics from the problem rather than from your implementation. Commit its results; sibling skill `prove-it` re-measures the headline claims against them ([claims-ledger.md](../prove-it/references/claims-ledger.md)).
5. Engine and tools: the deterministic core with unit tests, behind typed tools.
6. Screens skeleton: every golden-path screen exists with real copy and its loading, empty and error states, before any polish.
7. Deploy a preview and open it the way a judge will: logged out, incognito, on a phone. A preview behind the host's login returns HTTP 302 to strangers.
8. Add `.claude/launch.json` from [launch.example.json](assets/launch.example.json): a dev server, a production preview on its own port (it serves the last build, so rebuild after edits) and an API, whose `runtimeExecutable` should point at the project's virtual-environment interpreter. Add the one-command launchers [run-demo.sh](assets/run-demo.sh) and [run-demo.bat](assets/run-demo.bat), edit the CONFIG block at the top of each (port, health path, deep links), then run `./run-demo.sh --check` or `.\run-demo.bat --check`: it starts the app in demo mode, waits for the health endpoint, prints the links and stops.
9. Write a judge README stub: one-liner, live link, the 60-second path and how to run it locally. Sibling skill `submission-pack` grows it later.

```bash
cp "${CLAUDE_SKILL_DIR}/assets/run-demo.sh" "${CLAUDE_SKILL_DIR}/assets/run-demo.bat" .
chmod +x run-demo.sh && ./run-demo.sh --check
```

Other agents: copy the same files from this skill's `assets/` folder.

Gate: the four commands are green, the preview URL loads logged out on a phone, and the verifier agrees with the engine on the hero case.

> Field note (Detour · Graph Hacks 2026): scaffold at 19:17, data at 19:25, the model spec at 19:28, an independent NetworkX verifier with committed results at 19:34, tools at 19:47, pages by 21:06, the first deploy fixed by 21:27 and a judge README at 21:35, all before the first critic pass at 22:00.

> Field note (Detour · Graph Hacks 2026): after the deadline a reviewer found a bus leg whose two directions were summed against one direction's capacity. The verifier had copied the same counting, so both agreed. "An independent check needs independent semantics."

### 5. Data and seeds

1. Seed deterministically, from a fixed seed, and plant the stories the golden path walks through: a spike, a few items heading for trouble, a few slow ones, one anomaly. Same seed, same stories, every time.
2. Name a hero case and a failing case, and leave one live item for the hero beat to act on during the demo.
3. Write `data/meta.json`: each source with its URL, slice and retrieved date, every assumption you chose, and the counts the build produced.
4. Label synthetic data wherever it appears: a chip in the UI, a line in the README, a footer in the deck.
5. Make the seed idempotent, or make it refuse to run against production. `/api/health` returns the row counts.

Public sources by domain, licence notes and the method for simulating a claim on real data are in [data-and-seeds.md](references/data-and-seeds.md).

Gate: two seed runs produce identical counts and stories, `/api/health` shows the counts, and `data/meta.json` exists.

> Field note (StorePilot · OpenAI Build Week): 90 days of sales for 120 products came from one fixed seed with a seasonal spike, two products about to stock out, three trending down and one anomalous day. The prompt's acceptance line was "Done when `pnpm db:seed` fills the DB and a `/api/health` route returns row counts."

### 6. The demo layer

Build this before the wow features. Details, code sketches and the full checklist are in [demo-reliability.md](references/demo-reliability.md).

- **One `DEMO` flag.** The launcher sets it by default. Every external call has an offline fallback behind it, and canned answers carry `mocked: true`. Assume venue Wi-Fi dies mid-demo.
- **Three labelled modes.** LIVE (the model chooses tools), SCRIPTED (the same tools in a fixed procedure with templated words, when quota is gone) and RECORDED (a real live run captured and replayed with its date, when a dependency is down). The first event of every run names its mode and why; the UI shows it as a chip in a colour apart from the accent.
- **Replay on the same event contract** as live, so the UI cannot tell them apart except by the label.
- **A chip that names the path** whenever a heuristic or offline fallback answers.
- **Provider failover** with a start budget (fail over before the first token streams), one retry, and friendly in-character error copy.
- **Caches that warm themselves** on boot for the hero scenarios. Cache whole series, never one fetch per item.
- **`/api/health`** with mode, provider, build and counts. It never returns a 500.
- **Reset demo** plus deep links: `?demo=<scenario>`, `?autorun=1`, `&fast=1`, one URL per golden-path beat.
- **A build stamp** in the footer and in `/api/health`, so a phone on a stale cache shows itself.
- **Long-lived processes** (bots, sockets, schedulers) get a single-instance lock, dedupe, retries with jitter, hard timeouts and a boot health check shown in the UI.
- **Free hosts** get a keep-alive cron for databases that sleep. Open cold hosts two minutes before judging.
- **Static serving**: entry HTML `no-store`, hashed assets immutable, explicit MIME types, a path-contained SPA fallback.
- **Browser timing**: keyless map tiles, a `setTimeout` fail-safe behind every `requestAnimationFrame` count (hidden tabs suspend it), and nothing a judge must read starting at opacity 0.
- **Precompute** model outputs to JSON for a static UI whenever the model can run offline.
- **A smoke test** that replays the rehearsed scenarios and asserts their numbers.

Probe a running or deployed demo the way a judge's browser meets it:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/demo-check.mjs" https://your-preview.example --link "/?demo=hero" --link "/?autorun=1"
```

Other agents: run the same script from this skill's folder. [demo-check.mjs](scripts/demo-check.mjs) prints PASS, WARN or FAIL for: no login wall, entry HTML not cacheable, hashed assets cacheable with the right MIME type, a health endpoint that answers JSON (its mode and counts are printed), every deep link, an optional build stamp (`--stamp <sha>`), HTTPS on public hosts, and cold-start latency. It exits 1 on any FAIL. `--help` lists every option. In Git Bash, prefix the command with `MSYS_NO_PATHCONV=1`, because the shell rewrites arguments that start with `/` into Windows paths (the script detects this and says so).

Gate: with the network off and no keys, the golden path runs end to end and every screen says which mode it is in; the smoke test passes; `demo-check` passes against the preview URL.

> Field note (RegSutra · SEBI TechSprint 2026): one pipeline generator had one event contract and two backends, live with a key and a deterministic replay without one. The public deployment needed no environment variables, and the README could say "Judges reproduce the exact demo on any machine."

> Field note (SunPath · FlowZint AI Hackathon 2026): failover with a 12-second start budget was verified live three ways: a blank key failed over, a real provider brownout failed over in 1.9 s, and production rode out the outage.

### 7. AI features done right

Read [ai-patterns.md](references/ai-patterns.md) before writing any model call. The rules, in short:

1. **Ground at the schema boundary.** Extraction schemas require a verbatim source span, and code checks that the span occurs in the source ("No span, no obligation"). Numbers come only from tool results. Catalogue lines snap to the catalogue's price and tax code; the model chooses the item and the quantity. Ids the model returns are validated in code, and anything unresolved goes to a human review queue. Citations come only from tool results; a link is never invented.
2. **A fixed catalogue of typed tools.** The model never writes raw SQL, Cypher or HTTP.
3. **Forgiving, steering tools.** Nullable and coerced inputs, `{ needsInfo, message }` instead of a throw, id fallbacks, tool-name repair, question dedupe, a loop bounded at 8 to 10 steps, and a safety net for a question asked in plain text.
4. **Four answer shapes.** Answered with the proof; answered from memory with the date it was learned; not in the data; unknown entity (say which name).
5. **A glass-box trace.** "Before a batch of tool calls, write one short sentence saying what you are checking and why", shown next to each call's arguments, query, measured milliseconds and row count.
6. **A grounding check on figures** in model prose, plus a measurement of its strictness on random numbers, because a check that passes noise proves nothing.
7. **Provenance on every AI output**: `mode`, `mocked`, `llm_used`, `provider`, `explanation_source`, `degraded`, rendered as a badge.
8. **Facts first.** A deterministic draft, then a rewrite under a strict JSON schema with "keep every number exactly as given", merged by id, checked for changed numbers, and falling back to the draft on any failure.
9. **Operational hygiene.** A disk cache keyed by a hash of model, prompts and parameters with a TTL, one JSON-only retry, and self-healing when a provider rejects a parameter.
10. **Injection guard.** User text is content being analysed, never instructions to follow, and the prompt says so.
11. **Models.** Default to `claude-opus-5-5` with `effort` set explicitly, `claude-sonnet-5-5` for latency and `claude-haiku-5-5` for cheap bulk work. Use the sponsor's model when the event requires or rewards it; the patterns are provider-neutral.

Gate: a test feeds a fabricated span, an invented number, an unknown id and an injected instruction, and each is rejected or labelled; every AI surface shows its provenance; trace timings are measured, not typed.

> Field note (VyaparAI · Global AI Hackathon with Qwen Cloud): the money guard snapped every catalogue line to the catalogue's price, tax code and rate at the tool boundary: "The model only chooses the item and quantity. Kills price hallucination."

### 8. Named passes

Work in passes. Each ends with the four commands green, the smoke test green, the golden path walked, and a `▶ STATUS · <pass>` block under `## Log`.

| Pass | Adds | Done when |
|---|---|---|
| core | the golden path on seed data | every beat runs locally |
| deploy + proof | public URL, health, smoke test, a deployment proof screenshot | a logged-out phone completes the golden path |
| wow | the 3 to 5 most demo-able moments | the money shot lands inside 60 seconds |
| stacked | closed loops: every action has a visible consequence | approve, act and record all show on screen |
| parity | the second language or voice, end to end | every beat works in every language |
| polish | states, copy, favicon, metadata, hero | no placeholder text anywhere |
| assets | diagram, thumbnail, gallery, OG image | every asset at the platform's sizes |

Write the submission copy at about hour 2 (form answers, one-liner, demo script outline) and refresh it in the polish pass; sibling skill `submission-pack` turns it into `SUBMISSION.md`. When the event requires another tool to do the coding, write the plan as a prompt pack where every prompt ends with a "Done when" test. Hour tables for every event format are in [passes-and-timeboxes.md](references/passes-and-timeboxes.md).

Gate: the pass's Log block records what changed, how it was verified, and the numbers.

> Field note (VyaparAI · Global AI Hackathon with Qwen Cloud): the 52-hour commit log reads core loop, deploy kit, a real function-calling agent with a trace UI, submission copy at hour 2, live on the sponsor's cloud with a proof screenshot, "Wow pass", "Stacked pass", "Full English parity", "Polish pass", then the diagram, thumbnail and gallery.

### 9. Commit discipline

1. Decide the attribution policy before the first commit, from the Contract. Some events forbid AI trailers; others require an AI-assistance disclosure. Configure the agent to match (Claude Code has a project setting that turns its co-author trailer off) and write the decision under `## Decisions`.
2. Make small commits. Messages are sentence-case statements of the behaviour the product now has, with measured numbers where they exist ("Control-room map a frame behind the panels: longest task 138-157 to 77-94 ms at 4x"). A new dependency gets one line of reason in the body.
3. No secrets, ever. `.env.example` lists every variable the code reads, where to get it, and what happens without it. Keys never go into chat; rotate any that did after the event.
4. On Windows, write the message to a file without a byte-order mark and commit with `git commit -F <file>`; PowerShell here-strings put a BOM in front of the subject.

Gate: the first commit already follows the policy, and every name the code reads from the environment appears in `.env.example`.

> Field note (ORCA · SIH 2026): AI co-author trailers had to be purged with a history rewrite partway through the build, and setting attribution before the first commit became a standing rule.

### 10. Parallel work

1. In Claude Code, give each independent feature to a `bullseye:missile-builder` subagent in its own worktree (`missile-builder` when the agents are installed standalone), with the spec, its `Accept:` line, the allowed paths and the four commands, using the builder prompt in [prompts.md](../missile/references/prompts.md). Elsewhere, run a separate agent session on its own branch or worktree with the same brief.
2. Only independent files go to builders. Shared files (global styles, layout, header, the home page, `BULLSEYE.md`) stay in the main session.
3. Merge each branch as it returns, run the four commands after every merge, and delete merged worktrees before reporting done.
4. Human teams with one agent session each use team mode: lanes with directory ownership, one branch, claim-by-push task locks and contract-first APIs ([team-mode.md](references/team-mode.md), [TASKS.template.md](assets/TASKS.template.md), [CONTRACTS.template.md](assets/CONTRACTS.template.md)).

Gate: after the merges `main` is runnable and no worktree is left behind.

> Field note (Detour · Graph Hacks 2026): run playback and the memory timeline went to builders in worktrees because their files were independent; the identity, the scroll story and the theme switch stayed in the main session because they touched shared files.

### 11. Freeze

1. Freeze features at 65 to 70 percent of the window (hour 12 of about 18 overnight). After the freeze only golden-path fixes, honesty fixes (labels, wording, limits) and demo preparation land.
2. Budget the hardening tail on purpose. It happens anyway, so give it hours in the plan, and keep the presenter out of the all-nighter.
3. Hand off: [missile](../missile/SKILL.md) runs the polish loop (design system, signature moment, rubric scoring; `/bullseye:missile`, or `/missile` when the skills were added with `npx skills add`), and [prove-it](../prove-it/SKILL.md) builds the claims ledger, the evals and the limits.
4. Set the status line to `phase=polish` and record the freeze commit's SHA under `## Decisions`.

Gate: the freeze is logged with its time and SHA, and the golden path runs end to end on the deployed URL in demo mode, with no console errors, on a phone and a laptop.

> Field note (Dhaal · MUJ HackX 4.0): the freeze was declared for hour 12, yet hardening ran on to 05:35 with judging at 11:00. Put that tail in the plan instead of pretending it will not happen.

### 12. Keep BULLSEYE.md current

After every step, not at the end:

- `## Plan`: items with `Accept:` lines, effort, status and the SHA of the commit that closed them.
- `## Decisions`: one dated line per decision, with the why.
- `## Risks`: risk, likelihood, mitigation, owner.
- `## Log`: one `▶ STATUS · <pass name> · <date time TZ>` block per pass, newest first.
- The status line: `status: phase=build step=<n> updated=<ISO> next="<one action>"`.

## Outputs

In the user's project:

| File | Holds | Visibility |
|---|---|---|
| `PRODUCT.md` | the product contract: the judge as a user, must-never-break, who decides what | process file, private by default |
| `AGENT-DESIGN.md` | agentic apps only: unit of work, agent versus functions, workflow with the human step, seed, deliberately not built | process file |
| `docs/model.md`, `scripts/verify/`, committed verifier results | the spec of the core computation and its independent check | public |
| the seed script, `data/meta.json` | planted stories and provenance | public |
| `/api/health`, `/api/reset`, the smoke test | the demo layer's probes | public |
| `run-demo.sh`, `run-demo.bat`, `.claude/launch.json` | one-command launch, dev and production preview | launchers public, `.claude/` private |
| `.env.example` | every variable name, where to get it, behaviour without it | public |
| `README.md` stub | live link, the 60-second path, run locally | public |
| `docs/TASKS.md`, `docs/CONTRACTS.md` | team mode coordination | tracked, because the push is the lock; strip names and contacts before the repo goes public |

In `BULLSEYE.md`: `## Plan` (golden path and items), `## Decisions`, `## Risks`, `## Log`, and the status line.

## Guardrails

- The golden path runs end to end on the deployed URL before any feature outside it starts.
- No number a judge sees comes from the model. When model prose must carry a figure, the grounding check runs and the figure traces to a tool result.
- No silent fallback. Every degraded path says so on screen and in the response (`mode`, `mocked`, `llm_used`, `provider`).
- Nothing is faked. Recorded runs are real runs with their date; scripted mode says there is no model; mock-ups are labelled as mock-ups on screen. "Nothing in it is UI theater."
- No hand-typed numbers in the UI or the docs. Derive them from the data, or from the facts file that sibling skill `prove-it` owns ([claims-ledger.md](../prove-it/references/claims-ledger.md)).
- Never re-run a non-idempotent seed against production. Never commit a secret.
- Never improvise an input on stage. Every beat has its paste-ready string.
- An existing repository keeps its stack. A framework migration or a major-version upgrade is the user's call.
- Process files follow the policy in `BULLSEYE.md`: private by default for `PRODUCT.md`, `AGENT-DESIGN.md`, `BULLSEYE.md` and `.claude/`.

## Reference map

- [demo-reliability.md](references/demo-reliability.md): the never-break layer in detail, with sketches: modes, replay, failover, health, reset, deep links, build stamp, long-lived processes, keep-alive, static headers, map tiles, timers, HTTPS for voice, precompute, smoke test, and the checklist.
- [ai-patterns.md](references/ai-patterns.md): grounding, tool design, answer shapes, the trace, the grounding check, provenance, the facts-first rewrite, caching, the injection guard, the prompt-rule library, and current Claude model ids and call shapes.
- [passes-and-timeboxes.md](references/passes-and-timeboxes.md): the day-1 order, the named passes, hour tables for 8 h, 18 to 24 h, 36 to 48 h, 72 h, multi-week and surprise-round events, freeze points, sleep, submitting early.
- [data-and-seeds.md](references/data-and-seeds.md): planted-story seeds, the provenance file, labelling synthetic data, public data by domain with licence notes, simulating a claim on real data.
- [team-mode.md](references/team-mode.md): lanes, the git protocol, claim-by-push, contract-first, the kickoff and lane-loop prompts, the anti-slop overhaul prompt.
- [platform-gotchas.md](references/platform-gotchas.md): build, hosting, provider, Windows, Next.js, browser, mobile and CI failures already paid for, with their fixes.
- [PRODUCT.template.md](assets/PRODUCT.template.md) and [AGENT-DESIGN.template.md](assets/AGENT-DESIGN.template.md): the product contract and the agentic design note.
- [TASKS.template.md](assets/TASKS.template.md) and [CONTRACTS.template.md](assets/CONTRACTS.template.md): the team mode files.
- [run-demo.sh](assets/run-demo.sh) and [run-demo.bat](assets/run-demo.bat): one-command launchers that detect the runtime, reject the Microsoft Store Python alias, install what is missing, free the port from a stale demo, start in demo mode, wait for health, print the deep links and open the browser (`--live`, `--check`, `--force-port`).
- [launch.example.json](assets/launch.example.json): `.claude/launch.json` with a dev server, a production preview and an API.
- [demo-check.mjs](scripts/demo-check.mjs): the demo probe described in step 6.
- Sibling skill `missile`: [stack.md](../missile/references/stack.md) (defaults), [design-rules.md](../missile/references/design-rules.md) (doctrine and banned looks), [effects.md](../missile/references/effects.md) (signature-moment effects).
