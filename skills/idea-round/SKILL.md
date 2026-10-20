---
name: idea-round
description: Win idea, proposal and concept gates, the round where most teams are cut before anything is built. Sets the quality bar, writes the narrative spine, proves the core first, writes paste-ready answers within every limit, hardens each claim and records the submission. Use it when a first round asks for an idea submission, concept note, proposal PDF, idea deck, organiser template or a portal form with character limits (SIH, ISRO, bank and government hackathons, MSME-style calls), when re-pitching a project into a new round, or when the user says "Round 1", "proposal", "fill the template", "form answers", "character limit" or "shortlist".
argument-hint: "[spine | proof | form | harden | template <file> | gov | repitch | submit]"
license: MIT
metadata:
  author: Saud Satopay
  version: "1.0.0"
  part-of: bullseye
---

# Idea round

Many hackathons, Indian and government ones above all, cut most teams at the idea stage, before anyone writes code. Treat that gate as the contest: "The idea submission is the real elimination round: expect a single-digit advance rate." This skill takes the Contract and Thesis that `brief-decoder` wrote into `BULLSEYE.md` and turns them into a submission that survives the gate. It confirms the exact format, sets the quality bar, writes one narrative spine, proves the core before pitching, writes form answers that fit their boxes, labels every number for what it is, honors the organiser's template and records the submission. It decides what goes in; the sibling skill `pitch-deck` decides how it is rendered.

> Field note (LINE MARSHAL · TrackShift 2026): the event had 2,444 registrations for a finale expected to match the last edition's 50 or so teams, so the battle plan treated the idea form as the elimination round, and the entry went in two days early while edits were still allowed.

## Calling it

| Argument | Runs |
|---|---|
| none | Steps 1 to 11, resuming from the `status:` line in `BULLSEYE.md` |
| `spine` | Step 3 |
| `proof` | Step 4 |
| `form` | Step 6 |
| `harden` | Step 7 |
| `template <file>` | Step 8 on that template |
| `gov` | Step 9 |
| `repitch` | Step 10 |
| `submit` | Step 11 |

In Claude Code the command is `/bullseye:idea-round` with the plugin, or `/idea-round` after `npx skills add SaudSatopay/bullseye`. Elsewhere, ask the agent to run the idea-round skill with the same argument.

## Inputs

- `BULLSEYE.md` with `## Contract` (facts, rounds, deliverables and limits, hard rules, traps, the `### Requirements gate` R lines, judges) and `## Thesis`, written by the sibling [brief-decoder](../brief-decoder/SKILL.md). If it is missing, run it first; used alone, collect the step 1 facts yourself and write them under `## Contract`.
- The organiser's own material: the rules or instructions PDF, judging criteria, the form fields as the portal shows them, any template or sample deck, any dataset.
- For a re-pitch: the existing repo and its current measured numbers.
- Human-only facts (eligibility, who applies, calls to a host institute, portal logins), which live in `## Owner checklist`.

## Procedure

Each step ends at a gate. When a gate passes, update the status line (`phase=idea step=<n> updated=<ISO> next="<one action>"`); log real decisions under `## Decisions` as dated one-liners with the why.

### 1. Confirm the exact format

1. Read `## Contract` and check that each fact this round depends on is there with a source: the medium (document, deck, form essays, video, mandatory template), page or slide count and size, every form field with its limit, file type, size cap, naming rule, fonts, whether links, a repo or a video are accepted, whether a prototype is allowed this round, anonymity rules, edits after submitting, shortlist dates or waves, who judges, any organiser data.
2. Fill gaps from the organiser's material, never from memory, and add them to the Contract in its own format (value, source, read date). Copy field names and limits verbatim: "We draft to the template, not to a generic deck." A form behind a login becomes an owner action: "paste the exact form fields".
3. Mark what you could not confirm as Unknown, Unverified or Ambiguous, with the action that settles it, and copy it to `## Risks`.
4. Copy `assets/SPINE.template.md` to `idea/SPINE.md` and write its Round plan: the artifact set (step 5), which R lines each artifact meets, the rhythm and the route.
5. Rhythm. Edits allowed until the deadline: submit v1 as soon as the spine and one artifact pass step 7, then resubmit; shortlist waves can give an early entry two reads. Locked on submit: one submission at least 24 hours before the deadline, after the anonymization pass.
6. Route. A government or funding programme runs step 9's eligibility gate now. A template or sample deck lets step 8 decide the official cut. An existing project or a staged event lets step 10 shape the spine. Organiser data makes step 4 mandatory.

