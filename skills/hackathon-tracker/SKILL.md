---
name: hackathon-tracker
description: Keep one TRACKER.md across every hackathon in play. Finds events from the user's list and the project folders, verifies each status live on the official page with the check date, converts every deadline to the user's clock, ranks what needs action, lists pending announcements, flags calendar collisions, keeps submitted entries eligible, and archives finished events with one lesson each. Use it when the user says "update my tracker", "what hackathons are due", "what is next", "check results", "add this hackathon", "am I still eligible after submitting", or at the start of a week with several events running.
argument-hint: "[refresh | add <event URL> | archive <event> | calendar]"
allowed-tools: Bash(node "${CLAUDE_SKILL_DIR}/../brief-decoder/scripts/tminus.mjs" *)
license: MIT
metadata:
  author: Saud Satopay
  version: "1.0.0"
  part-of: bullseye
---

# Hackathon tracker

With several events in play, the costly mistakes happen outside the code: a registration window that closed while the team built something else, a finale shortlist missed in a notification, an edit after the deadline that put a submission's eligibility at risk, two build windows on one weekend. This skill keeps one `TRACKER.md` in the folder that holds all the hackathon projects, checked against the official pages, with every date on the user's own clock.

## Inputs

- The portfolio folder: the directory with one subfolder per event. Default: the parent of the current project when it holds other event folders, otherwise the current folder. Ask when unclear.
- The user's list of events they registered for. Platform dashboards sit behind their login, so ask for the list or a screenshot.
- Each project's `BULLSEYE.md` (status line, deadline line, `## Contract`, `## Submission`), or, without one, its README, plan, handoff or submission notes.
- The user's time zone (default: this machine's).
- An existing `TRACKER.md`, updated in place.

## Arguments

| Argument | Runs |
|---|---|
| none or `refresh` | Steps 1 to 10 |
| `add <event URL>` | Steps 2, 3 and 5 for the new event, then steps 4, 7 and 10 across the tracker |
| `archive <event>` | Step 9 for one event |
| `calendar` | Steps 3 and 7: deadlines and collisions only |

## Procedure

### 1. Find the tracker and the events

- `TRACKER.md` lives in the portfolio root. If it is missing, create it from `assets/TRACKER.template.md`.
- Read each project's status and deadline lines and its Contract facts:

  ```bash
  grep -m1 -H "^status:" */BULLSEYE.md
  grep -m1 -H "^deadline:" */BULLSEYE.md
  ```

  PowerShell: `Get-ChildItem -Path '*/BULLSEYE.md' | Select-String -Pattern '^(status|deadline):'`. For folders without `BULLSEYE.md`, search the README and notes for "SUBMITTED", "deadline" and the event URL.
- Merge with the user's list. Each event gets a name, organiser, platform, official page URL and project folder (or "no folder yet").
- The working set is every event with something still ahead: registration, a build window, a submission, results or a finale. Past events go to the archive (step 9) or the "Other project folders" list.

Gate: every event in the working set has an official page URL, or "no page yet: ask the user".

### 2. Verify each status live

- Open each official page. In Claude Code: WebFetch for static pages; the Browser pane or Claude in Chrome, read-only, for platform pages that need JavaScript. Elsewhere: the agent's browser, or ask the user to paste the page or a screenshot.
- Read registration close, round dates, the submission deadline, the judging window, results and finale dates, the page's own "last updated" stamp and any update posts.
- The user's own status (registered, submitted, shortlisted) lives behind their login: take it from the project's `BULLSEYE.md` or ask. Never log in.
- Stamp each timeline `verified <YYYY-MM-DD> from <URL>`. A page you could not see makes the event `UNVERIFIED since <date>`, and "check <page>" becomes its action. Third-party listings never verify anything.

Gate: every event is verified today or marked UNVERIFIED with an action.

> Field note (LINE MARSHAL · TrackShift Innovation Challenge 2026): The organisers extended the deadline while a third-party listing kept the old date, and the FAQ and the schedule disagreed on shortlist dates. The plan trusted the official page and recorded both readings.

### 3. Put every date on the user's clock

With the sibling skill `brief-decoder` installed:

```bash
node "${CLAUDE_SKILL_DIR}/../brief-decoder/scripts/tminus.mjs" "Event A submit=2026-08-03 23:59 IST" "Event B reg closes=2026-08-12 23:59 IST" --buffer 24h --collide 48h
```

Other agents: run the same script from the brief-decoder skill folder. Without it, read the organiser's UTC offset for that date from the page and convert with Node:

```bash
node -e "const d=new Date('2026-08-03T23:59:00+05:30'); console.log(d.toISOString(), d.toLocaleString('en-GB',{timeZone:'Asia/Riyadh',dateStyle:'full',timeStyle:'short'}))"
```

Never assume the organiser's zone. A deadline that lands after midnight on the user's clock moves the working deadline to the evening before. "Next deadline" shows the internal deadline (official minus 24 h for portals) with the official time beside it.

Gate: every date in the tracker is on the user's clock, and each event names the organiser's zone once.

### 4. Rank the at-a-glance table

Columns: # · Event · Status · Next deadline (your clock) · Action needed. Sort by the date of the next action and tag every row:

