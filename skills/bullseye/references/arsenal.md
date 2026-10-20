# Arsenal

The tools this playbook uses across a whole hackathon, with when and how. The `missile` skill keeps its own arsenal for the polish loop (sensors, design skills, effects); this file covers everything else and points there for craft.

Rules for using anything on this list:
1. One tool per job. Pick the first that fits, record the choice in one line under `## Decisions`, move on.
2. Prefer what is already installed (`node scripts/recon.mjs` in the `missile` skill lists the local arsenal).
3. A missing tool changes the method, never the target. Every row has a fallback.
4. Anything that needs a login or a key is an owner action; write the exact command for the user and continue with the fallback.
5. Check licences before shipping third-party code, fonts, images or data, and credit them.

## Agent skills for craft

These are tools inside a phase, not replacements for it. When one contradicts the project's `DESIGN.md`, record a waiver with the reason instead of complying.

| Skill | Use it for | Install |
|---|---|---|
| frontend-design (Anthropic) | A design direction that avoids templated defaults | `claude plugin install frontend-design@claude-plugins-official` |
| Impeccable | Critique, polish, audit and "bolder" passes on finished screens | `npx impeccable install` |
| Hallmark | Anti-slop gates and structural variety on landing pages | `npx skills add nutlope/hallmark` |
| Taste skill | Setting variance, motion and density for a landing page | `npx skills add Leonxlnx/taste-skill` |
| Emil Kowalski's skills | Motion decisions, animation reviews, interaction polish | `npx skills@latest add emilkowalski/skills` |
| Vercel agent skills | Web interface guideline audits, React performance | `npx skills add vercel-labs/agent-skills` |
| UI/UX Pro Max | A palette and type pairing library when nothing is specified | `npm i -g uipro-cli` then `uipro init --ai claude` |
| Superpowers | Plans, test-driven loops, code review discipline | `claude plugin install superpowers@claude-plugins-official` |
| Playwright CLI skills | Browser automation and screenshots from the shell | `npm i -g @playwright/cli@latest` then `playwright-cli install --skills` |

> Field note (ORCA · SIH 2026): taste, Impeccable, Hallmark and motion audits each produced a punch list; items that fought the protected design system were logged as waived with reasons instead of applied.

## MCP servers

| Server | Use it for | Without it |
|---|---|---|
| Context7 | Current docs for any library | Read the package's README and docs in `node_modules` |
| shadcn | Pulling components by name into a shadcn project | `pnpm dlx shadcn@latest add <component>` |
| Watermelon UI | Source-backed component search before writing UI from scratch | Magic UI and react-bits through the shadcn CLI |
| 21st.dev Magic | Pulling polished React components (needs a key) | Skip |
| Chrome DevTools | Performance traces at 4x CPU throttling | Lighthouse opportunities |
| Playwright MCP | Browser driving inside the agent | Playwright CLI or the Claude Code Browser pane |
| Vercel | Deploy and runtime logs | `vercel logs`, `vercel inspect` |
| Supabase | Database, auth, storage tasks | Supabase CLI and dashboard |
| Figma | When the team has real designs to implement | Exported PNGs pasted into the session |
| The sponsor's MCP | When the event names it as a tool | The sponsor's CLI or REST API |

## Command-line tools

| Tool | Use it for | Notes |
|---|---|---|
| `gh` | Repos, releases, tags, competitor scans (`gh search repos`) | Add the `workflow` scope before pushing CI files |
| `vercel` | Preview and production deploys of web apps | `vercel deploy --temporary --yes` makes a claimable preview without login |
| `npx lighthouse` | Performance, accessibility, SEO numbers | Mobile form factor; summarize with the `missile` script `lh-summary.mjs` |
| `playwright` / `playwright-cli` | Screenshots, recordings, end-to-end tests | `npx playwright install chromium` once |
| `ffmpeg` | Video conversion, GIFs, contact sheets, loudness | Install from the OS package manager |
| `uv` | Fast, reproducible Python environments and one-off tools | `uv run --with <pkg> python script.py` |
| `pnpm` | Node packages | pnpm 10+ needs `pnpm approve-builds` after the first install |
| `wrangler`, `railway`, `render` | Other hosts | See Hosting below |
| `ngrok` or `cloudflared` | Exposing a local webhook (chat platforms, payment sandboxes) | Use for development only; demo on a stable host |

## Libraries by job