Gate: every fact in item 1 has a value or "not published (checked <page>)", every R line for this round maps to an artifact, and the rhythm and route are written.

> Field note (NAADI · IDBI Innovate 2026): the demo script was written to 3:15 before anyone checked the platform cap of 3:00 ("do not submit 3:15"), so it had to be cut late. Read every limit before writing anything.

### 2. Set the quality bar

An idea document is done only when it has all six:

1. numbers in the problem statement;
2. an architecture diagram;
3. named data sources;
4. declared metrics;
5. a real-world deployment path with market size;
6. an honest scope for the build window.

"If any is missing, it's not done." Then, in `idea/SPINE.md`:

- Map every rubric criterion to the evidence that will hit it: criterion and weight, what wins it, our evidence, where it shows (brief page, deck slide, form field). A criterion with no evidence is a hole in the story.
- When the event's domain is narrow, use the dual layer from the Thesis: the domain is the proof, a real-world problem is the point. It scores the impact and scalability criteria that a pure-domain entry cannot.
- Weight what this jury scores and give it the most room. Bankers score governance and risk; practitioners punish hand-waving.

Gate: the six items are planned against named parts of the spine, and every criterion has evidence and a place.

> Field note (LINE MARSHAL · TrackShift 2026): the three themes were pure F1 problems and two of the six criteria were "nearly unscoreable for a pure F1 tool", so the entry pitched the same line-crossing engine on Indian roads as well: "motorsport is the proof, India is the point".

### 3. Write the narrative spine

Fill the spine table in `idea/SPINE.md`, part by part, with [references/pitch-skeleton.md](references/pitch-skeleton.md) open. The 14 parts:

1. **Cover:** the name huge, a 3 to 5 word tagline, event, theme, date, team, a document serial and revision.
2. **Problem:** one concrete incident, three numbers, their sources.
3. **Gap and why now:** the "solved elsewhere" row with years, the rails that just went live, the seat nobody has taken.
4. **Reframe and solution:** a one-line reframe, 3 to 6 verbs or agents mapped to the user's journey, one principle line.
5. **Product mock:** live text, and the featured case is the uncertain one, handed to a human.
6. **How it works:** layers, a latency or cost budget, why it holds up.
7. **Unfair advantage:** "Everyone else… Us…".
8. **Proof declared in advance:** 3 or 4 targets, how each is measured, the naive baselines.
9. **Impact:** typed numbers, plus what is not yet counted.
10. **Transfer and scale ladder:** the same engine at every rung, with the market size.
11. **Business model, or why this sponsor wins,** when the rubric scores it.
12. **Execution:** hour-by-hour plan, demo script, backup video, pre-mortem.
13. **Close:** the tagline as headline, roster, a small specific ask, sources, the illustrative disclaimer.
14. **Appendix:** "Every number, and where it came from."

Headlines are claims, usually in two beats: "Not a chatbot. An AI crew." "Agents draft. Humans fire." Read the 14 headlines aloud without their bodies; if they do not argue the case, fix the headlines before the bodies. Write every number into the Numbers table with its label and source the moment it appears.

Gate: all 14 parts are drafted or marked "not used" with the reason, the headlines pass the read-aloud test, and no number lacks a label.

### 4. Prove the core before pitching

"Evidence beats promises, even at idea stage." Take the path that fits ([references/proof-before-pitch.md](references/proof-before-pitch.md)):

- **The organiser gave you data:** prove the core on it now, with scripts in `proof/` that print their evidence and write JSON. Audit for leakage first (the audit becomes the hero story), validate out of fold, report rare-event metrics and never accuracy, put a bootstrap confidence interval on the headline ("not a naked point"), run the brief's own listed features through the same pipeline as the baseline, measure latency and state its scope, and show roadmap capabilities on a clearly labelled public proxy. Close with a PROVEN vs OPEN RISKS box and a Methods block that names the script behind each number.
- **No data:** build a thin vertical prototype, one input end to end, then capture screenshots, a 90-second recording and a repo link if the form accepts links.
- **This round forbids prototypes or links:** prove it anyway and cite the measured numbers with their Methods line.

