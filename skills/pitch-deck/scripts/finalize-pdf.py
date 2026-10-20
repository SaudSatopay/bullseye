#!/usr/bin/env python3
"""finalize-pdf.py · subset fonts, clean, gate the size, report fonts and metadata of a rendered PDF.

Chrome embeds every web font in full (MuleShot: ~450 KB of dead weight; 1060 KB -> 603 KB after
this step with zero visual change). This script subsets the fonts, garbage-collects and deflates
the file, replaces it in place (or writes --out), and prints one gate line:

    Deck.pdf · 14 pages · 2,140 KB · OK <10 MB

Usage:
    python finalize-pdf.py <in.pdf> [--out <out.pdf>] [--max-mb 10] [--select 2,4,14-15]
                           [--expect-fonts "Barlow,Plex"] [--title "..."] [--strip-metadata]
                           [--no-subset]

    --max-mb N          size gate; exit 1 when the result is over N MB (MB = 1024 * 1024 bytes)
    --select PAGES      keep only these pages, in this order (1-based): build an organiser cut
                        such as a 5-slide PDF from the master deck
    --expect-fonts A,B  exit 1 unless every name fragment appears in an embedded font
                        (catches web fonts that never loaded and fell back to Arial or Segoe UI)
    --title TEXT        set the PDF title (Chrome copies <title>, or the file name when there is none)
    --strip-metadata    blank author, creator, producer, subject, keywords and XMP (anonymous rounds)
    --no-subset         skip font subsetting (debugging only)

Exit codes: 0 ok · 1 over the size limit, missing fonts, or unreadable PDF · 2 bad usage.
Needs PyMuPDF: pip install pymupdf
"""
from __future__ import annotations

import argparse
import os
import sys


def _safe_stdio() -> None:
    # On Windows a pipe defaults to cp1252: the rupee sign crashes it and agent shells read UTF-8.
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
        print("finalize-pdf: PyMuPDF is missing. Install it with:  pip install pymupdf", file=sys.stderr)
        sys.exit(1)
    return fitz


def parse_pages(spec: str, count: int) -> list[int]:
    """'2,4,14-15' -> [1, 3, 13, 14] (0-based), validated against the page count."""
    out: list[int] = []
    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            a, b = part.split("-", 1)
            lo, hi = int(a), int(b)
            rng = range(lo, hi + 1) if lo <= hi else range(lo, hi - 1, -1)
        else:
            rng = [int(part)]
        for p in rng:
            if p < 1 or p > count:
                raise ValueError(f"page {p} is outside 1-{count}")
            out.append(p - 1)
    if not out:
        raise ValueError("no pages selected")
    return out


def font_report(doc) -> list[tuple[str, str]]:
    """Unique (font name without subset tag, embedded extension) pairs across the document."""
    seen: dict[str, str] = {}
    for page in doc:
        for xref, ext, _type, basefont, _name, _enc, *_ in page.get_fonts(full=True):
            name = basefont.split("+", 1)[1] if "+" in basefont[:8] else basefont
            seen.setdefault(name, ext)
    return sorted(seen.items())


def human_kb(n: int) -> str:
    return f"{round(n / 1024):,} KB"


