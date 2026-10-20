# Arsenal

What the missile uses at each stage, how to detect it, how to install it, and what to do when it is missing. The missile always flies; a missing tool changes the method, not the target.

## Sensors: how the missile sees

Use the first one available. Never skip screenshots because a tool is missing; fall down the list.

| Priority | Sensor | Detect | Use |
|---|---|---|---|
| 1 | Claude Code desktop Browser pane | tools named `mcp__Claude_Browser__*` are present | `preview_start` or `navigate`, `resize_window` preset `mobile` then `desktop`, `screenshot`, `read_console_messages`. Add `.claude/launch.json` so the dev server starts itself. |
| 2 | Playwright CLI | `playwright-cli --version` | `playwright-cli open <url>`, `playwright-cli resize 390 844`, `playwright-cli screenshot --filename=<path>`, `playwright-cli resize 1440 900`, screenshot again, `playwright-cli console` for errors, `playwright-cli eval "<expression>"` for checks such as horizontal overflow, `playwright-cli close`. Verified on Windows on 2026-10-01. |
| 3 | Bundled fallback | Node present | `node '${CLAUDE_SKILL_DIR}/scripts/shots.mjs' <url> <outDir> home pricing app` uses `npx playwright screenshot` at 390 and 1440. Route names without slashes. If Chromium is missing, run once with `--install`. |
| 4 | Playwright MCP or Chrome DevTools MCP | `claude mcp list` | Same job, more context cost. Chrome DevTools MCP is the only one that gives performance traces. |

Metrics: `npx lighthouse <url> --output=json --output-path=<file> --chrome-flags="--headless=new" --quiet --only-categories=performance,accessibility,best-practices,seo --form-factor=mobile --screenEmulation.mobile` then `node ${CLAUDE_SKILL_DIR}/scripts/lh-summary.mjs <file>`.

Static: the project's own `typecheck`, `lint`, `test`, `build` scripts. Console errors from the browser sensor.

## Design skills

| Skill | Stage | Detect | Install | Without it |
|---|---|---|---|---|
| frontend-design (Anthropic plugin) | Design system, Build | `~/.claude/plugins/installed_plugins.json` contains `frontend-design` | `claude plugin install frontend-design@claude-plugins-official` | design-rules.md carries the same doctrine. |
| Taste Skill (`Leonxlnx/taste-skill`) | Target lock, Design system | `~/.claude/skills/design-taste-frontend` or similar `taste` folder | `npx skills add Leonxlnx/taste-skill` | Set the three dials (VARIANCE, MOTION_INTENSITY, VISUAL_DENSITY) yourself in DESIGN.md and follow design-rules.md. |
| Impeccable (`pbakaus/impeccable`) | Design system, Polish | `/impeccable` appears in the skill list, or `~/.claude/skills/impeccable*` | `npx impeccable install` | Run the critique and polish passes as prompts from prompts.md. |
| Emil Kowalski skills | Design system, Polish | `~/.claude/skills/animate` and `review-animations` | `npx skills@latest add emilkowalski/skills` | Apply the motion budget in design-rules.md by hand. |
| Vercel agent-skills (`web-design-guidelines`) | Polish | `~/.claude/skills/web-design-guidelines` | `npx skills add vercel-labs/agent-skills` | Use the accessibility and UX checklist in rubric.md dimensions 5 and 6. |
| Hallmark (`nutlope/hallmark`) | Polish | `~/.claude/skills/hallmark` | `npx skills add nutlope/hallmark` | The banned-looks list in design-rules.md is the gate. |
| UI/UX Pro Max (`uipro`) | Design system | `uipro --version`; project has `.claude/skills/ui-ux-pro-max` after init | `npm i -g uipro-cli` then `uipro init --ai claude` in the project | Choose palette and type from design-rules.md. |
| Superpowers (`obra/superpowers`) | Build | installed plugin `superpowers` | `claude plugin install superpowers@claude-plugins-official` | Write the plan and tests yourself; flight.md has the sequence. |
| Ralph loop (Anthropic plugin) | Build | installed plugin `ralph-loop` | `claude plugin install ralph-loop@claude-plugins-official` | Use `/loop` or iterate manually on the failing suite. |
| Playwright CLI skills | Every sensor pass | `playwright-cli --version` | `npm i -g @playwright/cli@latest` then `playwright-cli install --skills` | Browser pane or `scripts/shots.mjs`. |

## MCP servers

| Server | Stage | Detect | Install | Without it |
|---|---|---|---|---|
| Context7 | Build | `claude mcp list` shows `context7` | `npx ctx7 setup --claude` | Read the installed package's README in `node_modules` before using an unfamiliar API. |
| shadcn MCP | Design system, Build | `.mcp.json` has `shadcn` | `pnpm dlx shadcn@latest mcp init --client claude` | `pnpm dlx shadcn@latest add <component>` by name. |
| Watermelon UI | Design system | `claude mcp list` shows `watermelon` | `claude mcp add --transport http watermelon https://mcp.watermelon.sh/mcp` | Magic UI and react-bits through the shadcn CLI. |
| 21st MCP | Design system | `claude mcp list` shows `21st` or `magic` connected | `npx @21st-dev/cli@latest init --client claude` (needs a key from 21st.dev/mcp) | Skip; not required. |
| Chrome DevTools MCP | Polish (performance) | `claude mcp list` shows `chrome-devtools` | `claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest` | Lighthouse opportunities cover most of it. |
| Vercel MCP | Ship | `claude mcp list` shows `vercel` | `claude mcp add --transport http vercel https://mcp.vercel.com` | `vercel logs` and `vercel inspect` from the CLI. |
| Supabase MCP | Build | `.mcp.json` has `supabase` | `claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp"` | The Supabase CLI and dashboard. |
| Figma MCP | Target lock (when designs exist) | plugin `figma` installed | `claude plugin install figma@claude-plugins-official` | Ask the user for exported PNGs and paste them. Free plan allows 20 calls a month; budget them. |

## Machine tools

| Tool | Detect | Install | Without it |
|---|---|---|---|
| Vercel CLI | `vercel --version`; signed in when `vercel whoami` prints a user and not "Logged out" | `npm i -g vercel@latest` then `vercel login` (the user's step) | `vercel deploy --temporary --yes` creates a claimable preview with no login. Record the URL and that it must be claimed under Decisions. |
| Lighthouse | runs through `npx lighthouse` | none | Chrome DevTools MCP trace, or PageSpeed Insights by hand. |
| ffmpeg | `ffmpeg -version` | package manager | Skip video trimming. |
| Bun | `bun -v` | `powershell -c "irm bun.sh/install.ps1|iex"` or `curl -fsSL https://bun.sh/install | bash` | pnpm. |

## Arming procedure

1. Run `node ${CLAUDE_SKILL_DIR}/scripts/recon.mjs <dir>`; its Arsenal section lists what is present.
2. Classify each missing item as critical (a sensor, the framework's own commands) or nice-to-have (a taste skill).
3. Critical and installable without a login or key: install it, then verify.
4. Needs a login or key (21st, Figma, Vercel login, Supabase): write the exact command into MISSILE.md under Decisions and continue with the fallback.
5. Never install global tools without saying so in MISSILE.md.