For claim ledgers, eval sets and benchmarks in depth, use the sibling skill [prove-it](../prove-it/SKILL.md) (install the full set with `npx skills add SaudSatopay/bullseye` if missing); its `bootstrap-ci.py` and `latency-bench.mjs` cover the interval and an HTTP timing, and it uses the same six number labels.

Gate: every headline metric is MEASURED by a committed script (path and output in the Numbers table) or labelled TARGET with how and on what it will be measured.

> Field note (MuleShot · BOI × IIT Hyderabad 2026): the Round 1 PDF told its proof as trap, audit, truth. A naive model scored 0.9998; the audit found a target proxy and a month code that matched the 81 mules exactly; the hardened model caught 90% of mules in the top 5% of accounts, reported with a 95% interval of 83.5 to 96.5%.

### 5. Produce the artifacts through pitch-deck

This skill decides what goes in. The sibling `pitch-deck` decides how it is rendered, size-gated and checked. Pick the set from the Contract:

| Artifact | Make it when | Built from |
|---|---|---|
| Concept brief, A4, about 8 pages, reads without a presenter | the round accepts a document | `idea/SPINE.md` |
| Idea deck, 16:9, one idea per slide, speaker notes on every slide | a deck upload or an online pitch | `idea/SPINE.md` |
| Organiser-template fill and the official cut | a template, sample deck or slide count is given | step 8 |
| Image-per-slide PPTX | the platform wants PPTX and the design lives in HTML | the PDF render |
| Paste-ready form pack | a portal form | step 6 |
| 90-second recording | links are accepted | the thin prototype |

- Same content, three formats. The brief is dense and standalone, the deck is one idea per slide with notes, the essays are plain text. All of them carry the same numbers and the same headlines.
- Keep prose: "it's a proposal, not an infographic". The cover, problem and close carry sentences. Decline gimmicks such as a QR code in an idea PDF.
- Commit every generator and its inputs next to its output; scratchpads disappear.

Gate: the drift check passes: every number in the brief, deck and form appears in the Numbers table with the same value and label. With `prove-it` installed, its `claims-check.mjs` runs this check from `facts.json`; otherwise run `form-check.mjs --numbers` (step 6) on the form and check the deck and brief row by row.

> Field note (LINE MARSHAL · TrackShift 2026): one body of content shipped as an 8-page A4 brief, a 12-slide deck with speaker notes and three essays of 1.7k to 2k characters, all carrying the same numbers.

### 6. Write the form answers

Copy `assets/SUBMISSION-FORM.template.md` to `idea/SUBMISSION-FORM.md`. One heading per form field, in the form's order, each carrying its budget: `## 6. Newness (1460/1500 chars)`. Paragraph structures for each essay type are in [references/form-answers.md](references/form-answers.md).

