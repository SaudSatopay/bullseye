---
name: bullseye
description: Run a whole hackathon with a coding agent, from problem statement to podium. Decodes the brief and rubric, locks a winning thesis, builds the demo path first, polishes the product, proves every claim, simulates the judges, ships the submission and prepares the finale, keeping one control file (BULLSEYE.md) so any session can resume. Use when the user starts, joins or continues a hackathon, ideathon, buildathon, idea round or finale; pastes a problem statement, rules page or rubric; or says "bullseye", "help me win this hackathon", "build for the judges", "the submission is due", "what next for the hackathon" or "resume the hackathon".
argument-hint: "[start <event, link or problem statement> | status | next | handoff | intake | idea | build | polish | prove | judge | package | finale]"
license: MIT
metadata:
  author: Saud Satopay
  version: "1.0.0"
  part-of: bullseye
---

# Bullseye

Bullseye is the flight director for one hackathon. It decides what phase the project is in, calls the skill that owns that phase, and keeps `BULLSEYE.md` (the control file) current so a fresh session, a teammate or another agent can pick up exactly where the last one stopped. It does not replace the phase skills; it sequences them and holds the line on the law below.

The target is a finished, judge-ready project: a product that works on a stranger's phone, numbers that survive a skeptic, a story a judge understands in two minutes, and a submission with nothing missing. Default agent output lands at "works, but reads as generated". Everything here exists to move it from there to finalist work.

## The law

These ten rules come from 30+ hackathons. Every phase skill enforces them. `references/law.md` gives the evidence behind each one.

1. **Decode the rubric before writing code.** Read every rule, criterion and limit first; pick the problem for win probability, not comfort.
2. **The judge is a user.** Design for someone with two minutes and a laptop who wants proof, not a tour.
3. **The engine decides, the model narrates.** Deterministic code computes anything a judge could check; the LLM chooses tools, parses language and explains. Never let a model invent a number.
4. **Build the demo path first and deploy on day 1.** A preview URL in the first hours exposes build and hosting failures while they are cheap.
5. **The demo cannot die.** An offline or recorded mode, labelled fallbacks, seeded data with planted stories, and rehearsed numbers asserted by a test.
6. **Every number is measured, labelled and identical everywhere.** One facts file feeds the README, deck, video and form. Simulated, projected and illustrative values say so on the artifact.
7. **Say the limits out loud before judges find them.** An honest-limits section raises trust; a discovered overclaim ends it.
8. **One signature moment, drawn from the subject's own world.** No default looks: no purple gradients, glass panels, Inter everywhere, emoji icons or three equal cards.
9. **Simulate the judges cold, then fact-check them.** A fresh-context judge attacks the build; every finding is verified against the code before it is fixed.
10. **Submit early, tag it, and never edit after the deadline.** Never let an AI answer real judges for you; rehearse instead.

## Modes

| Argument | What happens |
|---|---|
| `start <event>` | New hackathon: create `BULLSEYE.md`, set the process policy, install the project rules block, issue the owner checklist, then run intake. |
| `status` | Read `BULLSEYE.md`, report phase, deadline countdown, open owner actions, the next action and the biggest risk. Change nothing. |
| `next` | Do the single next action the status line names, then update the file. |
| `handoff` | End the session properly: rewrite `## Handoff`, add a `## Log` block, update the status line, commit. |
| `<phase>` | Jump to a phase (`intake`, `idea`, `build`, `polish`, `prove`, `judge`, `package`, `finale`) and run its skill. |
| none | If `BULLSEYE.md` exists, behave like `next`; otherwise behave like `start`. |

## The flight

