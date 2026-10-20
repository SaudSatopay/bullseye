# {{Project}} · demo run-sheet

The demo driver keeps this open. Every beat has a paste-ready input; never improvise inputs on stage. Rehearse until boring: three times at least after the feature freeze.

<!-- Copied from the finale-pitch skill. Every input below must have been pasted and run on the production build in
     rehearsal, and every Expected line must match what the screen shows today. -->

| | |
|---|---|
| Slot | {{5 min pitch + 3 min Q&A}} · {{onsite / online on <platform>}} |
| Pitch owner · demo driver | {{role or name}} · {{role or name}} |
| Live URL | {{https://...}} · health: {{https://.../api/health}} |
| Local fallback | `{{one command that starts the production build}}` → {{http://localhost:...}} (switch rehearsed: {{yes / no}}) |
| Backup video | {{presenter's phone gallery}} AND {{laptop desktop}} · link: {{unlisted URL}} |
| Network | phone hotspot, not venue Wi-Fi |
| Devices | {{Laptop: projector, driver}} · {{Phone A: the user's view}} · {{Phone B: the second device for the full-loop beat}} |
| Pre-paired backup | {{a deep link or code that skips a fragile setup step, such as pairing or login}} |
| Reset | {{the reset link or button, and what it restores}} |

## Judge five-beat: the 3-minute skeptic's tour

<!-- For the judge who says "show me it's real". Five inputs, in this order, zero setup. -->

**J1 · An unfamiliar case (no input the demo ever used):**
```
{{paste-ready input}}
```
Expected: {{the result on screen, with its number}}. Say: *"{{this exact wording was never in any test; it catches the pattern, not the words}}"*

**J2 · A legitimate case (it does not cry wolf):**
```
{{paste-ready input}}
```
Expected: {{no alarm; the honest green state, never "safe"}}. Say: *"{{one line}}"*

**J3 · An ambiguous input (it asks instead of guessing):**
```
{{paste-ready input}}
```
Expected: {{a question back, no verdict}}. Say: *"{{one line}}"*

**J4 · The mechanic-level insight (the case a keyword system misses):**
```
{{paste-ready input}}
```
Expected: {{the result and the reason only this design finds}}. Say: *"{{one line}}"*

**J5 · One full loop (the effect shows on a second device):**
{{the steps: input on device A → action on the laptop → the change visible on device B}}
Expected: {{the visible change, with its count}}. Say: *"{{one line}}"*

If asked about accuracy: open {{EVAL.md / the proof page}}. Never quote a number without the caveats printed there.

## Golden path

### Beat 1 · {{name}} ({{0:00–0:30}})

Input:
```
{{exact string, file name or click path}}
```
Expected: {{what appears, with the number the screen shows}}
Say: *"{{the line}}"*

### Beat 2 · {{name}} ({{t}})

Input:
```
{{exact input}}
```
Expected: {{result}}
Say: *"{{line}}"*
While it runs ({{about 12 s}}): *"{{the narration for the wait; never wait silently, the pause reads as gravitas if you own it}}"*

### Beat 3 · The contrast: it does not cry wolf ({{t}})

Input:
```
{{a legitimate input}}
```
Expected: {{quiet; no alarm}}
Say: *"{{one line}}"*

### Beat {{n}} · {{a feature that is parked or degraded}} ({{t}})

Say it straight: *"{{what was built, why it is off today, how it comes back}}"*. Do not claim it works today. {{15 seconds; do not linger.}}

### Beat {{n}} · The closer: the judge's own {{phone / inbox / data}} ({{t}})

Say: *"{{Open your inbox. Forward us anything.}}"* Run it live. Ask before touching a judge's data, and keep nothing.
Fallback: hand them a printed card with Beat 1's input and let them paste it.

## If things break

1. Slow or cold: the first request can take {{5 s}} on a sleeping host. Warm it 2 minutes before: open {{URL}} and run Beat 1 once. On stage, narrate over the wait.
2. API dead: switch to the local run, `{{command}}`, and keep going (rehearsed once).
3. A step fails: follow the decision rule in PREFLIGHT.md. Walk the recording or the graph; never bluff a broken step.
4. Everything dead: play the backup video, zero apology, keep narrating over it.
