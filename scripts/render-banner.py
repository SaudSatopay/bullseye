"""Render assets/brand/banner.html to banner.png (light) and banner-dark.png (dark), 1280x640 at 2x.

Usage: python -I scripts/render-banner.py
Needs: pip install playwright pillow && python -m playwright install chromium
"""
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent.parent
src = root / "assets" / "brand" / "banner.html"
targets = {"light": root / "assets" / "brand" / "banner.png", "dark": root / "assets" / "brand" / "banner-dark.png"}

with sync_playwright() as p:
    browser = p.chromium.launch()
    for theme, out in targets.items():
        page = browser.new_page(viewport={"width": 1280, "height": 640}, device_scale_factor=2)
        page.goto(f"{src.as_uri()}?theme={theme}", wait_until="networkidle")
        page.evaluate("document.fonts.ready")
        page.wait_for_timeout(400)
        page.screenshot(path=str(out), clip={"x": 0, "y": 0, "width": 1280, "height": 640})
        page.close()
        # A 256-colour palette keeps the banner sharp at well under half the weight.
        Image.open(out).convert("RGB").quantize(colors=256, method=Image.Quantize.MEDIANCUT,
                                                dither=Image.Dither.FLOYDSTEINBERG).save(out, optimize=True)
        print(f"wrote {out.relative_to(root)} ({out.stat().st_size // 1024} KB)")
    browser.close()
