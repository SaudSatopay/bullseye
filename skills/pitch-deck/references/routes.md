# Routes: how a deck, brief or proposal gets built and exported

Pick the route from the Contract before you design anything. A route decides the file format, the fonts policy, how text can be edited later and how QA works. Changing route late means building twice.

> Field note (DhanDrishti · NABARD Hackathon @ GFF 2026): the deck was built in pptxgenjs, rebuilt the same day as HTML to PDF because it looked better, then cut down to pass the portal's 10 MB upload limit (raster grain dropped, screenshots turned to JPEG). Reading the limit and choosing the route first saves the second build.

## Decide these first

| Decision | Where it comes from | Write it to |
|---|---|---|
| Format the portal accepts (PDF, PPTX, both) | the Contract's deliverables row, quoted | `## Decisions` |
| Page size | 16:9 deck: `338.667mm 190.5mm` (13.333 x 7.5 in). A4 brief: `210mm 297mm` (page box 296 mm, see gotchas). A4 landscape: `297mm 210mm` | the starter's `@page` |
| Size limit | the portal (1 MB idea PDFs exist; 10 MB is common) | `finalize-pdf.py --max-mb` |
| Fonts policy | the rules ("all fonts embedded"), and whether the file is opened on another machine | the route row below |
| Slide or page count, naming rule | the template or the rules (`TeamName_Institution_Category.pptx`, alphanumeric only) | `## Submission` |
| Anonymity | rules that forbid names, logos or citations | metadata sweep, below |
| Light or dark | print and reading on paper: light; projection: dark is fine | the design system |

> Field note (SBI Saarthi · SBI Hackathon @ GFF 2026): the first proposal was a dark design; it was redesigned as a light print system before submission because it would be read and printed as a document. Decide light or dark from how the file will be read.

## The four routes

| Route | Use when | Output | Editable | Fonts | QA |
|---|---|---|---|---|---|
| **A · HTML + print CSS to PDF** (default) | a PDF is accepted; best look; "projector-proof" | vector PDF | in the HTML | web fonts subset and embedded by Chrome | `qa-pdf.py` PNGs |
| **B · pptxgenjs** | an editable PPTX is required, or the team will present from PowerPoint | native PPTX | yes | system-safe faces, or embed by re-saving in PowerPoint | `pptx_kit.py check`, PowerPoint render |
| **C · organiser template, python-pptx** | the template is mandatory | the template, filled | yes | the template's own, plus yours embedded | `pptx_kit.py inspect` then `check`, PowerPoint render |
| **D · image per slide, from the PDF** | the platform demands PPTX but the design must stay identical | PPTX of full-bleed images | no | none needed | the PDF's QA, plus notes and alt text |

Routes combine: A for the brief and deck, D for a PPTX copy of the same deck, C for the mandatory cut. Keep one source of content so the numbers cannot drift between them.

## Route A · HTML to PDF

