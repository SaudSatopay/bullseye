"""Render assets/brand/banner.html to assets/brand/banner.png (1280x640 at 2x).

Usage: python -I scripts/render-banner.py
Needs: pip install playwright && python -m playwright install chromium
"""
from pathlib import Path
import sys

from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent.parent
src = root / "assets" / "brand" / "banner.html"
out = root / "assets" / "brand" / "banner.png"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1280, "height": 640}, device_scale_factor=2)
    page.goto(src.as_uri(), wait_until="networkidle")
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(400)
    page.screenshot(path=str(out), clip={"x": 0, "y": 0, "width": 1280, "height": 640})
    browser.close()

print(f"wrote {out.relative_to(root)} ({out.stat().st_size // 1024} KB)")
sys.exit(0)