- Fill 91 to 97% of each binding limit. When a limit is generous (an SIH description allows 50,000 characters; ORCA's used about 4,300), write what a judge will read and stop.
- Measure, never estimate: the ORCA pack's headings said "~3,400" and "~1,550", and the texts measured 4,259 and 1,601.
- Title shape: name + what it does + where it lands ("LINE MARSHAL - AI Line-Calling for Race Control, Built for India's Roads"). When names are forbidden: what it is + what it does + for whom.
- The three essays most forms ask for: solution and innovation, technologies and datasets, validation.
- Tone: confident and concrete. No adjective without a number.
- Form-safe characters: plain hyphens, straight quotes, ASCII stand-ins (Rs, +/-, >=). One government portal's sanitizer stripped `%`, apostrophes and semicolons from stored text: write "per cent", and re-read what was stored.
- Plain text only: form boxes do not render Markdown.
- Dropdowns go in a table with the exact option text. Uploads follow the checklist: vector PDF plus a PNG backup, alphanumeric file names, identity stripped from files and their metadata when anonymity is required.

Check every field the way a portal counts it:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/form-check.mjs" idea/SUBMISSION-FORM.md --fix --numbers idea/SPINE.md
node "${CLAUDE_SKILL_DIR}/scripts/form-check.mjs" idea/SUBMISSION-FORM.md --forbid "%';" --anon --terms "<team>,<institute>,<product>"
```

Other agents: run the same script from this skill's folder, passing the path of the form file. `--fix` writes the measured counts into the headings; `--numbers` warns about any number in the form that is missing from the Numbers table; `--forbid` takes the characters this portal strips; `--anon` fails on emails, phone numbers, URLs and the listed terms. A line break counts as 2 characters by default because browsers submit CRLF; `--help` lists the rest.

Gate: form-check exits 0 with this portal's `--forbid` set, and `--numbers` reports nothing missing.

### 7. Harden every claim

Plan this as a pass with its own time slot before submission, not as a cleanup at the end. Two reviewers, then fixes.

1. **Hard critic,** fresh context, no build history. In Claude Code: the `claims-auditor` subagent (`bullseye:claims-auditor` from the plugin), or a scored round with the sibling `judge-panel`. Elsewhere: a new session given only the rules, rubric, artifacts, the Numbers table and the prompt below.
2. **Cross-model check:** the same prompt, plus the proof scripts, through a different model family. One model's habits hide what another catches.

```text
You are a hostile reviewer of a hackathon idea submission. You have the rules, the rubric,
the submission files and a Numbers table. For every claim, check its label (SOURCED,
MEASURED, SIMULATED, PROJECTED, TARGET, ILLUSTRATIVE) and whether its source or script
backs it. List overclaims (autonomy, mandates, adoption, accuracy), numbers that disagree
across files, mock-ups that show what the data cannot support, competitors drawn unfairly,
prior art we did not name, and anything this jury (<jury>) would punish. For each finding
give file, quote, why and fix. Then list what you checked that turned out fine.
```

Apply the findings, then sweep the whole submission ([references/number-taxonomy.md](references/number-taxonomy.md)):

- Label every number on the artifact itself, and put a status chip on every product slide (IMPLEMENTED, PROTOTYPED, SIMULATED, FUTURE), "set to what the deck can honestly claim today".
- Use placeholders that refuse to lie: a dashed frame reading "PROTOTYPE PHOTO GOES HERE", never a mock-up in a slot meant for the real thing.
- Disclose the unflattering comparison beside the flattering one.
- Delete every claim you cannot verify. Cut autonomy down to what a human approves: "freezes" became "recommends a hold … maker-checker".
- Name the closest prior art yourself, rate competitors fairly (●/◐/○, "not strawmanned"), and position as a complement to the incumbent when that is true.
- Remove every em dash from judge-facing text, using a colon, comma, period, parentheses or middot instead.
- Record each change in the Claims changed table in `idea/SPINE.md`: draft, final, why, who caught it.

Gate: every finding is fixed or logged as a non-issue with the reason, the Claims changed table is current, and form-check and the drift check pass again.

> Field note (MuleShot · BOI × IIT Hyderabad 2026): hardening moved the headline from 96% to 90% after a second model caught a month leak that type coercion had hidden, deleted an unverified government mandate, turned "freezes the proceeds" into a recommended hold with maker-checker and an audit log, and dropped seat pricing because the IPR was co-owned.

### 8. Honor the organiser's template, then out-build it

When a template or sample deck is given ([references/organizer-templates.md](references/organizer-templates.md) has the section lists for SIH, ISRO BAH, Indian bank templates, Vibeathon, OneEarth and MUSA CodeX):

1. Inventory it: slide size, slide count, every section title verbatim, the prompt text on each slide, background art and logos, fonts, required identity fields, optional slides.
2. Fill it, or rebuild it at its exact size with its background art reused byte-identical. Keep every section in order and use its wording as the kicker label. Blank the prompt bullets so they cannot overlap your content.
3. Add the sections judges reward that the template leaves out, next to the section they extend: validation against named baselines, data availability, risks, impact, roadmap, a budget with ranges ("lean by design"), disclosure of existing work.
4. Always produce the organiser-format cut as its own file, separate from any longer presentation deck: the official slide count, size cap, embedded fonts and naming rule.
5. Look at every rendered slide before upload; `pitch-deck` owns the render and the overflow check.

Gate: the section order matches the template, the official cut meets every file rule, and every slide was checked as rendered.

> Field note (FLOODLIGHT · MUSA CodeX 2026): the Round 1 deck followed the sample's required flow exactly, down to a slide titled "00 · SUBMISSION IDENTITY · AS REQUIRED BY THE SAMPLE FORMAT", reused the organiser's logo and glow art from the sample file, and qualified for Round 2.

> Field note (WasteOS · OneEarth Hackathon 2026): the 16-slide talk deck was not the submission. The guidelines asked for 5 slides plus up to 3 appendix pages, at most 10 MB with fonts embedded, named TeamName_Institution_ChallengeCategory.pptx, so the official cut was planned from four talk slides plus a team slide.

### 9. Government and funding idea programmes

Funding-and-incubation calls are "not a weekend coding event": an approved idea gets money and a host institute to build it over about a year, after several review stages. When the Contract says so:

1. Eligibility gate first: citizenship, age, category and documents. The category usually cannot change after submission. If the applicant fails the gate, stop.
2. Lock five decisions today: the idea (one only; duplicate or similar ideas disqualify), the theme, the category, the host institute (consult them first; the choice locks), the applicant.
3. Map the idea's wording to the theme text and the official Do's, quoting them.
4. Write `idea/CONCEPT-NOTE.md` from `assets/CONCEPT-NOTE.template.md` (8 parts: problem sized, solution, novelty, technical approach with 12-month milestones, budget within the cap, impact, scalability and business model, risks) and a one-page block diagram.
5. Check the instant-rejection traps: identity in the note, the diagram or a file's metadata; references to papers, news or firms when they are forbidden; copied text; incomplete uploads.
6. Run the anonymization pass (`form-check.mjs --anon --terms ...` on the text; `pitch-deck`'s `finalize-pdf.py --strip-metadata` on every PDF; author fields cleared in Office files), then submit at least 24 hours early: "Do not trust the portal under last-hours load."
7. "Submit only if you intend to build it." The applicant commits to the build.

Gate: the human confirmed eligibility, the five decisions are under `## Decisions`, and the anonymization pass is clean.

> Field note (Smart Retrofit Kit · MSME Idea Hackathon 6.0): the pack went in two days before the deadline, and the portal's sanitizer still stripped `%`, apostrophes and semicolons from the stored essays, which could not be edited after submission.

### 10. Multi-round, re-pitch and surprise rounds

- **Round 1 promises, Round 2 runs.** Write Round 1 so every promise can become an acceptance test. The next round's closer is "Round 1, we promised this. Round 2, it runs." Hand the declared metrics and the hour plan to the sibling [build-sprint](../build-sprint/SKILL.md) as `Accept:` lines.
- **An existing project in a new event:** confirm the rules allow pre-built work ("Get it in writing; disclose everything."), then disclose on the artifact what existed, what is new and what is reused.
- **Surprise-challenge events:** the Stage 1 deck pre-commits the seams where new work snaps in, and a 12-hour playbook; Stage 2 pays them off seam by seam. The sibling `finale-pitch` covers the live payoff.
- **Design system reuse:** carry a proven brief or deck system to the next event, re-themed through role-named tokens.

Details and the seam slide: [references/multi-round.md](references/multi-round.md).

Gate: the next round's promises are in the spine, and the disclosure of existing work is on the artifact.

> Field note (ORCA · Vibeathon 2026): the Stage 1 slide "Hand us any challenge. The crew absorbs it." listed six seams and an H0 to H12 playbook. ORCA reached Stage 2, where the mentor's challenge landed in those seams and went from brief to the shipped gate in 2 h 45 min.

### 11. Submit and record

1. Work through `assets/quality-bar.md`. An unchecked line blocks submission, or becomes a dated line under `## Decisions` saying why it does not apply.
2. The human submits. Portal accounts, OTPs and the final click are owner actions; hand over the file list, the paste order and the dropdown table.
3. Re-read what the portal stored, field by field, against `idea/SUBMISSION-FORM.md`, and save a screenshot or download of the submitted view, plus the confirmation email or page, in the private `brief/` folder.
4. Record it in `BULLSEYE.md`: the status line (the next gate in `next=`), and a `### ▶ STATUS · idea round submitted · <date time TZ>` block in `## Log` holding `SUBMITTED <date time TZ> · under review`, the files with sizes, the acknowledgement ID (`BULLSEYE.md` is private; never put the ID in a public file), the next gates with dates, and what the next round needs. The sibling [hackathon-tracker](../hackathon-tracker/SKILL.md) reads these lines for the portfolio row.
5. When edits are allowed, log v1 and every resubmission the same way. Nothing changes after the deadline.
6. Start next-round prep the same day: the declared metrics become the build plan.

Gate: the SUBMITTED line has a time and timezone, and the next gate has a date.

## Outputs

| File (user's project) | Holds |
|---|---|
| `idea/SPINE.md` | round plan, quality bar, criteria map, the 14 parts, Numbers table, proven and open risks, Claims changed table, disclosure of existing work |
| `idea/SUBMISSION-FORM.md` | the paste-ready form pack |
| `idea/CONCEPT-NOTE.md` | government and funding calls only |
| `proof/` | proof scripts and their JSON results |
| rendered brief, deck, template cut | wherever `pitch-deck` writes them |
| `brief/` (gitignored, created by `brief-decoder`) | the submission confirmation and a screenshot of the stored form |

`BULLSEYE.md`: the status line at every gate; `## Contract` (missing facts only, each with its source); `## Decisions`; `## Risks` (unconfirmed facts, open risks from step 4, portal risks); `## Owner checklist` (human-only rows); `## Claims` (headline numbers, when `prove-it` has not filled it); `## Log` (the STATUS blocks, including SUBMITTED).

`idea/SPINE.md` and `idea/SUBMISSION-FORM.md` hold strategy and identity fields: keep them private under the process-file policy, like `BULLSEYE.md`.

## Guardrails

- Never invent a number, quote, partner, pilot, mandate or user count. A number without a source or a script is a TARGET, or it goes.
- Never present a mock-up as a screenshot, simulated data as live, or a target as a result.
- Never submit for the human or type their credentials. Prepare everything; they click.
- Never ride the deadline. Locked forms go in 24 hours early; editable forms get v1 early.
- Never let the brief, deck and form drift apart. A changed number changes in the Numbers table first, then everywhere it appears.
- Keep organiser data inside the project with relative paths, and record which file each number came from.
- One idea per programme when the rules say so, and never the same idea to two hosts.

## Reference map

| File | Use it for |
|---|---|
| [references/pitch-skeleton.md](references/pitch-skeleton.md) | the 14 parts, what goes on each, headline formulas with real examples, one body of content in three formats (step 3) |
| [references/form-answers.md](references/form-answers.md) | essay structures paragraph by paragraph, MSME and SIH patterns, budgets, portal-safe text, anonymization (step 6) |
| [references/number-taxonomy.md](references/number-taxonomy.md) | the six number labels, status chips, honest placeholders, the appendix, spoken disclosure (steps 3 and 7) |
| [references/organizer-templates.md](references/organizer-templates.md) | template section lists, honor then out-build, the official cut (step 8) |
| [references/proof-before-pitch.md](references/proof-before-pitch.md) | proving the core on organiser data, the thin-prototype path (step 4) |
| [references/multi-round.md](references/multi-round.md) | round arcs, re-pitching with disclosure, surprise-round seams, reusing a design system (step 10) |
| [assets/SPINE.template.md](assets/SPINE.template.md) | `idea/SPINE.md` |
| [assets/SUBMISSION-FORM.template.md](assets/SUBMISSION-FORM.template.md) | `idea/SUBMISSION-FORM.md` |
| [assets/CONCEPT-NOTE.template.md](assets/CONCEPT-NOTE.template.md) | `idea/CONCEPT-NOTE.md`, in the 8-part and 11-section shapes |
| [assets/quality-bar.md](assets/quality-bar.md) | the pre-submit checklist (step 11) |
| `scripts/form-check.mjs` | budgets, fill, portal-safe characters, literal Markdown, anonymity, numbers missing from the spine; `--help` for every option |

Sibling skills: [bullseye](../bullseye/SKILL.md) (control file, status line, owner checklist), [brief-decoder](../brief-decoder/SKILL.md) (the Contract), `pitch-deck` (rendering, size gates, PDF metadata), [prove-it](../prove-it/SKILL.md) (claims, facts, intervals), `judge-panel` (scored rounds), [build-sprint](../build-sprint/SKILL.md) (the next round's build), `finale-pitch` (live rounds), [hackathon-tracker](../hackathon-tracker/SKILL.md) (the portfolio row). Install the full set with `npx skills add SaudSatopay/bullseye` if one is missing.