Start from `assets/deck-16x9.html` (16:9) or `assets/brief-a4.html` (A4). Then:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/render-pdf.mjs" deck/deck.html --out deck/out/Deck.pdf --expect-pages 14 --qa
python "${CLAUDE_SKILL_DIR}/scripts/finalize-pdf.py" deck/out/Deck.pdf --max-mb 10 --expect-fonts "Barlow,Plex"
python "${CLAUDE_SKILL_DIR}/scripts/qa-pdf.py" deck/out/Deck.pdf --sheet --bottoms --glyphs "₹×≥≤" --tells
```

Other agents: run the same scripts from this skill's folder. Use `python3` where `python` is Python 2 or missing. The final deliverable is rendered without `--qa` (the probe only stamps pages that have problems, but a clean final render is the rule). Add `--strict` to the final render: it fails while any `{{placeholder}}` is left, including the ones inside CSS custom properties. Add `--facts facts.json` to fill `{{fact:path.to.value}}` tokens from the facts file so a number is typed once.

## Route B · pptxgenjs

```bash
cp "${CLAUDE_SKILL_DIR}/assets/deck.pptx.mjs" deck/   # then edit the facts, slides and roles
cd deck && npm i pptxgenjs
node deck.pptx.mjs --out out/Deck.pptx --facts ../facts.json --fonts windows
python "${CLAUDE_SKILL_DIR}/scripts/pptx_kit.py" check out/Deck.pptx --require-notes --expect-slides 8
```

Then render it and look: on Windows with PowerPoint use `powerpoint-com.md` (embed fonts, export the PDF, overflow QA, PNG per slide). With LibreOffice installed: `soffice --headless --convert-to pdf --outdir out out/Deck.pptx`, then `qa-pdf.py` on that PDF (LibreOffice substitutes fonts it lacks, so judge the layout, not the typography). With neither, export the PDF on any machine that has PowerPoint or Keynote before you trust the file.

Font sets in the starter: `windows` (Bahnschrift SemiBold Condensed, Segoe UI, Cascadia Mono; ship with Windows 10 and 11), `anywhere` (Arial Narrow, Arial, Courier New; every Office install), `brand` (your web fonts, installed, then embedded by re-saving in PowerPoint). LINE MARSHAL's PPTX swapped to the `anywhere` set and kept the palette, so it rendered the same on any laptop.

## Route C · the organiser's template

1. `python "${CLAUDE_SKILL_DIR}/scripts/pptx_kit.py" inspect template.pptx` and read every slide's shapes: ids, positions in inches, prompt text. Plan the fill from this table, not from a screenshot.
2. Write `deck/fill_template.py` with the helpers (`from pptx_kit import *`): `replace_text` keeps the template's font and colour, `clear_text(shape, keep=1)` blanks the prompt bullets under a heading, `text_box`, `card`, `chip`, `stat`, `line` (arrows in any direction, never a negative extent), `picture_fit` (contain or cover), `crop_image` for live screenshots, `send_to_back` for a photo panel that must sit under the template's art, `set_notes` on every slide.
3. Keep every branded header, footer and cover element untouched, keep the template's section order and wording (use them as your kickers), and add the sections judges reward after the required ones. The content rules are in the sibling skill `idea-round` (`../idea-round/references/organizer-templates.md`; install the full set with `npx skills add SaudSatopay/bullseye` if missing).
4. `pptx_kit.py check deck/out/Filled.pptx --require-notes --require-embedded-fonts`, then render with PowerPoint and look at every slide.

> Field note (Trinetra · ET AI Hackathon 2.0): right-to-left lines were written with negative `cx` values. python-pptx loaded the file without complaint and PowerPoint opened it with a Repair prompt. `pptx_kit.py check` scans every slide, layout and master for negative extents; run it before anyone opens the file.

## Route D · image per slide

```bash
python "${CLAUDE_SKILL_DIR}/scripts/pages-to-pptx.py" deck/out/Deck.pdf --out deck/out/Deck.pptx --notes deck/notes.json --max-mb 10
```

Each slide is one full-bleed render at 2560 px (`--width`), so it looks identical everywhere and needs no fonts. The text is not editable: every slide gets alt text (the first words of the page, or `--alt alt.json`) and speaker notes from `--notes` (a JSON array, or an object keyed by PDF page). `--format jpg` makes it smaller; `--pages 2,4,14-15` builds a cut.

## The organiser cut

The official submission is often a different format from the presentation deck (WasteOS: a 5-slide PPT with up to 3 appendix pages, at most 10 MB, fonts embedded, named `TeamName_Institution_ChallengeCategory.pptx`, against a 16-slide presentation). Build the cut as its own file from the same source: `finalize-pdf.py --select 2,4,14-15 --out ...` for a PDF cut, `pages-to-pptx.py --pages ...` for an image PPTX, its own HTML (same stylesheet) when the cut needs different slides. Then the same gates: page count, size, fonts, metadata, a look at every page.

## Gotchas (each one cost a team time)

- **Pass a full `file:///` URL.** A bare file name skipped the web fonts (ORCA, SIH). `render-pdf.mjs` builds the URL with `pathToFileURL`, which also encodes spaces as `%20`.
- **Print to a temp folder without spaces, then copy.** Chrome refused to write to a second drive (ORCA, Vibeathon) and PowerShell's `Start-Process` split an output path with spaces into "Multiple targets are not supported in headless mode" (MuleShot). The script prints into a space-free temp folder and copies the PDF.
- **Fresh `--user-data-dir` per run.** An open Chrome window otherwise takes the job and the headless process returns at once.
- **`--virtual-time-budget`** lets fonts and images settle (default 25000 ms here; 20000 to 35000 worked in the projects).
- **Calling Chrome from PowerShell by hand:** Chrome is a GUI program, so `&` returns before the PDF exists; use `Start-Process -Wait -NoNewWindow` with the arguments as an array, or just call `render-pdf.mjs`.
- **Effects that print as bitmaps.** Measured with Chrome 155: CSS `filter` (blur, saturate), SVG `<filter>`, blurred `box-shadow` (one shadow became a 4.8-megapixel image) and blurred `text-shadow` all print as images. Element `opacity` and `mix-blend-mode` print as PDF transparency groups, which some viewers and print drivers flatten. Use rgba fills, `fill-opacity` and `stroke-opacity`, solid zero-blur shadows, and bake photo grades into the JPEG. One filtered layer pushed a proposal to 18 MB (MuleShot).
- **Variable fonts print as Type3.** Chrome draws a variable font as Type3 glyph procedures: no font object, no subsetting, every word its own span. Google Fonts serves IBM Plex Sans, Archivo, Newsreader, Space Grotesk, JetBrains Mono and Instrument Sans as variable today; Barlow, Barlow Condensed, Barlow Semi Condensed, IBM Plex Mono, IBM Plex Serif, Spectral, Fira Sans and Anton as static. `finalize-pdf.py` lists the embedded fonts: unnamed entries mean a variable face slipped in.
- **Google's subsets drop symbols the font has.** The default `unicode-range` subsets leave out `≤ ≥ ≈ ₹ →` although IBM Plex Mono and Spectral contain them, so Chrome falls back to a system face. Add a second stylesheet link with `&text=` listing exactly those characters (the starters do). Barlow and Barlow Condensed have no `₹` or `→` at all: set those in the mono face. `qa-pdf.py --glyphs` names the face that drew each glyph.
- **A4 page boxes of 296 mm** keep a page from spilling onto a blank sheet but leave 1 mm of the body colour printed at the foot of every sheet. The brief starter seals it with a zero-blur `box-shadow` in the page colour and a paper-coloured body in print.
- **Page count is a check.** `render-pdf.mjs` compares the PDF's pages with the HTML's `.page` elements; more pages means a page spilled.
- **Size limits.** Subset fonts (`finalize-pdf.py`), JPEG the photos and screenshots at the size they are shown, drop raster textures, and remove filters. Chrome embeds every web font in full: subsetting took a 10-page proposal from 1060 KB to 603 KB with no visual change (MuleShot).
- **Metadata.** Chrome copies `<title>` into the PDF title (or the file name when there is none) and writes its user agent as the creator. python-pptx's default template carries its own author in `last_modified_by`. For anonymous rounds: `finalize-pdf.py --strip-metadata --title "..."`; for PPTX set `prs.core_properties.author` and `last_modified_by` (the starters and `pages-to-pptx.py` leave them empty).
- **Negative extents in PPTX** open with a Repair prompt; with PowerPoint automation the prompt can block a script that opens the file without a window. Run `pptx_kit.py check` first.
- **Keep every generator and its inputs in the project** (`deck/`), never only in a session scratchpad. The Round-2 deck script of FLOODLIGHT, the image-PPTX builder and template inputs of ORCA at Vibeathon, and SURYA's generator were all lost that way. If the competition repo keeps process files private, gitignore `deck/` but keep it on disk in the project.
