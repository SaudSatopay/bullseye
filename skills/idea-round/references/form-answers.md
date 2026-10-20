# Form answers

Most idea rounds run through a portal form: a title, two to four essays with character limits, dropdowns and uploads, often with the deck as one more upload. This file has the structures that filled real forms, the budgeting rules, and the text and file rules portals enforce.

## Before writing a word

1. Copy every field exactly as the portal shows it: label, order, limit (characters or words), whether it is required, dropdown options, upload type and size. When the form is behind a login, the human pastes it or screenshots it.
2. Put each field in `idea/SUBMISSION-FORM.md` as a heading that carries its budget: `## 6. Newness/uniqueness (1460/1500 chars)`. The budget in the heading is how a reviewer sees at a glance that the box will take the text, and it is what `form-check.mjs` reads.
3. Note what the form leaves out. When the form has no field for validation, put the validation sentence into the solution essay; the rubric still scores it.

## Budgets

- Fill 91 to 97% of every binding limit (roughly 300 to 5,000 characters). The MSME essays ran 1,372 to 1,460 of 1,500 characters. A half-empty box reads as half an idea.
- A generous limit is not a target. SIH's description allows 50,000 characters; ORCA's description used 4,259 and its abstract 1,601 of 10,000. Write what a judge will read and stop.
- Measure, never estimate. The ORCA pack's headings carried estimates ("~3,400 / 50,000", "~1,550 / 10,000") that ran low: the texts measured 4,259 and 1,601 characters. Against a binding limit an estimate that size overflows the box; run `form-check.mjs --fix` and let the headings carry measured counts.
- Titles are short by design: 72 characters (LINE MARSHAL), 89 of 100 (ORCA), 117 (MSME). No fill rule applies.
- Count the way the portal counts. Spaces count. A line break typed in the box counts once on the page, but browsers submit it as CRLF, so a server-side limit sees two characters. A word counter that splits on spaces counts a lone hyphen or "(1)" as a word. `form-check.mjs` takes the strict reading: 2 characters per line break, every run of non-space characters is a word.
- Write long, then cut to the budget in this order: adjectives without numbers, repeated subjects ("The system... The system..."), hedges, throat-clearing openers, then merge sentences. Never cut a number, a source or the human-in-the-loop sentence.

## Title

Shape: name + what it does + where it lands.

- "LINE MARSHAL - AI Line-Calling for Race Control, Built for India's Roads"
- "ORCA: An AI Crew That Turns India's Ocean Data into One Safe Decision for Every Fisherman"

When identity is forbidden (no brand names), drop the name and say what it is, what it does and for whom: "Affordable Plug-and-Play Edge-AI Retrofit Kit that Converts Legacy MSME Machines into Smart, Self-Monitoring Machines".

## The three-essay pattern

Most hackathon forms ask three things: the solution and what makes it innovative, the technologies and data, and how it will be validated. LINE MARSHAL's answers (TrackShift 2026) ran 1,987, 1,757 and 1,715 characters.

### Q1. The solution, and what makes it innovative

1. **Hook, two sentences.** The dated incident with its three numbers, then one analogy sentence with years. "At the 2023 Austrian GP, stewards manually reviewed 1,200+ potential track-limit violations; the final classification came about five hours after the podium, and eight drivers were penalised after the race had ended. Tennis automated line calls in 2006, football in 2012 - motorsport still scrubs video by hand."
2. **The product, four or five sentences.**
   - "<NAME> is <category> for <user>."
   - What it does, with one number ("flags a violation within 2 seconds of the last wheel crossing").
   - Its outputs, counted and numbered: "three outputs per incident: (1) ... (2) ... (3) ...".
   - The human-in-the-loop guarantee: "It is human-in-the-loop by design: it never issues a penalty."
   - A quantified workload claim: "It auto-clears the ~80% of laps that need no attention and queues the judgment calls with evidence attached."
3. **"What makes it innovative:"** then three numbered ideas, each a short name, the mechanism, and why it matters:
   1. a technical idea ("Vision + telemetry fusion ... it degrades gracefully to vision-only");
   2. an honesty idea ("Calibrated honesty ... The system knows what it doesn't know.");
   3. the dual layer ("One engine, two worlds ... Motorsport is our proof of concept; India's roads, with 168,000+ deaths a year, are our deployment.").

### Q2. Technologies, models, tools and datasets

