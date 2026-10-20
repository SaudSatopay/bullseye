# Session continuity

Hackathon builds run across many agent sessions, sometimes several in parallel, often through a night with little sleep. Context is lost at every boundary unless it is written down where the next session will look first. This file covers how.

## The single source of truth

`BULLSEYE.md` is the brain. A new session reads it top to bottom before doing anything and trusts it over memory. Three sections carry continuity:

- **Status line:** phase, step, updated time and the one next action.
- **`## Handoff`:** rewritten at the end of every session. A fresh session must be able to continue from this block alone.
- **`## Log`:** dated `▶ STATUS` blocks, newest first. Never delete history; it is how a later session learns why something is the way it is.

## What a good handoff contains

Taken from the handoffs that worked across long builds:

1. **State:** what is built and verified, with the numbers (tests passing, routes, headline metrics, deployed URL and which commit it serves).
2. **In progress:** anything half done, with the file and the next line to write.
3. **Next steps:** exact and ordered, each with how to verify it.
4. **Commands:** the precise commands to run the app, the tests, the claims check and the deploy.
5. **Environment and conventions:** working directory, OS, shell, in-session date versus deadline, commit identity and attribution policy, tool quirks on this machine.
6. **Decisions to defend:** deliberate choices a later session must not "simplify away".
7. **Bugs already fixed:** a two-column table, Bug | Lesson, so nobody reintroduces them.
8. **Verified stats and do-not-claim rules:** the numbers that may appear in public, and the claims that must not.
9. **Review history (already addressed, do not undo):** accepted decisions from judge rounds and reviews, so a fresh session does not re-litigate them.

> Field note (FaceAttend · NHAI Hackathon 2025): the handoff opened with "Read top-to-bottom; everything a new session needs is here", listed environment gotchas (the build tool to use, a toolchain version that was too new, a command whose piped output masked exit codes), the bugs already fixed, an honest self-score per judging criterion, and next tasks with acceptance criteria. Three of the next four task commits named the criterion they raised.

> Field note (MuleShot · BOI × IIT Hyderabad 2026): dated status blocks recorded each pass with the file size and the QA done, some with an estimated rating, plus a "Review history (already addressed, don't undo)" list and a "Render and QA pipeline (these gotchas cost time)" section.

## Paste-in prompts for a fresh session

When moving to a new chat, a new tool, or a teammate's machine, generate a prompt from `../assets/NEXT-SESSION.prompt.md`. It tells the new session to read `BULLSEYE.md` first, restates the quick state and the critical conventions, and gives a standing instruction for autonomous work:

> Roll through the remaining moves without stopping to ask. For each: build, verify in the production preview, commit, then move to the next. Stop only if genuinely blocked.

Attach a rubric target to each move ("Scalability 8 to 9") so the work stays aimed at points, and the rule "Measure real numbers; don't assert. If a property fails, it is a finding: investigate and surface it."

## Master plans for multi-week events

When a long event reaches a strategic turn (for example, the judge says the code is maxed and the ceiling is external validity), write a master plan from `../assets/MASTER-PLAN.template.md`: the situation in one paragraph, what the score is anchored by, the guardrails that must hold, the work in order, the definition of done and the first action. Big items get their own work map with phases, an honesty boundary (real, overlaid, not claimed) and the pitfalls not to relapse into.

> Field note (Trinetra · ET AI Hackathon 2.0): the master plan stated that a bigger self-built simulator adds production value but zero credibility when you author both the data and the detector, and redirected the remaining weeks to real-plant data or an attributable quote, a third-party physics model and the demo video.

## Code maps for agents joining an existing repo

For a repo that several agents (or a later polish flight) will work in, keep a local code map: `file:line` anchors for the important flows, the traps to read first, every guard test and what trips it, and recipes for common changes (add an endpoint, a screen, a string, a demo scenario, a data provider). It turns a 20-minute orientation into two.

## Parallel sessions

- Claude Code subagents in worktrees take independent features with explicit allowed paths. Shared files (global styles, the root layout, the header, the home page) stay in the main session. Merge each branch as it returns and run the four commands after every merge; delete the worktrees before reporting done.
- Human teams with one agent each follow the team-mode protocol in the `build-sprint` skill: lanes by directory, contract-first API changes, claim a task by pushing a `[WIP-name]` marker, `git pull --rebase` before every push, main stays runnable.

## Ops notes worth writing down the moment they bite

Every long build accumulates machine-specific lessons. Record each the first time it costs time, in the handoff, as one line: what happened, and the rule now. Examples from past builds: the preview tool serves the production build so frontend edits need a rebuild; hidden browser tabs suspend `requestAnimationFrame`; stale processes on a port serve yesterday's code; a toolchain release is too new for the mobile build; console banners with non-ASCII characters crash on a legacy code page (set `PYTHONUTF8=1`).
