# QA: render, look, fix, repeat

A deck is checked like code: every change is rendered and looked at before it counts. Pages are fixed-size and `overflow: hidden`, so a layout bug does not push content to a new page; it cuts it off silently. An agent cannot read a PDF but can read a PNG, so the loop turns pages into images and looks at them.

> Field note (MuleShot · BOI × IIT Hyderabad 2026): footer collisions happened twice after content grew (a STACK line on one page, a callout on another), and both were found only by rendering the bottom 30% of the changed pages at 2.6× and looking. The proposal stayed under its 1 MB cap because every pass ended with a size gate.

## The loop

1. **Render with the probe:** `node "${CLAUDE_SKILL_DIR}/scripts/render-pdf.mjs" deck/deck.html --qa --out deck/qa/Deck-qa.pdf --expect-pages <n>`. The starters' probe runs only with `?qa=1`: it waits until every font has loaded, then outlines in red and stamps a list on any page with text cut by a clipping box or the page edge, text below the frame, text touching the footer band, overlapping text, or a `--total` that does not match the page count.
2. **Overview:** `python "${CLAUDE_SKILL_DIR}/scripts/qa-pdf.py" deck/qa/Deck-qa.pdf --sheet --bottoms`. Open the contact sheet (rhythm, repeated furniture, a page that looks unlike its neighbours) and the stitched footer strip (every footer in one image). Probe stamps are listed and fail the run.
3. **Detail:** whole pages that changed (`--pages 5,9 --dpi 130`) and zoom crops of risky regions (`--crop 5:0.30-0.70 --zoom 3`): small captions, chart labels, table cells, anything near an edge. Open each PNG and look.
4. **Text checks:** `--glyphs "₹×≥≤●"` (each symbol present, and the face that drew it; a fallback face fails the look) and `--tells` (visible-text AI tells, below).
5. **Fix in the source, re-render, repeat** until the probe is silent, no glyph falls back, the tells pass and you have looked at every page at 130 dpi once after the last change.
6. **Final render without `--qa`**, with `--strict` (no `{{placeholders}}`), then `finalize-pdf.py --max-mb <limit> --expect-fonts "<faces>"`, then one last `qa-pdf.py --sheet --tells --glyphs ...` on the file you will upload.

In Claude Code: open the PNGs with the Read tool; the Browser pane can show the HTML live while you edit (measure a misbehaving element with a one-line script there instead of guessing). Elsewhere: any image viewer and any browser.

## What to look for

| Look for | Why | Caught by |
|---|---|---|
| Text cut at a box or page edge | `overflow: hidden` hides overflow instead of reflowing | probe CUT, page renders |
| Content below the frame, footer collisions | added lines push content into the footer zone | probe BELOW FRAME and FOOTER, `--bottoms` strip |
| Overlapping text | absolute positions, or a class name reused by two components (a matrix marker class shrank the brief's cover wordmark to 3.6 mm and the tagline printed across it) | probe OVERLAP, cover crop |
| Text past a drawn shape inside an SVG | the SVG's own box does not clip it, so no checker sees it (a gateway label ran off its navy panel) | zoom crops only |
| An extra page | content taller than the page box, or a page height that rounds up | `render-pdf.mjs` page count vs `.page` count |
| Tiny type | under about 6 pt in print, 7 pt on slides, nobody reads it; SVG text shrinks with its viewBox | 3× crops, the legibility floor in `deck-design.md` |
| Missing or fallback glyphs | Google's default subsets drop `≤ ≥ ≈ ₹ →`; Barlow has no `₹`; Arial Black and Times appeared as fallbacks while these starters were built | `--glyphs` |
| Type3 or unexpected fonts | variable web fonts print as Type3; a font that never loaded falls back to a system face | `finalize-pdf.py` font list, `--expect-fonts` |
| Size over the limit | full embedded fonts, raster photos, filters, blurred shadows | `finalize-pdf.py --max-mb` |
| Dark pages on a projector | thin light text on a dark ground washes out; colours lose contrast | look at the sheet at small size; keep body text 11 pt or more and weight 500 or more on dark pages |
| Unlabelled numbers and overlays | a mockup read as a measurement costs trust | read every number on the sheet: does it carry its label? |
| Placeholders left | `{{TEAM}}` shipped in a footer | `render-pdf.mjs --strict` |
| Metadata | Chrome's title is the `<title>` or the file name; PPTX carries author and last-modified-by | `finalize-pdf.py` prints it; `--strip-metadata`, `--title` |
| PPTX only: notes, alt text, extents | judges open the file in edit view; image slides need alt text | `pptx_kit.py check --require-notes`, `pages-to-pptx.py` alt text |

## PPTX routes

- `python "${CLAUDE_SKILL_DIR}/scripts/pptx_kit.py" check deck/out/Deck.pptx --require-notes --expect-slides <n> --max-mb <limit>`: negative extents (an error), shapes off the slide, empty placeholders that show "Click to add text" in edit view, missing notes, fonts used against fonts embedded (`--require-embedded-fonts` when the rules ask for embedding).
- Windows with PowerPoint: `qa-overflow.ps1` (PowerPoint's own text measurement: TOO TALL, TOO WIDE, OFF-SLIDE) and `render-slides.ps1` (a PNG per slide), both in `powerpoint-com.md`. Look at every PNG.
- LibreOffice: `soffice --headless --convert-to pdf --outdir out deck.pptx`, then `qa-pdf.py` on the result (layout yes, typography no: it substitutes fonts).
- No renderer at all: route D, or render on another machine before trusting the file.

## The AI-tell pass on visible text

`qa-pdf.py --tells` reads the PDF's visible text, so comments in the source never trigger it. It fails on any em dash and warns on hype words (seamless, powerful, leverage, robust, cutting-edge and the like), exclamation marks, and en dashes outside number ranges. Replace an em dash by what the sentence means:

| The em dash was doing | Write instead | Example |
|---|---|---|
| label, then detail | a colon | "Proof: 27 of 30 failure days caught" |
| an appositive | commas | "VialWatch, a fridge monitor, calls the nurse" |
| a separator in a list or footer | a middot | "VIALWATCH · DOC VW-02 · REV 0.1" |
| two sentences spliced | a period or a semicolon | "It forecasts. The nurse decides." |
| an aside | parentheses | "the gateway (₹3,000) runs offline" |

Check the `<title>` too: it becomes the PDF title. The builder removed every visible em dash from the MuleShot proposal with scripted, count-checked replacements and kept the ones inside HTML and CSS comments, which never print.
