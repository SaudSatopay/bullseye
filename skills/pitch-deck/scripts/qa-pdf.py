#!/usr/bin/env python3
"""qa-pdf.py · turn a PDF into PNGs an agent can look at, plus text checks that catch silent damage.

An agent cannot see a PDF; it can see PNGs. Pages are fixed-size and overflow:hidden, so a layout
bug does not push content to a new page: it silently cuts it. Render, look, fix, repeat.

Usage:
    python qa-pdf.py <file.pdf> [--out DIR] [--pages 1,3-5] [--dpi 130]
                     [--crop PAGE:Y0-Y1[:X0-X1] ...] [--zoom 3] [--bottoms] [--sheet]
                     [--glyphs "<chars>"] [--tells]

What gets written (paths are printed so you can open each one):
    --pages        whole pages at --dpi (default: every page when nothing else is asked for)
    --crop 7:0.40-0.86     zoom crop of page 7 from 40% to 86% of its height at --zoom (default 3x,
                   about 216 dpi): 6-7 pt captions, chart labels, table cells. Fractions or
                   percentages; add :X0-X1 to narrow the width. Repeat --crop for more regions.
    --bottoms      the bottom 30% of each selected page at 2.6x: footer clearance (collided twice
                   on one proposal), page numbers, credits
    --sheet        one contact sheet of the selected pages: rhythm, repeated furniture, a page
                   that looks unlike its neighbours
Text checks (no images needed):
    --glyphs "..." each character must appear in the extracted text; reports the pages and the
                   font that drew it (a fallback font means the design font lacks the glyph)
    --tells        visible-text pass: em dashes fail; hype words, exclamation marks and en
                   dashes outside number ranges warn
    always         stamps left by the in-page probe (render-pdf.mjs --qa) are reported and fail

Exit codes: 0 clean · 1 a glyph is missing, an em dash is visible, or the probe flagged a page ·
2 bad usage. Needs PyMuPDF: pip install pymupdf
"""
from __future__ import annotations

import argparse
import os
import re
import sys
import tempfile

EM_DASH = chr(0x2014)
EN_DASH = chr(0x2013)
HYPE = ["seamless", "seamlessly", "effortless", "effortlessly", "powerful", "elevate", "leverage",
        "leverages", "cutting-edge", "unleash", "robust", "comprehensive", "delve", "game-changing",
        "revolutionary", "supercharge", "world-class", "state-of-the-art"]
PROBE_MARK = "BULLSEYE-QA"


def _safe_stdio() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            if stream.isatty():
                stream.reconfigure(errors="backslashreplace")
            else:
                stream.reconfigure(encoding="utf-8", errors="backslashreplace")
        except Exception:
            pass


def _need_fitz():
    try:
        import fitz  # PyMuPDF
    except ImportError:
        print("qa-pdf: PyMuPDF is missing. Install it with:  pip install pymupdf", file=sys.stderr)
        sys.exit(1)
    return fitz


def usage(msg: str) -> None:
    print(f"qa-pdf: {msg}\nRun with --help for usage.", file=sys.stderr)
    sys.exit(2)


def parse_pages(spec: str, count: int) -> list[int]:
    out: list[int] = []
    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        try:
            if "-" in part:
                a, b = (int(x) for x in part.split("-", 1))
                out.extend(range(min(a, b), max(a, b) + 1))
            else:
                out.append(int(part))
        except ValueError:
            usage(f"bad page list '{spec}' (use 1,3-5)")
    for p in out:
        if p < 1 or p > count:
            usage(f"page {p} is outside 1-{count}")
    return sorted(set(out))


def frac(text: str, what: str) -> float:
    v = float(text)
    if v > 1:
        v /= 100.0
    if not 0 <= v <= 1:
        usage(f"{what} {text} must be a fraction 0-1 or a percentage 0-100")
    return v


