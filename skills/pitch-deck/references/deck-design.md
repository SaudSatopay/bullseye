# Deck design: the visual rules that keep a deck off the template shelf

A judge sees the deck before the product. These rules come from the decks and briefs that carried the builder's entries (WasteOS, Fineprint, LINE MARSHAL, ORCA, MuleShot, CrackWatch, Trinetra). Product UI taste lives in the sibling `missile` skill: [design-rules.md](../../missile/references/design-rules.md).

## Start from the product's tokens

The brand propagates: app, deck, brief, banner, OG image, favicon and video share one token file. Copy the app's role tokens into the starter's `:root` (or the pptxgenjs `ROLE` table) instead of inventing a second palette. Name the world in one line at the top of the token block ("a cold room at night; the paper log it replaces"), because every later choice is checked against it.

Name tokens by **role**, never by hue: `--accent`, `--crit`, `--ground`, not `--cyan`. Fineprint's accent token is still named `--cyan` and holds a red (`#FF4155`); a re-theme should be one table, not a hunt.

## Grounds and rhythm

- One dark ground tinted to the domain (WasteOS green-black, LINE MARSHAL carbon, Fineprint wine, the sample's cold-room blue-black), never pure `#000` or default slate.
- One light paper page type for rhythm and for the pages that carry tables, screenshots and charts. ORCA's Vibeathon deck alternated night-sea narrative pages with chart-paper product pages that match the app's own UI, so real screenshots sit on them without a frame.
- Print and documents read on paper go light. A brief is mostly paper with a navy cover and navy takeaway bands.

## Three type roles

| Role | Use | Static web faces | Windows system | Any Office |
|---|---|---|---|---|
| Display | condensed caps for headlines and big numbers | Barlow Condensed, Barlow Semi Condensed, Anton | Bahnschrift (SemiBold Condensed) | Arial Narrow |
| Body | sentences | Barlow, Fira Sans, IBM Plex Serif, Spectral | Segoe UI | Arial |
| Mono | every number, label, caption, chip, footer; tabular figures | IBM Plex Mono, Fira Mono, Space Mono | Cascadia Mono, Consolas | Courier New |

- Static font files only for anything printed to PDF: a variable face prints as Type3 glyph drawings (the full list of what Google serves static and variable is in `routes.md`).
- Check glyph coverage for the symbols you use (`≤ ≥ ≈ ₹ → × ° ·`). Barlow has no `₹` or `→`; set rupee amounts and arrows in the mono face. `qa-pdf.py --glyphs` reports the face that drew each one.
- Display type: weight 800 to 900, uppercase, line-height 0.86 to 0.92. Body 11 to 14 pt on a 16:9 slide, 9.5 to 11 pt in an A4 brief. Nothing a judge must read below 7 pt.

## Colour is meaning, written down

| Role | Means | Never |
|---|---|---|
| accent | the brand, the second beat of a headline, the active marker | a status |
| ok | in range, verified, measured, clear | decoration |
| warn | uncertain, on the line, a human decides | emphasis |
| crit | failure, loss, the trap number | a highlight colour |
| model | anything a model produced: forecasts, scores | the brand |

Write the table in the deck's source next to the tokens. WasteOS also wrote its palette into the PPTX theme so it appears in PowerPoint's colour picker.

## One motif, and engineering furniture

- **One motif taken from the product**, repeated quietly: WasteOS's detection brackets, LINE MARSHAL's "wheelmark" of four dots with one red (a wheel over the line), Fineprint's journey dots, the sample's vaccine vial monitor mark (a square inside a circle) as kicker bullet and section dots.
- **Furniture that says "engineered":** a document id and revision on the cover (`DOC LM-01 · REV 2.1`), a folio `NN / TT` on every page (CSS counters in the starters, so reordering never breaks it), a footer with product and event, kickers `0N · NAME`. CrackWatch's finalist brief printed a drawing title block on every sheet with the git revision (`Rev cba5e33 · Sheet 05 / 16`).

## Every number labelled, every feature chipped

Number labels, in this order: MEASURED, SOURCED, SIMULATED, PROJECTED, TARGET, ILLUSTRATIVE. Feature status chips: IMPLEMENTED (filled), PROTOTYPED (outlined), SIMULATED (dashed), FUTURE (muted), set to what the build can honestly claim today. The definitions and the wording rules belong to the sibling `prove-it` (`../prove-it/references/honesty.md`); this skill only draws them. Both starters carry `.nt` labels and `.chip` chips, and their appendix page explains the six labels on the artifact itself.

## Photos

- Real photographs only (Wikimedia Commons, NASA, OpenStreetMap renders, your own); no AI-generated imagery, and no stock photo that implies hardware you do not have. WasteOS left a dashed frame reading "PROTOTYPE PHOTO GOES HERE" rather than fake one.
- Bake the grade into the JPEG (crop to the slot's aspect, grade, darken a ramp where text sits) with a script such as WasteOS's `prepare_assets.py`. A CSS `filter` on a photo prints the photo as a second, larger bitmap; Fineprint's README carried the rule "don't add CSS filter on photos".
- **On-image credit chips.** Every photo carries its credit on the image: a tiny mono line in the bottom-right corner, `PHOTO: ARTIST · SOURCE · LICENCE`, about 6 pt, kept clear of the page number and the footer. What the photo shows goes in a separate caption chip at the bottom-left: mono caps on a dark plate with an accent left border ("RED BULL RING · 2023 · THE KERBS WHERE 1,200 CALLS WERE MADE BY EYE"). The back page or appendix repeats every credit in one line.
- **Ledger.** Keep `deck/assets/photo-credits.json` from `assets/photo-credits.template.json`: `local`, `source_url`, `license`, `artist`, `used_on`, `credit_line`. Check the licence allows reuse and keep share-alike terms in mind before the deck goes public.

## Diagrams and charts

- Inline SVG in HTML routes, native shapes in PPTX routes; never a screenshot of a diagram. Draw planned parts as dashed boxes labelled "(planned)".
- **Legibility floor:** SVG text scales with the viewBox. A 720-unit-wide diagram across the 178 mm column of an A4 brief renders 9 units at about 6 pt; keep labels at 9 units or more there, and at 10 to 13 units on 16:9 slides (MuleShot bumped every label below 9 units after QA).
- Charts in PPTX are native PowerPoint charts so a judge or teammate can edit them; set the label number format (`dataLabelFormatCode`) or 0.52 prints as "1".
- Name the baselines in the chart and label the target as a target inside it: "SURYA (target)" against Persistence and Climatology; the sample's "VIALWATCH (TARGET)" against the fixed alarm and the rate rule.

## Headlines are claims, in two beats

Write the headline as the claim the page proves, in two beats, the second in the accent colour: "A fridge fails at 02:10. / Nobody knows until 09:30." Topics ("Problem statement", "Our solution") are banned as headlines. From the builder's decks:

- "Data present. Unacted upon." · "Measured, not claimed" · "Brief at 12:05. Shipped by 14:50."
- "Not a chatbot. A crew." · "Floors that only raise." · "Same sea. Four answers."
- "An ignored pothole is a 6× invoice." · "Severity is a formula, not a vibe."
- "India fixed paying. Claiming is next." · "One engine. Every scary journey."

## Page recipes worth reusing

**Results after the build** (BIS Compass): eyebrow "Targets vs measurements" over the headline "All three targets: beaten by 2× to 11×". Tiles of metric, measured value and target, with a pill carrying the multiple of the target; ablation bars with the production configuration highlighted; an eval-sets table (set, size, author, result) showing sets written by different authors. The deck starter's slide 09 implements it.

**Why teams lose this track, and how we win it** (NAADI's pitch notes): a two-column table, typical entry against ours, one row per trap.

| Typical entry | Ours |
|---|---|
| {{a demo of the happy path only}} | {{the failing case on stage, and what the product does about it}} |
| {{accuracy on a balanced test set}} | {{recall at a fixed false-alert budget, with an interval}} |
| {{"AI-powered" in the title}} | {{the rule the model can never override, named}} |

**Competitor matrix**, rated fairly: ● full, ◐ partial, ○ none, drawn as CSS shapes rather than glyphs so subsetting cannot drop them; your own row highlighted; the closest prior art named by you; one sentence on where the others are better. MuleShot rated rules engines, enterprise AML suites and the regulator's own tool "fair, not strawmanned". The brief starter's page 7 implements it.

**Quadrant chart** ("only one corner does it all"): two axes that matter to this jury, competitors placed honestly, your product alone in the corner the problem needs. SBI Saarthi drew it as a Mermaid `quadrantChart` in the README.

## Slide count discipline

One idea per slide; merge before you add. Trinetra's deck grew from 10 to 21 slides and was tightened to 16 by merging. For a surprise-challenge round, ORCA at Vibeathon told "the project in 3, the hackathon day in 11". The organiser's official cut is a separate file with its own count (see routes.md).

> Field note (WasteOS · OneEarth International Hackathon 2026): the 16-slide presentation and the official 5-slide submission were different files with different rules (slide count, 10 MB, embedded fonts, naming). The README planned the cut from specific slides of the long deck, so one source would feed both.
