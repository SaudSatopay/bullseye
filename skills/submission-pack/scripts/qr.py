#!/usr/bin/env python3
"""qr.py: QR codes for a hackathon submission, each with its label printed under the code.

Part of the submission-pack skill. Python 3.10+. Needs qrcode and Pillow:
    pip install "qrcode[pil]"

Usage
    python qr.py "Live demo=https://app.example.org" "Code=https://github.com/team/app" [options]

    label=url       one or more pairs; the label is printed under its code
    --out DIR       output folder (default: qr)
    --size PX       width of each code in pixels, quiet zone included (default 600)
    --ecc LEVEL     error correction L, M, Q or H (default M; Q for printed cards and posters)
    --fg HEX        module colour, dark (default 111111)
    --bg HEX        background colour, light (default ffffff)
    --font FILE     TrueType font for the label (default: a bold system sans; pass one with
                    Devanagari or other scripts when the label needs them, e.g. Nirmala UI)
    --no-svg        write PNG only (by default an SVG twin is written, with the label as text)
    --verify        decode each PNG with OpenCV, when it is installed, and compare it with its URL

Writes <out>/<label-slug>-qr.png (and .svg) for each pair. A code that points at localhost cannot
work on a judge's phone, so those are refused; http:// links get a warning; light-on-dark codes are
refused because many phone scanners cannot read them. Exit code: 0 on success, 1 on a bad pair, a
bad colour or a failed verify, 2 when a library is missing.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from urllib.parse import urlparse
from xml.sax.saxutils import escape

ECC_LEVELS = ("L", "M", "Q", "H")
LOCAL_HOST = re.compile(
    r"^(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|::1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)$"
    r"|\.(localhost|local|test|invalid)$",
    re.IGNORECASE,
)
FONT_CANDIDATES = (
    # Windows
    "segoeuib.ttf", "arialbd.ttf", "seguisb.ttf", "arial.ttf",
    # macOS
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/Library/Fonts/Arial Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    # Linux
    "DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "LiberationSans-Bold.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
)


def fail(message: str, code: int = 1) -> None:
    print(f"qr.py: {message}", file=sys.stderr)
    raise SystemExit(code)


def parse_pair(pair: str) -> tuple[str, str]:
    label, sep, url = pair.partition("=")
    label, url = label.strip(), url.strip()
    if not sep or not label or not url:
        fail(f'"{pair}" is not label=url (for example "Live demo=https://app.example.org")')
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        fail(f'"{url}" is not an http(s) URL')
    host = parsed.hostname or ""
    if LOCAL_HOST.search(host):
        fail(f'"{url}" points at {host}, which a judge\'s phone cannot open: use the live URL')
    if parsed.scheme == "http":
        print(f"warning: {url} is http://; phones may warn or refuse, so prefer https://", file=sys.stderr)
    return label, url


def slug(label: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-") or "link"


def hex_colour(value: str) -> tuple[int, int, int]:
    v = value.strip().lstrip("#")
    if not re.fullmatch(r"[0-9a-fA-F]{6}", v):
        fail(f'colour "{value}" is not a six-digit hex value such as 111111')
    return (int(v[0:2], 16), int(v[2:4], 16), int(v[4:6], 16))


def luminance(rgb: tuple[int, int, int]) -> float:
    def channel(c: int) -> float:
        s = c / 255
        return s / 12.92 if s <= 0.03928 else ((s + 0.055) / 1.055) ** 2.4

    r, g, b = (channel(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def load_font(image_font, size: int, font_path: str | None):
    if font_path:
        try:
            return image_font.truetype(font_path, size)
        except OSError:
            fail(f'cannot load the font "{font_path}"')
    for name in FONT_CANDIDATES:
        try:
            return image_font.truetype(name, size)
        except OSError:
            continue
    try:
        return image_font.load_default(size=size)  # Pillow 10.1 and later
    except TypeError:
        return image_font.load_default()


def build_matrix(qrcode, url: str, ecc: str) -> list[list[bool]]:
    levels = {
        "L": qrcode.constants.ERROR_CORRECT_L,
        "M": qrcode.constants.ERROR_CORRECT_M,
        "Q": qrcode.constants.ERROR_CORRECT_Q,
        "H": qrcode.constants.ERROR_CORRECT_H,
    }
    qr = qrcode.QRCode(error_correction=levels[ecc], box_size=1, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    return qr.get_matrix()


def write_png(pil, matrix, label: str, out: Path, size: int, fg, bg, font_path: str | None) -> tuple[int, int]:
    image, image_draw, image_font = pil
    modules = len(matrix)
    box = max(2, size // modules)
    width = box * modules
    small = image.new("RGB", (modules, modules), bg)
    pixels = small.load()
    for y, row in enumerate(matrix):
        for x, dark in enumerate(row):
            if dark:
                pixels[x, y] = fg
    code = small.resize((width, width), image.NEAREST)

    font_size = max(14, width // 14)
    font = load_font(image_font, font_size, font_path)
    probe = image_draw.Draw(code)
    while True:
        left, top, right, bottom = probe.textbbox((0, 0), label, font=font)
        if right - left <= width - 8 * box or font_size <= 10:
            break
        font_size -= 2
        font = load_font(image_font, font_size, font_path)
    text_w, text_h = right - left, bottom - top
    band = text_h + 3 * box
    canvas = image.new("RGB", (width, width + band), bg)
    canvas.paste(code, (0, 0))
    draw = image_draw.Draw(canvas)
    draw.text(((width - text_w) / 2 - left, width - box - top), label, fill=fg, font=font)
    canvas.save(out, "PNG", optimize=True)
    return canvas.size


def write_svg(matrix, label: str, url: str, out: Path, fg, bg) -> None:
    modules = len(matrix)
    unit = 10
    width = modules * unit
    font_size = max(14, width // 14)
    if len(label) * font_size * 0.62 > width * 0.84:
        font_size = max(10, int(width * 0.84 / (len(label) * 0.62)))
    band = int(font_size * 1.6)
    height = width + band
    path = "".join(f"M{x} {y}h1v1h-1z" for y, row in enumerate(matrix) for x, dark in enumerate(row) if dark)
    fg_hex = "#%02x%02x%02x" % fg
    bg_hex = "#%02x%02x%02x" % bg
    quote = {'"': "&quot;"}
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}" '
        f'role="img" aria-label="{escape(label, quote)}: {escape(url, quote)}">\n'
        f"<title>{escape(label)}: {escape(url)}</title>\n"
        f'<rect width="{width}" height="{height}" fill="{bg_hex}"/>\n'
        f'<path transform="scale({unit})" fill="{fg_hex}" shape-rendering="crispEdges" d="{path}"/>\n'
        f'<text x="{width / 2:g}" y="{width + font_size * 0.35:g}" text-anchor="middle" '
        f'font-family="Segoe UI, Helvetica, Arial, sans-serif" font-weight="700" font-size="{font_size}" '
        f'fill="{fg_hex}">{escape(label)}</text>\n'
        "</svg>\n"
    )
    out.write_text(svg, encoding="utf-8")


def verify(png: Path, url: str) -> bool | None:
    """True when OpenCV decodes the PNG to the URL, None when OpenCV is not installed."""
    try:
        import cv2
        import numpy as np
    except ImportError:
        return None
    data = cv2.imdecode(np.fromfile(str(png), dtype=np.uint8), cv2.IMREAD_COLOR)
    text, _, _ = cv2.QRCodeDetector().detectAndDecode(data)
    return text == url


def main(argv: list[str] | None = None) -> int:
    try:
        sys.stdout.reconfigure(errors="replace")
        sys.stderr.reconfigure(errors="replace")
    except (AttributeError, ValueError):
        pass
    parser = argparse.ArgumentParser(prog="qr.py", description="QR codes for a hackathon submission, with each label printed under its code.")
    parser.add_argument("pairs", nargs="+", metavar="label=url", help='for example "Live demo=https://app.example.org"')
    parser.add_argument("--out", default="qr", help="output folder (default: qr)")
    parser.add_argument("--size", type=int, default=600, help="width of each code in pixels (default 600)")
    parser.add_argument("--ecc", default="M", type=str.upper, choices=ECC_LEVELS, help="error correction (default M)")
    parser.add_argument("--fg", default="111111", help="dark module colour (default 111111)")
    parser.add_argument("--bg", default="ffffff", help="light background colour (default ffffff)")
    parser.add_argument("--font", help="TrueType font file for the label")
    parser.add_argument("--no-svg", action="store_true", help="write PNG only")
    parser.add_argument("--verify", action="store_true", help="decode each PNG with OpenCV when it is installed")
    args = parser.parse_args(argv)

    if args.size < 100:
        fail("--size must be at least 100 pixels")
    pairs = [parse_pair(p) for p in args.pairs]
    fg, bg = hex_colour(args.fg), hex_colour(args.bg)
    lum_fg, lum_bg = luminance(fg), luminance(bg)
    if lum_fg >= lum_bg:
        fail("the module colour must be darker than the background: many phone scanners cannot read light-on-dark codes")
    if (lum_bg + 0.05) / (lum_fg + 0.05) < 4:
        print("warning: low contrast between --fg and --bg; scanning from a projector will be unreliable", file=sys.stderr)

    try:
        import qrcode
        from PIL import Image, ImageDraw, ImageFont
    except ImportError as e:
        fail(f'needs qrcode and Pillow ({e.name} is missing): pip install "qrcode[pil]"', 2)

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    used: set[str] = set()
    failed = False
    told_no_cv = False
    for label, url in pairs:
        name = slug(label)
        while name in used:
            name += "-2"
        used.add(name)
        matrix = build_matrix(qrcode, url, args.ecc)
        png = out_dir / f"{name}-qr.png"
        width, height = write_png((Image, ImageDraw, ImageFont), matrix, label, png, args.size, fg, bg, args.font)
        line = f"wrote {png} ({width}x{height} px, {len(matrix)} modules)"
        if not args.no_svg:
            svg = out_dir / f"{name}-qr.svg"
            write_svg(matrix, label, url, svg, fg, bg)
            line += f" and {svg.name}"
        if args.verify:
            ok = verify(png, url)
            if ok is None:
                if not told_no_cv:
                    print("verify skipped: OpenCV is not installed (pip install opencv-python-headless)", file=sys.stderr)
                    told_no_cv = True
            elif ok:
                line += ", decodes to its URL"
            else:
                failed = True
                print(f"FAILED: {png} does not decode to {url}", file=sys.stderr)
        print(f"{line}\n  -> {url}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
