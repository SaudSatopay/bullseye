# Video doctrine

What makes a hackathon demo video land with judges, distilled from the builder's scripts across many events. The SKILL.md procedure says what to do in order; this file says why and gives the patterns.

## One argument

The whole video is one argument: here is a bug you have, here is why you can't fix it in your code, here is it not happening. No architecture tour, no feature list, no logo animation. Judges watch dozens of these; the ones that land open with a problem the viewer recognizes as theirs.

Write the argument as one sentence at the top of the beat sheet before any beat. Every beat either moves that sentence forward or gets cut.

> Field note (engram · CockroachDB × AWS Agentic Memory): The script opened on black with typed lines (an agent calls the payment API, then writes "refunded €42" to its vector store) and then "Those are two writes. They are not atomic." The product did not appear until the viewer already wanted it.

## Beat patterns that worked

| Project | Length | Beats |
|---|---|---|
| engram | 2:50 | the bug → why you can't fix it in code → the race (typed live) → the control group → the audit → why the sponsor's database → one-line close |
| RegSutra | 2:53 | posture dashboard → the pipeline on a new circular (the killer feature) → the register it changed → tamper-evident audit → grounded Q&A → URL |
| SunPath | 2:50 target | the funnel problem → the agent and its six tools → one sentence qualifies and sizes a system → an objection answered from an approved playbook → a quote built live → booking → an honest "not a fit" for a renter → the measured A/B eval |
| NAADI | 3:00 cap | the book of loans → one thin-file borrower scored with a confidence band → explainability → a slider answered by the real model → the memo → a declined borrower compared → monitoring → URL |
| CrackWatch | 60 s | real photo, boxes drawn on device → map and leaderboard → the console's cost if ignored and the human approval → "the whole backend is one pod" → end card |
| FaceAttend | 3 to 4 min | problem → enrol → a printed photo fails liveness → recognition under a second with a latency badge → airplane mode → sync on reconnect → benchmark numbers, plus a requirement to scene table for judges |

The common skeleton, in order:

1. **Hook (0:00 to 0:10).** A problem the viewer has, with one number. Calm screen, no cursor movement; let the line land.
2. **Reveal (by 0:20).** The name and what it does, in one sentence. A one-second title card at most.
3. **The input.** A real input, typed or pasted live from the beat sheet's exact strings.
4. **The money shot.** The one frame that wins. Longest hold in the video. Pause half a beat after it so the screen talks.
5. **The contrast.** The legitimate message that stays quiet, the quiet day with zero alerts, the control group that fails, the renter told "not a fit". A system that never says no is not believed.
6. **The mechanism, shown.** One trace, one terminal run, one panel that proves the work is real. Shown, not narrated.
7. **Proof.** Measured numbers on screen with their source: tests, evals against a baseline, latency.
8. **Sponsor beat** when sponsor technology is judged: what it does here that nothing else could.
9. **Close (last 5 to 10 s).** The live URL on screen and spoken, then stop.

Name the one or two highlights and their timestamps at the top of the script, as VyaparAI's did, and give them the framing: "The phone-scanning-the-UPI-QR shot is the most memorable 5 seconds; frame it."

## Show and cut

**Show:** real captures of the running product; a real input the viewer could type; the result appearing; numbers with their source; the negative case; the human approval step when money or safety is involved; a terminal command typed live when the claim is about the engine; the deployed URL in the address bar.

**Cut:** schema and code scrolling past ("Nobody watches SQL scroll past. The README is for that."); architecture narration ("The race is the architecture."); every settings page; login flows; loading spinners (warm the caches, or speed the wait with a badge); a logo animation; music with a drop; anything the product cannot do today.

## Honesty on screen

- Show only what is implemented; never fabricate screens. A storyboard brief written for another product kept its structure but told the real story instead.
- Label anything that is not a live measurement on screen: SIMULATED, ILLUSTRATIVE, PROTOTYPE, RECORDED RUN. Say "In simulation" before a simulated number.
- Real captures only. No AI-generated imagery presented as the product or as footage.
- A sped-up stretch carries a visible speed badge. Never speed up a latency you claim: "The 174ms is real; don't cut it to look faster than it is."
- Say the number your run showed. "If your run shows 6 retries instead of 7, say six." Re-check every number against `facts.json` in QA; videos drift from READMEs when the code changes after recording.
- Mode chips on screen (LIVE, SCRIPTED, RECORDED, cached) stay visible in the recording. They are a strength, not a flaw.

> Field note (WasteOS · OneEarth Hackathon 2026): The narrator says "In simulation" before the 98% overflow figure, every overlay carries an ILLUSTRATIVE or SIMULATED chip, and the credits card says routes and results are simulated. The film uses only credited real photography.

## Legibility

- Record at 1280 to 1920 px wide, 100% zoom (100 to 110% for dense UIs). In route A, a 1280×720 viewport at device scale 1.5 records a 1920×1080 video with large, sharp type.
- Terminal at 16 pt or larger, high contrast. UI text at 16 px or larger at the recorded size.
- One idea on screen at a time. Hold every key frame at least 1.5 seconds; a caption needs about 15 characters a second of reading time.
- Make clicks visible: a cursor with click highlight (route B) or the recorder's cursor dot (route A).
- Check the cut on a phone. Judges often watch in a small embedded player.

## Length and word budgets

| Cap | Target | Spoken words at 150 a minute (aim for 80 to 90%) | Beats |
|---|---|---|---|
| 1:00 | 0:55 | about 140, aim 115 | 5 or 6 |
| 2:00 | 1:50 | about 275, aim 230 | 5 to 7 |
| 3:00 | 2:50 | about 425, aim 340 to 380 | 6 to 9 |
| 5:00 | 4:45 | about 710, aim 600 | 8 to 10 |
| 7:00 | 6:45 | about 1,010, aim 850 | sections with sub-beats |

Plan the short cut while writing the long one: name the beats that drop for a 2:00 version (the replay, the second example, the architecture slide) so a late cap change costs minutes, not a rewrite.

## Delivery notes for a human narrator

- Speak about 5% slower than feels natural. Smile on the last line; it is audible.
- Say numbers as words in the script ("seven-sixty-two", "nine-point-two lakhs") so the read is not improvised.
- If a click misfires, keep talking and redo the gesture; cut it in the edit. Do not restart the take.
- Practice a voice-input line once. If the room is noisy, type it instead.
- Record in a quiet room; a phone voice memo a hand's width from the mouth is fine.

## Hosting and links

- YouTube unlisted is the default: it plays everywhere, keeps captions, and allows chapters. Choose "not made for kids".
- Drive needs "Anyone with the link" and a test in an incognito window; its preview player has no caption track, so burn captions in.
- Direct uploads have size caps (50 MB at one portal): export a 720p copy and check its size.
- Portals that demand a file instead of a link: ship a one-page PDF holding the link (BIS Compass kept a `demo_video_link.pdf` "for portals that demand specific formats").
- Test every link logged out, play it to the end, and paste it into the submission the moment the upload finishes.
