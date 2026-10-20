# Flight procedure

Six stages. The missile moves forward only through a gate, and every gate leaves a trace in MISSILE.md so a later session can resume at the same point.

| Stage | Name | Produces | Gate to next |
|---|---|---|---|
| 0 | Recon | Recon report in MISSILE.md; `.missile/recon.json` | Report written |
| 1 | Target lock | PRODUCT.md, DESIGN.md, CLAUDE.md block, Plan and baseline scoreboard in MISSILE.md | User go (unless `go` was passed) |
| 2 | Arm | Arsenal verified; missing critical sensors installed or fallbacks chosen | A working screenshot sensor |
| 3 | Boost | Foundations green; design system; signature moment; features; first deploy | Commands green and a preview URL (or a documented reason there is none) |
| 4 | Guidance loop | Iterations of sense → score → fix until IMPACT, stall or the iteration cap | Verdict IMPACT, or a stall/cap report |
| 5 | Impact | README, OG, metadata, tagged release, final scorecard, handover note | Final scorecard in MISSILE.md |

Effort budget for a full run: Recon and Target lock 10 percent, Arm 5, Boost 40, Guidance 35, Impact 10. If the user gave a deadline, scale the loop's iteration cap, never the Impact stage.

## Stage 0: Recon

New project (empty directory, or `new <idea>` passed):
- Write the idea into `.missile/idea.md` if given. If no idea was given and the directory is empty, ask three questions in one message: what it does, who it is for, what the one moment is that should make people lean in. Keep answers short; a paragraph is enough.
- Skip the recon subagent. Baseline is 0 across the board.

Existing project:
- Delegate to `missile-recon` with the directory, the path to `scripts/recon.mjs`, and any screenshot paths already captured. It returns the Recon report.
- If the working tree is dirty, stop here and ask the user to commit or stash. The missile never works on top of uncommitted changes it did not make.
- Create the working branch `missile/<yyyymmdd>` from the current HEAD.

Both: create `MISSILE.md` from `assets/MISSILE.template.md`, paste the report, add `.missile/` to `.gitignore`.

## Stage 1: Target lock

1. Product: write or refresh PRODUCT.md (one-liner, audience, the three jobs the product does, the signature moment, what is explicitly out of scope). With Impeccable installed, `/impeccable init` produces it; otherwise write it from the idea and the recon.
2. Direction: work through the "three directions" prompt from prompts.md. In an interactive session do it in plan mode; in a headless run do it in your own reasoning and write the result directly. For an existing project with a real design system, extract it into DESIGN.md instead of proposing a new one; only propose a replacement when `design_system` scored 4 or below, and mark the replacement as a Decision for the user.
3. Rubric to plan: work through the "scope cut" prompt the same way. Put the plan in MISSILE.md with acceptance tests and effort.
   Elevation flights: when the measured baseline mean is 7 or above, or the user says the project is already good, the job is elevation, not repair. Protect what works. List under Target as Protected every element the user named and every dimension already at 8 or above, and do not restyle, re-lay-out or re-architect those. Aim the plan at two things only: the lowest-scoring dimensions, and lifting `first_impression` and `motion` from good to exceptional with one signature moment from effects.md that fits the existing design system. Extract the design system into DESIGN.md as it is; propose additions to it, never a replacement. Run the build in `polish` mode so nothing that works is rebuilt.
4. CLAUDE.md: append the block from `assets/CLAUDE.snippet.md` (stack, commands, design rules pointer, definition of done). Never overwrite an existing CLAUDE.md; append under a `## Missile` heading.
5. Baseline scoreboard: for an existing project with a runnable dev server, capture screenshots and run the critic once so the baseline is measured rather than guessed. For a new project, record zeros.
6. Gate: present the target in one screen: one-liner, direction in three lines, signature moment, plan summary with effort, what will not be touched, the iteration cap, and the branch. Ask for go, adjust, or stop. Skip the question when `go` was passed, and say so in MISSILE.md. In a headless run where no question can be asked, stop here with the target printed unless `go` was passed.

## Stage 2: Arm

Follow the arming procedure in arsenal.md. The only hard requirement is a screenshot sensor. Record what was installed and what fell back to a substitute under Decisions in MISSILE.md. Add `.claude/launch.json` from `assets/launch.template.json` when the Browser pane is available so the dev server starts itself. Offer, once, to add the typecheck hook from `assets/settings.hook.json` to `.claude/settings.local.json`; do not add it silently.

## Stage 3: Boost

Order matters. Each step ends with the four commands green and a commit.

