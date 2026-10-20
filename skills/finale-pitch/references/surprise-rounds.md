# Surprise-challenge rounds

Some events let teams bring a project they built earlier, then hand each team a challenge at the venue to build into it within fixed hours. The format rewards a project with clean seams and a team that plans before it types. The same discipline serves onsite finales where the brief or its twist is revealed at kickoff.

## Recognize the format

Read the rules for phrases like "pre-developed projects allowed", "mentors hand each team a challenge", "implement into your existing project within 12 hours". Ask the organisers, in writing, what pre-built work may be brought, and disclose everything.

## Before the round: pre-pitch the seams

Use the earlier stage to set up the payoff. One slide, "Hand us any challenge. The crew absorbs it.", lists the seams a challenge will land in, each true in the code today:

- a new agent or module is one file;
- every data provider sits behind one interface;
- a rule is a config line;
- a language is a table;
- every surface reads one API.

Under it, the hour plan you will follow on the day (below). Then make it true before the round: a smoke test that replays the rehearsed scenarios and asserts their numbers, deterministic fixtures, one main branch, and a deck skeleton with empty payoff slides.

> Field note (ORCA · Vibeathon 2026): The Stage 1 deck's slide 11 listed six seams and a 12-hour playbook. In Stage 2 the payoff slide mapped the mentor's challenge onto each promised seam and said the brief's "do nots" held.

## The day

| Hours | Do | Done when |
|---|---|---|
| H0 to 1 | Read the brief twice. Transcribe it verbatim into the plan file. Pick the seam it lands in. Write the plan below and post it to the team. | every brief item has a task in the self-review table |
| H1 to 6 | Build inside the seam. Tests named after the brief's own scenarios. Nothing outside the seam changes. | the scenario tests pass from a clean start with one command |
| H6 to 9 | Wire it into the UI, every language's strings, the spoken or printed output. | each surface shows the new behaviour |
| H9 to 11 | Smoke test green, a demo fixture for the new path, an independent code review of the change. | all old and new checks green |
| H11 to 12 | Rehearse twice, including the old demo. | the old demo is byte-identical; the new one runs from the run-sheet |

Test names that read as the brief's scenarios make the proof slide write itself: `test_scenario_3_missing_marine_data_fails_safe_and_invents_nothing`. An independent review before the deadline earns its time: ORCA's challenge-day review found a path traversal in the bundled server's single-page-app fallback.

## The plan file

Write it to `.claude/plans/<date>-<challenge>.md` (or `CHALLENGE-PLAN.md` when the process files are public) before any code:

```markdown
# <Project> · "<challenge title>"

**Goal:** <what the system does after this change, in two sentences>
**Architecture:** <where the change sits; the contracts it adds>
**Stack:** <unchanged; "No new dependencies.">
**Spec:** the brief, transcribed in Part A.
**Time box:** about <n> h from <start time and timezone>, done by <time>.

## Part A: the brief
### A1. The challenge, in the mentor's words (transcribed)
<title, objective, the one sentence that matters>
| Scenario | Condition | Expected behaviour |
|---|---|---|
**Minimum scope:** <numbered, as written>
**Acceptance (what the mentor checks):** <numbered, as written>
**Show at the end:** <as written>
**Stretch:** <as written>
**Do not:** <as written>
### A2. Before vs after
### A3. Where the change sits
### A4. The demo story, minute by minute

## Part B: the build
### Global constraints
- Every existing test stays green.
- Rehearsed numbers unchanged: <list them>.
- The healthy-path output is byte-identical to today's.
- No new dependencies. No redesign. Nothing the brief says not to do.
### Review focus (inputs the brief implies but does not spell out)
1. <a missing or future timestamp; a crashed component; the language switch; state leaking between tests>
### Task 1: <name>
Files · interfaces produced · tests (named after scenarios) · done when
### Self-review
| Brief item | Task | Test | Deck page |
|---|---|---|---|
```

## The payoff deck

Compress the project and expand the day: "the project in 3, the hackathon day in 11".

1. The project: problem, the system, what it already did.
2. The challenge: the brief scanned, with "What the mentor checks ✓" mirroring each acceptance check.
3. Before vs after.
4. The change, step by step, each step one slide with its guarantee.
5. The drills: the same input under each condition the brief named.
6. Every screen that changed, and the edge cases.
7. Proof: the real test run, with counts before and after.
8. How we built it: a timeline from the git log.
9. Why it fit: each seam the earlier stage promised, and how the challenge landed in it.
10. Try it live, with "What the brief asked us to show ✓ … page N" for every item.

Headlines in two beats: "Before: confident. After: honest." "Brief at 12:05. Shipped by 14:50."

The timeline and the counts come from the repo, never from memory:

```bash
git log --reverse --since="2026-10-10 12:00" --format="%ad  %h  %s" --date=format:"%H:%M"
git rev-list --count <start-commit>..HEAD
git diff --shortstat <start-commit>..HEAD -- . ":(exclude)*.lock" ":(exclude)dist"
git worktree add ../before <start-commit>   # run the old test suite there for the "before" count
```

> Field note (ORCA · Vibeathon 2026): The proof slide showed the real pytest output with backend tests 174 to 284 and frontend tests 703 to 812, measured against the commit just before the gate work began, and the timeline slide was cut from the git log: 12:05 to 14:50, 27 commits.

## Onsite build finales without a surprise brief

The same discipline over 18 to 24 hours:

| Hours | Do |
|---|---|
| H0 to 2 | Re-scope to what is demoable; agree the cut line. Pick a problem within 45 minutes when there is a choice. |
| H2 to 12 | Hello-world deployed by H3. Two streams in parallel (engine, demo surface), integrated every hour; never diverge for more than two hours. |
| H12 to 16 | Integration freeze. Run the metrics. Fix only what the demo path touches. |
| H16 to 20 | Polish the demo path; record the backup video. |
| H20 to 24 | Deck and pitch, rehearsed three times. Submit everything 30 minutes early. |

One pitch owner, one demo owner. The presenter does not pull the all-nighter: sleep in rotating shifts of about two hours so two people are always awake, and give the presenter the last shift before the slot. One hour-by-hour plan simply ended "Presenter sleeps."
