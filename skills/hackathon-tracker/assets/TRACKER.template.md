# Hackathon tracker

<!--
Portfolio tracker kept by the hackathon-tracker skill, in the folder that holds every hackathon project.
Every status is verified on the official page, with the date. Every time is on your clock.
Tags: URGENT (closes or opens within 7 days) · NEXT (within 21 days) · WATCH (waiting on an announcement) · LATER (nothing for 21+ days).
Keep reference numbers, IDs and personal contacts out of this file; link official contact pages instead.
The dates below are examples of the format. Delete guidance comments as you fill.
-->

> Last checked: **{{YYYY-MM-DD}}** ({{n}} of {{m}} statuses verified live on the official pages that day; the rest are marked UNVERIFIED).
> Your clock: {{IANA zone, e.g. Asia/Riyadh (UTC+03:00)}}. Every time below is yours unless marked "official".
> Working set: the {{n}} events in play. Other folders here are past events (Archive) or not tracked (last section).

---

## At a glance: what needs action, in order

| # | Event | Status | Next deadline (your clock) | Action needed |
|---|---|---|---|---|
| 1 | **{{Event}}** ({{organiser}}, {{platform}}) | {{Registered}} | **{{Build starts Fri 6 Nov · submit by Mon 9 Nov 21:29}}** | URGENT: {{prep now: 72 h build window}} |
| 2 | **{{Event}}** ({{organiser}}, {{platform}}) | {{Phase 2 submitted}} | {{Finale shortlist: ESTIMATE 12 to 18 Nov}} | WATCH: {{platform notifications and email; prep the finale pitch}} |
| 3 | **{{Event}}** ({{organiser}}, {{platform}}) | {{Submitted}} | {{Winners Wed 18 Nov 00:00}} | WATCH: {{verify judge sandbox access; do not edit the submission}} |
| 4 | **{{Event}}** ({{organiser}}, {{platform}}) | {{Registered}} | {{Registration closes Wed 18 Nov 21:29}} | NEXT: {{lock the team; draft the Round 1 one-pager}} |
| 5 | **{{Event}}** ({{organiser}}, {{platform}}) | {{Registered}} | {{Round 1 Fri 4 Dec 09:30}} | LATER: {{practice the format in late November}} |

---

## 1. {{Event}}: {{one-line identity}} (URGENT)

- **Organiser:** {{organiser}} · **Platform:** {{platform}} · **Page:** {{official URL}}
- **What it is:** {{format, what is judged, team rules, the one rule that disqualifies}}
- **Timeline** (verified {{YYYY-MM-DD}} from {{page}}; organiser zone {{Asia/Kolkata (UTC+05:30)}}):
  - Registration closes: {{Thu 5 Nov 21:29}} (official {{Thu 5 Nov 23:59 IST}})
  - Build window: {{Fri 6 Nov}} to {{Mon 9 Nov}}
  - **Submission deadline: {{Mon 9 Nov 21:29}}** (official {{Mon 9 Nov 23:59 IST}}) · internal {{Sun 8 Nov 21:29}}
  - Judging: {{10 to 19 Nov}} · results: {{Fri 20 Nov}}
- **Your status:** {{Registered / Submitted at <time> / Shortlisted}}
- **Project folder:** `{{folder}}/` · `{{status: phase=build step=3 next="..."}}`
- **Watch:** {{the official Discord: repo releases, rule clarifications and submission instructions land there}}
- **Prep checklist:**
  - [ ] {{Join the updates channel before the build starts}}
  - [ ] {{Clean repo and CI template ready}}
  - [ ] {{Block the build weekend}}
  - [ ] {{Run brief-decoder in the project folder}}

## 2. {{Event}}: {{one-line identity}} (WATCH)

