# Organiser templates

Many idea rounds hand out a template (a PPTX, a Google Slides export, a sample deck) or a fixed slide list. Reviewers score against it, often section by section. The method: honor the template, then out-build it.

## The method

1. **Inventory the template** before writing: slide size (Google Slides exports are often 10 × 5.625 in, not 13.333 × 7.5 in), slide count, every section title verbatim, the prompt text on each slide, background art and logos, fonts, required identity fields (team name, leader, problem-statement id), optional slides, and any limits printed in the guidelines (slide count, file size, naming).
2. **Keep every section, in order, with its wording.** Use the template's own section names as the kicker labels ("WIREFRAME / MOCKUP", "SYSTEM ARCHITECTURE", "TECHNOLOGY STACK", "BUDGET" on SURYA). Never rename, merge or drop a required section.
3. **Keep the branding untouched.** Reuse the template's background images byte-identical, keep its headers, footers and logos, and blank its prompt bullets so they cannot overlap your content.
4. **Out-build it.** Insert the sections judges reward that the template leaves out, next to the section they extend (table below).
5. **Produce the official cut as its own file,** separate from any longer presentation deck, to the organiser's exact count, size cap, fonts and name.
6. **Render and look.** Export through PowerPoint (or the platform's own viewer) and look at every slide; the sibling `pitch-deck` owns the render, the overflow check and the size gate.

## Three ways to work with a template

| Route | What it is | When it was used |
|---|---|---|
| Native fill | open the organiser's file with python-pptx; add text boxes, cards, arrows and cropped screenshots; leave every branded element alone | NAADI (IDBI Innovate 2026); ORCA's Vibeathon submission |
| Rebuild at the exact size | rebuild the deck in code (pptxgenjs) at the template's size, reusing its background art and logos byte-identical | SURYA (ISRO BAH 2026); FLOODLIGHT (MUSA CodeX 2026) |
| House deck mapped to the sections | your own design system, one slide per template section, exported to PDF | ORCA (SIH 2026), when the portal took a PDF idea template |

When the rules say the template is mandatory, use the first or second route. The third fits only when the rules accept any PDF that covers the template's sections.

## Template catalogue

### SIH idea deck and portal form

- **Sections (6):** Cover · Proposed Solution · Technical Approach · Feasibility & Viability · Impact & Benefits · Research & References.
- **Form:** Idea Title (at most 100 characters) · Idea Description (at most 50,000) · Abstract/Summary (at most 10,000) · the idea template PDF (at most 10 MB) · Technology Bucket (dropdown) · a video link (optional).
- **What ORCA did:** a v1 on the stock template was superseded by a 16:9 HTML deck mapped to the six sections, with the disclaimer "App screens in the deck are illustrative concept mock-ups"; the idea PDF for upload was 2.1 MB against the 10 MB cap. Headlines came in two beats ("Not a chatbot. An AI crew." "Proven parts. Honest risks." "Every value, sourced."), and the last slide carried a boxed ask.

### ISRO Bharatiya Antariksh Hackathon (10 slides)

- **Template:** 10 slides at 10 × 5.625 in in Google Sans; every slide a full-bleed branded image plus prompt text.
- **Sections:** cover fields (Team Name, Team Leader, Problem Statement) · team table · opportunity ("How different ... How will it solve ... USP") · features (asks for visual representations) · process flow or use case · wireframes (optional) · architecture · technologies · estimated cost (optional) · closing.
- **What SURYA did:** rebuilt in code at the exact size and reused the three background images byte-for-byte; kept every section with its name as the kicker; grew from 10 to 16 slides with an AI and model core, a data foundation ("pre-train now, de-risk data access"), validation, impact and a roadmap tied to the event's dates. The validation slide charted named baselines with the target labelled as a target (Persistence 0.18, Climatology 0.31, "SURYA (target)" 0.82) above a risks table. The optional cost slide became a budget, "PROTOTYPE TOTAL ₹ 11k – 28k", "Lean by design". Pain: the generator was never saved.

### Indian bank template (IDBI Innovate, 14 slides)

- **Sections:** Team details (team name, leader, problem statement) · Brief about the idea · Opportunities (How is it different? How does it solve the problem? USP) · Features · Process flow · Wireframes · Architecture · Technologies · Estimated implementation cost · Snapshots · Performance report or benchmarking · Future development · Links (GitHub and live product, with QR codes) · closing.
- **What NAADI did:** python-pptx filled the official file and left "every branded header, footer and cover element untouched"; blanked the prompt bullets but kept each heading; set Opportunities as three cards (different, solves, USP); drew a serpentine 10-step process flow with a feedback loop; cropped live-console screenshots for Snapshots and Benchmarking; split cost into "Concept build (done)", "Sandbox PoC", "Pilot (indicative)" and "At scale (indicative)"; answered "Why not '90% accuracy'?" on the benchmark slide and labelled it "Synthetic-population validation of the architecture, not a market claim." Then PowerPoint exported the PDF.
- **Pain:** a later commit had to "clear template prompt overlap". Blank every prompt bullet before placing content.
- The ISRO list has the same shape, so expect it in other bank and public-sector idea rounds.

### Vibeathon (10 sections)

- **Sections:** Team & project · Problem · Solution & validation · Business model & revenue · Competitors & market advantage · Technology, scalability & moat · Working product/demo · Future roadmap · Team & roles · Conclusion.
- **What ORCA did:** kept the organiser's canvas untouched (white ground, purple shapes, section titles, both logos) and composed its own design inside it as native, editable objects: statement headlines with one accent word, mono chips and credits, caption chips on photos, stat blocks, phone bezels, cards. Photos became fade panels z-ordered behind the template art, so the logos and titles rendered over them. Diagrams went in as 2,600 px renders; fonts were embedded (5 subsets); every one of the 10 slides was checked as PowerPoint rendered it. For Stage 2, five challenge slides went in right after "Solution & validation". An all-house-design 10-section variant was kept as an alternative.

### OneEarth International Hackathon (5 slides plus up to 3 appendix pages)

- **Sections:** team · problem · solution · impact & feasibility · implementation & scalability.
- **Rules:** at most 10 MB, fonts embedded, named `TeamName_Institution_ChallengeCategory.pptx`. The team slide asks for the institution's name and logo, each member's role, and the lead's email and phone.
- **What WasteOS did:** kept its 16-slide presentation deck separate and planned the official cut from four talk slides plus a team slide.

### MUSA CodeX (11-slide sample flow)

- **Flow:** title · "00 · SUBMISSION IDENTITY · AS REQUIRED BY THE SAMPLE FORMAT" (domain, problem statement, its number, team name) · 01 problem statement & target users (the pain, who bleeds, why it stays broken, what happens if nothing changes) · 02 team details & selected theme · 03 existing solutions & their limitations · 04 proposed solution & key innovation · 05 technical approach / system workflow · 06 feasibility & expected impact · 07 development plan · 08 solution summary / expected outcome · 09 references & disclosure of existing work.
- **What FLOODLIGHT did:** a pptxgenjs rebuild in the house style, with the organiser's logo and glow art extracted from the sample PPTX; every slide a mono kicker plus a two-colour statement headline. Slide 03 named the closest prior art and what it lacks ("We name the closest prior art ourselves"); slide 09, "CHECK OUR HOMEWORK.", listed the sources, the photo licences and a disclosure-of-existing-work box. Speaker notes coached intent. The entry qualified for Round 2.

### No template given

Use the 14-part skeleton, and add a table to the submission notes that maps each published criterion to where it is answered (DhanDrishti, NABARD Hackathon 2026: Innovation, Feasibility, Relevance, Potential impact, each pointing to concept-note sections and deck slides).

## Sections judges reward that templates leave out

| Section | What it shows | Where it was done |
|---|---|---|
| Validation against named baselines | declared targets, labelled as targets, beside naive baselines | SURYA (persistence, climatology) |
| Data foundation and availability | which data, which labels, how to get access, and the plan if access is late | SURYA ("pre-train now, de-risk data access"); MuleShot's dataset card |
| Risks and pre-mortem | each risk with the mitigation already planned | SURYA's risks table; LINE MARSHAL's "Risks we've already planned for" |
| Impact with typed numbers | SOURCED, SIMULATED, PROJECTED and TARGET kept apart, plus what is not yet counted | WasteOS |
| Roadmap tied to the event's dates | phases mapped to the rounds and the finale | SURYA; MuleShot's timeline mapped to the hackathon phases |
| Budget with ranges | indicative ranges, what is already spent, "lean by design" | SURYA; NAADI's cost slide |
| Fair competitor matrix and named prior art | ●/◐/○ per capability, your own row highlighted, incumbents not strawmanned | MuleShot; FLOODLIGHT |
| Disclosure of existing work | what existed, what is new, what is reused | FLOODLIGHT |
| Sponsor alignment | what the sponsor is solving for · how we deliver it · where you see it | SBI Saarthi |

When the slide count is capped, put the extra sections in the allowed appendix pages, or fold each into the nearest required section. Never exceed the count.

## The official cut

- Always its own file, built from the same source as the long deck so the numbers cannot drift. A cut from a master PDF can be assembled with the sibling `pitch-deck`'s `finalize-pdf.py --select 2,4,14-15`.
- The exact slide count, the size cap with margin, fonts embedded (or system fonts only), and the naming rule.
- The identity fields the organiser asks for (logo, roles, contacts), unless the round is anonymous.
- Opened and looked at, every slide, as the judge's software renders it.

## Gotchas

- **Size:** build at the template's size; never scale a 16:9-wide deck into a 10 × 5.625 in template.
- **Fonts:** template fonts (Google Sans) or web fonts may be missing on the judge's machine. Embed them, or use system faces: LINE MARSHAL's deck switched to Arial Narrow, Arial and Courier New so it renders on any laptop. Anton has a single weight (never ask for bold) and Space Grotesk has no italics (FLOODLIGHT's builder comments).
- **Art:** organiser logos and glow images sit in the sample file; unzip the PPTX and take them from `ppt/media/`.
- **Z-order:** a photo placed late covers the template's logos; send it behind the template art.
- **Prompt text:** blank it, or it shows through or overlaps your content.
- **Generators:** keep the deck builder and its inputs in the repo. SURYA's generator was never saved, and ORCA's Vibeathon image-PPTX builder and template-fill script lived only in a session scratchpad.
- **Identity versus anonymity:** a template that asks for team details in an anonymous round is a question for the organisers, in writing.
