# {{Project}} · pre-flight

<!-- Copied from the finale-pitch skill. Print it. Run T-15 even when everything worked an hour ago. -->

Slot: {{date, time and timezone}} · {{room or call link owner}} · speaker {{role}} · driver {{role}}

## The day before

- [ ] Full dry run on the real setup: the projector or the call platform, with sound
- [ ] Failure drill rehearsed once: switch to the local run, then to the backup video
- [ ] Backup video on the presenter's phone AND the laptop desktop; the unlisted link opens logged out
- [ ] Printed: RUNSHEET.md, the numbers cheat card, Beat 1's input on a card for the closer's fallback
- [ ] Feature freeze holding: only golden-path and honesty fixes since {{time}}
- [ ] The presenter is off the build and asleep tonight

## T-60

- [ ] Laptop, phones and hotspot charged; chargers, adapter for the projector, extension lead
- [ ] Notifications off on every device (Do Not Disturb, Focus); chat apps closed
- [ ] A clean browser profile: no personal tabs, bookmarks bar hidden, zoom set ({{100%}} onsite, about 125% on a call)
- [ ] Every demo device on the phone hotspot, not venue Wi-Fi

## T-15

- [ ] Warm everything 2 minutes before the slot: open {{live URL}} and run Beat 1 once (free hosts sleep; the first request can take a minute)
- [ ] Re-verify the rehearsed numbers on screen: {{list them}} (demo stores keyed to the hour or the date drift)
- [ ] Reset the demo state: {{reset link or button}}
- [ ] Local fallback running and reachable: `{{command}}` → {{localhost URL}} (production build, demo mode on, no `--reload`)
- [ ] Fresh tab or cleared cache; `index.html` served `no-store`, so no stale bundle reaches the stage
- [ ] Pre-paired backup link open in a background tab: {{link}}
- [ ] One throwaway run of every beat that touches a live service
- [ ] Newest run status checked: `{{command}}` → {{COMPLETED / FAILED}}

## Decision rule

**Newest run COMPLETED → demo live. FAILED → walk the graph on the recording. Never bluff a broken step.**

Record which one you chose here: {{live / recording}} at {{time}}.

## T-2

- [ ] Run-sheet open for the driver; the script's first line ready for the speaker
- [ ] The first screen of the demo already on the projector or the shared tab
- [ ] Water; phones silent

## Failure drill (on stage)

1. Slow: keep narrating over the wait. The pause reads as gravitas if you own it.
2. API dead: switch to the local run and continue from the same beat.
3. One step fails: say what it does, show it on the recording, move on. Never bluff a broken step.
4. Everything dead: play the backup video, zero apology, keep narrating over it.

## Online judging

- [ ] Present the Chrome TAB with "Also share tab audio" on; a shared window sends no sound
- [ ] Second monitor for notes only: the run-sheet and your own printed bank; nothing listens to the call
- [ ] Screen-share permission granted and tested (macOS: Screen Recording, then restart the browser); camera and mic tested
- [ ] Who shares, who speaks, who answers which questions: agreed
- [ ] The live URL ready to paste into the chat; the deck as a PDF in a tab as the fallback

## After the round

- [ ] No edits to the submission after the deadline; later work goes after a tag, under "After the deadline"
- [ ] Judge access kept alive until results: invites, logins, the deployed URL, keep-alive for free tiers
- [ ] Every secret that passed through chat or appeared on screen rotated
- [ ] Thanks sent to sponsors and mentors with specifics: what you used, what broke, the one feature you would ask for
- [ ] Outcome (exactly as announced) and one lesson recorded in TRACKER.md; BULLSEYE.md status set to `phase=done`
