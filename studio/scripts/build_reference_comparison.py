"""Assemble unchanged Blender render pixels into review sheets (Pillow, dev only).
Reference renders stay outside web/public and retain WiseWolf's attribution.
This is a technical comparison, never an AI-generated depiction of the models.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[2]
out = root / 'studio/evidence/classic-large-avatar-2026-11-03'
font_path = root / 'web/public/assets/NotoSansCJKsc-Bold.otf'
title_font = ImageFont.truetype(str(font_path), 40)
caption_font = ImageFont.truetype(str(font_path), 23)
titles = ['Legacy template / reference only', 'Classic / Large Avatar', 'Native / VRChat Style']
for kind, height in [('front', 480), ('perspective', 600)]:
    files = [out / ('reference/legacy-template-' + kind + '.png')]
    files += [out / (style + '-default-' + kind + '.png') for style in ['classic', 'native']]
    sheet = Image.new('RGB', (3600, height + 180), '#1b1d22')
    draw = ImageDraw.Draw(sheet)
    for i, (path, title) in enumerate(zip(files, titles)):
        draw.text((i * 1200 + 30, 25), title, font=title_font, fill='white')
        pixels = Image.open(path).convert('RGBA')
        assert pixels.size == (1200, height)
        sheet.paste(pixels, (i * 1200, 90), pixels)
        if i:
            draw.line((i * 1200, 10, i * 1200, height + 90), fill='#575961', width=2)
    draw.text((30, height + 110), 'Legacy reference: WiseWolf, VRC name tag pendant, CC BY-NC-SA 4.0. First-party terms pending; no commercial clearance.', font=caption_font, fill='#c7c9d0')
    sheet.save(out / ('comparison-' + kind + '.png'))
print('Reference-only review sheets assembled; nothing copied into production assets.')
