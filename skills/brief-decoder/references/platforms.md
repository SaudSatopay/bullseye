# Platforms: limits and quirks seen in real events

Each entry records only what a real event showed, and names the event. Limits differ per event even on one platform, so treat these as the questions to ask, then confirm the answers on the event's own pages and write them into the Contract. Used in brief-decoder step 2.

## Checks for any platform

Answer every one in the Contract, with the page you checked:

- **Video:** length cap, host (public or unlisted YouTube, a Drive link), audio required, file-size cap, formats.
- **Files:** size caps, formats, naming rule, embedded fonts, a mandatory organiser template.
- **Form:** field names, character limits, whether the boxes render Markdown, whether links and files are accepted, whether edits are allowed after submitting and until when.
- **Repo:** public at submission, or private and shared with named accounts; licence; history inside the window.
- **Judge access:** a live URL that works logged-out, sandbox or test accounts, how long it must stay up.
- **After the deadline:** what counts as an edit, and who must stay in which workspace.
- **Channel:** where rule changes and submission instructions are announced.
- **Identity:** anonymity rules for documents and their metadata.

## Devpost

Seen in OpenAI Build Week (StorePilot), Slack Agent Builder Challenge (Bridge), the Global AI Hackathon Series with Qwen Cloud (VyaparAI).