def parse_crop(spec: str, count: int):
    m = re.fullmatch(r"\s*(\d+)\s*:\s*([\d.]+)\s*-\s*([\d.]+)\s*(?::\s*([\d.]+)\s*-\s*([\d.]+))?\s*", spec)
    if not m:
        usage(f"bad --crop '{spec}' (use PAGE:Y0-Y1 or PAGE:Y0-Y1:X0-X1, e.g. 7:0.40-0.86)")
    page = int(m.group(1))
    if page < 1 or page > count:
        usage(f"--crop page {page} is outside 1-{count}")
    y0, y1 = frac(m.group(2), "y0"), frac(m.group(3), "y1")
    x0, x1 = (frac(m.group(4), "x0"), frac(m.group(5), "x1")) if m.group(4) else (0.0, 1.0)
    if y1 <= y0 or x1 <= x0:
        usage(f"--crop '{spec}': the end must be greater than the start")
    return page, y0, y1, x0, x1


def safe_stem(path: str) -> str:
    return re.sub(r"[^\w.-]+", "-", os.path.splitext(os.path.basename(path))[0]).strip("-") or "doc"


def save_pix(pix, path: str, written: list[str]) -> None:
    pix.save(path)
    written.append(path)


def contact_sheet(fitz, doc, pages: list[int], out_path: str, written: list[str]) -> None:
    """Tile pages onto one sheet with show_pdf_page (vector), then rasterise once."""
    cols = 4 if len(pages) > 6 else max(1, min(3, len(pages)))
    rows = (len(pages) + cols - 1) // cols
    first = doc[pages[0] - 1].rect
    cell_w = 240.0
    cell_h = cell_w * first.height / first.width
    gap, label = 10.0, 14.0
    sheet = fitz.open()
    page = sheet.new_page(width=cols * cell_w + (cols + 1) * gap, height=rows * (cell_h + label) + (rows + 1) * gap)
    page.draw_rect(page.rect, color=None, fill=(0.16, 0.17, 0.19))
    for i, pno in enumerate(pages):
        r, c = divmod(i, cols)
        x = gap + c * (cell_w + gap)
        y = gap + r * (cell_h + label + gap)
        target = fitz.Rect(x, y + label, x + cell_w, y + label + cell_h)
        page.draw_rect(target, color=None, fill=(1, 1, 1))   # paper is white where a page paints nothing
        page.show_pdf_page(target, doc, pno - 1)
        page.draw_rect(target, color=(0.45, 0.47, 0.5), width=0.4)
        page.insert_text((x, y + 10), f"{pno:02d}", fontsize=8, fontname="cour", color=(0.85, 0.86, 0.88))
    save_pix(page.get_pixmap(dpi=144), out_path, written)
    sheet.close()


def bottoms_strip(fitz, doc, pages: list[int], out_path: str, written: list[str]) -> None:
    """Every selected page's bottom 30% stacked in one image: one look checks every footer."""
    first = doc[pages[0] - 1].rect
    band = first.height * 0.30
    sheet = fitz.open()
    page = sheet.new_page(width=first.width, height=band * len(pages))
    for i, pno in enumerate(pages):
        src = doc[pno - 1].rect
        target = fitz.Rect(0, i * band, first.width, (i + 1) * band)
        page.draw_rect(target, color=None, fill=(1, 1, 1))
        page.show_pdf_page(target, doc, pno - 1, clip=fitz.Rect(src.x0, src.y1 - src.height * 0.30, src.x1, src.y1))
        page.draw_line((0, (i + 1) * band), (first.width, (i + 1) * band), color=(0.9, 0.1, 0.2), width=0.8)
        page.insert_text((4, i * band + 10), f"{pno:02d}", fontsize=8, fontname="cour", color=(0.9, 0.1, 0.2))
    save_pix(page.get_pixmap(dpi=96), out_path, written)
    sheet.close()


