# Design rules

The missile's taste, in one file. These rules exist because generated interfaces cluster around a handful of looks that every judge and every user has now seen a thousand times. A specific choice grounded in the product's own world always beats a safe default.

## Doctrine

1. Specific beats generic. Every visual choice should be explainable by the subject: its materials, its instruments, its vernacular, its users.
2. One bold move, quiet everything else. Put the personality in one place (the type, the hero, the palette) and keep the rest disciplined.
3. Real content only. No lorem ipsum, no placeholder avatars, no "John Doe". If the data does not exist yet, invent plausible, specific data and label it as example data.
4. Structure is information. Numbering, dividers and labels encode something true about the content or they go.
5. Complete at rest. Everything meant to be read is visible when the page loads; motion starts from a visible state.

## The banned looks (score design_system at 4 or below when present)

- Warm cream background with a serif display and a terracotta accent.
- Near-black background with one acid-green or vermilion pop.
- A purple-to-blue gradient hero on white, or gradient text anywhere.
- Inter or Space Grotesk as the personality of the page (fine as a utility body face inside an otherwise deliberate system).
- Emoji as icons or section markers.
- Everything centered.
- The same radius and shadow on every block. Three equal feature cards in a row.
- Glassmorphism on every surface. Sparkles icons for anything AI.
- Stock hero illustrations of people pointing at charts. Photos of handshakes.
- Headlines like "Welcome to X", "Lightning fast. Secure. Scalable.", "Unleash the power of".
- A dark mode that is the light mode inverted.

If the user asks for one of these looks, do it well; their words win. When nothing is specified, do not spend the freedom on a default.

## Tokens: the one source of truth

Tailwind 4 projects put the whole system in one `@theme` block. Other stacks use the same names as CSS custom properties. Colors in OKLCH so lightness steps are perceptually even.

```css
@import "tailwindcss";

@theme {
  /* Neutrals with a hue bias toward the accent. Never pure grey. */
  --color-paper-50:  oklch(0.985 0.004 250);
  --color-paper-100: oklch(0.965 0.006 250);
  --color-paper-200: oklch(0.925 0.008 250);
  --color-ink-900:   oklch(0.20 0.02 255);
  --color-ink-700:   oklch(0.38 0.02 255);
  --color-ink-500:   oklch(0.56 0.02 255);
  --color-line:      oklch(0.88 0.008 250);

  /* One accent. Semantic colors are not the accent. */
  --color-accent:     oklch(0.62 0.21 35);
  --color-accent-ink: oklch(0.99 0.01 35);
  --color-ok:   oklch(0.62 0.15 155);
  --color-warn: oklch(0.72 0.15 80);
  --color-crit: oklch(0.55 0.20 25);

  /* Type roles, not families. */
  --font-display: "Bricolage Grotesque", "Arial Narrow", sans-serif;
  --font-body: "Instrument Sans", system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;

  /* Scale: 1.25 ratio from 15 px. */
  --text-sm: 0.8rem;  --text-base: 0.9375rem; --text-lg: 1.17rem;
  --text-xl: 1.46rem; --text-2xl: 1.83rem;    --text-3xl: 2.29rem;
  --text-4xl: 2.86rem; --text-5xl: 3.58rem;

  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 14px;
  --shadow-card: 0 1px 2px oklch(0 0 0 / 0.06), 0 8px 24px oklch(0 0 0 / 0.06);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* redefine the same tokens; design them, do not invert */ }
}
:root[data-theme="dark"] { /* same dark values */ }
```

Rules: every color used by a component comes from a token; component code never contains a literal hex. Dark values are chosen, not computed. The neutral scale carries a hint of the accent hue.

## Type

- Three roles: display (personality, used with restraint), body (reading), mono (data, code, labels). Two families minimum, three at most.
- Pair by contrast of construction, not by trend: a condensed grotesk with a humanist body; a quirky serif display with a plain sans body; a mono display with a neutral sans.
- Faces that still read as chosen in 2026: Bricolage Grotesque, Instrument Sans and Serif, Fraunces, Newsreader, Onest, Host Grotesk, Funnel Display, Barlow Condensed, IBM Plex; from Fontshare: Satoshi, General Sans, Clash Display, Cabinet Grotesk, Switzer; mono: Geist Mono, JetBrains Mono, Commit Mono, Monaspace.
- Scale: pick a ratio (1.2 to 1.333) and stick to it. Headlines get `text-wrap: balance`; paragraphs get `text-wrap: pretty`.
- Body line-height 1.5 to 1.6, headlines 0.9 to 1.1. Uppercase labels get `letter-spacing: 0.06em` to `0.12em` and a smaller size. Numbers in columns get `font-variant-numeric: tabular-nums`.
- Measure: 45 to 75 characters. Set `max-width: 65ch` on prose.
- Load through the framework's font loader (`next/font`) or self-host; never a render-blocking font link on the critical path.

## Color

- Proportion: about 60 percent neutral surface, 30 percent secondary surface or ink, 10 percent accent. The accent goes on the primary action, the signature element, focus rings, and little else.
- Neutrals: derive the scale from one hue-biased base. Pure white and near-black are fine as chosen surfaces.
- Semantic colors (ok, warn, crit) live apart from the accent so status never competes with brand.
- Contrast: body text 4.5:1 minimum, large text 3:1, and check the accent against both surfaces.
- If the accent clashes with a surface, shift it toward an analogous hue or desaturate it; do not add a second accent.

