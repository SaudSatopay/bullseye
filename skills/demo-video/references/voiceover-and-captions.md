# Voiceover and captions

How to get a narration that fits its windows, says the numbers right, and comes with captions that match it. Commands below were run on Windows with ffmpeg 7.1; they work the same on macOS and Linux.

## Human or synthetic

| Option | Cost | When it fits | Watch out for |
|---|---|---|---|
| Your own voice | free | founder-fit stories, live pitch rehearsal, any event that rewards the team's presence | a quiet room; one take per beat; 5% slower than feels natural |
| edge-tts (Microsoft neural voices) | free, no key | the default for scripted demos: deterministic per line, per-beat rate control, many English accents (`en-US-AndrewNeural`, `en-US-GuyNeural`, `en-IN-PrabhatNeural`, `en-IN-NeerjaNeural`) | it rides Microsoft's consumer endpoint; when requests start failing with 403, update it (`pip install -U edge-tts`) and check the system clock |
| Groq Orpheus | free tier with a key | expressive reads with `[directions]`, six voices to audition, Whisper on the same API for checks | rate limits: write every transcript to disk first, parse "try again in Xs" and cool down; the same line gives the same read, so reword a line to get a new take |
| ElevenLabs | paid credits | the best prosody when budget allows | credits run out mid-retake; keep the final takes on disk |

Audition voices on one line before generating the whole script. List edge-tts voices with `edge-tts --list-voices`.

## Writing for the ear

- Write in beat-sized lines. One line per beat, or a few short ones; never a paragraph that must be cut later. Splitting a line so each phrase lands on its own picture is a normal retake.
- Write numbers the way they are spoken: "ninety-eight percent", "seven-sixty-two", "nine-point-two lakhs". Put the display form in the Say/Show table so captions show "98%".
- Fix pronunciation by spelling, then listen again: "SHA two fifty-six" for SHA-256, "regsutra dot vercel dot app" for a URL, "Sebi" for SEBI, "Falkor D B" for FalkorDB, "SY-fer" for Cypher.
- Use punctuation for pauses: a comma for a short one, a full stop for a beat. Words in [square brackets] are stage directions for a human; `voiceover.py` removes them before synthesis and from the captions.
- No hype words: leverage, seamlessly, powerful, cutting-edge, revolutionary. `voiceover.py` fails on them.

> Field note (RegSutra · SEBI TechSprint 2026): The voiceover table held the timeline start, the window, a per-beat rate and the text for seven beats; the generator printed OK or OVER for each clip against its window, and pronunciation was tuned by spelling ("SHA two fifty-six", "regsutra dot vercel dot app").

## Timing

- Each beat's window is its row in the beat sheet (`0:16–0:30` is a 14-second window). The line must end inside it.
- Narration runs at about 145 to 150 words a minute. `voiceover.py --dry-run` estimates each line from its word count; a real run measures each clip.
- Fix OVER by cutting words first. Then raise that beat's rate, up to +15%. Past that the voice sounds rushed.
- For a recorded human take that runs a little long, a pitch-preserving speed-up of at most 12% is invisible: `ffmpeg -i b04.wav -af atempo=1.08 b04-fit.wav`.
- When picture and voice disagree in the edit, move the video. Split and slide the video, not the audio; the narration spacing is already tuned.
- A clip far shorter than its word count suggests (under 60% of about 2.4 words a second) was probably cut off by the TTS service. `voiceover.py` reports it as SHORT; synthesize it again with `--only <id> --force`.

## Checking the read

1. Listen to every clip once at 1x, with the beat sheet open.
2. For a stricter check, transcribe each clip and compare it with the script. With the open-source Whisper package (`pip install openai-whisper`): `whisper video/vo/b03.mp3 --model small --language en --output_format txt --output_dir video/vo/check`. Regenerate any clip whose transcript differs from the script beyond spelling, and keep the shortest word-perfect take.
3. Run the same check once on the final mixed master: the voice must survive the music. A word error rate under 3% is the bar the WasteOS masters met (0.5% and 1.5%).

