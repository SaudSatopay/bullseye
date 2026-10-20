# Launch film or trailer (optional, heavy)

A 60 to 100 second film made from code: kinetic type, real product captures, a soundtrack and a narrator, all timed from one cue sheet. Budget a day or more. Make one only when the demo video is finished and the event rewards it: an idea round that accepts a video, a pitch that opens on a film, a booth loop, a launch post. If any of that is uncertain, polish the demo video instead.

> Field note (WasteOS · OneEarth Hackathon 2026): The 100-second film shipped as two 1080p masters (male and female narrator), 720p copies of about 9 MB for chat, a music-only cut for a teammate narrating live, two SRT files and a 1280×720 thumbnail, with the films and captions rebuilt by commands listed in its README.

## Pick an engine

| Engine | What it is | Strong at | Cost |
|---|---|---|---|
| Remotion (React) | compositions in TSX, rendered frame by frame | real UI captures in 2.5D, product scenes, a design system shared with the app | Node project of its own; render time |
| Deterministic canvas | one `renderFrame(t)` function in a static HTML page, frames captured with Playwright and piped to ffmpeg | kinetic type, maps, data drawn from your real files; any frame can be re-rendered alone | you write every scene by hand |
| HTML motion graphic | one offline HTML file on a 1920×1080 stage with scene keys, recorded as video | a 75 to 90 second explainer for one feature or a judges' challenge | lowest; it doubles as a live page |

For the HTML motion graphic, the brief that worked: one self-contained file that opens by double-click and works offline; autoplay; space to pause, arrow keys to step scenes, R to restart, `?scene=N` to jump; a poster frame per scene under reduced motion; every scene holds its key frame at least 1.5 seconds; a scene-timing table as a comment at the top; checked at 1920×1080 and 1280×720. Give the builder the source of facts and the rule "Do not invent features, numbers or claims beyond it."

## Storyboard first

Fill [the storyboard template](../assets/STORYBOARD.template.md) before any scene code:

- **What the film is about,** in product truth. Show only what is implemented, never fabricate screens. When a brief written for another product is reused, keep its structure and quality bar but tell the real story.
- **Design system** taken from the app's tokens: background, ink, the one accent, the semantic colours, display, body and mono type. The film is one more surface of the same brand.
- **Motion rules.** One idea on screen at a time. Type holds at least 30 frames. Every move eases out with no bounce. No rotation for its own sake. Crossfade between scenes; never dip to black mid-film.
- **Timeline** with columns Time | Frames | Picture | Words on screen | Sound | Source for every claim.
- **It works muted.** Every beat is carried by type, image and sound; the narrator adds a voice, not the meaning.

## One cue sheet

Keep one file of named cue times (the break, the reveal, each chapter, the finale). Scenes read it for picture; the soundtrack reads it for hits and chord changes. After the voiceover is cut, move the visual cues onto the spoken words (the narrator says "visibility" and the word rewrites on screen at that frame). Then a re-timed voice re-times the picture automatically.

## Sound

- A soundtrack synthesized from code with a fixed seed has no licensing questions; a licensed track needs its licence in the credits.
- Duck the music about 9 dB under each voice line.
- Master to -16 to -14 LUFS integrated with the true peak at -1.5 dBTP or lower, measured after encoding.
- Voice alternates: audition voices on one line, then build the full set for one male and one female narrator and a music-only cut for live narration. Each version gets captions timed to its own voice.
- Verify every take: transcribe it back with Whisper and regenerate until it matches the script, keep the shortest word-perfect take, and cache takes by a hash of voice and text.

## Render and deliver

```bash
# frames from a deterministic page: the page exposes renderFrame(t); Playwright screenshots each frame into ffmpeg
#   (launch Chromium with --force-color-profile=srgb --disable-lcd-text --font-render-hinting=none)
#   ffmpeg -f image2pipe -framerate 30 -c:v mjpeg -i - -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p master-picture.mp4
# delivery master: picture + mixed audio + soft English captions, streamable from the first byte
ffmpeg -i master-picture.mp4 -i soundtrack-vo.wav -i film.en.srt -map 0:v -map 1:a -map 2:s -c:v libx264 -crf 19 -preset slow -pix_fmt yuv420p -c:a aac -b:a 256k -c:s mov_text -metadata:s:s:0 language=eng -movflags +faststart film-1080p.mp4
# share copy for chat and email
ffmpeg -i film-1080p.mp4 -map 0:v -map 0:a -vf scale=1280:720:flags=lanczos -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart film-720p.mp4
```

Deliverables: the 1080p master per voice, the 720p copies, the music-only cut, the SRT per voice, a 1280×720 thumbnail, and a credits card for every photo, map and font licence.

## QA

- A contact sheet of 24 frames across the film and a seam strip of five frames around each scene cut, so jumps and pops show side by side (commands in SKILL.md step 8).
- Stills at the named cue times.
- Streams and length with `ffprobe`; a full decode with `ffmpeg -v error -i film-1080p.mp4 -f null -`.
- Loudness with `ebur128=peak=true`.
- Sync: the mixed audio's hits must land on the frames that cue them; a cross-correlation at a few hits between the delivered file and the master WAV should show zero lag.
- Whisper on the delivered master: a word error rate under 3%.
- One muted watch and one watch on a phone.

## Honesty in a film

- No AI-generated imagery. Use real captures of the product and credited real photography (Wikimedia Commons, NASA, OpenStreetMap), with the credits on a card.
- Every overlay that is not live product output carries a chip: ILLUSTRATIVE, SIMULATED, PROTOTYPE, VISUALIZATION.
- The narrator says "In simulation" before a simulated number; the numbers are the same as the deck's, read from the same data files.
- When a physical prototype exists, cut 3 to 5 seconds of real footage into the film; it is the strongest upgrade available.
- On Google Meet, present the film from a Chrome tab with "Also share tab audio"; sharing a window sends no sound.