1. Foundations. Make `typecheck`, `lint`, `test` and `build` exist and pass. For a new project this is the scaffold from stack.md. For an existing one, fix what is red before touching anything visual; a beautiful page on a broken build scores 4 on `code_health` and cannot ship. If `pnpm install` stops with `ERR_PNPM_IGNORED_BUILDS`, approve the packages it names with `pnpm approve-builds <names>` as stack.md describes, then install again; nothing else works until it does.
2. Design system. Tokens into the theme file, two typefaces through the framework's loader, the kit themed. Screenshot one screen at both widths to confirm the tokens took.
3. Signature moment. Build it on the hero or the primary screen from the matching recipe in effects.md. Static poster fallback first, then the live version. Measure its cost with Lighthouse immediately; if it drops performance under 85, lazy-load it or simplify it now.
4. Screens. Every screen in the plan exists as a laid-out skeleton with real copy and its states, before any feature logic. Judges see screens, not logic.
5. Features. At most three for a new project. Independent features go to `missile-builder` subagents in parallel worktrees, each with the builder prompt from prompts.md, an allowed-paths list and the acceptance test. Merge each branch as it returns; run the four commands after every merge. Dependent or small work stays in the main session.
6. First deploy. `vercel` (preview) when logged in; otherwise note the gap. Record the URL in MISSILE.md.

Crew rules during Boost: commit after every green step; never rewrite history; never push to the user's shared branches; new dependencies get one line of justification in the commit body.

## Stage 4: Guidance loop

Each iteration:

1. Sense. Start the production build (`build` then `start`), or use the preview URL; never sense the dev server. `node '${CLAUDE_SKILL_DIR}/scripts/sense.mjs' <url> .missile/shots/it<N> <routes> --keyboard --perf` covers the screenshots, overflow, console, keyboard walk and 4x CPU numbers in one command; the steps below say what the evidence must contain whichever sensor you use. Capture full-page screenshots of every key screen at 390 and 1440 into `.missile/shots/it<N>/`. Run Lighthouse on the demo route and the heaviest route into `.missile/lh/it<N>/` and summarize with `scripts/lh-summary.mjs`. Run the four commands and save the output to `.missile/checks/it<N>.txt`. Save the browser console of each key screen to `.missile/checks/console-it<N>.txt`. Walk the primary flow with the keyboard only (Tab, Enter, Escape) through the browser sensor and write what happened, including where focus was invisible or trapped, to `.missile/checks/keyboard-it<N>.txt`; Lighthouse cannot see that, and the critic will not score accessibility above 6 without it.
2. Score. Delegate to `missile-critic` with the rubric path, the evidence paths, the previous scorecard and the URL. It returns the scorecard JSON and saves it to `.missile/scorecards/it<N>.json`.
3. Record. `node ${CLAUDE_SKILL_DIR}/scripts/scorecard.mjs <project> .missile/scorecards/it<N>.json` updates the scoreboard, the status line and the iteration log in MISSILE.md.
4. Decide. Verdict IMPACT: go to Impact. Otherwise take the critic's `top_fixes`.
5. Fix. Apply the top fixes, highest value first. Independent fixes with effort M or L go to builders in worktrees; S fixes stay in the main session. Use the installed design skills where they fit (Impeccable polish, review-animations, web-design-guidelines audit, Hallmark gates) and the prompts in prompts.md otherwise. Commit per fix.
6. Loop.

Stop conditions: verdict IMPACT; the iteration cap in MISSILE.md (default 6); or a stall, meaning no dimension improved across two consecutive iterations. On stall or cap, write the remaining gaps and the reason for each under Remaining gaps, then go to Impact anyway so the project ships in its best state.

The critic never sees the builder's narrative, only evidence. That separation is what keeps the scores honest. Do not argue with a score; produce evidence that changes it.

## Stage 5: Impact

1. Story: README from the "README for a judge" prompt; OG image route; titles and descriptions on every route; seed data that shows the product at its best; favicon.
2. Ship: final `vercel` preview (or `--prod` only when the user asked for production); verify in an incognito window at 390 and 1440; tag `v<semver>-missile`.
3. Final sense and score: one more full sensor pass and critic run, recorded as the final column.
4. Handover in MISSILE.md: final scoreboard, what changed (from the git log on the missile branch), what remains with the reason, the exact commands to run it, and the one thing to demo first.
5. Tell the user in one screen: the URL, the score, the top three remaining gaps, and the branch to merge.

## Resuming

If MISSILE.md exists, read its status line and continue from that stage and iteration. Never restart Recon on a project that has a target locked; refresh the recon only if `package.json` or the framework changed. If the user invokes a specific mode (`recon`, `score`, `polish`, `ship`), run only that stage and update the status line accordingly.
