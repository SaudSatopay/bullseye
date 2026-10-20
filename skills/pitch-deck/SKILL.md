---
name: pitch-deck
description: Build decks, concept briefs and proposals as code and QA them like code (HTML with print CSS to PDF by default, editable PPTX via pptxgenjs, organiser templates filled with python-pptx, or an image-per-slide PPTX from the PDF). Scripts render with headless Chrome, subset fonts, gate file size, turn pages into PNGs to look at, and check glyphs, AI tells and PPTX repair errors. Use when the user says "make the deck", "pitch deck", "slides", "concept brief", "proposal PDF", "fill the organiser's template", "export to PPTX", "the PDF is too big" or "fonts not embedded".
argument-hint: "[deck|brief|template|pptx|cut] [path]"
license: MIT
metadata:
  author: Saud Satopay
  version: "1.0.0"
  part-of: bullseye
---

# Pitch deck

This skill builds the files a jury reads and looks at: the 16:9 deck, the A4 concept brief or proposal, the PPTX a portal demands, and the organiser-format cut. It treats them as code: one source in the project, one render command, gates for page count, size and fonts, and a QA loop that turns every page into a PNG and looks at it before anything is uploaded. The sibling skill `idea-round` decides what a submission says (the spine, the numbers, the form answers); this skill decides how it is built, exported and checked. Install the full set with `npx skills add SaudSatopay/bullseye` if a sibling is missing.

> Field note (MuleShot · BOI × IIT Hyderabad 2026): the idea round accepted one PDF of at most 1 MB. The proposal was a single HTML file rendered by headless Chrome, font-subset from 1060 KB to 603 KB, and checked after every pass by rendering changed pages, zoom crops and footer zones to PNG. Eleven pages went in at 698 KB with no clipped line.

## Inputs

- `BULLSEYE.md` `## Contract`: each deliverable with its format, page or slide count, size limit, template, naming rule, font rule, anonymity rule and deadline, quoted from the rules. If a field is missing, read the rules page again; ask the user only when the rules do not say.
- `## Thesis` (the one-liner and the signature moment) and `## Claims` (where `facts.json` and `CLAIMS.md` live; the sibling `prove-it` owns them).
- The content from `idea-round` (its spine, concept-note copy and form answers), the product's design tokens (`DESIGN.md` or the token file), real screenshots of the build, and the organiser's template file when one is mandatory.

## Procedure

### 1. Choose the route before designing

| Route | Use when | Start from |
|---|---|---|
| **A · HTML + print CSS to PDF** (default; best look, "projector-proof") | a PDF is accepted | `assets/deck-16x9.html`, `assets/brief-a4.html` |
| **B · pptxgenjs** | an editable PPTX is required, or the team presents from PowerPoint | `assets/deck.pptx.mjs` |
| **C · organiser's template, python-pptx** | the template is mandatory | `scripts/pptx_kit.py` helpers |
| **D · image per slide, from the PDF** | the platform demands PPTX but the design must stay identical | `scripts/pages-to-pptx.py` |

Decide the format, the page size (16:9 is `338.667mm 190.5mm`, 13.333 x 7.5 in; A4 is `210mm 297mm`), the size limit, the font policy (embedded web fonts, embedded by PowerPoint, or system-safe), the count and the file name before the first layout decision.

**Gate:** one line under `## Decisions` names the route and why, with the format, size limit and font policy. For route C, `python "${CLAUDE_SKILL_DIR}/scripts/pptx_kit.py" inspect template.pptx` has been run and read.

> Field note (DhanDrishti · NABARD Hackathon @ GFF 2026): the deck was built in pptxgenjs, rebuilt the same day as HTML to PDF because that looked better, and then squeezed under the portal's 10 MB cap. Choosing the route and reading the limit first is one build instead of three.

### 2. Set the design system

Reuse the product's tokens so the brand carries from app to deck, banner, OG image and video. Then apply the deck rules (depth in `references/deck-design.md`):

- one dark ground tinted to the domain, plus one light paper page type for rhythm (documents meant for print go light);
- three type roles: condensed display caps, a body sans or serif, and mono for every number, label, chip and footer, with tabular figures; static font files only, because a variable web font prints as Type3;
- colour is meaning, written down next to the tokens (accent is the brand; ok, warn, crit and model are status only), and tokens are named by role, never by hue;
- one motif taken from the product, and engineering furniture: a document id and revision on the cover, `NN / TT` on every page, a product and event footer, kickers `0N · NAME`;
- real photographs only, credited on the image, with the grade baked into the JPEG; diagrams as inline SVG or native shapes.

**Gate:** the token block uses role names and carries the colour-meaning table; the fonts are static and the symbols the copy uses exist in them.

### 3. Build from the starter

Copy the starter into the project's `deck/` folder and replace the sample content, keeping the grammar. VialWatch in the starters is a fictional product; every value in them is invented.

