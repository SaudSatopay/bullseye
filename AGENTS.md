# AGENTS.md · BULLSEYE

This repository is a playbook for coding agents that build hackathon projects. It is a set of Agent Skills (`skills/<name>/SKILL.md`), Claude Code subagents (`agents/`), and the docs and scripts behind them. Two kinds of agent read this file; find yours.

## If a user asked you to build or run a hackathon entry with BULLSEYE

1. Work in the **user's project directory**, never inside this repository. If this repository was cloned into the project as `.bullseye/`, every path below is relative to `.bullseye/`.
2. Read `skills/bullseye/SKILL.md` first and follow it. It is the flight director: it creates `BULLSEYE.md` in the user's project, decides the phase, and tells you which skill to read next.
3. When a skill is not installed in your agent, read its folder here and follow it the same way: `skills/<name>/SKILL.md` first, then the `references/`, `assets/` and `scripts/` files it names, resolving every relative path from that skill's folder. Run a bundled script by its path, for example `node .bullseye/skills/prove-it/scripts/claims-check.mjs claims.json`.
4. The skills, in the order a hackathon uses them:

| Skill | Phase | Read when |
|---|---|---|
| `bullseye` | All | Always first; it sequences everything else |
| `brief-decoder` | Intake | A new event, problem statement, rules page or rubric arrives |
| `idea-round` | Idea gate | The event has an idea, proposal or concept submission |
| `pitch-deck` | Any document | A deck, concept brief, proposal or organiser template must be produced |
| `build-sprint` | Build | Writing the product |
| `missile` | Polish | Raising product craft with screenshots, measurements and a separate critic |
| `prove-it` | Proof | Any number, claim, benchmark or evaluation |
| `judge-panel` | Judging | Simulating judges or rehearsing Q&A |
| `demo-video` | Package | The demo video or a launch film |
| `submission-pack` | Package | README for judges, form answers, final sweep, submitting |
| `finale-pitch` | Finale | Live pitch, live demo, Q&A, surprise challenges |
| `hackathon-tracker` | Portfolio | Tracking several events and deadlines |

5. Subagents in `agents/` work only in Claude Code. Elsewhere, when a skill calls for a fresh-context critic or judge, open a new session, paste the prompt from that skill's `assets/` with the evidence it lists, and bring back only the verdict.
6. Respect the law in `skills/bullseye/references/law.md` and the event's own rules, which win over anything here.

## If you are improving BULLSEYE itself

Read `CONTRIBUTING.md`. In short:

- Every skill follows the Agent Skills specification: `name` equals the folder name (lowercase, hyphens), `description` says what it does and when to use it (at most 1024 characters; all descriptions together under about 8,000, Codex's listing budget), the `SKILL.md` body stays under 500 lines, and depth goes into `references/` one level deep.
- Every new rule carries a field note saying where it was learned: `> Field note (Project · Event): what happened and the lesson.` No invented results; no personal data; no secrets.
- House style: plain, imperative, concrete. No em dash characters anywhere (the validator fails on them); no emoji; no hype words.
- Scripts: Node 20+ ESM with zero dependencies where possible, or Python 3.10+ with optional libraries checked at import and an install hint. Every script has `--help`, clear errors, and a test in `tests/` (`node:test`).
- Do not copy third-party skills into this repository; reference them with install commands.
- Before finishing: `node scripts/validate.mjs` and `node --test` must both pass.
