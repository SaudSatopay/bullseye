# Submission day checklist

<!-- guide: Keep beside BULLSEYE.md and tick as you go. "Owner" rows need a person: accounts, passwords, repository visibility, uploads, invitations and the Submit button. "Agent" rows a coding agent can do and prove with a command or a screenshot. Count back from the internal deadline in BULLSEYE.md (official deadline minus the buffer), never from the official one. Portal deadlines: start the T-24 block a day early, because portals slow down in the last hours. Onsite: start it six hours out. -->

## T-24 hours (portal) or T-6 hours (onsite)

| Who | Item | Done when |
|---|---|---|
| Agent | Re-read the rules page and the form; refresh the Contract and the requirements gate | every deliverable and hard rule has an R line with a check |
| Agent | Refresh README.md, SUBMISSION.md and BRIEFING.md from facts.json | the sweep shows no `stale-count` finding |
| Agent | Every number in the deck, video script and form matches facts.json | sibling skill prove-it's claims check exits 0 |
| Owner | Production keys set on the host, never in a file in the repo | the live URL answers with the live model |
| Owner | Repository public when the rules ask, with a LICENSE | the repo URL opens logged out in a private window |
| Owner | Judge access: sandbox invitations sent and accepted, demo account seeded | a judge-role account logs in on a phone |
| Owner | Video uploaded unlisted or public, under the length cap | it plays in a private window; `ffprobe` length under the cap |
| Agent | Upload files built and under their caps (deck PDF, PPTX, ZIP) | `maxFileMB` in sweep.config.json passes |

## T-2 hours

| Who | Item | Done when |
|---|---|---|
| Agent | Final sweep with link checks | `final-sweep.mjs . --check-links` exits 0 |
| Agent | Requirements gate run | `final-sweep.mjs . --run-gate` output read; every [hard] line ticked |
| Agent | Fresh clone in a new folder, following "Run it locally" exactly | the commands and their run times are written in BULLSEYE.md (Log) |
| Agent | README render check, light and dark | `readme-preview.mjs README.md --shoot`: 0 Mermaid errors, 0 broken images |
| Agent | Media match the current build | OG card, screenshots and GIF come from the current production build, no dev indicator |
| Agent | AI-tell pass on judge-facing prose | the sweep shows no `em-dash` and no `ai-tell` finding you have not decided to keep |
| Owner | Live URL logged out, on a phone and in a private window | the golden path runs end to end; the footer build stamp matches the last deploy |
| Owner | Every secret that passed through chat or a commit rotated | old keys revoked at the provider |

## T-30 minutes: submit now, not at the deadline

| Who | Item | Done when |
|---|---|---|
| Owner | Tag the submission commit and push the tag | `git ls-remote --tags origin` lists it |
| Owner | Paste SUBMISSION.md field by field, then use the form's preview | every field matches; no Markdown symbols in plain-text boxes; government portals that strip `%` or `'` re-read |
| Owner | Upload the files | each under its cap, named the way the rules ask |
| Owner | Press Submit and keep the confirmation | a screenshot or the email saved in `brief/` |
| Agent | Record `SUBMITTED <time, timezone>` in BULLSEYE.md (Submission) and in TRACKER.md | the line is there with the tag and its commit |

## After submitting

| Who | Item | Done when |
|---|---|---|
| Owner | No edits to the submission after the deadline | the form shows the submitted time only |
| Agent | Post-deadline work goes under "After the deadline" in the README, with a compare link from the tag | the README's top callout names the submitted tag |
| Agent | Corrections say what the submitted version still gets wrong | "The submitted v1.0.0 still has the error." where it applies |
| Owner | Keep the live URL up through judging: quotas, keep-alive, free-tier sleep | checked once a day until results |
| Agent | Credit any other team whose finding you used | named in the README and the blog |