- One `.page` per slide or page, real copy, no lorem. The content and the order of the 14 parts come from `idea-round` (`../idea-round/references/pitch-skeleton.md`).
- Numbers come from data: write `{{fact:eval.recall}}` in the HTML and render with `--facts facts.json`, or pass `--facts` to `deck.pptx.mjs`. A number typed by hand drifts.
- Every number carries its label (MEASURED, SOURCED, SIMULATED, PROJECTED, TARGET, ILLUSTRATIVE) and every feature its status chip (IMPLEMENTED, PROTOTYPED, SIMULATED, FUTURE), at the level the build can honestly claim today.
- PPTX routes: speaker notes on every slide (`deck.pptx.mjs` refuses to build without them; `pptx_kit.set_notes`; `notes.json` for route D).

**Gate:** every number on every page has a label, and every placeholder left is one the team still has to fill (team names, contacts, sources).

### 4. Render

```bash
node "${CLAUDE_SKILL_DIR}/scripts/render-pdf.mjs" deck/deck.html --out deck/qa/Deck-qa.pdf --expect-pages 14 --qa
```

Other agents: run the same script from this skill's folder (and use `python3` where `python` is not Python 3). The script finds Chrome, Edge or Chromium (`CHROME_PATH`, standard installs, then Playwright's cache), passes a full `file:///` URL, prints into a space-free temp folder with a fresh profile and a virtual-time budget, then copies the PDF out and compares its page count with the HTML's `.page` count. Route B: `node deck/deck.pptx.mjs --out deck/out/Deck.pptx`. Route C: `python deck/fill_template.py`. Route D renders A first.

**Gate:** the page count matches; no spilled page.

### 5. Finalize

```bash
python "${CLAUDE_SKILL_DIR}/scripts/finalize-pdf.py" deck/out/Deck.pdf --max-mb 10 --expect-fonts "Barlow,Plex"
```

Subsets the fonts (Chrome embeds every web font whole), garbage-collects, deflates, replaces the file and prints `Deck.pdf · 14 pages · 395 KB · OK <10 MB`, the embedded fonts and the metadata. Exit 1 when over the limit or when an expected face is missing (a web font that never loaded).

**Gate:** OK under the limit, the expected fonts present, the title and author fields what the round allows (`--title`, `--strip-metadata` for anonymous rounds).

### 6. QA loop: render, look, fix, repeat

```bash
python "${CLAUDE_SKILL_DIR}/scripts/qa-pdf.py" deck/qa/Deck-qa.pdf --sheet --bottoms --glyphs "₹×≥≤" --tells
python "${CLAUDE_SKILL_DIR}/scripts/qa-pdf.py" deck/qa/Deck-qa.pdf --pages 5,9 --crop 5:0.30-0.70 --zoom 3
```

Open every PNG it lists and look: the contact sheet first, the stitched footer strip, then changed pages and 3× crops of small type, chart labels and edges. Fix in the source and render again. The in-page probe stamps any page with cut text, text below the frame or on the footer, overlapping text or a wrong page total; `--glyphs` names the face that drew each symbol; `--tells` fails on visible em dashes and warns on hype words. The checklist of what to look for is in `references/qa.md`.

PPTX routes: `python "${CLAUDE_SKILL_DIR}/scripts/pptx_kit.py" check deck/out/Deck.pptx --require-notes` (negative extents, off-slide shapes, empty placeholders, notes, embedded fonts). On Windows with PowerPoint run the overflow check and the PNG render from `references/powerpoint-com.md` and look at every slide; with LibreOffice convert to PDF and use `qa-pdf.py`; with neither, use route D or render on another machine.

**Gate:** the probe is silent, no glyph falls back, the tells pass, and every page has been looked at once after the last change. Then render the deliverable without `--qa`, with `--strict` (fails on any `{{placeholder}}` left), finalize it and run `qa-pdf.py --sheet --tells` on that exact file.

### 7. Cut, name and keep the generator

Build the organiser's format as its own file from the same source: `finalize-pdf.py deck/out/Deck.pdf --select 2,4,14-15 --out deck/out/<Name>.pdf`, `pages-to-pptx.py --pages ...` for a PPTX, or a separate HTML with the same stylesheet when the cut needs different slides. Name it exactly as the rules say (alphanumeric only when they say so), check the size, embed fonts when the rules ask (`embed-and-export.ps1`, then `pptx_kit.py check --require-embedded-fonts`), and clear identity metadata for anonymous rounds.

Keep every generator and its inputs in the project's `deck/` folder (HTML, scripts, `facts.json` path, graded photos, `photo-credits.json`, notes), with a short `deck/README.md` holding the rebuild commands and what every number is. Whether `deck/` sources, speaker-note files and QA renders are committed follows the process-file policy in `BULLSEYE.md` (private by default: gitignored, kept on disk); the deliverables themselves are submitted, not hidden.

