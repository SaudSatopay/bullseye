---
name: finale-pitch
description: Prepare and run the live round. A pitch script timed to the slot and the jury, a run-sheet where every demo beat has a paste-ready input, the expected result and the line to say, a Q&A bank with honest limits first, a T-15 pre-flight with a decision rule for a broken step, the online-call setup, and the playbook for surprise-challenge rounds. Use when the user says "finale", "live pitch", "demo day", "pitch script", "run-sheet", "Q&A prep", "judging call", "present to the judges", "rehearse the pitch", "mentor challenge" or "surprise round", or when a shortlist email arrives.
argument-hint: "[plan | runsheet | script | qa | preflight | online | challenge | after] [slot minutes]"
license: MIT
metadata:
  author: Saud Satopay
  version: "1.0.0"
  part-of: bullseye
---

# Finale pitch

The live round performs something already built, and it is won before the slot starts: inputs rehearsed until boring, numbers that match the repo, limits said before the jury finds them, and a rehearsed plan for every way the demo can fail. This skill writes four files (RUNSHEET.md, PITCH-SCRIPT.md, QA-BANK.md, PREFLIGHT.md), drills them, runs the day and closes the event out. It also covers rounds where mentors hand over a surprise challenge to build into the project within fixed hours.

## Arguments

| `$ARGUMENTS` | Runs |
|---|---|
| none or `plan` | Steps 1 to 7 in order; step 8 when the format has a surprise challenge |
| `runsheet` · `script` · `qa` · `preflight` · `online` | Step 3 · 4 · 5 · 6 · 7 |
| `challenge` | Step 8, the surprise-challenge playbook |
| `after` | Step 9, after the round |
| a number, such as `5` | The slot length in minutes for step 1 |

## Inputs

- `BULLSEYE.md` (template: [BULLSEYE.template.md](../bullseye/assets/BULLSEYE.template.md)): `## Contract` for the round format (slot length, Q&A length, onsite or online, the jury, required deck), `## Thesis`, the golden path in `## Plan`, `## Claims`, `## Risks`.
- `facts.json`, `CLAIMS.md` and `LIMITS.md` from the sibling skill [prove-it](../prove-it/SKILL.md) (install the full set with `npx skills add SaudSatopay/bullseye` if missing). Every number in the pitch and the answers comes from them.
- The deck (sibling skill `pitch-deck`), the backup video (sibling skill [demo-video](../demo-video/SKILL.md)) and the latest findings from the sibling skill [judge-panel](../judge-panel/SKILL.md).
- The live URL, a local production build that runs without the network, seeded demo data with a reset, and every device that appears in the demo.

## Procedure

### 1. Fit the structure to the slot and the jury

Write the format at the top of PITCH-SCRIPT.md: slot length, Q&A length, onsite or online, jury type, language, deck required or not, demo live or recorded. Then pick the structure:

| Slot | Structure |
|---|---|
| 3 min | 0:20 hook · 0:15 what it is · 1:50 demo in three beats · 0:25 proof · 0:10 close |
| 5 min | 0:45 problem · 0:40 solution frame · 3:00 live demo · 0:35 architecture and honesty · close inside 5:00 |
| about 4:30, one presenter | cold open with a dated number · what it is in one breath · demo acts, one of them THE PROOF (the negative case) · architecture in 60 s with four verbs · close; about 140 words a minute |
| 10 min + Q&A | problem 1:00 · reframe and product 1:00 · demo 4:30 · proof 1:30 · scale and ask 1:30 · close 0:30 |
| 20 min call | problem in one breath (2) · both surfaces end to end (7) · under the hood, live (7) · the point (2) · who did what (2) |

Weight the jury: founders and VCs get the product and the money first (ROI with its basis, the buyer, the wedge); engineers get the mechanism and the failure modes; bankers, regulators and government get governance (maker-checker, audit, a human at the risky step); sponsor judges get what their platform did and honest friction. Jury types, what each rewards and what loses them: [judge-panel personas](../judge-panel/references/personas.md). Openers, closers, word budgets and the ask: [references/pitch-structures.md](references/pitch-structures.md).

