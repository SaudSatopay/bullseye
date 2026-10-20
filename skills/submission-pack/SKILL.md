---
name: submission-pack
description: "Package a hackathon project for its judges: a judge-first README, paste-ready form answers (SUBMISSION.md), a one-page team briefing, OG card, screenshots and QR codes, repo hygiene, judge-access checks, and a final sweep that fails on unfilled placeholders, stale counts, missing required sections, localhost links, open hard requirements, absolute paths and secrets. It freezes the entry too: tag, submit early, label post-deadline work. Use it when the user says 'write the README', 'prepare the submission', 'fill the Devpost form', 'final sweep', 'are we ready to submit', 'package this for judges', 'make the OG image' or 'tag the release', or when a deadline is under 24 hours away."
argument-hint: "[start | readme | form | briefing | media | blog | hygiene | access | sweep | freeze]"
license: MIT
metadata:
  author: Saud Satopay
  version: "1.0.0"
  part-of: bullseye
---

# Submission pack

Everything a judge touches outside the live pitch: the README, the form answers, the briefing the team rehearses, the media, the repository and the path a judge takes to reach the product. Real submissions shipped with slips nobody meant to make: a video link left as `{VIDEO_URL}`, a README that said 58 tests while the suite had 59, a mandatory README section never written, a dev-mode badge in the hero screenshot, an HTTP link beside the HTTPS one, and preview deploys behind a login that judges could not pass. This skill writes the copy from measured facts, then runs a sweep that fails on every one of those slips before the owner presses Submit.

## Modes

| Argument | Runs |
|---|---|
| none | Steps 1 to 10, skipping what BULLSEYE.md (Submission) already marks done |
| `start` | Step 1: the first draft of the copy, at hour 2 of the build |
| `readme` | Step 2 |
| `form` | Step 3 |
| `briefing` | Step 4 |
| `media` | Step 5 |
| `blog` | Step 6 |
| `hygiene` | Step 7 |
| `access` | Step 8 |
| `sweep` | Step 9 |
| `freeze` | Step 10 |

In Claude Code: `/bullseye:submission-pack sweep` when installed as the plugin, or `/submission-pack sweep` when installed with `npx skills add SaudSatopay/bullseye`. Elsewhere: ask the agent to run the submission-pack skill in that mode.

## Inputs

- `BULLSEYE.md` at the project root (sibling skill `bullseye`): the Contract (form fields, deliverables and their caps, the rubric, the `### Requirements gate` R lines, the sponsor test, the deadline with its timezone), the Thesis one-liner, the golden path in Plan, the Owner checklist and the `process:` line. Without it, ask for the form's fields, the rubric, the deadline with timezone and the deliverables, and write them at the top of SUBMISSION.md.
- `facts.json` and `CLAIMS.md` from sibling skill `prove-it`: every number. Until a number is measured, write a placeholder such as `{{tests}}`; the sweep fails while one is left.
- The live URL, the repository URL, the video (sibling skill `demo-video`) and the deck (sibling skill `pitch-deck`).

Siblings are installed together; if one is missing, install the full set with `npx skills add SaudSatopay/bullseye`. This skill works alone: every rule it needs is below or in its references.

## Procedure

### 1. Start the copy at hour 2

Draft the submission at about hour 2 of the build and refresh it in the polish pass. Writing to the form's own fields early exposes a missing requirement while there is still time to build it.

1. Create `SUBMISSION.md` from [assets/SUBMISSION.template.md](assets/SUBMISSION.template.md): every field the form has, in the form's order, with its limit in the heading ("(1460/1500 chars)").
2. Grow the README stub from sibling skill `build-sprint`, or start from [assets/README.template.md](assets/README.template.md): the claim, the live link, the 60-second path, how to run it.
3. Copy [assets/sweep.config.example.json](assets/sweep.config.example.json) to `sweep.config.json`: `requireSections` from the rubric and the R lines, `facts`, and `maxFileMB` from the upload caps in the Contract.
4. When BULLSEYE.md says `process: private`, append [assets/gitignore-process.txt](assets/gitignore-process.txt) to `.gitignore` and to `.vercelignore`.

