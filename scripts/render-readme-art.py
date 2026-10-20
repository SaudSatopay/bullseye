"""Render the README boards in assets/readme/ from assets/brand/readme-art.html, light and dark, at 2x.

The deck board shows four slides of the pitch-deck starter. They are rendered here with the skill's own
render-pdf.mjs (placeholders filled with neutral sample text, never an invented source) and rasterized with
PyMuPDF, so the README always shows the starter as it ships.

Usage: python -I scripts/render-readme-art.py [board ...]     (boards: flight deck checks control; default all)
Needs: Node 20+, Chrome or Edge, pip install playwright pymupdf pillow && python -m playwright install chromium
"""
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent.parent
src = root / "assets" / "brand" / "readme-art.html"
out_dir = root / "assets" / "readme"
boards = sys.argv[1:] or ["flight", "deck", "checks", "control"]
DECK_PAGES = {"01": 1, "02": 2, "09": 9, "10": 10}

# Neutral fills for the starter's placeholders: sample text, never a real organisation or an invented source.
FILLS = {
    "EVENT": "Sample Hackathon 2026", "TRACK": "Health track", "DATE": "Nov 2026", "TEAM": "Team VialWatch",
    "CONTACT": "vialwatch.example", "STACK": "Python · FastAPI", "LIVE URL": "vialwatch.example",
    "SOURCE, YEAR": "sample source", "DISTRICT": "Sample District",
}


def render_slides(work: Path) -> Path:
    html = (root / "skills" / "pitch-deck" / "assets" / "deck-16x9.html").read_text(encoding="utf-8")
    html = re.sub(r"\{\{([^{}\n]{1,80})\}\}", lambda m: FILLS.get(m.group(1).strip(), "Sample"), html)
    filled = work / "deck.html"
    filled.write_text(html, encoding="utf-8")
    pdf = work / "deck.pdf"
    script = root / "skills" / "pitch-deck" / "scripts" / "render-pdf.mjs"
    subprocess.run(["node", str(script), str(filled), "--out", str(pdf), "--expect-pages", "14"], check=True,
                   stdout=subprocess.DEVNULL)
    slides = work / "slides"
    slides.mkdir()
    doc = fitz.open(pdf)
    for name, page_no in DECK_PAGES.items():
        page = doc[page_no - 1]
        zoom = 1110 / page.rect.width  # 555 CSS px at 2x
        page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False).save(slides / f"slide-{name}.png")
    doc.close()
    return slides


out_dir.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(prefix="bullseye-readme-art-") as tmp:
    slides_url = render_slides(Path(tmp)).as_uri() if "deck" in boards else ""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for board in boards:
            for theme in ("light", "dark"):
                page = browser.new_page(viewport={"width": 1280, "height": 900}, device_scale_factor=2)
                page.goto(f"{src.as_uri()}?board={board}&theme={theme}&slides={slides_url}", wait_until="networkidle")
                page.evaluate("document.fonts.ready")
                page.wait_for_timeout(500)
                target = out_dir / (f"{board}.png" if theme == "light" else f"{board}-dark.png")
                page.locator(f"#{board}").screenshot(path=str(target))
                page.close()
                # A 256-colour palette keeps the boards sharp at well under half the weight.
                Image.open(target).convert("RGB").quantize(colors=256, method=Image.Quantize.MEDIANCUT,
                                                           dither=Image.Dither.FLOYDSTEINBERG).save(target, optimize=True)
                print(f"wrote {target.relative_to(root)} ({target.stat().st_size // 1024} KB)")
        browser.close()