- Judging can run in stages. Build Week's Stage 1 checked fit and the required tech, pass or fail, before four equal criteria.
- Build Week's requirements: a demo video under 3 minutes, public on YouTube, with audio; a public repo with a licence, or a private one shared with the testing accounts named in the rules; a README with setup, sample data, run instructions and a section describing the collaboration with the required tool; session IDs from that tool; judge access to a working project; a text description and a track.
- After the deadline, the Slack Agent Builder Challenge's official update said: do not edit the project, because any change to the video, description, links or sandbox access can affect eligibility. The judges' accounts had to be active members of the sandbox workspace (accepted, not just invited) and stay in through judging.
- Media seen: a thumbnail and gallery images at 1200×800 (VyaparAI), plus a screenshot proving the deployment ran on the sponsor's cloud.
- Form fields seen (VyaparAI's paste-ready pack): elevator pitch, inspiration, what it does, how we built it, challenges, accomplishments, what we learned, what's next, built with, links.
- Results came weeks later: the Slack challenge closed on 13 Jul and scheduled its results for 12 Aug.

> Field note (Bridge · Slack Agent Builder Challenge): The tracker's only post-deadline action was a 2-minute check that the judges' accounts were accepted members of the sandbox workspace; after that, hands off the submission until results.

## Unstop

Seen in ET AI Hackathon 2.0 (Trinetra), and in several events on the builder's tracker.

- One competition page can carry several phases: ET ran an AI-proctored MCQ round, then a build sprint, then a finale.
- Shortlists and finale dates arrive as platform notifications and email, often with no date published in advance.
- ET's Phase 2 portal took a 3–4 minute demo video, mp4 or mkv, with a 50 MB cap; bigger files went as a Google Drive link (public, tested in a private window).
- Record the page's "last updated" stamp with your own check date.

## Hack2skill

Seen in IDBI Innovate 2026 (NAADI).

- Demo video at most 3:00. NAADI's demo script opened with "Hack2skill requires ≤ 3:00 … do not submit 3:15" once its 3:15 master needed a cut.
- A mandatory organiser template PPTX. NAADI filled it with python-pptx and left every branded header, footer and cover element untouched (depth in the sibling skill `pitch-deck`).

> Field note (NAADI · IDBI Innovate 2026): The rework shows in the history: a 3:15 script that gained a 2:00 cut and a "do not submit 3:15" warning once the limit was noticed, and a commit starting "fix(submission deck): drop video reference, clear template prompt overlap". Read platform limits before writing any artefact.

## HackCulture

Seen in NABARD Hackathon @ GFF 2026 (DhanDrishti), TrackShift Innovation Challenge 2026 (LINE MARSHAL), MUJ HackX 4.0 (Dhaal).

- PDF uploads capped at 10 MB. DhanDrishti's deck was recompressed under the cap: JPEG screenshots, no raster grain.
- The idea form sat behind a login. TrackShift's plan marked the fields Unknown until registration, then drafted to them.
- The listing can lag the event's own site: MUJ's nine tracks were public on the event site while the HackCulture page still said "revealing soon".
- Pages can disagree: TrackShift's FAQ and schedule gave different shortlist dates, the deadlines were extended, and a third-party page kept the old date. The plan trusted the official page and noted both.

## Smart India Hackathon portal

Seen in SIH 2026 (ORCA).

- The idea form's limits: Title 100 characters, Description 50,000, Abstract 10,000, a technology bucket, and a PDF upload of at most 10 MB. ORCA's paste-ready copy put the count in each heading ("89 / 100 chars").
- The idea deck follows the SIH template's six slides: Cover · Proposed Solution · Technical Approach · Feasibility & Viability · Impact & Benefits · Research & References.
- An internal (institute) round comes before the national one; check both calendars.

## Government portals (MSME and similar)

Seen in MSME Idea Hackathon 6.0 (Smart Retrofit Kit).

- The portal's sanitiser stripped `%`, apostrophes and semicolons from stored text. Write "per cent", avoid apostrophes and semicolons, and re-read the stored text after saving.
- Every choice locked on submit: host institute, category, all fields. Consult the host institute before choosing it.
- Anonymity: no name, phone, email, brand or firm in the concept note or the block diagram; no references to papers, news, people or firms; nothing in the file metadata; alphanumeric filenames; a vector PDF with a PNG backup.
- Eligibility was checked on the registration form itself: citizenship, age on a set date, a local mobile number.
- "Do not trust the portal under last-hours load": submit at least 24 h early, then save the acknowledgement privately (reference numbers stay out of any repo).
- The portal warned about fake websites and agents asking for money; applying was free. Use only the official domain.

## WeMakeDevs

Seen in Graph Hacks 2026 (Detour) and Mergetober.

- The event's overview, rules, schedule and resources live on separate pages; Detour's contract was read from all four on day 1.
- Judging criteria, weights and judges were not published. The rules carried a hard test for the sponsor's tech and allowed AI assistants with disclosure, provided the team could explain the graph model, queries, architecture and decisions.
- Required items: a public repo; a README with setup and the data model; the queries or algorithms the product depends on; a demo video; a live deployment (or a full local setup plus the video); the tracks named.
- A side prize for the best blog post, competed under the event's dev.to tag; T-shirts for the top 50 teams.
- The submission form's boxes do not render Markdown: paste plain text.
- Mergetober, a contribution campaign: no code before assignment, at most 5 open PRs, no pinging maintainers, a public blog post per PR in the contributor's own words, and "AI-generated PRs" get people banned, so the human must understand every line.

## Organiser templates, on any platform

- Produce the organiser's format next to your own deck. OneEarth 2026's official format was 5 slides plus up to 3 appendix pages, at most 10 MB, fonts embedded, named `TeamName_Institution_ChallengeCategory.pptx`, while WasteOS's presentation deck ran to 16 slides plus an appendix slide.
- Keep every template section, in order, with its own wording. ISRO's BAH 2026 template was 10 Google-Slides-exported slides at 10 × 5.625 in; SURYA rebuilt it in code at that exact size and reused the template's backgrounds byte for byte.
- Follow a sample's required flow exactly: FLOODLIGHT's MUSA CodeX deck followed the sample's 11-slide flow and opened with a "submission identity as required by the sample format" slide.

## Not yet in the field notes

MLH member events and Hacktoberfest have no project in the notes yet. Run the checks at the top of this file, write the answers into the Contract, and contribute the platform entry back to BULLSEYE (see the repo's `CONTRIBUTING.md`).