## Layout

- Lay out siblings with flex or grid and `gap`; avoid per-element margins that collapse unpredictably.
- One outer gutter of at least 16 px at every width; content max-width around 1180 px for marketing, wider for tools.
- Section rhythm: pick two vertical spacings (for example 48 and 96 px) and alternate them; do not invent a new one per section.
- Cards by role: border, fill, radius and shadow mark an element as a separate object. Use them for the one element that needs separation, not for every block.
- Repeated elements share edges, baselines and inner padding. Let content set height; choose column counts the items fill.
- Responsive: stack to one column under 640 px; give flex and grid children that hold text, code or tables `min-width: 0`; images and aspect-ratio boxes get `max-width: 100%`; only tables, diagrams and code may scroll sideways, each inside its own `overflow-x: auto` container.
- Tools and dashboards are scanned, not read: summary before detail, state encoded in form (pill, stripe, chip) as well as words, interactive things that look interactive.

## Motion budget

| Where | Duration | Easing | Notes |
|---|---|---|---|
| Hero page-load sequence | 600 to 900 ms total | ease-out, stagger 40 to 80 ms | The one orchestrated moment. Runs once. |
| UI transitions (hover, open, toggle) | 120 to 240 ms | ease-out in, ease-in out | Transform and opacity only. |
| Layout moves (reorder, expand) | 200 to 320 ms | ease-in-out | Use layout animation primitives, never animate height by hand. |
| Route transitions | 200 to 400 ms | ease-out | React View Transitions or the framework's equivalent. |
| Scroll-driven effects | landing page only | linear to scroll | Never inside the app. |

Always: `@media (prefers-reduced-motion: reduce)` disables non-essential motion. Hover states only on pointer devices (`@media (hover: hover)`). No bounce or overshoot unless the brand is playful. Nothing animates forever except an intentional ambient element in the hero, and it pauses when off-screen.

## Signature moment catalog

Pick one. Build it in the Design system stage and protect it through every iteration.

| Moment | When it fits | Cost | Tools |
|---|---|---|---|
| Live transformation | The product turns input into output (text, image, data) | M | Streaming UI, before/after layout |
| 3D object or scene | Physical products, hardware, spatial ideas | M (Spline) to L (R3F) | Spline, React Three Fiber with drei |
| Shader or mesh gradient atmosphere | Brands, tools that want depth without objects | S | ShaderGradient, Paper Shaders, Unicorn Studio |
| Liquid glass controls | A nav pill, floating toolbar or primary action over a rich, still background | S to M | liquid-glass-js (vendored), CSS backdrop-filter fallback, drei MeshTransmissionMaterial inside a 3D scene |
| Liquid metal logo | A brand moment: hero mark, loader, demo intro | S (exported asset) to M (live shader) | Paper Shaders LiquidMetal, the liquid-logo tool or its shader |
| Kinetic typography | Editorial, media, anything with a strong voice | S to M | Motion, GSAP SplitText |
| Data-driven hero | Analytics, finance, anything with numbers | M | Real data, number-flow, a chart drawn to scale |
| Before/after slider | Restoration, optimization, cleanup tools | S | Two layers and a drag handle |
| Cursor-aware scene | Playful products, games, creative tools | S | Pointer tracking, spring physics |
| Generative canvas | Art, music, tools with variety | M | Canvas or WebGL with a seed |
| Real-time presence | Collaboration, multiplayer, live events | M | Liveblocks, Supabase Realtime |
| Physical simulation | Anything about motion, flow, weight | M | Matter.js, Rapier, Motion springs |
| Sound reactive | Audio, music, voice products | M | Web Audio API, meters and waveforms |
| Command palette as the product | Developer tools, power-user apps | S | cmdk-style palette with real actions |

A signature moment must: work on a phone; respond in under 100 ms; degrade to a static poster when JavaScript or WebGL is unavailable; cost less than 10 percent of the performance budget.

Install commands, working code, budgets and fallbacks for the WebGL moments (3D scenes, shader gradients, liquid glass, liquid metal) are in `effects.md`. Read it before building one.

## Copy

- Write from the user's side: name things by what people recognize, not how the system is built.
- Active voice. A control says exactly what happens ("Publish", then "Published").
- Errors say what went wrong and how to fix it, without apology.
- Specific beats clever. Short beats compressed. No "not X, but Y", no colon-then-reveal, no "seamless", "effortless", "powerful", "elevate".
- Headlines are claims or outcomes, not greetings.

## Imagery

- Product screenshots and real UI beat any illustration.
- Generated SVG backgrounds (Haikei, fffuel) and shader gradients beat stock photos.
- Illustrations only from a consistent set, recolored to the tokens.
- 3D only when it is the signature moment.

## Components and kits

- Theme shadcn (or the project's kit) through the tokens before using a single component. The stock look is the tell.
- Pull complex pieces from registries (Watermelon, Magic UI, react-bits, Aceternity) rather than building them, then restyle them to the tokens. One effect from these kits per page, not a collage.
- Prefer the framework's primitives for images, fonts, links and metadata; they carry performance and SEO for free.
