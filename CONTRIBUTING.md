# Contributing to BULLSEYE

BULLSEYE grows from real hackathons. The most valuable contribution is a lesson you paid for: a rule that would have saved your entry, with the evidence of where it bit.

## What makes a good contribution

- **A field-tested rule.** Something that changed a result or nearly did. State it as an instruction an agent can follow without asking questions, and add a field note:

  ```markdown
  > Field note (Project · Event): what happened, and the lesson.
  ```

  Name the project and the event. Never name people, never include private details, and never claim a result the event did not announce.
- **A template you actually used**, generalized: keep its section order and its sharpest lines, replace specifics with `{{slots}}`.
- **A script that removed a manual step**, with a test.
- **A fix** to anything that is wrong, out of date or unclear.

## Repository layout

```text
skills/<name>/SKILL.md        one Agent Skill per folder; references/, assets/, scripts/ inside it
agents/<name>.md              Claude Code subagents
docs/                         the method, field notes, install guide, prompt cookbook
scripts/validate.mjs          the repository's own checks
tests/                        node:test suites, one file per bundled script
.claude-plugin/               plugin and marketplace manifests
```

## Rules for skills

- Follow the [Agent Skills specification](https://agentskills.io/specification): `name` equals the folder name in lowercase with single hyphens; `description` says what the skill does and when to use it, in at most 1024 characters, with the phrases users actually say.
- Keep `SKILL.md` under 500 lines. Put depth in `references/`, linked directly from `SKILL.md` (one level deep).
- Write for any agent. Where a Claude Code feature helps (subagents, the Browser pane, plan mode), give the fallback for other agents in the same paragraph.
- Link a sibling skill as `../<skill>/...` and keep the essential rule inline, so each skill still works when installed alone.
- Never copy a third-party skill into this repository. Reference it with its install command.

## Rules for scripts

- Node 20+ ESM (`.mjs`) with zero npm dependencies where possible. If Playwright is needed, resolve it from the user's project and print an exact install hint when it is missing.
- Python 3.10+, standard library first. Optional libraries (PyMuPDF, python-pptx, qrcode, edge-tts) are checked at import with an install hint.
- Every script has a header comment with purpose and usage, `--help`, helpful errors, a non-zero exit on failure, and no absolute machine paths. It works on Windows, macOS and Linux.
- Every script has a test in `tests/<skill>.<script>.test.mjs` using `node:test`. Tests create their own fixtures in a temporary folder, need no network, and skip with a reason when an optional dependency is missing.

## House style

- Plain, declarative, imperative. Short sentences. Concrete numbers.
- No em dash characters anywhere: use a colon, comma, period, parentheses or a middot. The validator fails on them.
- No emoji in prose or headings. No hype words (seamless, effortless, powerful, elevate, leverage, cutting-edge, robust).
- In code that must handle an em dash, build the character at runtime (`String.fromCharCode(0x2014)` or `chr(0x2014)`).

## Before you open a pull request

```bash
node scripts/validate.mjs
node --test tests/
claude plugin validate .
```

The first two must pass; the third is optional if you do not use Claude Code. Describe what changed, why, and where the lesson came from.

## Licence

By contributing you agree that your contribution is licensed under the MIT licence of this repository.