| # | Phase | Skill | Produces | Gate to leave |
|---|---|---|---|---|
| 0 | Intake | `brief-decoder` | `## Contract`, `## Thesis`, battle plan, rubric map | Every deliverable and limit is listed; the problem statement is chosen with a reason; the sponsor test is answered |
| 1 | Idea gate (only if the event has one) | `idea-round` + `pitch-deck` | Concept brief, idea deck, form answers, organiser-format cut | Submitted early with every number labelled |
| 2 | Build | `build-sprint` | `PRODUCT.md`, golden path, deployed skeleton, features, demo layer | The golden path runs end to end on the deployed URL in demo mode |
| 3 | Polish | `missile` | `DESIGN.md`, scoreboard, signature moment | Every craft dimension at 9 or a documented stall |
| 4 | Prove | `prove-it` | `CLAIMS.md`, `facts.json`, evals, `LIMITS.md` | `claims-check` green; every headline number reproducible |
| 5 | Judge | `judge-panel` | Judge rounds, fixes, final blind score | No open substantiated finding; blind round recorded |
| 6 | Package | `submission-pack`, `demo-video`, `pitch-deck` | Judge README, `SUBMISSION.md`, video, deck, media | Final sweep green; submitted; submission commit tagged |
| 7 | Finale | `finale-pitch` | Runsheet, pitch script, QA bank, pre-flight | Rehearsed until boring; backup video in two places |

Phases overlap on purpose. Submission copy starts at hour 2 and is refreshed in polish. Proof and judge rounds run as loops inside build and polish, not only at the end. `references/flight.md` has the full procedure, the hand-offs between phases and the hour tables per format.

If a phase skill is not installed, read its folder in this repository and follow it, or install the full set (see Install below).

## Session protocol

**At the start of every session:**
1. Read `BULLSEYE.md` top to bottom. Trust it over memory; the status line says where to resume.
2. Run `git status` and `git log --oneline -10`. Uncommitted work you did not make: ask the user before touching it.
3. Recompute the deadline countdown and rewrite the deadline line with the sibling skill `brief-decoder`'s script: `node "${CLAUDE_SKILL_DIR}/../brief-decoder/scripts/tminus.mjs" "<label>=<deadline with zone>" --buffer 24h --line` (other agents: run it from that skill's folder). Never type a countdown by hand.
4. Check the owner checklist. Anything still open that blocks the next phase goes to the user in one short message.
5. State the plan for this session in three lines, then work.

**At the end of every session (or before the context runs out):**
1. Rewrite `## Handoff`: state, in progress, exact next steps, commands to run, gotchas already paid for.
2. Add a `▶ STATUS` block to `## Log` (what changed, how it was verified, the numbers, what is next).
3. Update the status line (`phase`, `step`, `updated`, `next`).
4. Commit with a message that states what the product now does.

A fresh session must be able to continue from `## Handoff` alone. When the user wants to move to another tool or chat, generate a paste-in prompt from `assets/NEXT-SESSION.prompt.md`.

## Start a new event

1. Create `BULLSEYE.md` in the project root from `assets/BULLSEYE.template.md`. Fill the title, the status line and what is already known.
2. Decide the process policy with the user in one question (default **private**): private keeps `BULLSEYE.md`, `MISSILE.md`, `PRODUCT.md`, `DESIGN.md`, the pitch and form prep, judge prompts and `.claude/` out of the public repo, because a real jury never sees how you planned to be judged; `CLAIMS.md` and `LIMITS.md` stay public. Append `assets/gitignore-process.txt` to `.gitignore` when private.
3. Add the project rules block from `assets/AGENTS.project.md` to the project's `AGENTS.md` (create it if missing). For Claude Code, make `CLAUDE.md` contain `@AGENTS.md` on its own line. Never overwrite existing content; append under a `## Bullseye` heading.
4. Decide the commit attribution policy before the first commit. Some events forbid AI co-author trailers and some require AI disclosure; record the choice under Decisions.
5. Hand the owner checklist to the user in one message (accounts, keys, repo visibility, `gh auth` scopes, judge access, video hosting). These are the actions an agent cannot take and the ones that most often cap the final score.
6. Run intake (`brief-decoder`).

`references/project-setup.md` covers `AGENTS.md`, `CLAUDE.md`, `.claude/launch.json`, MCP servers and hooks for a hackathon repo.

## Time budgets

