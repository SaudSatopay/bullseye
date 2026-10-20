# The 10/10 target

Ten dimensions, each scored 0 to 10 by the critic from evidence only: screenshots, metric files, command output, code excerpts. A score without a pointer to a pixel, a number or a file is not a score.

## Verdict

- **IMPACT**: every dimension at 9 or above and the mean at 9.5 or above. The missile stops and ships.
- **CONTINUE**: anything else. Return the top fixes ordered by (10 − score) × demo-path weight ÷ effort. Demo-path weight is 2 for anything a first-time visitor meets in the first minute, 1 otherwise.
- **Unmeasured**: a dimension the sensors could not observe gets `"score": null` and an `"unmeasured"` reason. For the mean, carry the previous score, or 5 if there is none. The same dimension unmeasured twice in a row is a sensor failure; fix the sensor before the product.

## Scale (applies to every dimension)

| Score | Meaning |
|---|---|
| 10 | Would be shown as the reference example. Evidence at both 390 px and 1440 px for visual dimensions. Nothing left to fix. |
| 9 | One small nit a reviewer would forgive. |
| 7–8 | Competent. A professional would change two or three things. |
| 5–6 | Works, but reads as generated or unfinished. |
| 3–4 | Broken in places, or clearly the default template. |
| 0–2 | Missing. |

Calibration: most first drafts score 4 to 6 on the visual dimensions. A 9 is earned, and a 10 is rare. When in doubt between two scores, give the lower one and say what would earn the higher.

## Dimensions

### 1. `first_impression` — thesis and signature moment
Within five seconds a stranger knows what this is, who it is for, and feels one thing. One signature interaction exists and is flawless.
- Sensors: hero screenshots at 390 and 1440; the five-second test (look only at the first viewport); the signature moment exercised in a cold browser profile.
- 10: the headline states the thesis in plain words; the hero shows the product or the moment, never a stock image; the signature interaction responds in under 100 ms and degrades gracefully without JavaScript or WebGL.
- 7: clear headline, safe hero, no moment.
- 4: "Welcome to X", a template hero, or a moment that stutters or blocks the page.
- Fixes: rewrite the headline as a claim; replace decoration with the product; pick one moment from design-rules.md and delete the rest.

### 2. `design_system` — tokens, type, color
Every color, size, radius and font comes from a token layer, and the choices read as intentional.
- Sensors: the theme file (Tailwind `@theme`, CSS custom properties, or theme config); font loading code; screenshots of three different screens side by side.
- 10: one token source; two typefaces with clear roles (display, body) plus a mono where data appears; a type scale; neutrals with a hue bias; one accent used sparingly; semantic colors separate from the accent; dark mode designed rather than inverted, if the product has one.
- 7: tokens exist but the look is still recognizably a stock kit; or a good look with hard-coded values scattered through components.
- 4: default shadcn or Bootstrap look, Inter everywhere, gradient text, purple-to-blue.
- Fixes: write the `@theme` block from design-rules.md; load two faces with real roles; sweep hard-coded values into tokens; kill the gradient.

### 3. `layout` — hierarchy and responsiveness
The eye knows where to go, and it works on a phone.
- Sensors: full-page screenshots at 390 and 1440 for every key screen; `document.documentElement.scrollWidth > innerWidth` check; text measure.
- 10: no horizontal overflow at 390; a visible grid; consistent spacing rhythm; repeated elements identical in edges and padding; running text between 45 and 75 characters; nothing clipped.
- 7: clean desktop, a few cramped or over-wide spots on mobile.
- 4: overflow, overlapping elements, centered everything, cards on everything.
- Fixes: `min-width: 0` on flex and grid children with text; gap instead of margins; max-width on prose; stack to one column below 640 px; card styling only for the one element that needs it.

### 4. `motion` — purposeful motion
Motion explains or delights, never decorates.
- Sensors: a screen recording or sequential screenshots of page load and key interactions; a search for animation code and its durations; `prefers-reduced-motion` handling; frame timing from the Chrome DevTools trace if available.
- 10: one orchestrated page-load sequence under one second, on the hero only; UI transitions 120 to 300 ms with ease-out entrances; hover and focus states on every interactive element; transform and opacity only; reduced motion honored; no jank at 4x CPU throttling.
- 7: tasteful but sparse, or a hero animation that runs long.
- 4: scattered scroll effects, bouncing, motion on every element, or no motion at all on a page that calls for it.
- Fixes: apply the motion budget in design-rules.md; remove scroll-triggered effects outside the landing page; add a reduced-motion media query.

### 5. `ux_completeness` — states, flows and copy
Nothing dead-ends, nothing is empty, every word was chosen.
- Sensors: walk the primary flow as a first-time user; screenshots of loading, empty, error and success states; form submission with bad input; copy read aloud.
- 10: skeletons or optimistic UI for loading; designed empty states that say what will appear and how to start; errors that say what went wrong and how to fix it; forms validate inline; primary action obvious on every screen; copy is specific, active and short; no placeholder text anywhere.
- 7: main flow polished, secondary states generic.
- 4: spinners, blank empties, "Something went wrong", lorem ipsum, "Get started" everywhere.
- Fixes: enumerate every state per screen and design the missing ones; rewrite copy from the user's side; give each screen one primary action.

