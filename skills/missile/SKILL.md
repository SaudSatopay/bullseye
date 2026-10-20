---
name: missile
description: Fire the missile at any project to take it from wherever it is to a shipped 10/10 product. It runs recon, locks a target (product, design direction, plan), builds foundations, a design system, a signature moment and the features, then loops sense → score → fix with screenshots and a separate critic until every rubric dimension is 9 or better, and ships (deploy, README, OG image, tagged release). Use it whenever the user says "fire the missile", "/missile", "missile this", "make this 10/10", "take this to the next level", "build me <idea> at production quality" or "polish this until it is perfect", or asks to make an app or site dramatically better end to end. Works on an empty folder or an existing repo.
argument-hint: "[new <idea> | recon | arm | polish | score | ship] [go]"
allowed-tools: Bash(node '${CLAUDE_SKILL_DIR}/scripts/recon.mjs' *), Bash(node '${CLAUDE_SKILL_DIR}/scripts/scorecard.mjs' *), Bash(node '${CLAUDE_SKILL_DIR}/scripts/lh-summary.mjs' *), Bash(node '${CLAUDE_SKILL_DIR}/scripts/shots.mjs' *), Bash(node '${CLAUDE_SKILL_DIR}/scripts/sense.mjs' *)
license: MIT
metadata:
  author: Saud Satopay
  version: "1.1.0"
  part-of: bullseye
---

# Missile

Fire it at a folder. Whatever is there, a blank directory with an idea or a repo with years of history, it takes to a shipped product that scores 9 or better on every dimension of `references/rubric.md`. You decide the target once; after that the missile senses, scores and corrects on its own until impact.

Read `references/flight.md` before doing anything. This file is the summary; that file is the procedure.

**Inside a hackathon.** When the sibling skill `bullseye` runs the event, the missile is the Polish phase: it owns product craft (the ten dimensions below), while `judge-panel` scores contest fit against the event's own rubric and `prove-it` owns every number. Read `BULLSEYE.md` first: its Contract, Thesis and golden path are the target, and its owner checklist covers the human-only actions that otherwise hold `shipped` at 6. On a deadline, scale the iteration cap to the time left; never skip Impact. In a hackathon the release tag is the submission tag that `submission-pack` sets on the submitted commit; do not add a second one.

## Arguments

`$ARGUMENTS` sets the mode:

| Argument | Mode |
|---|---|
| none | Full flight. Recon decides new versus existing. |
| `new <idea>` | Full flight on an empty directory. The idea text seeds PRODUCT.md. |
| `recon` | Stages 0 and 1 only. Nothing in the product changes. |
| `arm` | Stage 2 only: verify and install sensors and design skills. |
| `polish` | Skip Boost. Run the guidance loop on what already exists. |
| `score` | One sensor pass, one critic run, record it, stop. |
| `ship` | Stage 5 only. |
| `go` anywhere | Skip the Target lock confirmation. Write that under Decisions in MISSILE.md. |

Any other words in the arguments are the user's direction for this flight: what to protect and what to push, for example `polish keep the palette and layout; push motion and the hero`. Write them into MISSILE.md under Target as the user's direction and Protected list, and honor them above the default plan. Anything the user says to keep is off-limits in every stage.

If MISSILE.md already exists, read its `status:` line and resume from that stage and iteration instead of starting over.

## The target

IMPACT: every dimension of the rubric at 9 or above, mean 9.5 or above, a live URL, a README a judge can use in two minutes, a tagged release. The rubric is the contract; a score without evidence is not a score. The critic who scores is a separate subagent that never sees the builder's narrative, only screenshots, numbers and files. Do not argue with a score. Produce evidence that changes it.

## Stages

Procedure, gates and resume rules are in `references/flight.md`. In one line each:

0. **Recon**: inventory the project and the machine. New projects skip the subagent; existing projects get the `missile-recon` report and a `missile/<yyyymmdd>` branch. Create MISSILE.md from `assets/MISSILE.template.md`.
1. **Target lock**: PRODUCT.md, three directions (plan mode when interactive, your own reasoning when headless; `ultrathink` either way) with one chosen into DESIGN.md, a plan mapped to rubric dimensions with acceptance tests, the `## Missile` block appended to CLAUDE.md, a measured baseline. Then the one question: go, adjust or stop.
2. **Arm**: a working screenshot sensor is the only hard requirement. Everything else installs if it needs no login, or falls back per `references/arsenal.md`.
3. **Boost**: foundations green first, then tokens and type, then the signature moment with its static fallback, then screens with states and real copy, then at most three features (parallel `missile-builder` worktrees for independent ones), then a preview deploy.
4. **Guidance loop**: sense (screenshots at 390 and 1440, Lighthouse, the four commands, console) → score (`missile-critic`) → record (`scorecard.mjs`) → fix the top fixes → repeat until IMPACT, the iteration cap, or a stall.
5. **Impact**: README, OG image, metadata, seed data, final preview, tag, final scorecard, handover.

## Sensors

Use the first available; never skip screenshots because a tool is missing.

1. `node '${CLAUDE_SKILL_DIR}/scripts/sense.mjs' <url> .missile/shots/it<N> home pricing app --keyboard --perf`: one command for the whole evidence pass. Every route at 390 and 1440 in light and dark, full-page screenshots, horizontal overflow and console errors per screen, a keyboard walk with focus visibility (`keyboard.txt`), and 4x CPU frame, long-task, LCP and CLS numbers (`perf.json`). It resolves Playwright from the project, then global installs, and launches Playwright's Chromium, installed Chrome or Edge, in that order.
2. Claude Code desktop Browser pane tools (`preview_start` or `navigate`, `resize_window` mobile and desktop, `screenshot`, `read_console_messages`).
3. `playwright-cli`: `playwright-cli open <url>`, `playwright-cli resize 390 844`, `playwright-cli screenshot --filename=.missile/shots/it<N>/home-390.png`, `playwright-cli resize 1440 900`, screenshot again, `playwright-cli console` for errors, `playwright-cli close`.
4. `node '${CLAUDE_SKILL_DIR}/scripts/shots.mjs' <url> .missile/shots/it<N> home pricing app` (route names without a leading slash; `home` is `/`). It uses `npx playwright screenshot`; if it reports Chromium missing, run it once with `--install`.
5. Playwright MCP or Chrome DevTools MCP.

Always sense the production build (`build` then `start`), never the dev server: dev overlays and dev-only hydration bugs pollute the evidence.

Metrics: `npx lighthouse <url> --output=json --output-path=.missile/lh/it<N>/<route>.json --chrome-flags="--headless=new" --quiet --only-categories=performance,accessibility,best-practices,seo --form-factor=mobile --screenEmulation.mobile`, then `node '${CLAUDE_SKILL_DIR}/scripts/lh-summary.mjs' <json>`.

## Bundled scripts

| Script | Use |
|---|---|
| `node '${CLAUDE_SKILL_DIR}/scripts/recon.mjs' <dir>` | Inventory: stack, commands, routes, design signals, smells, machine tools, arsenal. Writes `.missile/recon.json`. Add `--dry` to skip the write. |
| `node '${CLAUDE_SKILL_DIR}/scripts/scorecard.mjs' <dir> <scorecard.json>` | Validates a critic scorecard, computes mean, min, verdict and stall, updates the status line, scoreboard and iteration log in MISSILE.md. Run it after every critic pass; it is the only way the scoreboard changes. |
| `node '${CLAUDE_SKILL_DIR}/scripts/lh-summary.mjs' <json...>` | Lighthouse JSON to a short table with metrics, opportunities and accessibility findings. |
| `node '${CLAUDE_SKILL_DIR}/scripts/sense.mjs' <url> <outDir> [route names] [--keyboard] [--perf]` | The full evidence pass: screenshots at 390 and 1440 in both schemes, overflow, console errors, keyboard walk, 4x CPU performance. Writes `sense.json`. |
| `node '${CLAUDE_SKILL_DIR}/scripts/shots.mjs' <url> <outDir> [route names] [--install]` | Fallback screenshots at 390 and 1440. Route names without slashes (`home pricing app`). |

Quote the script path in single quotes exactly as shown; it keeps Windows paths intact in every shell.

