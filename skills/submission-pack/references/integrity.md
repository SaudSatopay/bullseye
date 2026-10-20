# Integrity

What a judge saw at the deadline must stay findable, everything after it must be labelled, and every claim, credit and disclosure must survive a hostile reader. These rules come from the builder's own projects; the field notes say where each one was paid for.

## 1. The submitted version is a tag

Tag the exact commit you submit, push the tag, and write it down:

```bash
git tag -a v1.0.0 -m "Submitted to <event>, <date> <time> <timezone>"
git push origin v1.0.0          # the owner approves every push
git ls-remote --tags origin     # proof the tag reached GitHub
```

- Record the tag and its commit in BULLSEYE.md (Submission) and in TRACKER.md (sibling skill hackathon-tracker).
- In a hackathon this tag is the release tag. Sibling skill missile does not add a second one.
- Tag before pressing Submit, so the form, the tag and the README describe one commit.
- Never rewrite history after the tag: it changes the commit the judges saw.

## 2. Submit early, then freeze

- Submit at least 30 minutes before an onsite deadline and at least 24 hours before a portal deadline. Portals slow down in the last hours, and a government portal's form can strip characters such as `%` and `'` without warning (write "per cent", then re-read what it stored).
- Work to the internal deadline in BULLSEYE.md (official deadline minus the buffer, converted to your clock by sibling skill brief-decoder), never the official one.
- Record `SUBMITTED <time, timezone>` in BULLSEYE.md and TRACKER.md, with what was uploaded.
- Do not edit the submission after the deadline. Devpost warns that changes can affect eligibility, and the Slack challenge's own notes said the same.

## 3. After the deadline

Work can continue in the repository; it just must never pass for the entry. Put this callout under the README's deep links and a section below Evidence:

```markdown
> [!IMPORTANT]
> **The entry submitted before the deadline is [v1.0.0](https://github.com/<owner>/<repo>/tree/v1.0.0)**, tagged on <date> at <time, timezone> (the deadline was <time, timezone>), with [its README](https://github.com/<owner>/<repo>/blob/v1.0.0/README.md). This page and the live site describe the current version, which adds work done after the deadline: see [After the deadline](#after-the-deadline).

## After the deadline

Everything in this list was built after the submission deadline and is not part of the entry submitted as [v1.0.0](https://github.com/<owner>/<repo>/tree/v1.0.0) ([every change since](https://github.com/<owner>/<repo>/compare/v1.0.0...main)):

- **<Area>.** <What was added, in one or two sentences.>
```

- Numbers, badges and screenshots that changed after the deadline say so where they appear.
- When the live site now runs newer code, the callout says that too; when judging needs the submitted behaviour, keep a deploy of the tag.

> Field note (Detour · Graph Hacks 2026): The v1.0.0 tag landed 39 minutes before the deadline. The 49 commits made the next day went into an "After the deadline" section with a compare link, and the README's top callout points judges at the tagged version and its README.

## 4. Corrections

When you find an error after submitting, fix it and publish the correction where the claim lived, saying what the submitted version still gets wrong:

```markdown
- **<What was wrong>, fixed after the deadline.** <What the code did, with the numbers it produced>. <Who found it>. <What changed, and what now checks it>. The submitted v1.0.0 still has the error.
```

- Detour's counting error (a shuttle leg's two directions summed against one direction's capacity) went into "Where we lose" in exactly this shape, and into a follow-up post on the numbers that were wrong. Its lesson belongs in every proof plan: "An independent check needs independent semantics."
- Credit whoever found it, and credit other teams whose findings you used. Detour credited the team whose bug report on the sponsor's max-flow procedure led to its certificate check, in the README, the model spec and the blog.

## 5. AI disclosure

Say plainly what the coding agent did, what the people did, and how the output is verified, in the same words everywhere it is asked: the README's "Team and AI assistance", the form's AI field, the blog footer.

- A pattern that held up: "<Project> was built with <coding agent> as a pair programmer: it did much of the research, design, code, tests and documentation under our direction. <Runtime models, if any>. <What checks the output: tests, an independent recomputation, re-measured claims>."
- Kasauti's form answer separated the build from the runtime: AI pair-programming for code under human direction and review; at runtime an optional, user-supplied model; and "all evidence retrieval, credibility weighting and confidence guardrails are deterministic, reviewable code".
- When the event requires a tool (OpenAI Build Week required Codex and GPT-5.6), meet its proof rules: a README section with the exact name the rules use, the session IDs it asks for, and a dated `CODEX_LOG.md` (date, prompt, result) kept per commit. "The public history is your evidence of in-window work."
- The team answers "What did the AI build?" without notes (BRIEFING.md). Judges check that you understand your own code.
- Never use a live AI that listens to judges and answers for the team. A tool that turns questions into spoken answers "as your voice" breaks the trust the event runs on and, in most rules, the event itself. Rehearse with sibling skills judge-panel and finale-pitch instead.

## 6. Commit attribution

Decide the policy before the first commit and write it in BULLSEYE.md (Owner checklist): AI co-author trailers allowed, required, or forbidden by the event or by the owner.

- When trailers are forbidden, turn them off in the agent's settings before the first commit. Dhaal set `{"includeCoAuthoredBy": false}` in `.claude/settings.json`; check the setting name your agent uses today.
- Rewriting history to remove trailers later is expensive and risky. Do it only with the owner's approval, never after the submission tag, and only after a backup bundle: `git bundle create ../<repo>-before-rewrite.bundle --all`.

> Field note (ORCA · SIH 2026): Earlier commits carried AI co-author trailers that the owner did not want in a competition repo, and a history rewrite on 31 August purged them. Setting the attribution policy before the first commit costs one line.

## 7. Pre-existing work

- Say what existed before the window and what was built during it. "Built from scratch for this hackathon" only when it is true (Kasauti's "Prior existence" line).
- Mark the line in git: a tag at the window's start (`pre-<event>`), or the first commit made inside it.
- When the rules are unclear about earlier work or AI use, ask the organisers in writing and quote the answer in BULLSEYE.md (Contract). "Get it in writing; disclose everything."
- Events that allow earlier projects still reward proof of the day's work: ORCA's Vibeathon deck showed a git-log timeline of the challenge built that day, with test counts before and after.

## 8. Licences and credits

| What | Rule | Example |
|---|---|---|
| The repository | MIT unless the rules ask otherwise; MIT or Apache-2.0 when they require an OSI licence | engram's event required MIT or Apache, and it shipped Apache 2.0 |
| Fonts | Google Fonts use the SIL Open Font License; name each family in the README credits | ORCA credits Fraunces, Archivo, Spline Sans Mono and Noto Serif Devanagari, self-hosted |
| Photos | Real photography only (Wikimedia Commons, NASA, OpenStreetMap-based maps), never generated images presented as real; one record per image in `assets/photo-credits.json`; a credit chip on the image; a credits line on the last slide and in the README | ORCA's SIH deck: four Commons photos under CC BY-SA 4.0, CC BY 2.0, CC0 and CC BY-SA 3.0 |
| UI kits | A `LICENSES.md` beside vendored components, one line per kit and its terms | ORCA: Magic UI under MIT; React Bits under MIT plus Commons Clause, which forbids selling the components themselves; a shader kit whose public use needed a paid plan was rejected |
| Data | Cite the dataset, its URL, its licence and the date read; OpenStreetMap data is ODbL, so show "© OpenStreetMap contributors" and share derived databases alike | Detour's Data section links every MTA dataset and labels its sample riders |
| Starting points | Name the template or earlier work you began from | Bridge credits Slack's bolt-js-starter-agent template |
| Names and logos | Add "not affiliated with" when you use an organisation's data or name; no logos you have no right to | Detour's banned list includes the MTA logos |

The photo ledger, one object per image:

```json
[
  {
    "local": "assets/photos/harbour.jpg",
    "commons_file": "<file name on Wikimedia Commons>",
    "url": "https://commons.wikimedia.org/wiki/File:<file name>",
    "license": "CC BY-SA 4.0",
    "artist": "<author as Commons credits them>"
  }
]
```

CC BY and CC BY-SA require the attribution; BY-SA adaptations carry the same licence; CC0 and US federal works such as NASA's need none, and you credit them anyway. A chip on the image reads like "PHOTO: <AUTHOR> · WIKIMEDIA COMMONS · CC BY-SA 4.0".

## 9. Process files and the public repository

The policy is set at intake in BULLSEYE.md (`process: private` by default): a real jury never sees how to judge you.

- Private: BULLSEYE.md, MISSILE.md, PRODUCT.md, DESIGN.md, handoffs, judge prompts, QA-BANK.md, RUNSHEET.md, `.claude/`, `.missile/`, and the submission prep (SUBMISSION.md, BRIEFING.md, blog drafts). Append `../assets/gitignore-process.txt` to `.gitignore` and to `.vercelignore`.
- Always public: CLAIMS.md and LIMITS.md, the evidence judges are meant to read.
- To keep a file local without naming it in the public `.gitignore`, list it in `.git/info/exclude`; Detour kept its form answers and briefing there.
- A process file that was already pushed: `git rm --cached <file>`, commit, and decide with the owner whether history matters. Removing it from history is a rewrite (backup bundle first, never after the tag).
- When the event asks to see agent instructions (CLAUDE.md, AGENTS.md, a prompt log), publish a clean copy; strategy and judge notes stay private.

## 10. Secrets

- Keys live on the host and in an ignored `.env` file, never in the repo, a screenshot, the video or a chat. A key checker prints OK or FAIL, never the value.
- A key that was ever committed or pasted into a chat is burned: rotate it at the provider first, then clean up. Dhaal's handoff listed "Rotate after the event: every secret that passed through chat" as an owner action.
- The sweep scans the working tree and every commit (`git log -p --all`) for key-shaped strings and committed `.env` files, and prints only a masked prefix.
- On a public deploy, leave paid-model keys unset when an open URL would let anyone spend your credits (RegSutra's README says so, and its public deploy runs a replay mode that needs no key).

## 11. Claims that match the code

Every number comes from facts.json and a command that re-measures it (sibling skill prove-it); sample, simulated, projected and illustrative numbers carry their label where they appear. Before the tag, audit claims against the code, not just the documents: NAADI's README promised "a replayable agentic run with real pipeline timings" while the code hardcoded the millisecond values. A claim the code cannot back is a correction waiting to happen.
