---
name: demo-video
description: Make the hackathon demo video like code. A timed beat sheet with exact inputs and a source for every number, real captures (a scripted Playwright recording with captions drawn in the app's own type, or OBS), a voiceover fitted to each beat's window (edge-tts clips checked OK or OVER, or a human read), SRT captions from the same timeline, ffmpeg assembly and QA, then an unlisted upload tested logged out. Optional launch film or trailer. Use when the user says "demo video", "record the demo", "make the 3-minute video", "voiceover", "captions", "screen recording", "pitch video", "launch film" or "trailer", or when a submission form asks for a video link.
argument-hint: "[script | record | voiceover | captions | assemble | qa | deliver | film]"
license: MIT
metadata:
  author: Saud Satopay
  version: "1.0.0"
  part-of: bullseye
---

# Demo video

The video is often the only part of a project every judge watches end to end. Build it like code: the beat sheet is the source, captures and voiceover are generated from it, and QA checks the result before anyone uploads it. The whole video is one argument: here is a bug you have, here is why you can't fix it in your code, here is it not happening. No architecture tour, no feature list, no logo animation. Video quality does not affect judging; clarity does. Show only what is implemented, never fabricate screens.

## Arguments

| `$ARGUMENTS` | Runs |
|---|---|
| none | Steps 1 to 9 in order. Step 10 only when asked. |
| `script` | Steps 1 and 2 |
| `record` | Steps 3 and 4 |
| `voiceover` · `captions` · `assemble` · `qa` · `deliver` | Step 5 · 6 · 7 · 8 · 9 |
| `film` | Step 10, the optional launch film or trailer |

## Inputs

- `BULLSEYE.md` in the project root (template: [BULLSEYE.template.md](../bullseye/assets/BULLSEYE.template.md)): `## Contract` for the video rules, `## Thesis` for the one-liner and signature moment, `## Plan` for the golden path beats, `## Claims` for the headline numbers. Without it, read the event's rules page and write the video rules at the top of `docs/demo-script.md`.
- `facts.json` and `CLAIMS.md` from the sibling skill [prove-it](../prove-it/SKILL.md) (install the full set with `npx skills add SaudSatopay/bullseye` if missing). Every number said or shown in the video comes from there.
- A production build or the deployed URL, seeded demo data, and a reset control (a Reset demo button or a `?demo=reset` link).
- Tools: ffmpeg and ffprobe on PATH; Node 20+ with Playwright for route A (the project's copy first, else `PLAYWRIGHT_MODULE` or a global install); Python 3.10+ with `edge-tts` for a synthetic voice (`mutagen` optional).

## Procedure

### 1. Read the video rules

Write these at the top of `docs/demo-script.md` before the first beat: length cap, file size cap, format, hosting (YouTube unlisted, Drive "Anyone with the link", or direct upload), required content, language, whether captions are required. Rules seen at real events:

| Event or platform | Rule | What it changes |
|---|---|---|
| Hack2skill events | 3:00 at most | Cut to 2:50. "Do not submit 3:15." |
| Devpost events | a public video link, usually under 3:00 | Unlisted YouTube, tested logged out |
| OpenAI Build Week | under 3:00, with audio; Codex session IDs on screen | One beat shows the session IDs and repo history |
| ET AI Hackathon 2.0 | 3 to 4 minutes; 50 MB upload or a Drive link | Drive link set to public, tested in incognito |
| Sigma Squad × BIS | 7:00 hard cap | A longer structure: demo, architecture, eval results |

Gate: cap, target (cap minus 10 seconds: 2:50 for 3:00) and every required item are written down.

> Field note (NAADI · IDBI Innovate 2026): The first script ran 3:15 against Hack2skill's 3:00 limit and had to be cut after it was written. Read the cap before the first beat.

### 2. Write the beat sheet

Copy [assets/VIDEO-SCRIPT.template.md](assets/VIDEO-SCRIPT.template.md) to `docs/demo-script.md` and fill it. It is the single source: `voiceover.py` reads its beat table.

- 6 to 9 beats, columns `# | Time | On screen | Voiceover | Source of every number`. Budget every second; the Time ranges are the voiceover windows.
- Hook in the first 10 seconds: a problem the viewer recognizes as their own, with one number. Name the product and what it does by 0:20.
- The money shot: the one moment that wins. Give it the longest hold.
- The contrast beat: the case where it stays quiet, refuses, or the naive version fails (a legitimate message, a quiet day, a control group).
- Proof: measured numbers on screen with where they come from. A sponsor beat when sponsor tech is judged: what it does that nothing else could.
- Close on the live URL, on screen and spoken ("probe dot example dot app").
- List the exact inputs to paste, in order, and the deep links (`?autorun=1`, `?demo=`).
- One idea on screen at a time. Hold the damning frame a full beat: 1.5 seconds at least.
- About 150 spoken words a minute: a 2:50 video holds about 420 words; leave silence on the money shot and aim for 330 to 380.
- Write numbers the way the narrator says them ("ninety-eight percent") and add the display form to the Say/Show table ("98%").
- Plan the short cut (2:00 or 1:00): which beats drop. When the brief lists required items, fill the requirement to beat map.

Gate: `python "${CLAUDE_SKILL_DIR}/scripts/voiceover.py" docs/demo-script.md --dry-run` exits 0 (every line fits its window, no banned word, no placeholder) and every beat that states a number has a Source cell.

> Field note (engram · CockroachDB × AWS Agentic Memory): The script budgeted 2:50 against a 3:00 cap and spent it on one argument: eight racing agents, one refund, then the control group's "0 × SQLSTATE 40001" held for a full beat. No schema, no architecture narration.

### 3. Prepare the recording

Work through "Before you record" in the beat sheet. The items that cost the most when missed:

- A production build or the deployed URL, never a dev server (`next build && next start`; Next.js `devIndicators: false`). Record against the deployed URL when you can: it proves the deploy.
- Reset demo first; caches warm (one run of every beat); fresh model quota (record early in the day); eval run first so the proof page has numbers.
- Window 1280 to 1920 px wide at 100% zoom, full screen, bookmarks bar hidden, notifications off, a clean browser profile with no personal tabs, avatars or autofill.
- Terminal at 16 pt or larger, high contrast, cleared history; `NO_COLOR=1` when ANSI colours render badly. Dry-run every command once: the first run pays connection setup.

Gate: every box in "Before you record" is ticked.

> Field note (RegSutra · SEBI TechSprint 2026): The hero screenshot shipped with the Next.js dev indicator over the sidebar because it was captured from `npm run dev`. Capture from the production build.

### 4. Capture

**Route A, scripted and repeatable.** Copy [assets/beats.example.json](assets/beats.example.json) to `video/beats.json` and turn each beat into one or more steps with holds sized to its window. Each step runs goto, fill, click, press, scroll, waitFor, caption, hold: it acts, waits for the result, captions the result, then holds.

```bash
node "${CLAUDE_SKILL_DIR}/scripts/record-demo.mjs" video/beats.json --dry-run
node "${CLAUDE_SKILL_DIR}/scripts/record-demo.mjs" video/beats.json --out video/out
```

Other agents: run the same scripts from this skill's folder. The recorder draws the caption bar in the app's own fonts and colour variables with `pointer-events: none`, moves a cursor dot to every click, refuses a Next.js or Vite dev server (pass `--allow-dev` to override), falls back to installed Chrome or Edge when Playwright's Chromium is missing, writes `timing.json` with every step's start and end, and encodes H.264, yuv420p, `+faststart` when ffmpeg is on PATH. A step with `"speed": 4` plays four times faster in `demo.mp4` and shows a speed badge while it plays. Use it for slow live runs.

**Route B, by hand.** OBS at 1080p30, H.264 around 8 Mbps, cursor with click highlight, mic muted if you dub later. Record one clip per beat. Windows Game Bar (Win+Alt+R) records one app window; macOS uses Cmd+Shift+5.

Either route: record each beat's clip the day its feature lands, and keep beats as separate clips so a fluffed beat costs one retake. In Claude Code, rehearse the click path in the Browser pane first; elsewhere, run the recorder with `--headed`.

Gate: a clip (or a route A run) for every beat, no dev indicator in any frame, `timing.json` kept next to the clips.

> Field note (Detour · Graph Hacks 2026): The demo was recorded by a Playwright script that drew captions into the page in the app's own type and colours, pointer-events off so they never blocked a click, then encoded H.264 with `+faststart`. Re-recording after a fix took one command.

### 5. Voiceover

**Human.** Speak about 5% slower than feels natural. Say numbers exactly as measured: "If your run shows 6 retries instead of 7, say six." One take per beat; when a line is fluffed, finish the take, then re-record that sentence and splice.

**Synthetic.** Generate one clip per beat from the beat sheet and check each against its window:

```bash
python "${CLAUDE_SKILL_DIR}/scripts/voiceover.py" docs/demo-script.md --out video/vo --srt video/captions.srt --cap 175
```

It prints OK, OVER or SHORT per beat and exits 1 on any OVER. Fix OVER by cutting words first; raise a beat's rate to +15% at most. Fix mispronunciations by spelling ("SHA two fifty-six", "regsutra dot vercel dot app"). Clips are cached by text, voice and rate; `--only b03` retakes one beat. Listen to every clip once at 1x. For a stricter check, transcribe each clip with Whisper and regenerate until the word error rate is 0: "we can't listen to every take, so the machine does." Options and commands are in [references/voiceover-and-captions.md](references/voiceover-and-captions.md).

Gate: every beat OK, and every clip heard once or checked by Whisper.

> Field note (WasteOS · OneEarth Hackathon 2026): Every TTS take was transcribed back with Whisper and regenerated unless the word error rate was zero. Both narrators passed all 29 lines, and the delivered films measured 0.5% and 1.5% word error rate.

### 6. Captions

`voiceover.py --srt` builds them from the same timeline (add `--dry-run` for a human voiceover; replace the times if your read differs): at most 42 characters a line and two lines a cue, broken at a sentence, then a clause, then a balanced word; display forms from the Say/Show table or `--display "ninety-eight percent=98%"`; em dashes turned into commas; [directions] removed. Burn them in when the player has no caption track (Drive previews, direct uploads, muted autoplay); otherwise attach the SRT (YouTube upload or a soft `mov_text` track). Banned in narration and captions: leverage, seamlessly, powerful, cutting-edge, revolutionary.

Gate: the SRT matches the final narration and reads correctly in a muted watch.

### 7. Assemble

Use an editor (Clipchamp, DaVinci Resolve, CapCut) or ffmpeg; the commands are in [references/voiceover-and-captions.md](references/voiceover-and-captions.md). Place every voiceover clip at its start time (`voiceover.py` prints the ffmpeg mix command). When an action lands early or late, split and slide the video, not the audio; the narration spacing is already tuned. Nothing is sped up when it fits its slot; anything that is shows a speed badge, and never speed up a latency you claim. Keep cuts hard and fast. No music with a drop; if you use music, keep it under the voice and licensed or generated.

Gate: one master file, under the cap.

### 8. QA

Run these on the master, read the numbers, and look at every image yourself (in Claude Code the Read tool opens PNGs):

```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 final.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate -of compact final.mp4
ffmpeg -v error -i final.mp4 -f null -
ffmpeg -hide_banner -nostats -i final.mp4 -af ebur128=peak=true -f null -
ffmpeg -v error -y -i final.mp4 -vf "fps=1/2.5,scale=320:-1,tile=8x9" -frames:v 1 -update 1 video/qa/contact.png
ffmpeg -v error -y -ss 41.7 -t 0.6 -i final.mp4 -vf "fps=10,scale=384:-1,tile=6x1" -frames:v 1 -update 1 video/qa/seam-042.png
```

- Duration under the cap. Streams: h264 at the planned size, yuv420p, aac. Full decode prints nothing.
- Loudness: integrated (`I:`) between -16 and -14 LUFS, true peak (`Peak:`) at -1 dBTP or lower. Fix with `-af loudnorm=I=-15:TP=-1.5:LRA=11`.
- Contact sheet: one frame every 2.5 seconds (tile n sits at n × 2.5 s; `tile=8x9` covers 180 s). Check every tile for a dev indicator, personal data, a notification, unreadable text, a blank frame, and a number that differs from `facts.json`.
- Seams: six frames around every cut (start 0.3 s before it) to catch jumps and pops.
- Watch once muted: the screen and captions must carry the argument alone. Watch once with sound on a phone.

Gate: every check passes and is written into the `## Log` block.

### 9. Deliver

- Master: 1080p H.264, `+faststart`, CRF 19 to 20, AAC 192k. Share copy: 720p, CRF 26, AAC 128k, for chat and email.
- Thumbnail 1280×720 for YouTube (a custom thumbnail needs a verified channel); check the platform's own sizes.
- Title, description with the live URL and repo, and chapters from the beat sheet times (YouTube needs the first at 0:00, at least three, each 10 seconds or longer).
- The owner uploads: accounts and publishing are theirs. YouTube unlisted and "not made for kids", or Drive "Anyone with the link".
- Open the link in an incognito window, logged out, and play it to the end with captions on.
- Paste the link into `SUBMISSION.md` (sibling skill `submission-pack`) and `## Submission` in `BULLSEYE.md`, then search both for the old placeholder.
- Keep the master in two places for the live round: the presenter's phone and the laptop desktop (sibling skill [finale-pitch](../finale-pitch/SKILL.md)).

Gate: the link plays logged out, and no placeholder is left anywhere.

> Field note (VyaparAI · Qwen Cloud hackathon): SUBMISSION.md still held the video-link placeholder at the end of the build. Paste the link the moment the upload finishes, then open it logged out.

### 10. Optional: launch film or trailer

A 60 to 100 second film for an idea round, a pitch opener or a booth loop. It is heavy (a day or more), so make it only when the event rewards it and the demo video is done. Storyboard first with [assets/STORYBOARD.template.md](assets/STORYBOARD.template.md): Time, Frames, Picture, Words on screen, Sound, and a source for every claim. It must work muted, one cue sheet drives picture and sound, and it ships with male and female voice versions plus a music-only cut for live narration. Engines, sound, QA and delivery are in [references/film.md](references/film.md).

## Outputs

- `docs/demo-script.md` (the beat sheet and checklists), `video/beats.json`, `video/captions.srt`: commit these.
- `video/out/` (`raw.webm`, `demo.mp4`, `timing.json`), `video/vo/` (clips and `timeline.json`), `video/qa/` (contact sheet, seams), `video/final/` (master, share copy, thumbnail): gitignore the media, keep the sources.
- `BULLSEYE.md`: tick the video item in `## Submission` with link and duration; one line each in `## Decisions` (route, voice, cap and target) and `## Risks` (a live step in the money shot, quota on recording day); a `▶ STATUS · demo video` block in `## Log` with duration, loudness and QA result; then update the status line's `next=`.

## Rules

- Show only what is implemented. Label simulated or illustrative values on screen, and say "In simulation" before a simulated number.
- Every number said or shown comes from `facts.json`; say the number your run showed.
- Record a production build or the deployed URL, never a dev server.
- No speed-up without a badge, and never speed up a latency you claim.
- No AI-generated imagery presented as the product or as real footage.
- Stay under the cap with margin; never submit over it.
- No personal data, keys, tokens or notifications in any frame; rotate a key that appears on screen.
- The agent prepares files, title, description and chapters; the owner uploads and publishes.
- Keep every builder and input in the repo (beat sheet, beats file, captions), never only in a scratch folder.
- Captions and titles judges read carry no em dashes and no emoji.

## Reference map

| File | Use it for |
|---|---|
| [references/video-doctrine.md](references/video-doctrine.md) | The one argument, beat patterns that worked, what to show and cut, honesty on screen, legibility, length and word budgets, hosting |
| [references/voiceover-and-captions.md](references/voiceover-and-captions.md) | Human or TTS (edge-tts, Groq Orpheus, ElevenLabs), writing for the ear, timing, Whisper checks, captions, mixing and assembly commands |
| [references/film.md](references/film.md) | Optional launch film: engines, storyboard, sound, alternates, QA, delivery |
| [assets/VIDEO-SCRIPT.template.md](assets/VIDEO-SCRIPT.template.md) | The beat sheet with pre-record, post-record and "If something hiccups" checklists; `voiceover.py` reads its table |
| [assets/beats.example.json](assets/beats.example.json) | A route A recording script to copy into `video/beats.json` |
| [assets/STORYBOARD.template.md](assets/STORYBOARD.template.md) | Storyboard for the optional film |
| `scripts/record-demo.mjs` | Scripted Playwright recording with in-page captions, cursor, speed badges, `timing.json`, H.264 encode; `--dry-run` validates |
| `scripts/voiceover.py` | Per-beat edge-tts clips checked against their windows, SRT captions, the ffmpeg mix command; `--dry-run` works offline |