def main() -> int:
    _safe_stdio()
    ap = argparse.ArgumentParser(
        prog="finalize-pdf.py",
        description="Subset fonts, clean, size-gate and report a rendered PDF (PyMuPDF).",
    )
    ap.add_argument("pdf", help="the PDF to finalize")
    ap.add_argument("--out", help="write here instead of replacing the input")
    ap.add_argument("--max-mb", type=float, help="size limit in MB; exit 1 when over")
    ap.add_argument("--select", help="keep only these 1-based pages, in this order, e.g. 2,4,14-15")
    ap.add_argument("--expect-fonts", help="comma-separated font name fragments that must be embedded")
    ap.add_argument("--title", help="set the PDF title")
    ap.add_argument("--strip-metadata", action="store_true", help="blank author/creator/producer/subject/keywords and XMP")
    ap.add_argument("--no-subset", action="store_true", help="skip font subsetting")
    args = ap.parse_args()

    fitz = _need_fitz()
    src = os.path.abspath(args.pdf)
    if not os.path.isfile(src):
        print(f"finalize-pdf: FAILED · not found: {src}", file=sys.stderr)
        return 1
    dst = os.path.abspath(args.out) if args.out else src
    before = os.path.getsize(src)

    try:
        doc = fitz.open(src)
    except Exception as exc:  # noqa: BLE001 - report any open failure plainly
        print(f"finalize-pdf: FAILED · cannot open {src}: {exc}", file=sys.stderr)
        return 1
    if doc.page_count == 0:
        print("finalize-pdf: FAILED · the PDF has no pages", file=sys.stderr)
        return 1

    if args.select:
        try:
            keep = parse_pages(args.select, doc.page_count)
        except ValueError as exc:
            print(f"finalize-pdf: --select {args.select}: {exc}", file=sys.stderr)
            return 2
        doc.select(keep)

    if not args.no_subset:
        try:
            doc.subset_fonts()
        except Exception as exc:  # subsetting is an optimisation; never block the deliverable on it
            print(f"finalize-pdf: warn · font subsetting skipped: {exc} (try: pip install fonttools)", file=sys.stderr)

    meta = dict(doc.metadata or {})
    if args.strip_metadata:
        for key in ("author", "creator", "producer", "subject", "keywords"):
            meta[key] = ""
        try:
            doc.del_xml_metadata()
        except Exception:
            pass
    if args.title is not None:
        meta["title"] = args.title
    if args.strip_metadata or args.title is not None:
        doc.set_metadata({k: v for k, v in meta.items() if k in ("title", "author", "subject", "keywords", "creator", "producer", "creationDate", "modDate", "trapped")})

    tmp = dst + ".finalize-tmp.pdf"
    try:
        doc.save(tmp, garbage=4, deflate=True, deflate_fonts=True, clean=True)
    except Exception as exc:  # noqa: BLE001
        print(f"finalize-pdf: FAILED · save failed: {exc}", file=sys.stderr)
        return 1
    pages = doc.page_count
    doc.close()
    try:
        os.replace(tmp, dst)
    except OSError as exc:
        print(f"finalize-pdf: FAILED · cannot replace {dst} ({exc}); is it open in a viewer?", file=sys.stderr)
        return 1
    after = os.path.getsize(dst)

    with fitz.open(dst) as check:
        fonts = font_report(check)
        final_meta = check.metadata or {}

    status = 0
    gate = "no size limit set (pass --max-mb)"
    if args.max_mb is not None:
        limit = args.max_mb * 1024 * 1024
        limit_txt = f"{args.max_mb:g} MB"
        if after <= limit:
            gate = f"OK <{limit_txt}"
        else:
            gate = f"OVER {limit_txt}"
            status = 1
    saved = (1 - after / before) * 100 if before else 0
    print(f"{os.path.basename(dst)} · {pages} pages · {human_kb(after)} · {gate}")
    print(f"  size      {human_kb(before)} -> {human_kb(after)} ({saved:.0f}% smaller)")

    missing_embed = [n for n, ext in fonts if ext in ("n/a", "")]
    names = ", ".join(n for n, _ in fonts) or "none"
    print(f"  fonts     {len(fonts)}: {names}")
    if missing_embed:
        print(f"  warn      not embedded: {', '.join(missing_embed)}")
    if args.expect_fonts:
        wanted = [w.strip() for w in args.expect_fonts.split(",") if w.strip()]
        absent = [w for w in wanted if not any(w.lower().replace(" ", "") in n.lower().replace(" ", "") for n, _ in fonts)]
        if absent:
            print(f"  FAILED    expected fonts not in the PDF: {', '.join(absent)} (a web font did not load: render with a full file:/// URL, a longer --budget, or self-host the font)")
            status = 1
        else:
            print(f"  fonts ok  {', '.join(wanted)}")
    shown = {k: final_meta.get(k, "") for k in ("title", "author", "creator", "producer")}
    print("  metadata  " + " · ".join(f"{k}={v!r}" for k, v in shown.items()))
    if status and gate.startswith("OVER"):
        print("  next      over the limit: JPEG the screenshots and photos, drop raster grain or texture images, remove filters and blurred shadows, then re-render")
    return status


if __name__ == "__main__":
    sys.exit(main())