### 6. `accessibility` — operable by everyone
- Sensors: Lighthouse accessibility score; keyboard walk of the primary flow (Tab, Enter, Escape); focus visibility in screenshots; contrast of body text and accent-on-background; landmarks and labels in the DOM.
- 10: Lighthouse accessibility 95 or above with no serious findings; the full flow works with a keyboard; focus rings visible on the brand palette; body text at WCAG AA (4.5:1) and large text at 3:1; landmarks, alt text and labels present; reduced motion and color scheme preferences honored.
- 7: score 90 or above, one or two keyboard traps or unlabeled controls.
- 4: score under 80, no visible focus, icon buttons without names.
- Fixes: semantic elements before ARIA; `:focus-visible` styles from the accent; label every control; fix contrast in the token layer so it fixes everywhere.

### 7. `performance` — fast on a phone
- Sensors: Lighthouse mobile run on the demo route and the heaviest route; bundle sizes from the build output; network waterfall for the hero.
- 10: Lighthouse performance 90 or above on mobile; LCP under 2.5 s; CLS under 0.1; TBT under 200 ms; images through the framework's image component; fonts self-hosted with `display: swap` or the framework's font loader; hero effects lazy-loaded and budgeted; no render-blocking third-party scripts.
- 7: 80 to 89, one heavy asset.
- 4: under 70, layout shift on load, a hero that ships megabytes.
- Fixes: read the Lighthouse opportunities in order; lazy-load the 3D or WebGL hero behind a static poster; compress and size images; drop unused dependencies.

### 8. `code_health` — trustworthy build
- Sensors: typecheck, lint, test and build commands; browser console on every key screen; git log.
- 10: all four commands pass; tests cover the critical path; zero console errors or warnings on key screens; error boundaries around risky UI; environment variables documented in `.env.example`; commits small and descriptive; no dead code left over from iterations.
- 7: green build with warnings, thin tests.
- 4: red typecheck or lint, console errors, no tests, secrets in the repo.
- Fixes: make the four commands pass before anything visual; delete what the iterations left behind; write the three tests that protect the demo path.

### 9. `story` — the product explains itself
- Sensors: README rendered on GitHub; the URL pasted into a chat (OG image and title); page titles and meta on each route; the seed data.
- 10: README opens with a hero screenshot or GIF, a one-sentence pitch, what it does, how it works, how to run it from a fresh clone (verified), the stack, and credits; every route has a real title and description; an OG image renders from the design tokens; the seed data tells a story with real-sounding names and numbers.
- 7: solid README, missing OG or thin meta.
- 4: scaffold README, "Create Next App" titles, lorem data.
- Fixes: write the README for a judge with two minutes; generate the OG image route; seed data that shows the product at its best.

### 10. `shipped` — live and reproducible
- Sensors: the deployed URL opened in an incognito window and on a phone; the build log; a fresh clone plus install plus dev.
- 10: a live URL that works in incognito and on mobile; environment variables set on the host; preview per branch; analytics or error tracking wired (optional but counts); a tagged release; a fresh clone runs with the README steps.
- 7: live but only on localhost-like setups, or missing envs on the host.
- 4: not deployed, or deployed and broken.
- Fixes: deploy a preview now, not later; set the envs on the host; tag the release.

## Scorecard JSON

The critic returns exactly this shape. `scripts/scorecard.mjs` validates it and updates MISSILE.md.

```json
{
  "iteration": 1,
  "timestamp": "2026-10-01T12:00:00Z",
  "url": "http://localhost:3000",
  "screens_reviewed": ["/", "/app"],
  "scores": {
    "first_impression": { "score": 6, "evidence": "shots/it1/home-390.png: headline is 'Welcome to Acme'; no moment", "fixes": ["Rewrite headline as a claim", "Add the live transformation moment above the fold"] },
    "design_system": { "score": 5, "evidence": "globals.css has no @theme; Inter only; violet-600 accent", "fixes": ["Write the @theme block", "Load Bricolage Grotesque for display"] },
    "layout": { "score": null, "unmeasured": "no 390 px screenshots were provided", "fixes": [] },
    "motion": { "score": 4, "evidence": "...", "fixes": [] },
    "ux_completeness": { "score": 5, "evidence": "...", "fixes": [] },
    "accessibility": { "score": 7, "evidence": "lh-home.json accessibility 0.91; icon buttons unnamed", "fixes": [] },
    "performance": { "score": 8, "evidence": "lh-home.json performance 0.86, LCP 2.9 s", "fixes": [] },
    "code_health": { "score": 6, "evidence": "typecheck green, lint 12 warnings, 0 tests", "fixes": [] },
    "story": { "score": 3, "evidence": "README is the scaffold default", "fixes": [] },
    "shipped": { "score": 2, "evidence": "no deployment found", "fixes": [] }
  },
  "top_fixes": [
    { "dimension": "first_impression", "fix": "Rewrite the headline as a claim and build the live transformation moment", "effort": "M", "files": ["src/app/page.tsx"] },
    { "dimension": "design_system", "fix": "Write the @theme block and load two typefaces", "effort": "M", "files": ["src/app/globals.css", "src/app/layout.tsx"] }
  ]
}
```

Rules for the critic:
- Every `evidence` string names a file, a screenshot path or a number.
- `fixes` are imperative sentences a builder can act on without asking questions.
- `top_fixes` has three to seven entries, ordered by the verdict formula, each with an effort of S (under 30 min), M (under 2 h) or L.
- Do not repeat a fix that a previous iteration already applied unless the evidence shows it did not work; say so.
