# {{Project}} · demo video script

<!-- Copied from the demo-video skill (assets/VIDEO-SCRIPT.template.md) to docs/demo-script.md.
     This file is the single source for the video: voiceover.py reads the beat table and the Say/Show table.
     Keep it in the repo. Fill every {{placeholder}}; voiceover.py refuses to run while one is left in the beat table. -->

| Rule | Value |
|---|---|
| Cap and target | {{3:00}} hard cap · target {{2:50}} (the cap minus 10 seconds) |
| Format and size | {{MP4, H.264, 1080p}} · size cap {{none / 50 MB}} |
| Hosting | {{YouTube unlisted / Drive "Anyone with the link" / direct upload}} |
| Required content | {{audio · captions · sponsor tool on screen · session IDs · deployed URL}} |
| Language | {{English; captions burned in / attached}} |
| Record against | {{https://...}} <!-- a production build or the deployed URL, never a dev server --> |
| Capture route | {{A: record-demo.mjs with video/beats.json / B: OBS by hand}} |
| Voice | {{human: who reads / TTS: edge-tts voice name}} |

## The argument

{{One sentence: here is a problem you have, here is why you can't fix it the usual way, here is it not happening.}}

Highlights, the frames that must be perfect: {{the money shot at m:ss}} · {{the contrast at m:ss}}

## Beat sheet

<!-- Time is the voiceover window for the beat. Write numbers as the narrator says them and add their display form to
     the Say/Show table. Source names the facts.json key or the command that measured the number. Use (none) in the
     Voiceover cell for a silent beat. Hook in the first 10 seconds; close on the live URL. -->

| # | Time | On screen | Voiceover | Source of every number |
|---|---|---|---|---|
| 1 | 0:00–0:10 | {{the calm state; no cursor movement}} | {{the hook: the viewer's own problem, with one number}} | {{facts.json key}} |
| 2 | 0:10–0:20 | {{the name and one line on screen}} | {{This is <name>. It <does what> for <whom>.}} | |
| 3 | 0:20–0:45 | {{input 1 typed or pasted; the result appears}} | {{what just happened, in plain words}} | {{facts.json key}} |
| 4 | 0:45–1:20 | {{the money shot; hold it a full beat}} | {{why this frame matters, then silence}} | {{facts.json key}} |
| 5 | 1:20–1:45 | {{the contrast: the case where it stays quiet, refuses or the naive version fails}} | {{the line that shows it does not cry wolf}} | |
| 6 | 1:45–2:10 | {{the mechanism, shown: one trace, one terminal run or one panel}} | {{how it works, in one sentence}} | |
| 7 | 2:10–2:35 | {{proof: measured numbers on screen with their source}} | {{the numbers, said exactly as measured}} | {{facts.json keys}} |
| 8 | 2:35–2:50 | {{close: the live URL on screen}} | {{<Name>. Try it at <name> dot <domain>.}} | |

Spoken words: {{total}} (about 150 a minute; 330 to 380 fit 2:50 with room for silence).

## Inputs to paste, in this order

1. `{{exact input for beat 3}}`
2. `{{exact input for the contrast beat}}`

## Deep links

- `{{https://app.example.com/?demo=reset}}`: back to the seeded state
- `{{https://app.example.com/run?autorun=1}}`: starts the run on page load (add `&fast=1` for rehearsal only)

## Say and show

<!-- voiceover.py reads this table: the voice says the left column, the captions show the right column. -->

| Say (voiceover) | Show (captions) |
|---|---|
| {{ninety-eight percent}} | {{98%}} |
| {{name dot domain}} | {{name.domain}} |

## Requirement to beat map

<!-- Fill when the brief or the rules list what the video must show. Judges look for these. -->

| Requirement, as written | Beat |
|---|---|
| {{requirement}} | {{#}} |

## Short cut ({{2:00}})

Drop beats {{#, #}}. Compress beat {{#}} to one line: "{{line}}". Everything else stays.

## Before you record

- [ ] Recording against the production build or the deployed URL; dev indicators off
- [ ] Reset demo done; seeded data in place; the hero case untouched
- [ ] Every beat run once to warm caches, models and fonts
- [ ] Model quota fresh (record early in the day); eval run so the proof page shows numbers
- [ ] Browser 1280 to 1920 px wide at 100% zoom, full screen, bookmarks bar hidden, a clean profile
- [ ] Notifications off (Do Not Disturb or Focus); chat apps closed; no personal tabs, avatars or autofill
- [ ] Terminal at 16 pt or larger, high contrast, history cleared; `NO_COLOR=1` if colours render badly
- [ ] Every command dry-run once (the first run pays connection setup)
- [ ] Deep links open; the exact inputs are ready to paste
- [ ] Required content ready (sponsor tool, session IDs, the deployed URL in the address bar)
- [ ] Mic checked in a quiet room (human voice); OS shortcuts known (Ctrl+K on Windows, Cmd+K on macOS)
- [ ] `voiceover.py docs/demo-script.md --dry-run` exits 0

## After you record

- [ ] Length under the cap: {{m:ss}} against a target of {{2:50}}
- [ ] QA from the skill's step 8: streams, full decode, loudness -16 to -14 LUFS, true peak -1 dBTP or lower
- [ ] Contact sheet and seams checked: no dev indicator, personal data, notification or blank frame
- [ ] Every number on screen and in the voice matches facts.json
- [ ] Watched once muted and once on a phone; captions readable
- [ ] Master 1080p and share copy 720p exported; thumbnail ready
- [ ] The owner uploaded it unlisted; the link plays to the end logged out, in an incognito window
- [ ] Link pasted into SUBMISSION.md and BULLSEYE.md; no placeholder left
- [ ] Backup copies on the presenter's phone and the laptop desktop

## If something hiccups

- A click misfires or a line is fluffed: keep going, redo the gesture or the sentence, and cut it in the edit. Do not restart the take.
- A model throttles mid-take: the failover or the friendly retry message is part of the reliability story; mention it, or retake that beat only.
- A step is slow: record it in real time and speed it up in the edit with a visible speed badge.
- The deployed URL breaks: record the beat on a local production build and say so in the description.
- A second take: Reset demo, then run again; seeded data makes every take identical.
- Keep beats as separate clips; the money shot and the contrast are the ones worth a second take.

## Delivery notes

- {{The money moments: pause half a beat after each and let the screen talk.}}
- Say the numbers as written in the beat table; they are the pitch.
- {{Pronunciation reminders for names, acronyms and the URL.}}