## voiceover.py in one screen

```bash
python voiceover.py docs/demo-script.md --dry-run --srt video/captions.srt     # offline: estimates, timeline, captions
python voiceover.py docs/demo-script.md --out video/vo --srt video/captions.srt --cap 175
python voiceover.py docs/demo-script.md --out video/vo --only b03               # retake one beat
python voiceover.py video/vo.json --voice en-IN-NeerjaNeural --rate +5%         # JSON input, another voice
```

- Input: the first Markdown table with a Time column and a Voiceover column, or JSON `[{"id", "start", "window", "text", "rate"?, "caption"?}]`. A table with Say and Show columns adds caption display forms; so does `--display "spoken=shown"`.
- Output: `<out>/<id>.mp3`, `<out>/timeline.json` (start, window, measured length, status per beat, and the ffmpeg mix command), and the SRT when `--srt` is given.
- Exit 1 on any OVER or SHORT beat, a banned word, a `{{placeholder}}`, an end past `--cap`, or a synthesis failure. A beat whose narration states a number with an empty Source cell prints a warning.

## Captions

- At most 42 characters a line and two lines a cue. Break at a sentence, then at a clause, then at the most balanced word boundary.
- Show display forms ("98%", "SHA-256", "regsutra.vercel.app") while the voice says the spoken forms.
- Captions follow the voice timeline: a cue starts when its words start and leaves 0.35 seconds after the line ends, or just before the next line.
- Judges read captions: no em dashes (the script turns them into commas), no emoji.
- Burned in (hard) when the player shows no caption track: Drive previews, direct uploads, muted autoplay. Attached (soft) otherwise: upload the SRT to YouTube, or add a `mov_text` track.

```bash
# soft captions in the MP4
ffmpeg -i final.mp4 -i captions.srt -map 0 -map 1 -c copy -c:s mov_text -metadata:s:s:0 language=eng final-cc.mp4
# burned in (run it from the folder that holds the SRT; Windows drive letters break the filter path)
ffmpeg -i final.mp4 -vf "subtitles=captions.srt:force_style='FontName=Arial,FontSize=22,Outline=1'" -c:a copy final-burned.mp4
```

## Assembly commands

```bash
# lay per-beat clips on the cut at their start times (voiceover.py prints this line with your files and times)
ffmpeg -i video.mp4 -i "video/vo/b01.mp3" -i "video/vo/b03.mp3" -filter_complex "[1:a]adelay=0:all=1[a1];[2:a]adelay=16000:all=1[a2];[a1][a2]amix=inputs=2:normalize=0[vo]" -map 0:v -map "[vo]" -c:v copy -c:a aac -b:a 192k video-with-vo.mp4

# join clips that share codec and size (list.txt holds lines like: file 'beat01.mp4')
ffmpeg -f concat -safe 0 -i list.txt -c copy cut.mp4

# music under the voice, ducked about 9 dB while the voice speaks
ffmpeg -i video-with-vo.mp4 -i music.wav -filter_complex "[1:a]volume=0.25[m];[m][0:a]sidechaincompress=threshold=0.05:ratio=8:attack=20:release=300[ducked];[ducked][0:a]amix=inputs=2:normalize=0[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k mixed.mp4

# loudness to -15 LUFS integrated, true peak -1.5 dBTP
ffmpeg -i mixed.mp4 -c:v copy -af loudnorm=I=-15:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k final.mp4
```

Read the loudness back with `ffmpeg -hide_banner -nostats -i final.mp4 -af ebur128=peak=true -f null -`: `I:` is the integrated loudness (aim -16 to -14 LUFS) and `Peak:` the true peak (-1 dBTP or lower).

## Presenting a video on a call

Google Meet sends a video's sound only when you present a Chrome tab with "Also share tab audio" turned on. Open the MP4 in a Chrome tab and present that tab; sharing a window sends no sound.