**Web app (defaults in the `missile` skill's `references/stack.md`):** Next.js with the App Router, TypeScript, Tailwind CSS 4 with one `@theme` block, shadcn/ui themed through tokens, Motion for UI transitions, GSAP for one hero timeline, Leaflet or MapLibre with keyless OpenStreetMap tiles for maps, a chart library only when a hand-drawn SVG would take longer.

**Python services:** FastAPI with uvicorn, pydantic, httpx. Keep dependencies few so the app installs in seconds on a judge's laptop; pure-Python fallbacks beat native installs that can fail on stage.

**AI:**
- Anthropic SDK: `claude-opus-5-5` as the default (set the effort level explicitly; its default is medium), `claude-sonnet-5-5` for latency-sensitive chat, `claude-haiku-5-5` for cheap high-volume classification. Use adaptive thinking, streaming for long outputs, and structured outputs instead of assistant prefill.
- Vercel AI SDK for streaming chat UIs and provider failover middleware.
- Claude Agent SDK when the product is itself an agent with built-in tools; the MCP SDK when the product should expose tools to other agents.
- Use the sponsor's model when the event requires or rewards it (an OpenAI event wants OpenAI models, a Qwen event wants Qwen). Judges notice.
- Free tiers (Gemini, Groq, local Ollama) are fine for building but run out mid-event; chain them with failover and budget a paid key for the final evaluation run.

**Data, ML and evaluation:** pandas or Polars, scikit-learn, LightGBM, networkx, Hypothesis for property tests, pytest or Vitest, Playwright with axe for accessibility, PyMuPDF for PDFs.

**Decks and documents (see the `pitch-deck` skill):** HTML with print CSS rendered by headless Chrome; pptxgenjs for editable decks; python-pptx for organiser templates; the `docx` npm package for concept notes; PyMuPDF for PDF finishing and QA; `qrcode` for QR codes.

**Video (see the `demo-video` skill):** Playwright `recordVideo` for scripted captures, OBS for manual ones, ffmpeg for assembly, edge-tts for free voiceover, Whisper for transcript checks, Remotion or a canvas engine for a launch film.

## Design resources

- **Type:** Google Fonts and Fontshare. Faces that still read as chosen are listed in the `missile` skill's `references/design-rules.md`. Load through the framework's font loader or self-host; for decks, embed fonts or fall back to system faces (Bahnschrift, Segoe UI and Cascadia Mono on Windows; Arial Narrow, Arial and Courier New anywhere).
- **Icons:** Lucide or Phosphor, or hand-drawn inline SVG in the project's stroke weight. Never emoji as icons.
- **Imagery:** product screenshots first. Photos from Wikimedia Commons, NASA (public domain) or other openly licensed sources, each recorded in a credits ledger and credited on the slide. Bake colour grades into the image file; CSS filters make PDFs huge.
- **Texture:** SVG `feTurbulence` grain at 3 to 5 percent, hairline grids, radial glows. One texture, used consistently.
- **Effects:** the `missile` skill's `references/effects.md` has working recipes for shader gradients, 3D scenes, liquid glass and liquid metal, each with a poster fallback and a performance budget.
- **Maps:** OpenStreetMap tiles (keyless) and Overpass exports for real street, building and water geometry. Credit OpenStreetMap contributors (ODbL).

## Data sources

Real public data beats a bigger self-built simulation. Record provenance for everything in a `data/meta.json` (source, URL, slice, retrieved date, assumptions, counts) and label synthetic data wherever it appears.

| Domain | Sources |
|---|---|
| Geography, cities, infrastructure | OpenStreetMap and the Overpass API |
| Weather and oceans | Open-Meteo (keyless), national meteorological portals |
| Transit | GTFS feeds published by transit agencies |
| Government and development data | data.gov.in and other national open-data portals, World Bank data |
| Space and earth observation | NASA open data, ISRO/MOSDAC portals |
| Machine learning | Hugging Face datasets, Kaggle, public benchmarks (SemEval, LFW and others) |
| Organiser data | Whatever the event provides; prove the core on it before pitching |

## Hosting

| Host | Good for | Watch out for |
|---|---|---|
| Vercel | Next.js, previews per branch, cron, Python functions | Previews can sit behind a login (judges get HTTP 302); pin `framework` in `vercel.json`; in-memory state resets between instances |
| Render | One-process Python or Node web services (`Procfile`, `render.yaml`, `/healthz`) | Free instances sleep; open the URL two minutes before demoing |
| Railway | Quick full-stack deploys | Trials expire mid-event |
| Cloudflare Workers and Pages | Edge APIs and static sites | Runtime differs from Node |
| GitHub Pages | Static concept demos (Vite `base` + build into `docs/`) | No server code |
| Hugging Face Spaces, Streamlit Community Cloud | ML demos | Cold starts; memory limits |
| A small VM with Caddy and an sslip.io hostname | Anything that needs HTTPS on a bare IP (microphone and voice features need a secure context) | You own uptime |

Free databases sleep after idle periods; a daily keep-alive cron prevents a dead demo during judging.