## Delegation

Subagent names are `missile-recon`, `missile-critic`, `missile-builder`; when installed through the BULLSEYE plugin they are `bullseye:missile-recon`, `bullseye:missile-critic` and `bullseye:missile-builder`. Outside Claude Code there are no subagents: run recon yourself, and run the critic in a fresh session that sees only the rubric and the evidence files, never your narrative.

- **Recon** (existing projects): give the directory, the absolute path of `scripts/recon.mjs`, and any screenshot paths. Paste the returned report into MISSILE.md under Recon.
- **Critic** (every iteration): use the critic delegation prompt in `references/prompts.md`. Always pass the absolute rubric path `${CLAUDE_SKILL_DIR}/references/rubric.md`, the evidence paths, the previous scorecard, the URL and the save path `.missile/scorecards/it<N>.json`. Then run `scorecard.mjs`.
- **Builders** (independent M or L work): one task per subagent with the builder prompt, the allowed paths, the acceptance test and the four commands. When they return, merge each branch into the missile branch, run the four commands, resolve conflicts, commit.

Run the sensors yourself; delegate judgment and parallel building.

## Hard stops

These are the only moments the missile asks the user for anything:

1. The Target lock go / adjust / stop, unless `go` was passed.
2. An existing project with uncommitted changes: ask for a commit or stash, then continue.
3. Anything on the ask-first list in `references/stack.md`: framework or major upgrades, replacing the component kit, deleting directories, touching auth, billing or secrets, pushing shared branches, deploying to production.
4. Adding a hook to `.claude/settings.local.json` (offer `assets/settings.hook.json` once).

Everything else is a decision: make it, write it under Decisions in MISSILE.md, continue. A missing tool changes the method, never the target. A missing login (Vercel, 21st, Figma) becomes a line under Decisions with the exact command, and the flight continues with the fallback.

For the duration of a flight this procedure takes precedence over other workflow skills that are installed, such as Superpowers' brainstorming and planning skills or a design skill's own interview. Use those skills as tools inside a stage (a critique pass, an animation review, a test-first loop), not as a replacement for the stage, and do not let them add questions beyond the four hard stops. The user fired the missile precisely so they would not be interviewed.

## Guardrails

- Existing projects: work on `missile/<yyyymmdd>`, commit after every green step, never rewrite history, never push, never migrate the framework or package manager, and respect a design system that scores 5 or above (extract it into DESIGN.md and improve it).
- New projects: `git init` before the first file; the scaffold is the first commit.
- Previews are always fine. Production only when the user said production.
- No global installs without a line under Decisions saying what and why.
- The critic never edits product files. Builders never leave their allowed paths. The main session never skips `scorecard.mjs`.

## Files the missile owns

`MISSILE.md` (target, plan, scoreboard, iteration log, decisions, remaining gaps; committed, unless a hackathon's `BULLSEYE.md` says `process: private`), `.missile/` (recon, shots, Lighthouse, checks, scorecards; gitignored), `PRODUCT.md`, `DESIGN.md`, the `## Missile` block in `CLAUDE.md`, `.claude/launch.json`.

## Reference map

- `references/flight.md`: procedure, gates, effort budget, resume rules. Read first.
- `references/rubric.md`: the ten dimensions with anchors and sensors, the scorecard JSON. Read before Target lock; hand its path to the critic.
- `references/design-rules.md`: doctrine, banned looks, the token template, type, color, layout, motion budget, the signature moment catalog, copy rules. Read during Design system and Polish.
- `references/effects.md`: the effects arsenal. Working recipes for React Three Fiber scenes, ShaderGradient and Paper Shaders atmospheres, liquid glass and liquid metal, each with install commands, a performance budget and a fallback. Read before building the signature moment.
- `references/stack.md`: defaults for new projects, the respect-the-stack policy for existing ones, commands per framework, the ask-first list.
- `references/arsenal.md`: sensors, skills, MCPs, detection, install commands, fallbacks, the arming procedure.
- `references/prompts.md`: the prompts to hand to skills and subagents at each stage.
- `assets/`: MISSILE.md template, the CLAUDE.md block, launch.json, the typecheck hook.