1. **One paragraph per layer,** each opening with its name and a colon: "Perception:", "Geometry and fusion:", "Decision layer:", "Stack:". Name the model families, libraries and methods exactly, and give the target precision where there is one ("targeting +/-5 cm localisation").
2. **The stack paragraph ends on the deployment constraint:** "The whole pipeline runs on a single consumer GPU, fully offline."
3. **Separate what runs today from the production path** when the form asks what you "plan to use". ORCA's README did it in one line: "PostGIS and XGBoost are the documented production path, not demo requirements".
4. **"Datasets - our unfair advantage:"** the source the other teams lack, how labels are produced, how the model transfers to real data, the real validation set, and the data for the real-world layer.

### Q3. Validation, feasibility and effectiveness

1. **"We declare our targets before we build, and measure them on data the model has never seen:"** then three bullets with thresholds and how each is measured.
2. **Ground truth:** where labels come from (objective, not annotated), plus an independent second label source: "two label sources that must agree".
3. **The transfer gap, "reported honestly and separately",** and calibration: "so a score of 0.9 really means 90%".
4. **Feasibility proven live:** the demo as a chain of steps, the hardware it needs, no internet, a backup video.
5. **The benchmark against the incident's baseline:** "Austria 2023 took roughly five hours to reach a final classification. LINE MARSHAL closes the loop in seconds per incident."

## Government funding essays (MSME Idea Hackathon pattern)

These forms ask for newness, concept and objective, applications and market potential, often with citations forbidden. Each Smart Retrofit Kit essay ran about 190 to 205 words and 91 to 97% of a 1,500-character box.

### Newness or uniqueness

1. **Contrast:** "Existing <category> are built for <another segment>: they assume <three assumptions>."
2. **The unserved reality:** "The lakhs of legacy machines that actually run Indian MSME shop floors ... remain unmonitored."
3. **"The proposed <thing> is different by design:"** five numbered differentiators, each a name, a colon and the mechanism with a number: "(1) Non-invasive retrofit: ... fit any machine in under 30 minutes, with no rewiring, no PLC and no machine downtime".
4. **Closer:** "This combination (<four traits>) is not available in the market today at this price point."

### Concept and objective

1. **"Concept:"** what it is, what is inside it, how it learns or works, the outputs it reports (enumerated), how they reach the user (languages, SMS), how it behaves offline.
2. **"Objective (12 months):"** five numbered milestones: build v1, the firmware or model, the dashboard, a pilot sized in units and sites ("10-15 machines across 3-5 MSME units"), and measured impact against declared targets with the unit cost (the submitted text targeted 8-10% energy savings and 15%+ less downtime; written portal-safe, that is "8-10 per cent" and "15 per cent or more").

### Potential areas of application

1. Where it runs: the general rule, then the list of machine or user types.
2. **"Concrete industry uses:"** six numbered uses, each saying what it gives whom.
3. **"Beyond individual factories:"** the ecosystem buyers (dealers, financiers, clusters, supply chains).

### Market potential, sized in words

When citations are forbidden, size the market in words and keep the sources in your private Numbers table:

1. The base: "India has several crore MSMEs, of which manufacturing units number in the tens of lakhs, each typically operating 3-20 motor-driven machines".
2. A penetration line: "Even 1 per cent penetration represents lakhs of kits." (The submitted text wrote "1%" and the portal stripped the sign.)
3. Demand drivers, then the economics: a payback "within months out of the customer's own savings".
4. The business model and distribution channel, the competitive gap, export headroom, and an indicative growth path ("about 100 kits deployed in the pilot year, scaling towards 10,000+ kits per year").

When the programme lists innovation dimensions (MSME: ideation, technology, marketing and branding, social innovation, open innovation, co-creation, entrepreneurship, business-model innovation), give each a sentence somewhere in the essays or the concept note; evaluators are told ideas should contain them.

## SIH description and abstract

The SIH portal asks for a title (at most 100 characters), a description (at most 50,000), an abstract (at most 10,000), the idea PDF (at most 10 MB), a technology bucket and an optional video link. Forms do not render Markdown, so the description uses uppercase plain-text section labels and "- " bullets. ORCA's description, in order:

1. **THE PROBLEM:** the users with a sourced count ("37.7 lakh marine fisherfolk across 3,400+ coastal villages"), the official data that already exists, why it does not reach them, the harms.
2. **THE IDEA:** the name and its expansion, "not a chatbot", the one question the user asks, the outputs, the languages and voice.
3. **HOW IT WORKS:** one bullet per component, then the safety order: deterministic rules first, the model second, the language model last; official warnings override everything.
4. **WHAT MAKES IT DIFFERENT:** five numbered points.
5. **TECH STACK:** one line, then the data sources. ORCA separated the items with middots; in a portal, commas are the safe separator, and `form-check.mjs` flags the middot as non-ASCII.
6. **FEASIBILITY: A WORKING MVP EXISTS:** what runs today, with numbers ("0.02 s cached reads"), and "the entire demo runs on one laptop".
7. **IMPACT:** SOCIAL, ECONOMIC, ENVIRONMENT & GOVERNANCE, one line each, with a sourced number where one exists.

The abstract is four paragraphs: what it is, for whom and the gap; how it works in a short paragraph; the working MVP and the stack; the impact in one sentence.

## Tone

- Confident and concrete. Present tense for what exists, future tense for what is planned, never both in one sentence.
- No adjective without a number: "fast" becomes "within 2 seconds"; "affordable" becomes "under Rs 20,000 per machine".
- Name things: model families, datasets, standards, public rails.
- Every claim of autonomy carries its human gate in the same sentence.
- One spelling convention, matched to the jury (LINE MARSHAL mostly used British spelling for an Indian jury: "penalised", "localisation", "kerbs").
- None of the hype words (seamless, powerful, cutting-edge, leverage and the rest), no exclamation marks, no emoji, no em dashes.

## Portal-safe text

| Instead of | Write | Why |
|---|---|---|
| em dash, en dash | a plain hyphen, a colon or a comma | LINE MARSHAL's essays used plain hyphens and plain ASCII throughout |
| curly quotes and apostrophes | straight quotes | editors insert them silently; plain ASCII is the one set every portal stores |
| `%` | "per cent" | the MSME portal's sanitizer stripped it ("8-10% energy savings" was stored as "8-10 energy savings") |
| `'` | a rephrase ("the baseline of the machine") | the same sanitizer stripped apostrophes |
| `;` | a full stop or a comma | the same sanitizer stripped semicolons |
| ₹ | Rs | the MSME essays wrote "Rs 20,000" |
| ±, ≥, ≤ | +/-, >=, <= | the LINE MARSHAL essays wrote "+/-5 cm" and "Recall >= 95%" |
| ×, →, …, •, · | x, "to" or ->, ..., "- " at the start of a line, a comma | non-ASCII symbols vary by portal |
| `**bold**`, `[link](url)`, `` `code` `` | plain text | "the form's boxes do not render markdown" (Detour) |

Only the sanitizer row is portal-specific. Find out what your portal strips by saving a test draft when it allows drafts, or by reading the stored text after submitting, and record it under Portal quirks in the form pack.

## Anonymization

Some programmes reject on sight any identity in the text or the files (MSME: "no name, phone, email, brand/firm name", and no "references to research papers, news articles, or any individual/firm").

- **Text:** run `form-check.mjs --anon --terms "<every name, team, institute, product brand, city when it identifies you>"`. It fails on emails, phone numbers, URLs and the listed terms.
- **Files:** alphanumeric file names with no team names; PDF metadata blank or neutral (Title, Author, Creator, Subject, Keywords, XMP). Chrome copies the HTML `<title>` into the PDF title, so set a neutral `<title>`. Office files carry the author and last-modified-by fields of the machine that saved them; clear them (python-pptx: `prs.core_properties.author = ""` and `prs.core_properties.last_modified_by = ""`). The sibling `pitch-deck`'s `finalize-pdf.py --strip-metadata` blanks a PDF's metadata.
- **Check by reopening:** `python -c "import fitz; print(fitz.open('Idea.pdf').metadata)"` should print no names.
- **Diagrams:** no logos, no names, no institute marks.
- **Markets:** sized in words; the sources stay private.

## Dropdowns and uploads

- Dropdowns go in a table: form field, the exact option text, why, whether it locks after submitting. Choices that lock (category, host institute) are confirmed with a human, and with the institute, before submitting.
- Uploads: a vector PDF plus a PNG backup in case the portal wants an image; file names alphanumeric when the portal asks; each file under its cap with margin; every page opened and looked at after export.
- Links: open each one in a logged-out browser; an unlisted video must play for a stranger.

## After submitting

Re-read every stored field against the form pack. Note what the portal changed under Portal quirks, keep a screenshot or download of the submitted view, and record the submission in `BULLSEYE.md`. When stored text is mangled and edits are locked, record it and move on: the MSME sanitizer hit every applicant's text the same way, and the meaning survived.