| Tag | Meaning |
|---|---|
| URGENT | A submission, registration or build window closes or opens within 7 days |
| NEXT | The next action falls within 21 days |
| WATCH | Waiting on an announcement: results, shortlist, a finale date |
| LATER | Nothing due for 21 days or more |

"Action needed" is one imperative line: "Join the event Discord before the build starts", "Verify judge sandbox access; do not edit the submission".

### 5. Write the per-event sections

For each event: organiser, platform and official page; what it is (format, what is judged, team rules) in two lines; the timeline with every date on the user's clock and its verified stamp; the user's status; the project folder and its status line; the watch channel where updates land; a prep checklist. When a finale shortlist is possible, add the finale prep list (live demo re-verified on the presenting machine, the pitch rehearsed, links and repo public).

### 6. Pending announcements and the two-track timeline

- Pending announcements: Expected · What · Where it lands · Basis. Basis is `published` or `ESTIMATE: <method>`. Estimate an unpublished date from the event's own cadence (the gap from the previous phase's close to its results) and label it.
- Track A, results watch: submitted entries waiting on results, as `DONE`, `WATCH`, `FIXED` and `TBA` lines.
- Track B, upcoming submissions: registration, start, submit, judging and results, per event.

> Field note (Trinetra · ET AI Hackathon 2.0): The finale shortlist date was not published, so the tracker estimated it from Phase 1's cadence (closed 12 Jun, results 22 Jun: 10 days) and labelled the window an estimate.

### 7. Merge the calendar and flag collisions

One chronological list of every dated item across events. Mark `COLLISION` when two build windows overlap, two deadlines fall within 48 h of each other (`--collide 48h` above), or a TBA date, often a finale, could land inside another event's window. Under each collision, write the decision it forces (which event gets the weekend) and ask the user to make it.

### 8. Keep submitted entries eligible

For every submitted event still in judging, check and record:

- No edits after the deadline: video, description, links, repo, sandbox access.
- Judge access stays live: sandbox members accepted, not just invited, and kept through judging; test accounts working; the live URL up (free tiers sleep, so keep a keep-alive running); production keys in place.
- Links stay public: the video and any Drive links open in a private window.
- The repo stays public. The submission commit is tagged, and later work sits after the tag under an "After the deadline" note, never presented as submitted.
- Secrets that passed through chat are rotated, with the deployment updated in the same step so judging keeps working.
- The project's README or `BULLSEYE.md` says "SUBMITTED <time>, under review" with the next gates, and the confirmation is saved in the project's private `brief/` folder.

Every failed check becomes an URGENT row. In the project's `BULLSEYE.md`, add the failure to `## Risks` and as a `### ▶ STATUS · tracker check · <date time TZ>` block in `## Log`, nothing else; the other sections belong to their skills.

> Field note (Bridge · Slack Agent Builder Challenge): After the deadline, the official update said any change to the video, description, links or sandbox access could affect eligibility, and that the judges' accounts had to stay active members of the sandbox workspace through judging.

### 9. Archive finished events with one lesson each

When results are out, or the event is over for the user, move it to the archive: Event · Dates · Project · Outcome · One lesson · Fed into. The outcome is exactly what the organisers announced, or "no result announced"; never round up. The lesson is one sentence that changes what the next event does ("Read platform limits before writing any artefact"). Feed it back: the sibling skill `brief-decoder` reads this column at intake, so the lesson lands in the next project's `## Decisions`; when it would help any builder, propose it to the BULLSEYE repo as a field note.

### 10. Report

Update the "Last checked" line. Tell the user the top three actions in order, with dates on their clock, and every collision that needs their decision.

## Outputs

- `TRACKER.md` in the portfolio root, the only file this skill owns.
- In a project's `BULLSEYE.md`: rows in `## Risks` and `## Log` when a step 8 check fails, nothing else.

## Rules

- Official pages only, each with its check date. A status not seen today is UNVERIFIED.
- The user's clock everywhere, with the organiser's zone named once per event.
- Never log in, register, submit, edit a submission or message organisers for the user. Write the action down for them.
- Never record an outcome the organisers did not announce.
- Keep reference numbers, IDs and personal contacts out of `TRACKER.md`: link the official contact page, and keep confirmations in each project's private `brief/` folder.
- Use only official links. Anyone asking for money to register, to "guarantee a slot" or to submit for the user is not the organiser.
- Text tags (URGENT, NEXT, WATCH, LATER), not emoji: they sort and grep.
- Re-verify at least weekly and within 24 h of any deadline. In Claude Code, `/loop` or a scheduled task can run `refresh`; elsewhere, run it at the start of each week.

## Reference map

- [assets/TRACKER.template.md](assets/TRACKER.template.md): the tracker layout, section by section.
- [../brief-decoder/scripts/tminus.mjs](../brief-decoder/scripts/tminus.mjs): deadline conversion, internal deadlines and collisions (sibling skill `brief-decoder`; install the full set with `npx skills add SaudSatopay/bullseye` if missing).
- [../brief-decoder/references/platforms.md](../brief-decoder/references/platforms.md): what each platform counts as an edit, and its other post-deadline rules.