- **Organiser:** {{organiser}} · **Platform:** {{platform}} · **Page:** {{official URL}}
- **Your status:** {{Phase 1 qualified (results <date>). Phase 2 submitted; window closed <date>.}}
- **What is next:** "{{the page's own words about the next stage}}". {{No date published (page last updated <date>).}} Last edition: {{finale size and format}}. Judging: {{criteria and weights}}.
- **Project state:** {{from the project's BULLSEYE.md: commits, CI, what was delivered and where}}
- **Watch:** {{platform notifications and email}}
- **If shortlisted:**
  - [ ] Re-verify the live demo on the presenting machine, in demo mode
  - [ ] Rehearse the timed pitch (script in the project folder)
  - [ ] Keep video and Drive links public and the repo public

<!-- Repeat one section per event in the working set, in the at-a-glance order. -->

---

## Pending announcements to watch for

| Expected (your clock) | What | Where it lands | Basis |
|---|---|---|---|
| {{12 to 18 Nov}} | {{Finale shortlist and finale date}} | {{Platform notifications, email}} | ESTIMATE: {{Phase 1 closed 2 Oct, results 12 Oct: a 10-day cadence; Phase 2 closed 3 Nov}} |
| {{Before 6 Nov}} | {{Repo release and submission instructions}} | {{Official Discord}} | published |
| {{Wed 18 Nov 00:00}} | {{Winners}} | {{Platform email, event page}} | published |

## Two-track timeline (as of {{YYYY-MM-DD}})

### Track A: results watch (submissions done)

```text
DONE   {{20 Oct}}              {{Event}} submitted · judging {{21 Oct to 12 Nov}}
DONE   {{3 Nov}}               {{Event}} submitted · evaluation in progress
WATCH  {{12 to 18 Nov}}        {{Event}} shortlist: NOT PUBLISHED, estimate from Phase 1 cadence
FIXED  {{18 Nov 00:00}}        {{Event}} winners
TBA    {{late Nov or later}}   {{Event}} finale: {{format}}
```

### Track B: upcoming submissions

```text
{{Event}}   reg closes {{5 Nov}} → starts {{6 Nov}} → SUBMIT by {{9 Nov}} → judging → winners {{20 Nov}}
{{Event}}   reg closes {{18 Nov}} → event {{21 to 22 Nov}} (R1 idea → shortlist → R2 build and pitch) → results TBA
```

## Merged calendar

```text
{{05 to 06 Nov}}  {{Event}} registration closes → build BEGINS {{6 Nov}}
{{09 Nov}}        {{Event}} SUBMISSION
{{12 to 18 Nov}}  {{Event}} shortlist expected (ESTIMATE)
{{18 Nov}}        {{Event}} winners · {{Event}} registration closes
{{21 to 22 Nov}}  {{Event}} build and pitch
{{Nov, TBA}}      {{Event}} finale: COLLISION risk with {{21 to 22 Nov}}. Decide which event gets the weekend.
```

---

## After you submit: rules that keep you eligible

- [ ] No edits after the deadline: video, description, links, repo, sandbox access.
- [ ] Judge access live: sandbox members accepted (not just invited) and kept through judging; test accounts work; the live URL is up (keep-alive on free tiers); production keys in place.
- [ ] Video and Drive links open in a private window.
- [ ] Repo public; the submission commit tagged; later work after the tag under "After the deadline".
- [ ] Secrets that passed through chat rotated, with the deployment updated in the same step.
- [ ] "SUBMITTED {{time}}, under review" and the next gates written in the project; the confirmation saved privately.

## Archive (finished events)

| Event | Dates | Project | Outcome (as announced) | One lesson | Fed into |
|---|---|---|---|---|---|
| {{Event}} | {{dates}} | `{{folder}}/` | {{Top 25, then a judging call for the top 10 / no result announced}} | {{Read platform limits before writing any artefact.}} | {{next project's Decisions / BULLSEYE field note}} |

## Other project folders (not in the tracking set)

{{folder}} · {{folder}} · {{folder}}. Add any of these to the working set if their event is still live.
