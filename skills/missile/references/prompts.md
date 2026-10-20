# Prompt library

Prompts the missile hands to subagents, skills or itself. Fill the angle-bracket slots. Keep them; they encode the sequence that works.

## Target lock

**Three directions (plan mode, ultrathink)**
> ultrathink. Read PRODUCT.md, MISSILE.md and the recon report. Propose three distinct visual directions for this product. For each: the audience feeling in one word, palette (five OKLCH tokens), type pairing (display, body, mono) with the reason it fits this subject, the hero concept, the signature moment from design-rules.md, and one risk. Recommend one for a first-time visitor with two minutes, then write it into DESIGN.md as the single source of truth: tokens, type, spacing, motion budget, banned looks, and the signature moment spec.

**Scope cut (plan mode)**
> Read MISSILE.md. Define the smallest set of changes that moves every dimension of the rubric to 9 or above. Group them into: foundations (commands green), design system, signature moment, features (at most three for a new project), states and copy, accessibility and performance, story, ship. For each item: acceptance test in one line, effort S/M/L, files touched. Put the list under Plan in MISSILE.md.

## Design system stage

**Craft the main screens**
> Build <screen list> from DESIGN.md. Tokens only; no literal colors in components. Real copy from PRODUCT.md. The hero carries the signature moment: <spec>. Every screen has its loading, empty and error state designed, not stubbed. Then capture 390 and 1440 screenshots and critique your own result against design-rules.md before reporting.

**With Impeccable installed**
> /impeccable craft: <same brief as above>. Follow with `/impeccable critique`, apply, then one `/impeccable bolder` if the result plays it safe.

**Motion pass**
> Use the animate skill (or the motion budget in design-rules.md). Add one page-load sequence to the hero, 600 to 900 ms total, staggered, transform and opacity only, honoring prefers-reduced-motion. Add hover and focus states to every interactive element at 120 to 240 ms. Nothing else moves yet.

## Build stage

**Builder task (one per worktree)**
> Implement <feature> end to end. Read DESIGN.md and CLAUDE.md first. Write the acceptance test, make it pass, keep every visual decision on the tokens, and stop when typecheck, lint, test and build are green. Stay inside <allowed paths>. Do not add dependencies without noting why in your report. Report: branch, commits, files, command output, screenshot path if a browser tool is available, anything left.

**Ralph loop**
> /ralph-loop "Make all tests in <path> pass without changing the tests; keep the UI on the tokens in DESIGN.md" --max-iterations 20 --completion-promise "ALL TESTS PASS"

## Polish stage

**Audit pass**
> Run the web-design-guidelines review on <src>. Fix every accessibility and UX finding in place. Then review the motion on the demo path against the motion budget and fix durations, easing and reduced-motion handling. Capture 390 and 1440 screenshots of <screens> and show before and after.

**States and copy**
> For every screen in <list>, enumerate loading, empty, error and success states and design the missing ones using the tokens. Rewrite all copy from the user's side: headlines as claims, buttons as outcomes, errors as instructions. No placeholder text remains.

**Performance**
> Read <lighthouse summary>. Apply the opportunities in order of savings: lazy-load the hero effect behind a static poster, size and compress images through the framework's image component, self-host fonts, remove unused dependencies. Re-run Lighthouse and report the before and after numbers.

## Ship stage

**README for a judge**
> Write the README for someone with two minutes: hero screenshot (1200 by 630, from <shot path>), one-sentence pitch, what it does in three bullets, how it works with a Mermaid diagram, the stack with versions, run steps verified from a fresh clone, and credits. Then generate the OG image route from the design tokens and set titles and descriptions on every route.

**Bug bash**
> Using the browser sensor against <url>, walk every route as a first-time user on desktop and at 390 px. Report every console error, broken link, layout overflow and dead end as a table with severity. Fix P0 only, one fix per commit, and re-verify each with a screenshot.

## Critic delegation (main session to missile-critic)

> Score iteration <n> of <project> against the rubric at <rubric path>. Evidence: screenshots in <dir> (files: <list>), Lighthouse summaries <files>, command output <file>, previous scorecard <file>. Product URL <url>. Screens reviewed: <routes>. Return the scorecard JSON exactly as the rubric specifies, save it to <path>, then a short note on the three biggest blockers. You did not build this; judge it.
