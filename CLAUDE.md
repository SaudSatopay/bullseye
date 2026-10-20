@AGENTS.md

## Claude Code notes

- Installed as a plugin, the skills are namespaced `/bullseye:<skill>` (the flight director is `/bullseye:bullseye`) and the subagents are `bullseye:missile-recon`, `bullseye:missile-critic`, `bullseye:missile-builder`, `bullseye:hackathon-judge` and `bullseye:claims-auditor`.
- In skill files, `${CLAUDE_SKILL_DIR}` resolves to the skill's own folder; use it to run bundled scripts.
- Use the Browser pane (or `skills/missile/scripts/sense.mjs`) to verify any visual change at 390 and 1440 against the production build.
- When working on this repository, check plugin manifests with `claude plugin validate .` in addition to the validator and tests.
