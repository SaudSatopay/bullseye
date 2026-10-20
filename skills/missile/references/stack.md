# Stack

Versions verified 2026-10-01. Re-check with `npm view <pkg> version` before pinning if more than a month has passed.

## New project: the default flight

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16.3 (App Router, Turbopack, Cache Components) | Deploys to Vercel with zero config; fonts, images, OG and metadata are built in. |
| Language | TypeScript 7 | Go-native compiler makes typecheck cheap enough to run on every edit. |
| Package manager | pnpm (Bun if the user's machine already lives in Bun) | Fast, deterministic, and installed on most dev machines. |
| Styling | Tailwind CSS 4.3 with one `@theme` block | The design system is a single file Claude can hold in context. |
| Components | shadcn CLI 4 on Base UI, themed before use | Registries and an MCP let the missile pull blocks by name. |
| Motion | Motion 13 (`motion/react`); GSAP 3.15 for hero timelines | Declarative for UI, timeline for the signature moment. |
| 3D / effects | Paper Shaders (cheapest), Spline (designer-friendly), React Three Fiber 9 (full control) | One of these for the signature moment, not all. |
| Data | Supabase (Postgres, auth, storage, realtime) or Convex for reactive apps | Free tiers cover a launch; MCPs exist for both. |
| Auth | Better Auth 1.7 (self-hosted) or Clerk (hosted UI) | Both work with Next.js 16 today. |
| ORM | Drizzle 0.45 | Stay off the 1.0 release candidate. |
| AI | Anthropic SDK with `claude-opus-5-5` by default (set the effort level explicitly; it defaults to medium), `claude-sonnet-5-5` for latency-sensitive chat, `claude-haiku-5-5` for cheap high-volume work; Vercel AI SDK 7 for streaming UI | Adaptive thinking, streaming for long outputs, structured outputs instead of assistant prefill. In a hackathon, use the sponsor's model when the event requires or rewards it. |
| Deploy | Vercel (preview per branch) | `vercel` for preview, `vercel --prod` to ship. Cloudflare Workers as the backup. |
| Observe | Vercel Analytics, Sentry (free 5K errors), PostHog (replays) | Optional, but `shipped` scores higher with one wired. |

### Scaffold (new project)

```bash
pnpm create next-app@latest <name> --ts --tailwind --app --src-dir --use-pnpm
cd <name>
pnpm approve-builds --all
pnpm install
pnpm dlx shadcn@latest init
pnpm add motion
pnpm add -D @types/node
git init && git add -A && git commit -m "chore: scaffold"
```

pnpm 10 and later refuse to run dependency build scripts until they are approved, and pnpm 11 fails the install outright with `ERR_PNPM_IGNORED_BUILDS` (seen on 2026-10-01 with esbuild; sharp, `@tailwindcss/oxide` and `unrs-resolver` behave the same). Every later `pnpm exec`, `pnpm build` and `pnpm dev` then fails too, because pnpm retries the install first. Right after a scaffold, `pnpm approve-builds --all` is fine: the pending packages are the framework's own. Later, approve by name (`pnpm approve-builds esbuild sharp`), record the names under Decisions, and leave anything unfamiliar unapproved unless the build cannot run without it. The approval is written to `pnpm-workspace.yaml`; commit that file.

Then, in this order: `src/app/globals.css` gets the `@theme` block from design-rules.md; `src/app/layout.tsx` loads the two typefaces with `next/font`; `src/app/opengraph-image.tsx` renders the OG image from the tokens; `package.json` gets `typecheck: "tsc --noEmit"` and `lint`, `test`, `build` scripts that pass.

Optional adds by signature moment (recipes in effects.md): `pnpm add @paper-design/shaders-react`; `pnpm add @shadergradient/react @react-three/fiber three three-stdlib camera-controls`; `pnpm add three @react-three/fiber @react-three/drei`; `pnpm add html2canvas` (for vendored liquid-glass-js); `pnpm add @splinetool/react-spline @splinetool/runtime`; `pnpm add gsap`; `pnpm add lenis`. React Three Fiber 9 pairs with React 19, version 8 with React 18; never mix them.

### Alternatives when the product is not a web app
- Pure client app, game or WebGL toy: Vite 8 + React 19, deploy to Vercel or Cloudflare Pages.
- Content site: Astro 7.
- Mobile: Expo (React Native) with Emil's `animate-expo` skill; the missile's visual rubric still applies, sensors change to simulator screenshots.

## Existing project: respect the stack

The missile improves what is there. It does not migrate frameworks, swap package managers, or move a project between hosting providers on its own. Those are decisions the user makes; propose them in MISSILE.md under Decisions and continue with the current stack.

Allowed without asking: adding a token layer, adding fonts, adding motion and effect libraries, adding tests and scripts, upgrading dependencies within their current major, adding a preview deployment, adding a README and metadata.

Ask first (a hard stop): major-version upgrades of the framework, replacing the component kit, changing the build tool, deleting directories, anything touching auth, billing or security code without tests, pushing to a shared branch, deploying to production.

### Detecting the stack

`scripts/recon.mjs` reports the framework, the package manager (from the lockfile) and the available scripts. Use the project's own commands; add missing ones rather than inventing parallel tooling.

| Framework | Dev | Build | Typecheck | Notes |
|---|---|---|---|---|
| Next.js | `dev` | `build` | `tsc --noEmit` | Routes under `app/` or `src/app/` (`page.*`), or `pages/`. |
| Vite + React | `dev` | `build` | `tsc --noEmit` | Single route unless a router is present. |
| Astro | `dev` | `build` | `astro check` | Routes under `src/pages/`. |
| SvelteKit | `dev` | `build` | `svelte-check` | Routes under `src/routes/` (`+page.svelte`). |
| Remix / React Router 7 | `dev` | `build` | `tsc --noEmit` | Routes under `app/routes/`. |
| Nuxt | `dev` | `build` | `nuxi typecheck` | Routes under `pages/`. |
| Expo | `start` | `expo export` | `tsc --noEmit` | Screens under `app/`. |

Package manager from lockfile: `pnpm-lock.yaml` → pnpm, `bun.lock` or `bun.lockb` → bun, `yarn.lock` → yarn, `package-lock.json` → npm. No lockfile: pnpm.

Run commands through the detected manager (`pnpm run build`, `npm run build`, `bun run build`). When a script is missing (for example `typecheck`), add it to `package.json` rather than running a one-off.