Gate: every section has a start time and a length, and they sum to the slot minus at least 15 seconds.

### 2. Assign roles and freeze

- One pitch owner speaks and owns PITCH-SCRIPT.md. One demo driver drives and owns RUNSHEET.md. The speaker never waits for the screen; narration continues over any lag.
- Solo: you are both. Pre-open every tab, use reset and autorun deep links so no beat needs typing beyond its input, and keep the run-sheet in a second window or on paper.
- The presenter does not pull the all-nighter. After the feature freeze the presenter rehearses and sleeps.
- After the freeze, only golden-path and honesty fixes land; anything else waits.

Gate: roles in the header of both files; the freeze time in `## Decisions`.

> Field note (Dhaal · MUJ HackX 4.0): The team declared a feature freeze at hour 12, yet hardening ran until 05:35 with judging at 11:00. A freeze holds only if it is written down with the one exception: golden-path and honesty fixes.

### 3. Write RUNSHEET.md

Copy [assets/RUNSHEET.template.md](assets/RUNSHEET.template.md). Every beat has a paste-ready input in a code block, the expected result with the number the screen shows, and what to say. Never improvise inputs on stage. Rehearse until boring.

- **The judge five-beat**, a 3-minute skeptic's tour for the judge who says "show me it's real": J1 an unfamiliar case no rehearsed input used; J2 a legitimate case (it does not cry wolf); J3 an ambiguous input (it asks instead of guessing); J4 the mechanic-level insight (the case a keyword system misses); J5 one full loop whose effect shows on a second device.
- **A contrast beat** in the main path too: the case where it stays quiet.
- **Latency lines**: for every step that takes more than 3 seconds, the line said while it runs. Never wait silently. The pause reads as gravitas if you own it.
- **The closer**: the judge's own phone, inbox or data when the product allows it, with a printed card holding beat 1's input as the fallback. Ask first, and never keep or screenshot what a judge shares.
- The header holds the devices, the hotspot, the live and local URLs, the backup video's two locations and a pre-paired backup link for any fragile setup step.

Gate: every input was pasted and run in rehearsal on the production build, and every expected result matches today's screen.

### 4. Write PITCH-SCRIPT.md

Copy [assets/PITCH-SCRIPT.template.md](assets/PITCH-SCRIPT.template.md).

- Timed sections with start times. [SQUARE BRACKETS] are actions: do them while speaking, never silently.
- Bold every number with your voice. They are the pitch. Every number comes from `facts.json`; an external statistic carries its date, said out loud when pressed.
- Open on a dated number or the judge's own experience. Close on the ask, or on "Round 1, we promised this. Round 2, it runs." when the event had rounds.
- The demo section names RUNSHEET beat numbers; the slide notes carry the same beats.
- Write an EMERGENCY 90-SECOND CUT and a NUMBERS CHEAT CARD (every number on one card, glanced at before going on).
- Time it aloud. Cut words; never speed up.

Gate: three timed run-throughs after the freeze, each inside the slot, and the 90-second cut timed once.

> Field note (FLOODLIGHT · MUSA CodeX 2026): The Round 2 script ran about 4:30 at 140 words a minute, made the quiet day with zero alerts its own act ("THE PROOF"), opened the free host two minutes early because it sleeps, kept a local run as the fallback, and ended with a 90-second cut and a numbers cheat card. The project had qualified from Round 1.

### 5. Build the Q&A bank and drill it

Copy [assets/QA-BANK.template.md](assets/QA-BANK.template.md) and keep it gitignored.