def glyph_report(doc, glyphs: str) -> int:
    wanted = []
    for ch in glyphs:
        if not ch.isspace() and ch not in wanted:
            wanted.append(ch)
    found = {ch: {"count": 0, "pages": set(), "fonts": set()} for ch in wanted}
    font_chars: dict[str, int] = {}      # every character each font draws, to spot fallback faces
    glyph_chars: dict[str, int] = {}     # how many of the requested glyphs each font draws
    for page in doc:
        raw = page.get_text("rawdict")
        for block in raw.get("blocks", []):
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    font = span.get("font", "?")
                    for c in span.get("chars", []):
                        ch = c.get("c")
                        font_chars[font] = font_chars.get(font, 0) + 1
                        if ch in found:
                            f = found[ch]
                            f["count"] += 1
                            f["pages"].add(page.number + 1)
                            f["fonts"].add(font)
                            glyph_chars[font] = glyph_chars.get(font, 0) + 1
    missing = 0
    print("glyphs (extracted text after subsetting; the font is the one that drew the glyph):")
    for ch, f in found.items():
        code = f"U+{ord(ch):04X}"
        if f["count"]:
            pages = ",".join(str(p) for p in sorted(f["pages"]))
            fonts = ", ".join(sorted(f["fonts"]))
            fallback = [ft for ft in f["fonts"] if font_chars.get(ft, 0) - glyph_chars.get(ft, 0) < 5]
            note = ""
            if fallback:
                note = f"   <- fallback face {', '.join(fallback)}: the design font lacks this glyph; pick another glyph or a font that has it"
            elif len(f["fonts"]) > 1:
                note = "   <- drawn by more than one font"
            print(f"  ok       {ch}  {code}  x{f['count']}  pages {pages}  font {fonts}{note}")
        else:
            missing += 1
            print(f"  MISSING  {ch}  {code}  not in the document text (never typed, dropped by subsetting, or drawn as an image)")
    return missing


def tells_report(doc) -> int:
    hype_re = re.compile(r"\b(" + "|".join(re.escape(w) for w in HYPE) + r")\b", re.IGNORECASE)

    def numeric_range(flat: str, i: int) -> bool:
        before = flat[max(0, i - 2):i].rstrip()
        after = flat[i + 1:i + 3].lstrip()
        return bool(before) and (before[-1].isdigit() or before[-1] == "%") and bool(after) and (after[0].isdigit() or after[0] in "₹$€£")

    fails = warns = 0
    print("tells (visible text only; comments never reach the PDF):")
    for page in doc:
        text = page.get_text()
        flat = re.sub(r"\s+", " ", text)
        pno = page.number + 1

        def ctx(i: int, n: int = 1) -> str:
            return flat[max(0, i - 38): i + n + 38].strip()

        for m in re.finditer(EM_DASH, flat):
            fails += 1
            print(f"  FAIL  p{pno:02d}  em dash: ...{ctx(m.start())}...")
        for m in re.finditer(EN_DASH, flat):
            if not numeric_range(flat, m.start()):
                warns += 1
                print(f"  warn  p{pno:02d}  en dash outside a number range: ...{ctx(m.start())}...")
        for m in hype_re.finditer(flat):
            warns += 1
            print(f"  warn  p{pno:02d}  hype word '{m.group(0)}': ...{ctx(m.start(), len(m.group(0)))}...")
        for m in re.finditer(r"!(?=\s|$)", flat):
            warns += 1
            print(f"  warn  p{pno:02d}  exclamation mark: ...{ctx(m.start())}...")
    if not fails and not warns:
        print("  clean")
    else:
        print("  fix: colon for label:detail, comma for an appositive, middot for separators, period or semicolon for a splice, parentheses for an aside")
    return fails


def probe_report(doc) -> int:
    flagged = 0
    for page in doc:
        text = page.get_text()
        if PROBE_MARK not in text:
            continue
        flagged += 1
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        start = next((i for i, ln in enumerate(lines) if PROBE_MARK in ln), 0)
        detail = " | ".join(lines[start:start + 6])
        print(f"  FLAG  p{page.number + 1:02d}  {detail}")
    if flagged:
        print(f"in-page probe: {flagged} page(s) flagged (outlined in red on the renders); fix them and re-render with --qa")
    return flagged