Gate: SUBMISSION.md has a heading for every form field; `sweep.config.json` exists; the sweep runs. Its placeholder errors are the to-do list for the rest of the build.

> Field note (VyaparAI · Global AI Hackathon Series with Qwen Cloud): The Devpost copy, demo script and blog post were committed at hour 2 of a 52-hour build and refreshed in the polish pass. The video line still read `{VIDEO_URL}` with "fill after recording" when the build ended; this skill's sweep fails on exactly that line.

### 2. Write the README for judges

A judge decides on the first screen, clicks the first link and checks one number. Use this order (structure from Detour, SunPath, RegSutra and FLOODLIGHT; the reasons are in [references/readme-for-judges.md](references/readme-for-judges.md)):

1. Hero: the live OG image (`https://<host>/opengraph-image`) or `public/og.png` from the design tokens, so the README matches production; alt text states the claim and the numbers.
2. One bold claim sentence: what it does, for whom, with the number that makes it checkable.
3. Badges that carry real numbers and link to their proof: tests (from facts), "claims re-measured N/N" (CLAIMS.md), live demo, track. No CI badge unless CI runs.
4. A row of deep links that land each page in the right state (`?scenario=`, `?demo=`, `?autorun=1`).
5. **For judges: 60 seconds**: three or four numbered clicks, what to look for, and the one caveat.
6. **Evidence**: What was tested | Result, against honest baselines (same model without your tool, a rules floor, the organiser's own baseline).
7. **The judging criteria, point by point**: Criterion | Weight | Where to see it, then Track | Where to see it.
8. **What it does**: captioned screenshots from the production build at 1440 and 390 px, with alt text that says what the screen shows.
9. **How it works**: one Mermaid diagram in the palette (the render-checked pattern is in the template), or an architecture page rendered to PNG with dashed "(planned)" boxes; then three or four bolded rules.
10. **Why <sponsor tech>**: answer "does it work without it?" first, then Question | How it answers.
11. **Where we lose**: results that went against you, with numbers.
12. **Proof**: Check | Result, Lighthouse included.
13. **Run it locally**: works without keys; commands verified from a fresh clone; Command | What it checks; local URLs inside code blocks.
14. **Data**: every source linked, sample data labelled, "not affiliated with" where it applies.
15. **Team and AI assistance**: what the coding agent did and how the output is verified.
16. **License and credits**: fonts, photos, UI kits, data.

Render it as GitHub does, in both themes, and fix what breaks:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/readme-preview.mjs" README.md --shoot
```

Gate: both themes show 0 Mermaid errors and 0 broken images; every deep link opens logged out; the sweep reports no README error.

> Field note (StorePilot · OpenAI Build Week): The rules made a README section on the Codex collaboration a hard requirement. Nothing checked it, and the submitted README did not have it. Put every required heading in `requireSections` (or an R line with a grep check) and the sweep fails until it exists.

### 3. Write SUBMISSION.md: paste-ready answers

"Paste-ready answers, field by field, in the form's order, in plain text (the form's boxes do not render markdown). Every number matches the README and the proof page. The feedback answers are written in your voice."

- Put each field's limit in its heading and fill 91 to 97 percent of it. The sweep fails an answer over its limit and warns when the stated count is stale.
- Title: the name, what it does, where it lands. Description: problem with numbers, who it is for, numbered outputs, how it works, what makes it different, proof against baselines, what is real data and what is sample.
- Sponsor usage, when asked: a primitives table (primitive | where | what it does), "Why this is meaningful use, not a wrapper", and "What we did not have to build" as a strikethrough list. In a plain-text box, one line per primitive.
- Business model, when judged: who pays and why, revenue streams, defensibility, go-to-market, with unmeasured money figures labelled illustrative.
- Links: repo, live, video, deck, blog, each opened logged out. Disclosures: AI tools, prior work, team roles (the owner types names and contact details into the form; they never go in a file).
- Feedback in the owner's voice, with specific technical asks of the sponsor.
- The requirement table comes from the gate: `node "${CLAUDE_SKILL_DIR}/scripts/final-sweep.mjs" . --gate-table` prints one "Requirement | Where it is" row per R line; fill "Where it is" with a link, or a file and its section.

Gate: every R line has a row and a place; every number matches facts.json and the README; no placeholder is left.

> Field note (CrackWatch · Gappy AI Hackathon 2026): The entry that reached the top 25 told its sponsor story as subtraction: ten platform primitives in a table, "Why this is meaningful use, not a wrapper", and a strikethrough line of everything the team did not have to build.

### 4. Write BRIEFING.md: one page the team knows by heart

From [assets/BRIEFING.template.md](assets/BRIEFING.template.md): the pitch, the architecture, a model and data table (Part | Holds | Why), the demo flow with its numbers, decisions and why, the numbers at a glance, and questions to expect, each with a speakable answer: "Does it work without <sponsor>?", "Is that realistic?", "Are the numbers right?", "What is real data?", "Where does it break?", "What did the AI build? Say it plainly."

It is rehearsal material for people. Never wire it into a live AI that listens to judges and answers for the team: that breaks the event's trust and usually its rules. Mock Q&A runs in sibling skills `judge-panel` and `finale-pitch`.

Gate: it fits one page; every number matches facts.json; each team member answers the six questions without notes.

### 5. Make the media

Sizes, caps and tested recipes are in [references/media-specs.md](references/media-specs.md).

- OG card, 1200 × 630, from the design tokens: Next `app/opengraph-image.tsx`, or a hidden `noindex` route screenshotted to `public/og.png`. Three numbers from facts; titles and descriptions on every route; a favicon from the brand mark.
- Screenshots from the production build (`next build && next start`, or `devIndicators: false`), 1440 and 390 px at scale 2, light and dark, after fonts and animations settle. In Claude Code: the Browser pane (`resize_window`, `screenshot`); elsewhere the recipe in media-specs, or [../missile/scripts/shots.mjs](../missile/scripts/shots.mjs) for quick captures.
- README GIF: Playwright `recordVideo`, then ffmpeg palettegen and paletteuse at 9 fps, 720 px wide, under 5 MB.
- Thumbnails padded from the OG card: Devpost 3:2 (1200 × 800), YouTube 1280 × 720, dev.to 1000 × 420.
- QR codes for the live URL and the repo, for the last slide, a booth card or a poster:

```bash
python "${CLAUDE_SKILL_DIR}/scripts/qr.py" "Live demo=https://<live-host>" "Code=https://github.com/<owner>/<repo>" --out docs/qr --verify
```

Re-shoot the README images, the OG card and the GIF in the same change as any redesign.

Gate: pasting the live URL into a chat shows the card; every image comes from the current production build; no dev indicator in any capture.

> Field note (RegSutra · SEBI Securities Market TechSprint 2026): The first screenshot in the README was captured from the dev server, and the Next.js dev indicator sits over the sidebar footer in the image every judge sees first.

### 6. Write the blog post (only for a blog prize or a write-up field)

From [assets/BLOG.template.md](assets/BLOG.template.md), in Detour's structure: a title with numbers, an opening scene, a one-line thesis, a TL;DR box with live and code links, a six-questions table, steps with the real queries, honest limits, "What broke, and what I learned", "What I'd love to see in <sponsor>", stack and AI disclosure, and a question to readers. Publish under the event's tag; link it from the README and SUBMISSION.md.

Gate: every number matches facts.json; every query was copied from a real run.

### 7. Repo hygiene

- `LICENSE`: MIT unless the rules ask otherwise; MIT or Apache-2.0 when an OSI licence is required.
- `.env.example` names every variable the code reads, what it does, where to get it, and what happens without it. The sweep compares it with the code.
- No secrets in the tree or in history: the sweep scans both. A key that was ever committed or pasted into a chat is rotated first, then cleaned up.
- Process files stay local per the BULLSEYE.md policy (BULLSEYE.md, MISSILE.md, judge prompts, `.claude/` and the submission prep); CLAIMS.md and LIMITS.md stay public.
- No absolute machine paths in committed files: launch configs, build scripts and results JSON are where they hide.
- The repo is public when the rules ask, and the README renders when viewed logged out.
- The commit attribution policy was set before the first commit ([references/integrity.md](references/integrity.md)).

Gate: the sweep's `secret`, `history`, `env-file`, `abs-path`, `process-file` and `repo-link` checks are clean.

### 8. Judge access: what a stranger sees

- The live URL works logged out, on a phone and in a private window, and the production alias serves the current build (compare the footer build stamp or the bundle hash).
- Preview deploys: open the exact link you will paste, logged out. A Vercel preview behind Deployment Protection answers strangers with a redirect to a login (HTTP 302) or HTTP 401; share the production alias, or turn protection off for that deploy. `--check-links` fails any link that redirects to a login.
- Sandboxes: invite judges early and confirm they are active members (the Slack challenge required judges to be active members of the sandbox workspace).
- The video is unlisted or public and plays in a private window; `--check-links` asks YouTube whether it is private.
- Demo credentials, when a login cannot be avoided: a seeded judge account in the form's notes, never a personal one.
- Free-tier hosts: a cold-start note in the README, and a keep-alive or a warm-up before judging windows.

Gate: every link in the requirement table opened logged out, with the time it was checked written in BULLSEYE.md (Submission).

> Field note (ORCA · SIH 2026): Its previews answered HTTP 302 to anyone not signed in to Vercel and the public alias served an older bundle, which held the critic's `shipped` score at 6 for the whole run.

### 9. Final sweep

```bash
node "${CLAUDE_SKILL_DIR}/scripts/final-sweep.mjs" . --check-links --run-gate
```

Other agents: run the same scripts from this skill's folder. The sweep reads `sweep.config.json` and BULLSEYE.md; `--require "For judges"` adds a required heading, `--strict-prose` makes em dashes errors, `--json` prints the report for a machine.

| Check | ERROR | WARN |
|---|---|---|
| `requirements` | an open `[hard]` R line in BULLSEYE.md | an open `[scored]` line, a malformed line, a check with no command |
| `required-section` | a required heading missing (config, `--require`, or a README grep in an R line) | |
| `placeholder` | `{{...}}`, `{VIDEO_URL`, `<VIDEO`, `TODO`, `TBD`, `FIXME`, lorem ipsum, "fill after", "coming soon", `your-` links, `example.com` in README, SUBMISSION, BRIEFING or deck HTML | the same in docs and code; inside HTML comments |
| `template-guide`, `field-budget` | an answer over its form limit | leftover `guide:` comments; a stale stated count |
| `stale-count` | "58 tests" or "15/16 claims" against facts.json | counts that disagree between files when there is no facts.json |
| `localhost-link`, `http-link`, `repo-link`, `link` | a clickable localhost link; a relative link to a missing, ignored or wrong-case file; a 404, 401, login wall or private video (`--check-links`) | an `http://` link; a page that blocks scripts |
| `abs-path`, `secret`, `history`, `env-file` | a home path (`C:\Users\<name>`, `/Users/<name>/`, `/home/<name>/`); a key-shaped string, now or in any commit; a tracked or unignored `.env` | another drive path; a key or certificate file; variables missing from `.env.example` |
| `process-file`, `large-file`, `dev-indicator` | a process file tracked under `process: private`; a file over its `maxFileMB` cap or over 100 MB | a deck over 10 MB; Next.js screenshots that may show the dev badge |
| `em-dash`, `ai-tell` | em dashes with `--strict-prose` | em dashes, hype words, exclamation marks, emoji headings in judge-facing prose |

With `--run-gate`, the sweep runs each R line's `cmd:` from the project root and prints its output beside its `pass:` condition. Judge each one yourself, then tick the line in BULLSEYE.md; the sweep never decides a free-text condition, but it warns when a ticked line's command fails now (a stale tick). On Windows, run it from Git Bash so the gate's `grep` and `ffprobe` checks find their tools.

Every R line must be checkable before anyone presses Submit, because the sweep runs before submitting and fails on any open `[hard]` line. The deadline and the act of submitting are never R lines: the deadline lives in the Contract and the status line, and the submission is recorded under `## Submission` (step 10). If you find an R line that can only pass after submitting, move it there and tell the owner.

Then:

1. Run the claims check from sibling skill `prove-it` ([../prove-it/scripts/claims-check.mjs](../prove-it/scripts/claims-check.mjs)): every README number re-measured.
2. Clone the repository into a new folder outside synced folders and follow "Run it locally" exactly. Write the commands and the time they took into BULLSEYE.md (Log).
3. Read every judge-facing page once more for AI tells: replace em dashes (a colon for label and detail, a comma for an aside, a period for a splice, parentheses, a middot for separators), cut hype words and exclamation marks, and keep numbers where adjectives were.
4. Run [the render check](#2-write-the-readme-for-judges) again if the README changed.

Gate: the sweep exits 0, the claims check exits 0, the fresh clone runs. Paste the sweep's last line into BULLSEYE.md (Submission).

> Field note (Bridge · Slack Agent Builder Challenge): The README badge and text said 58 tests while the suite, the pitch deck and the voiceover said 59, and the stale number went out with the submission. Counts typed by hand drift; the sweep compares every count with facts.json and with the other documents.

### 10. Freeze and integrity

- Tag the submission commit (`v1.0.0`) and push the tag with the owner's approval; this is the project's release tag.
- Submit early: at least 30 minutes before an onsite deadline, at least 24 hours before a portal deadline. The owner pastes SUBMISSION.md, uploads, accepts the terms and presses Submit; the agent never does.
- Record `SUBMITTED <time, timezone>` in BULLSEYE.md (Submission) and in the tracker (sibling skill `hackathon-tracker`).
- Do not edit the submission after the deadline; Devpost warns that changes can affect eligibility.
- Work after the deadline goes under "After the deadline" in the README, with a compare link from the tag and a callout naming the submitted version.
- A correction says what the submitted version still gets wrong: "The submitted v1.0.0 still has the error."
- Credit other teams whose findings you used.

Details and templates: [references/integrity.md](references/integrity.md). Gate: the tag is on the remote, the SUBMITTED line is written, and the README callout is in place once anything changes after the deadline.

> Field note (Detour · Graph Hacks 2026): The v1.0.0 tag landed 39 minutes before the deadline; the next day's 49 commits were listed under "After the deadline" with a compare link, and a counting error found later was published with "The submitted v1.0.0 still has the error."

## Scripts

| Script | Command | Use |
|---|---|---|
| [scripts/final-sweep.mjs](scripts/final-sweep.mjs) | `node "${CLAUDE_SKILL_DIR}/scripts/final-sweep.mjs" . --check-links --run-gate` | The last check: placeholders, stale counts, links, paths, secrets, history, gate, caps, prose. Exit 1 on any ERROR. `--gate-table` prints the SUBMISSION.md requirement table. Zero dependencies. |
| [scripts/readme-preview.mjs](scripts/readme-preview.mjs) | `node "${CLAUDE_SKILL_DIR}/scripts/readme-preview.mjs" README.md --shoot` | GitHub's own render of the README in light and dark, Mermaid drawn, broken images counted, 1000 px slices. Needs `gh` (logged in); `--shoot` uses the project's Playwright; `--html` works offline. |
| [scripts/qr.py](scripts/qr.py) | `python "${CLAUDE_SKILL_DIR}/scripts/qr.py" "Live demo=https://..." --out docs/qr --verify` | Labelled QR codes as PNG and SVG; refuses localhost and light-on-dark; `--verify` decodes each with OpenCV. Needs `pip install "qrcode[pil]"`. |

Other agents: run the same scripts from this skill's folder.

## Outputs

Files in the user's project: `README.md`, `SUBMISSION.md` and `BRIEFING.md` (both private by default), `docs/blog.md` when there is a blog prize, `sweep.config.json`, the OG card (`public/og.png` or an OG route), `docs/images/`, `docs/qr/`, `LICENSE`, `.env.example`, and the process-file block in `.gitignore` and `.vercelignore`.

`BULLSEYE.md` sections this skill updates:

- `## Submission`: keep the template's checklist line, then a table and three lines:

```markdown
- [x] README for judges · [x] SUBMISSION.md · [ ] deck · [x] video · [x] live URL · [x] repo public · [ ] tag

| Deliverable | Where | Limit | Checked |
|---|---|---|---|
| Video | https://youtu.be/<id> | 3:00, unlisted | 2:51, plays in a private window, 2026-10-18 22:05 IST |
| Live demo | https://<host> | works logged out | phone and private window, 2026-10-18 22:05 IST |

- Final sweep: sweep: PASS, 0 errors, 3 warnings (2026-10-18 22:10 +05:30)
- Tag: v1.0.0 at <short commit>
- Submitted: SUBMITTED 2026-10-18 23:20 IST (deadline 23:59 IST)
```

- `## Decisions`: one dated line per choice that shapes the entry (the track, the process policy, what the blog covers).
- `## Log`: a `▶ STATUS` block for each pass (first draft, README, media, sweep, freeze).
- The status line: `phase=package`, with `next=` naming the one action left.

## Rules

- Every number comes from facts.json or a committed script. Never type a number from memory; when it is not measured yet, keep the placeholder.
- Judge-facing prose is claims with numbers: no em dashes, no hype words (`seamless`, `powerful`, `robust`, `cutting-edge` and the rest of the list in the sweep), no exclamation marks, no emoji.
- Label sample, synthetic, simulated, projected and illustrative data where it appears. Draw unbuilt parts dashed and labelled "(planned)".
- The agent prepares; the owner acts. Accounts, passwords, keys, repository visibility, uploads, invitations, terms and the Submit button belong to a person. The agent never types a password or a key into a form.
- No live AI answers judges. Rehearsal tools only.
- Read the platform's limits (video length, file size, slide count, file naming) before making the artifact.
- Re-shoot media after any redesign; keep every generator and its inputs in the repository, never in a scratchpad.
- Never edit the submission after the deadline, and never rewrite history after the submission tag.

## Reference map

- [references/readme-for-judges.md](references/readme-for-judges.md): the README order and why, badge and deep-link rules, the render-checked diagram pattern and its measured limits, the render check, and the failures it prevents.
- [references/media-specs.md](references/media-specs.md): sizes and caps per platform, the production screenshot script, the OG card from tokens, thumbnail and GIF commands, video upload rules, QR use.
- [references/integrity.md](references/integrity.md): tagging, freezing, the after-deadline section, corrections, AI disclosure, commit attribution, prior work, licences and credits, process files, secrets.
- [assets/README.template.md](assets/README.template.md), [assets/SUBMISSION.template.md](assets/SUBMISSION.template.md), [assets/BRIEFING.template.md](assets/BRIEFING.template.md), [assets/BLOG.template.md](assets/BLOG.template.md): the four documents, with `guide:` comments the sweep flags until they are deleted.
- [assets/final-checklist.md](assets/final-checklist.md): submission day, hour by hour, owner and agent.
- [assets/gitignore-process.txt](assets/gitignore-process.txt): the block of process files kept local.
- [assets/sweep.config.example.json](assets/sweep.config.example.json): every sweep setting, explained.
- [scripts/final-sweep.mjs](scripts/final-sweep.mjs), [scripts/readme-preview.mjs](scripts/readme-preview.mjs), [scripts/qr.py](scripts/qr.py): see Scripts.
- Control file template: [../bullseye/assets/BULLSEYE.template.md](../bullseye/assets/BULLSEYE.template.md). Requirements gate format: [../brief-decoder/SKILL.md](../brief-decoder/SKILL.md).
