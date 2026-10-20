# {{Project}} · {{60}}-second film storyboard

<!-- Optional and heavy. Copy to film/STORYBOARD.md only after the demo video is done. Read references/film.md first. -->

{{1920×1080}}, {{30}} fps, {{1,800}} frames, H.264 and AAC. Engine: {{Remotion composition / canvas renderFrame(t) / HTML motion graphic}}.

## What the film is about

{{Two or three sentences of product truth: what it is, who it is for, the one thing it does that nothing else does.}}

Show only what is implemented, never fabricate screens. Every product scene is a real capture of {{https://...}}, taken by {{capture script}} on {{date}}. Every number on screen comes from {{facts.json / the recorded run / the deck's data files}}.

## Design system

<!-- Take every value from the app's tokens; the film is one more surface of the same brand. -->

| Token | Value | Use |
|---|---|---|
| Background | {{value}} | ground, a gradient at most |
| Ink | {{value}} | type and highlights |
| Accent | {{value}} | the one accent: the flow, the live thing, the fix |
| Critical | {{value}} | the break, the overload, the failure |
| Display type | {{family and weights}} | headlines and numbers |
| Body type | {{family}} | captions |
| Mono | {{family}} | code, timings, labels |

Motion rules:
- One idea on screen at a time. Type holds at least 30 frames.
- Every move eases out ({{cubic-bezier(.16,1,.3,1)}}) with no bounce. No rotation for its own sake.
- Crossfade between scenes; never dip to black mid-film.
- It works muted: every beat is carried by type, image and sound.

## Timeline

| Time | Frames | Picture | Words on screen | Sound | Source |
|---|---|---|---|---|---|
| 0.0–3.0 | 0–89 | {{cold open}} | {{a dated number}} | {{drone fades in}} | {{where the number comes from}} |
| 3.0–6.0 | 90–179 | {{the break}} | {{THE SHORT CLAIM.}} | {{the hit}} | |
| 6.0–9.0 | 180–269 | {{the reveal}} | {{NAME. One line.}} | {{logo chime}} | |
| {{…}} | {{…}} | {{real product capture}} | {{FEATURE: one line}} | {{card tick}} | |
| {{…}} | {{…}} | {{the end card: name, line, URL}} | {{name.domain}} | {{final chord, decay to silence}} | |

## Cue sheet

<!-- One file of named cue times drives picture and sound. After the voiceover is cut, move visual cues onto the spoken words. -->

| Cue | Time (s) | Picture | Sound |
|---|---|---|---|
| {{break}} | {{3.0}} | {{the line snaps red}} | {{low hit}} |
| {{reveal}} | {{7.2}} | {{the mark draws}} | {{chime}} |

## Voiceover

| Line | Starts (male) | Starts (female) | Lands on |
|---|---|---|---|
| {{line, numbers spelled as spoken}} | {{0:01.4}} | {{0:01.2}} | {{the words on screen it must meet}} |

## Sources for every claim

- {{number or claim}}: {{file, run or public source, with the date}}

## Honesty

- [ ] No AI-generated imagery; real captures and credited photography only
- [ ] ILLUSTRATIVE, SIMULATED, PROTOTYPE or VISUALIZATION chips on every overlay that is not live output
- [ ] "In simulation" spoken before every simulated number
- [ ] A credits card for photos, maps, fonts and music, with licences

## Deliverables

- [ ] 1080p master per voice: CRF 19, AAC 256k, soft English captions, `+faststart`
- [ ] 720p share copies for chat and email
- [ ] A music-only cut for live narration
- [ ] An SRT per voice
- [ ] A 1280×720 thumbnail

## QA

- [ ] Contact sheet (24 frames) and seams (five frames around each cut) checked
- [ ] Stills at every named cue
- [ ] Streams, length and a full decode clean
- [ ] Loudness -16 to -14 LUFS integrated, true peak -1.5 dBTP or lower
- [ ] Whisper word error rate under 3% on each delivered master
- [ ] Watched muted and on a phone