| Format | Intake | Build | Polish + prove + judge | Package | Buffer before deadline |
|---|---|---|---|---|---|
| 8 h onsite | 30 min | 4 h | 1.5 h | 1 h | 30 min |
| 18–36 h overnight | 45 min | 50% | 25% | 15% | 1 h, and the presenter sleeps |
| 48–72 h online | 2 h | 45% | 30% | 15% | 3 h |
| Multi-week | 1 day | 40% | 35% | 15% | 24 h |
| Idea round only | 25% | n/a | 35% (prototype evidence + honesty pass) | 30% | 24 h on portals |

Feature freeze lands at roughly 65 to 70 percent of the build window. After the freeze, only golden-path and honesty fixes go in. Hour tables per format are in `references/flight.md`.

## Delegation

- **Claude Code:** use plan mode for the target lock; send independent features to `bullseye:missile-builder` subagents in worktrees (independent files only); score craft with `bullseye:missile-critic`; judge contest fit with `bullseye:hackathon-judge`; audit claims with `bullseye:claims-auditor`. Run sensors yourself; delegate judgment and parallel building.
- **Codex, Cursor, Gemini CLI and others:** run the same procedures in the main session. Where a skill calls for a fresh-context judge or critic, open a new session, paste the prompt from that skill's `assets/` with the evidence pack, and bring back only the verdict.
- **Human teams:** split by lanes with contract-first APIs and claim-by-push task locks (`build-sprint` team mode).

## Hard stops

Ask the user only at these moments:
1. The process policy and attribution policy at `start`.
2. The problem-statement choice when two options score within a point of each other.
3. Any owner-only action (accounts, keys, payments, repo visibility, production deploys, submitting forms).
4. Uncommitted changes the agent did not make.
5. Anything irreversible: deleting directories, rewriting history, editing a submission after the deadline (refuse this one).

Everything else is a decision: make it, write one dated line under `## Decisions`, continue.

## Guardrails

- Never put secrets in chat, code or commits. Keys live in `.env`; `.env.example` lists names and where to get them.
- Never fabricate a screen, a metric, a testimonial, a partner or a result. Label every simulated, projected, target and illustrative value on the artifact itself.
- Never build or use a tool that answers real judges live on the team's behalf. Rehearse with `judge-panel` instead.
- Keep every generator (deck builders, render scripts, seeds) and its inputs inside the repo, with relative paths. Session scratchpads disappear.
- Respect event rules on pre-existing work, AI use, licences and anonymity over anything in this skill.

## Install

The full set installs with `npx skills add SaudSatopay/bullseye` (Claude Code, Codex, Cursor, Gemini CLI and others) or, in Claude Code, `/plugin marketplace add SaudSatopay/bullseye` then `/plugin install bullseye@bullseye`. Without installing, clone the repository into `.bullseye/` (gitignored) and tell the agent to read `.bullseye/AGENTS.md`.

## Reference map

- `references/flight.md`: phase-by-phase procedure, hand-offs, loops and hour tables per format. Read at `start` and whenever a phase changes.
- `references/law.md`: the ten rules with the field evidence behind each. Read when a rule seems negotiable.
- `references/project-setup.md`: `AGENTS.md` block, `CLAUDE.md`, launch configs, MCP servers, hooks, process and attribution policies.
- `references/arsenal.md`: the tools, skills, MCP servers, libraries, data sources and hosts this playbook uses, with when and how to use each.
- `references/session-continuity.md`: handoffs, next-session prompts, master plans and code maps for long or multi-agent builds.
- `assets/BULLSEYE.template.md`: the control file.
- `assets/BULLSEYE.example.md`: a filled control file, 30 hours into a fictional 48-hour event. Read it once to see the level of detail each section needs.
- `assets/AGENTS.project.md`: the rules block for the project's `AGENTS.md`.
- `assets/NEXT-SESSION.prompt.md`: paste-in prompt to resume in a fresh session or another tool.
- `assets/MASTER-PLAN.template.md`: a strategy brief for multi-week events when the plan must change direction.
- `assets/gitignore-process.txt`: the process-file block for private mode.
