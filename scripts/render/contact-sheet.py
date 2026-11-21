#!/usr/bin/env python3
"""Assemble matching offline study frames; needs the locally installed Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "media-masters/transition-1-style-comparison.png"
FRAMES = [30, 70, 100]
STUDIES = [
    ("CURRENT", "Existing scene / unchanged", "current"),
    ("A / MACRO STILL LIFE", "Low camera / warm raking light", "macro"),
    ("B / SPECIMEN PLATE", "Overhead / soft daylight", "specimen"),
]
FONT = "/System/Library/Fonts/Helvetica.ttc"
DISPLAY = "/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf"
title = ImageFont.truetype(DISPLAY, 66)
heading = ImageFont.truetype(DISPLAY, 42)
body = ImageFont.truetype(FONT, 25)
small = ImageFont.truetype(FONT, 23)
margin, gap, width, height = 48, 24, 800, 450
sheet = Image.new("RGB", (margin * 2 + width * 3 + gap * 2, 1850), "white")
draw = ImageDraw.Draw(sheet)
draw.text((margin, 32), "THEREFORE TECH / TRANSITION 1", font=title, fill="#111111")
draw.text((margin, 112), "Desktop art-direction studies / 1920 x 1080 / 16 samples / 20 November 2026", font=body, fill="#555555")
draw.line((margin, 164, sheet.width - margin, 164), fill="#111111", width=2)
for col, (name, description, _) in enumerate(STUDIES):
    x = margin + col * (width + gap)
    draw.text((x, 188), name, font=heading, fill="#111111")
    draw.text((x, 242), description, font=small, fill="#555555")
for row, frame in enumerate(FRAMES):
    y = 298 + row * 500
    draw.text((margin, y), f"FRAME {frame:03d} / {frame / 24:.2f} s", font=small, fill="#555555")
    for col, (_, _, folder) in enumerate(STUDIES):
        x = margin + col * (width + gap)
        source = ROOT / f"media-masters/renders/style-{folder}/frame_{frame:04d}.png"
        with Image.open(source) as image:
            sheet.paste(image.convert("RGB").resize((width, height), Image.Resampling.LANCZOS), (x, y + 38))
        draw.rectangle((x, y + 38, x + width - 1, y + 38 + height - 1), outline="#dddddd", width=1)
draw.text((margin, 1814), "Review only / production page and clip unchanged / select A or B before full renders", font=small, fill="#555555")
sheet.save(OUT, optimize=True)
print(OUT)
