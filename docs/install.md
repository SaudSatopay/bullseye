# Install

BULLSEYE is a set of Agent Skills plus five Claude Code subagents. Pick the route for your agent.

## Claude Code (recommended: skills and subagents)

```text
/plugin marketplace add SaudSatopay/bullseye
/plugin install bullseye@bullseye
```

- From a shell: `claude plugin marketplace add SaudSatopay/bullseye`, then `claude plugin install bullseye@bullseye`.
- Recent Claude Code versions accept one step: `/plugin install bullseye --marketplace SaudSatopay/bullseye`.
- Pin a release: `/plugin marketplace add SaudSatopay/bullseye#v1.0.0`.
- Skills are namespaced: `/bullseye:bullseye` (the flight director), `/bullseye:prove-it`, and so on. Plain-language requests ("use bullseye for this hackathon") trigger them too.
- Subagents: `bullseye:missile-recon`, `bullseye:missile-critic`, `bullseye:missile-builder`, `bullseye:hackathon-judge`, `bullseye:claims-auditor`.
- **Updating.** Third-party marketplaces do not auto-update by default. Turn it on under `/plugin` → Marketplaces, or run `claude plugin marketplace update bullseye` and `claude plugin update bullseye@bullseye`.
- **Windows.** Git for Windows must be on `PATH` for `owner/repo` marketplace adds. If cloning over SSH fails, set `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1`.

## Any agent that reads Agent Skills

The [skills CLI](https://github.com/vercel-labs/skills) installs into Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode, Windsurf and many others:

```bash
npx skills add SaudSatopay/bullseye
```

- It asks which agents to install for; `-a codex -a cursor` chooses up front, `-g` installs for your user instead of the project.
- Install only some skills with `--skill bullseye --skill prove-it`. The skills link to each other, so the full set is recommended.
- Project installs land in each agent's folder, for example `.claude/skills/` for Claude Code and `.agents/skills/` for Codex, Cursor, Gemini CLI and Copilot.

### Codex notes

- Codex scans `.agents/skills` from the working directory up to the repository root, and `~/.agents/skills` for your user.
- Mention a skill with `$bullseye` or pick it from `/skills`; Codex also chooses a skill on its own when your request matches its description.
- Codex has no subagents. Where a skill calls for a fresh-context critic or judge, open a new Codex session, paste the prompt from that skill's `assets/` with the evidence it lists, and bring back only the verdict.

## No install

```bash
git clone --depth 1 https://github.com/SaudSatopay/bullseye .bullseye
```

Add `.bullseye/` to your project's `.gitignore`, then tell your agent: *"Read .bullseye/AGENTS.md and run the bullseye skill for this hackathon."* This works with any agent that can read files, including ones without skills support.

## What the bundled scripts need

Everything is Markdown except the scripts, and each script prints an install hint when something is missing.

| Need | For | Install |
|---|---|---|
| Node 20+ | Every `.mjs` script | nodejs.org |
| Python 3.10+ | PDF finishing and QA, PPTX tools, QR codes, voiceover, statistics | python.org |
| PyMuPDF, python-pptx, qrcode | `pitch-deck` and `submission-pack` scripts | `pip install pymupdf python-pptx "qrcode[pil]"` |
| edge-tts | Free voiceover in `demo-video` | `pip install edge-tts` |
| Playwright | Evidence sensor (`missile`), scripted recordings (`demo-video`) | In your project: `npm i -D playwright` then `npx playwright install chromium` |
| Chrome or Edge | HTML to PDF rendering (`pitch-deck`) | Usually already installed |
| ffmpeg | Video conversion, GIFs, contact sheets | Your OS package manager |

## Check that it works

Ask your agent: *"Which bullseye skills can you use, and what does each one do?"* It should list twelve skills. In Claude Code, `/plugin` shows the plugin as enabled and `/agents` lists the five subagents.

## Remove

- Claude Code plugin: `/plugin uninstall bullseye@bullseye`, then remove the marketplace with `/plugin marketplace remove bullseye`.
- Skills CLI installs: delete the installed skill folders (for example `.claude/skills/<name>` or `.agents/skills/<name>`).
- Clone: delete `.bullseye/`.