**Gate:** the cut passes steps 4 to 6; the rebuild commands run from a clean checkout.

> Field note (ORCA · Vibeathon 2026): the image-per-slide PPTX builder and the template filler's inputs lived only in a session scratchpad and were gone when the next round needed them. FLOODLIGHT's Round 2 deck script at MUSA CodeX and SURYA's generator went the same way. A deck you cannot rebuild cannot be fixed at 23:40.

### 8. Record

In `BULLSEYE.md`:

- `## Submission` (owned by `submission-pack`; add a line per artifact, do not restructure it): `- [x] Deck PDF · deck/out/<Name>.pdf · 14 pp · 0.4 MB of 10 MB · fonts subset · QA <date>, probe silent`.
- `## Decisions`: the route and font policy, with the reason.
- `## Log`, newest first:

```markdown
### ▶ STATUS · deck pass · {{YYYY-MM-DD HH:MM TZ}}
- Changed: {{pages and what changed on each}}
- Verified: probe silent, glyphs {{list}} in design faces, tells clean, every page looked at
- Numbers: {{pages}} pages, {{size}} of {{limit}} MB, fonts {{faces}}
- Next: {{the cut, or the next pass}}
```

## Outputs

In the user's project: `deck/deck.html` or `deck/brief.html` (route A), `deck/deck.pptx.mjs` (B), `deck/fill_template.py` (C), `deck/notes.json` (D), `deck/assets/` with graded photos and `photo-credits.json`, `deck/out/` with the deliverables under the organiser's names, `deck/qa/` for QA renders (gitignore it), and `deck/README.md` with rebuild commands. In `BULLSEYE.md`: lines in `## Submission`, `## Decisions` and a `## Log` block.

## Rules

- Choose the route, size limit and font policy before designing; never discover a limit at upload time.
- Every number on a page carries its label; every overlay and concept screen says ILLUSTRATIVE; nothing unmeasured is shown as measured. Never invent a source, a customer or a result.
- No visible em dashes, hype words or exclamation marks in anything a judge reads (`--tells`).
- No CSS or SVG `filter`, no blurred `box-shadow` or `text-shadow`, no element `opacity` or `mix-blend-mode` in print: rgba fills and `fill-opacity` instead.
- Static fonts only for PDFs; check every symbol you use with `--glyphs`.
- Real, credited photos only; no AI-generated imagery; an honest placeholder beats a fake.
- Never ship a placeholder: the final render uses `--strict`.
- PPTX files pass `pptx_kit.py check` before anyone opens them; PowerPoint automation never quits a PowerPoint that has the user's documents open.
- Keep generators and inputs in the project, and one source of content for every format, so the deck, brief, form answers and README carry the same numbers.

## Reference map

| File | What it is for |
|---|---|
| `references/routes.md` | The four routes, the decisions to make first, exact commands, the organiser cut, and the gotchas (file URLs, temp paths, effects that rasterize, variable fonts, Google subsets, the A4 strip, metadata, negative extents) |
| `references/deck-design.md` | Visual rules: grounds, type roles, colour meanings, motif and furniture, labels and chips, photo and credit rules, diagram legibility, headline formulas, results slide, competitor matrix, slide count |
| `references/qa.md` | The QA loop, what to look for and what catches it, PPTX QA, the AI-tell pass |
| `references/powerpoint-com.md` | PowerShell for PowerPoint: embed fonts, export PDF, overflow QA, PNG per slide (Windows + PowerPoint) |
| `assets/deck-16x9.html` | 14-slide 16:9 starter in the canonical order, with role tokens, chips, number labels, self-numbering footers and the QA probe |
| `assets/brief-a4.html` | 8-page A4 concept brief starter: cover, problem, product, architecture, proof, feasibility, competitive edge, impact and sources |
| `assets/deck.pptx.mjs` | pptxgenjs starter: five masters, role colours, primitives, facts-driven numbers, native chart, fit estimator, notes enforced |
| `assets/photo-credits.template.json` | The photo credits ledger |
| `scripts/render-pdf.mjs` | HTML to PDF with headless Chrome, Edge or Chromium; page-count, placeholder and facts handling; `--qa` probe |
| `scripts/finalize-pdf.py` | Font subsetting, cleanup, size gate, font and metadata report, page selection for cuts |
| `scripts/qa-pdf.py` | Page PNGs, zoom crops, footer strips, contact sheet, glyph and tell checks, probe stamps |
| `scripts/pages-to-pptx.py` | Image-per-slide PPTX with notes and alt text |
| `scripts/pptx_kit.py` | python-pptx helpers for template fills, plus `inspect` and `check` |

Product UI taste and the banned looks live in the sibling `missile` skill: [design-rules.md](../missile/references/design-rules.md).