def main() -> int:
    _safe_stdio()
    ap = argparse.ArgumentParser(prog="qa-pdf.py", description="Render PDF pages, crops and footer zones to PNG; check glyphs, tells and probe flags.")
    ap.add_argument("pdf")
    ap.add_argument("--out", help="folder for the PNGs (default: <temp>/bullseye-qa/<name>)")
    ap.add_argument("--pages", help="1-based pages, e.g. 1,3-5 (default: all)")
    ap.add_argument("--dpi", type=int, default=130, help="whole-page resolution (default 130)")
    ap.add_argument("--crop", action="append", default=[], help="PAGE:Y0-Y1[:X0-X1] as fractions or percentages; repeatable")
    ap.add_argument("--zoom", type=float, default=3.0, help="zoom for --crop (default 3)")
    ap.add_argument("--bottoms", action="store_true", help="bottom 30%% of each selected page at 2.6x")
    ap.add_argument("--sheet", action="store_true", help="one contact sheet of the selected pages")
    ap.add_argument("--glyphs", help="characters that must survive, e.g. \"₹×●◐○\"")
    ap.add_argument("--tells", action="store_true", help="em dash / hype word / exclamation pass on visible text")
    args = ap.parse_args()

    fitz = _need_fitz()
    src = os.path.abspath(args.pdf)
    if not os.path.isfile(src):
        print(f"qa-pdf: FAILED · not found: {src}", file=sys.stderr)
        return 1
    try:
        doc = fitz.open(src)
    except Exception as exc:  # noqa: BLE001
        print(f"qa-pdf: FAILED · cannot open {src}: {exc}", file=sys.stderr)
        return 1
    n = doc.page_count
    stem = safe_stem(src)
    out = os.path.abspath(args.out) if args.out else os.path.join(tempfile.gettempdir(), "bullseye-qa", stem)
    os.makedirs(out, exist_ok=True)

    sizes = {(round(p.rect.width * 25.4 / 72, 1), round(p.rect.height * 25.4 / 72, 1)) for p in doc}
    size_txt = "  ".join(f"{w} x {h} mm" for w, h in sorted(sizes))
    print(f"qa-pdf · {os.path.basename(src)} · {n} pages · {size_txt}" + ("   <- MIXED PAGE SIZES" if len(sizes) > 1 else ""))

    selected = parse_pages(args.pages, n) if args.pages else list(range(1, n + 1))
    crops = [parse_crop(c, n) for c in args.crop]
    asked_other = bool(crops or args.bottoms or args.sheet or args.glyphs or args.tells)
    render_pages = bool(args.pages) or not asked_other
    written: list[str] = []

    if render_pages:
        for pno in selected:
            save_pix(doc[pno - 1].get_pixmap(dpi=args.dpi), os.path.join(out, f"{stem}-p{pno:02d}.png"), written)
    for pno, y0, y1, x0, x1 in crops:
        page = doc[pno - 1]
        r = page.rect
        clip = fitz.Rect(r.x0 + r.width * x0, r.y0 + r.height * y0, r.x0 + r.width * x1, r.y0 + r.height * y1)
        tag = f"crop-{round(y0 * 100)}-{round(y1 * 100)}" + ("" if (x0, x1) == (0.0, 1.0) else f"-x{round(x0 * 100)}-{round(x1 * 100)}")
        pix = page.get_pixmap(matrix=fitz.Matrix(args.zoom, args.zoom), clip=clip)
        save_pix(pix, os.path.join(out, f"{stem}-p{pno:02d}-{tag}.png"), written)
    if args.bottoms:
        for pno in selected:
            page = doc[pno - 1]
            r = page.rect
            clip = fitz.Rect(r.x0, r.y0 + r.height * 0.70, r.x1, r.y1)
            pix = page.get_pixmap(matrix=fitz.Matrix(2.6, 2.6), clip=clip)
            save_pix(pix, os.path.join(out, f"{stem}-p{pno:02d}-bottom.png"), written)
        bottoms_strip(fitz, doc, selected, os.path.join(out, f"{stem}-bottoms.png"), written)
    if args.sheet:
        contact_sheet(fitz, doc, selected, os.path.join(out, f"{stem}-sheet.png"), written)

    status = 0
    if args.glyphs:
        if glyph_report(doc, args.glyphs):
            status = 1
    if args.tells:
        if tells_report(doc):
            status = 1
    if probe_report(doc):
        status = 1
    doc.close()

    if written:
        print(f"wrote {len(written)} PNG(s) to {out} (open each one and look):")
        for w in written:
            print(f"  {w}")
    return status


if __name__ == "__main__":
    sys.exit(main())