- Honest limits first: say these before judges find them, each with its roadmap line.
- Every answer in three parts. LIVE: 2 to 5 speakable sentences, the first one answering the question. SHOW: one thing on screen. IF PUSHED: a one-line deeper defense.
- Questions by persona: technical, business, domain expert, sponsor, skeptic, team and process.
- Never quote a number without the caveats printed beside it in CLAIMS.md. Every answer points at something committed: a file, a test, a command.
- What did the AI build? Say it plainly. Judges check that you understand it, so know every row of the build table.
- One dense line of numbers at a glance, re-verified on the day.
- Drill it with the sibling skill [judge-panel](../judge-panel/SKILL.md) (`/bullseye:judge-panel qa`, or `/judge-panel qa` when installed with `npx skills add`): a fresh session asks the bank's questions one at a time and grades each answer against the project's facts. Log every miss in the bank and fix the answer.

Gate: every persona's questions answered aloud in under 30 seconds each, no number without its caveat, every limit said at least once. Answer craft and hostile patterns: [references/qa-craft.md](references/qa-craft.md).

> Field note (CrackWatch · Gappy AI Hackathon 2026): In the top 25, the team prepared for a 20-minute judging call with a brief verified against the code: honest limits to say first, a T-15 pre-flight, a decision rule, one line of numbers and fourteen speakable answers.

### 6. Pre-flight, decision rule and failure drill

Copy [assets/PREFLIGHT.template.md](assets/PREFLIGHT.template.md) and run it at T-15:

