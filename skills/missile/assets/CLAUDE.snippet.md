## Missile

This project is under the missile's guidance loop. MISSILE.md holds the target, the plan and the scoreboard; DESIGN.md is the single source of truth for every visual decision.

- Stack and commands: see the Stack section of MISSILE.md. Use the project's package manager; add a missing script to package.json rather than running one-off commands.
- Design: tokens only, no literal colors in components. Two typefaces with roles. The banned looks in the missile's design rules score a 4; do not produce them. One signature moment, protected in every iteration.
- Definition of done for any change: typecheck, lint, test and build green; screenshot verified at 390 and 1440 with the browser sensor; no console errors; committed with a descriptive message on the missile branch.
- Never: rewrite git history, push to shared branches, migrate the framework, delete directories, or touch auth, billing or secrets without tests and a note under Decisions in MISSILE.md.
