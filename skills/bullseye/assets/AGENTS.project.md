## Bullseye

This repository is a hackathon entry run with the BULLSEYE playbook. `BULLSEYE.md` is the control file: read it top to bottom before any work and trust it over memory. Its status line names the phase and the next action; its `## Handoff` says where the last session stopped.

**Rules for every agent session**
- The engine decides, the model narrates. Anything a judge can check (numbers, scores, verdicts, money) is computed by deterministic code; a model chooses tools, parses language and explains. Never let a model invent a number, an identifier or a citation.
- The golden path in `BULLSEYE.md` must keep working end to end in demo mode. Break it and fixing it outranks every feature.
- Numbers come from `facts.json` and `CLAIMS.md`. Never type a measured number by hand into the README, deck, video script or UI; re-run the measurement instead.
- Label simulated, projected, target and illustrative values on the artifact itself. Say known limits out loud in the README.
- Design decisions live in `DESIGN.md`: tokens only, no literal colours in components, the banned looks stay banned, the signature moment is protected.
- Write against the installed versions of every framework; read the package's own docs before using an API you are unsure of.
- Secrets live in `.env` only. Never paste keys into chat, code, commits or logs. `.env.example` lists every name.

**Definition of done for any change**
- Typecheck, lint, test and build pass.
- The changed screen is checked at 390 px and 1440 px with no console errors.
- Any number the change affects is re-measured and `claims-check` passes.
- Committed with a message that states what the product now does.

**Never**
- Rewrite git history, force-push, or push to a shared branch without being asked.
- Delete directories, change the framework or package manager, or touch auth, payments or secrets without a note under `## Decisions`.
- Edit the submission after the deadline.
- Build or run anything that answers real judges live on the team's behalf.

**At the end of every session**, rewrite `## Handoff`, add a `▶ STATUS` block to `## Log`, and update the status line in `BULLSEYE.md`.
