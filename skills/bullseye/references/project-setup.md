# Project setup for a hackathon repo

What to put in place before the first feature, so every agent session starts oriented and every human action is known.

## Files in the project root

| File | Purpose | Public? |
|---|---|---|
| `AGENTS.md` | Rules every coding agent reads (Codex, Cursor, Gemini CLI, Copilot, Claude Code). Append the block from `../assets/AGENTS.project.md` under `## Bullseye`. | Depends on the process policy |
| `CLAUDE.md` | One line, `@AGENTS.md`, plus Claude-only notes below it. Claude Code imports the shared rules this way. | Same as `AGENTS.md` |
| `BULLSEYE.md` | The control file. | Private by default |
| `.env.example` | Every environment variable name, one comment each saying where to get it and what happens without it. | Public |
| `.claude/launch.json` | Dev-server configs so the Claude Code Browser pane can start the app itself. | Private by default |
| `.gitignore` | Secrets, build output, and the process block in private mode. | Public |

## The process policy

Decide at `start`, record under `## Decisions`.

- **Private (default for competitions).** Planning files stay on disk and out of git and deploys: `BULLSEYE.md`, `MISSILE.md`, `PRODUCT.md`, `DESIGN.md`, `judging/`, `.claude/`, deck builders that contain strategy notes. Add the same paths to `.vercelignore` (or the host's equivalent). Reason: judges should evaluate the product, and judge-simulation prompts are internal red-team tools.
- **Public.** Commit the process files. Useful for open-source events, learning-in-public tracks, or when the event rewards a visible build log.
- In both modes `CLAIMS.md`, `LIMITS.md`, `README.md` and `LICENSE` are public.

If history ever needs rewriting to remove a file, save a backup bundle first (`git bundle create ../backup.bundle --all`).

## The attribution policy

Decide before the first commit, because changing it later means rewriting history.

- Some events require disclosing AI assistance; put a plain "Team and AI assistance" section in the README either way.
- Some builders and events prefer commits without AI co-author trailers. In Claude Code, `"includeCoAuthoredBy": false` in the project's `.claude/settings.json` turns the trailer off.
- On Windows, write commit messages to a UTF-8 file without a byte-order mark and use `git commit -F <file>`; PowerShell here-strings can put a BOM in the subject line.

## Launch configs

`.claude/launch.json` lets the Browser pane start the app and take screenshots without manual steps. Keep a development config and a production-preview config, because demos, screenshots and recordings must come from the production build.

```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "web", "runtimeExecutable": "pnpm", "runtimeArgs": ["dev"], "port": 3000 },
    { "name": "web-prod", "runtimeExecutable": "pnpm", "runtimeArgs": ["start", "-p", "3005"], "port": 3005 }
  ]
}
```

For a Python backend add a config that runs `uvicorn` on its port. For a pitch workspace that previews a sibling repo, point `cwd` at that repo.

## MCP servers worth adding per project

Add only what the build needs; each server costs context.

| Server | When | Install |
|---|---|---|
| Context7 | Any unfamiliar library or a framework major you did not train on | `npx ctx7 setup --claude` |
| shadcn | The project uses shadcn/ui | `pnpm dlx shadcn@latest mcp init --client claude` |
| The sponsor's own MCP | The event names it as a tool (databases, platforms) | Follow the sponsor's guide; prefer read-only tools for agents |
| Chrome DevTools | Performance traces during polish | `claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest` |
| Vercel | Deploy logs and runtime errors | `claude mcp add --transport http vercel https://mcp.vercel.com` |

When the product itself exposes an MCP server (a common bonus in agent tracks), document the one-line install in the README so judges can try it from their own agent.

## Hooks

Offer, never add silently: a post-edit hook that runs the typecheck keeps the build green during fast iteration. The `missile` skill ships one in `../../missile/assets/settings.hook.json`.

## Version-matched docs

Frameworks change faster than any model's training. Write against the installed versions: read the package's own docs in `node_modules` (Next.js 16 ships them under `node_modules/next/dist/docs/`), check `package.json` before using an API, and prefer Context7 for anything else. One builder's README made this a claim: the codebase was written against the installed type definitions, not from memory, and built clean the first time.

## The owner checklist

These are the actions an agent cannot take. Hand them to the user on day 1, in one message, and track them in `## Owner checklist`:

1. Register every team member and confirm eligibility.
2. Create accounts and API keys; put keys in `.env` locally, never in chat.
3. Set production keys on the host.
4. Create the repository; decide when it becomes public.
5. Give the GitHub token the `workflow` scope if CI must run (`gh auth refresh -s workflow`).
6. Link the deploy target; confirm preview URLs are reachable while logged out.
7. Decide video hosting (YouTube unlisted or a public Drive link) and the channel.
8. Arrange judge access: sandbox invitations accepted, demo credentials ready.
9. Approve the commit attribution policy.
10. Plan the release tag for the submission commit.

> Field note (Detour · Graph Hacks 2026): the "shipped" score stayed at 6 or 7 for seven iterations because production keys, the release tag, analytics and the CI token scope all needed the owner. None of it was code.