- Warm everything 2 minutes before: free hosts sleep, and the first request can take a minute.
- Re-verify the rehearsed numbers on the screen; demo stores keyed to the hour or the date drift.
- Devices on a phone hotspot, not venue Wi-Fi. The local fallback running: a production build, demo mode on (a `DEMO_MODE=1` style flag that serves vetted cached AI output), and no `--reload` (a reloading server restarts on every edit and can die mid-restart).
- Backup video in two places (the presenter's phone and the laptop desktop) and a pre-paired backup link.
- A fresh browser profile or a cleared cache, with `index.html` served `no-store`, so no stale bundle reaches the stage.
- Decision rule: newest run COMPLETED → demo live; FAILED → walk the graph on the recording; never bluff a broken step.
- Failure drill, rehearsed once end to end: slow → narrate; API dead → switch to the local run; everything dead → the backup video, zero apology, keep narrating.

Gate: the drill was rehearsed once, including the switch to the local run and to the video.

> Field note (ORCA · SIH 2026): A stale browser tab once showed the previous day's bundle on stage. The fix was serving `index.html` with `no-store`, so every load fetches the current build.

### 7. Online judging

- Share the Chrome tab, not the window, with "Also share tab audio" on; a shared window sends no sound.
- A second monitor holds notes only: the run-sheet and your own printed bank. Nothing listens to the call.
- Test the setup the day before on the same platform with a teammate: screen-share permission (macOS asks for Screen Recording and needs a browser restart), camera, mic, who shares, the meeting link.
- Zoom the browser to about 125% so text survives compression; close other tabs; notifications off.
- Paste the live URL into the chat so judges can click it, and keep the deck as a PDF in a tab as the fallback.

Gate: a full dry run on the same platform, with sound, the day before.

### 8. Surprise-challenge rounds

When mentors hand each team a challenge to build into its existing project within fixed hours:

- **Before the round:** in the earlier stage, pre-pitch the seams the challenge will land in (a new agent is one file, a rule is a config line, a language is a table) and the hour plan. "Hand us any challenge. The crew absorbs it."
- **H0 to 1:** read the brief, transcribe it verbatim into a plan file, pick the seam it lands in, post the plan with a brief-to-task table and global constraints: rehearsed numbers unchanged, healthy-path text byte-identical, no new dependencies.
- **H1 to 6:** build inside the seam with tests named after the brief's scenarios; the rest of the project stays untouched.
- **H6 to 9:** wire it into the UI and every language's strings.
- **H9 to 11:** smoke test green, plus a demo fixture for the new path.
- **H11 to 12:** rehearse twice. The old demo stays byte-identical.
- **The deck pays off seam by seam:** the brief with "what the mentor checks", before and after, the drills, edge cases, real test output with counts before and after, a timeline slide from the git log (brief at 12:05, shipped by 14:50, commits, lines, tests), and "What the brief asked us to show ✓ … page N".

Gate: every item in the brief maps to a task, a test and a page. Plan skeleton and deck structure: [references/surprise-rounds.md](references/surprise-rounds.md).

> Field note (ORCA · Vibeathon 2026): The Stage 1 deck promised the seams and a 12-hour playbook; in Stage 2 the mentor's safety-gate brief arrived at 12:05 and shipped by 14:50: 27 commits, 3,213 product lines and 219 new tests, with the healthy demo untouched.

### 9. After the round

- Do not edit the submission after the deadline. Later work goes after a tag, under an "After the deadline" note.
- Keep judge access alive until results: sandbox invites, logins, the deployed URL, keep-alive for free tiers.
- Thank sponsors and mentors with specifics: what you used, what broke, the one feature you would ask for. Credit any team whose finding helped you.
- Rotate every secret that passed through chat or appeared on screen.
- Record the outcome exactly as announced and one lesson in TRACKER.md with the sibling skill [hackathon-tracker](../hackathon-tracker/SKILL.md) (`archive <event>`).

Gate: the tracker holds the outcome and the lesson, and the status line in BULLSEYE.md reads `phase=done`.

## Outputs

- `RUNSHEET.md`, `PITCH-SCRIPT.md`, `QA-BANK.md`, `PREFLIGHT.md` in the project root; in a surprise round, a plan file such as `.claude/plans/<date>-<challenge>.md`. Print the run-sheet and the numbers cheat card.
- Git: QA-BANK.md is always gitignored. The others follow the process-file policy recorded in BULLSEYE.md (private by default).
- `BULLSEYE.md`: status `phase=finale` with the next action; `## Decisions` (structure, roles, freeze time); `## Risks` (each live-demo risk with its mitigation); a `▶ STATUS · rehearsal` block in `## Log` per run-through (time, misses, fixes); `## Handoff` rewritten before the slot; after the round, `phase=done` and the outcome.

## Rules

- Never improvise inputs on stage. Rehearse until boring.
- Never bluff a broken step: walk the recording and say what it shows.
- Never quote a number without its caveat, and never claim what has no committed file, test or command behind it.
- Say the honest limits before the judges find them.
- No AI answers judges live. The bank is rehearsed, not consulted by a listening assistant: a hidden assistant can break the event's rules and the judges' trust. If an assistive tool is used during judging (captions, translation, accessibility), disclose it and follow the event's rules.
- After the freeze, only golden-path and honesty fixes. The presenter sleeps.
- In a surprise round, the old demo stays byte-identical and every rehearsed number stays true.
- Ask before using a judge's phone or data, and keep nothing.
- Do not edit the submission after the deadline.

## Reference map

| File | Use it for |
|---|---|
| [references/pitch-structures.md](references/pitch-structures.md) | Structures per slot length and jury type, openers, closers, word budgets, the ask |
| [references/qa-craft.md](references/qa-craft.md) | Answer formats, hostile question patterns and answer shapes, concede then pivot, numbers and caveats, delivery in the room |
| [references/surprise-rounds.md](references/surprise-rounds.md) | The challenge-round playbook: pre-pitch, the time-boxed plan skeleton, the 12-hour schedule, the payoff deck |
| [assets/RUNSHEET.template.md](assets/RUNSHEET.template.md) | Exact inputs, expected results and lines, the judge five-beat, "If things break" |
| [assets/PITCH-SCRIPT.template.md](assets/PITCH-SCRIPT.template.md) | The timed script with actions, the 90-second cut, the numbers cheat card |
| [assets/QA-BANK.template.md](assets/QA-BANK.template.md) | Honest limits, numbers at a glance, the AI build table, questions by persona, the rehearsal log |
| [assets/PREFLIGHT.template.md](assets/PREFLIGHT.template.md) | T-60, T-15 and T-2 checks, the decision rule, the failure drill, the online setup |
