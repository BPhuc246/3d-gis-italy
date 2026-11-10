"""Produce local contact sheets for visual review; these are not app screenshots."""
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONT = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 15)
for slug in ['colosseum', 'arch-of-constantine', 'pantheon', 'vittoriano']:
    tour = json.loads((ROOT / '_local' / (slug + '-tour.json')).read_text(encoding='utf-8'))
    sheet = Image.new('RGB', (1920, math.ceil(len(tour['scenes']) / 4) * 410), '#f4f2e9')
    draw = ImageDraw.Draw(sheet)
    for i, scene in enumerate(tour['scenes']):
        image = Image.open(ROOT / scene['image'].lstrip('/')).convert('RGB')
        image.thumbnail((470, 350))
        cx, cy = i % 4 * 480, i // 4 * 410
        px, py = cx + (480 - image.width) // 2, cy + (350 - image.height) // 2
        sheet.paste(image, (px, py))
        for n, h in enumerate(scene['hotspots']):
            x, y = px + h['x'] / 100 * image.width, py + h['y'] / 100 * image.height
            draw.ellipse((x-10, y-10, x+10, y+10), fill='#b35514' if h.get('target') else '#146a47', outline='white', width=2)
            label = {'left':'L', 'right':'R', 'forward':'F', 'up':'U', 'down':'D', 'return':'B', 'view':'V'}.get(h.get('direction'), str(n+1))
            draw.text((x-5, y-9), label, font=FONT, fill='white')
        draw.text((cx+10, cy+362), scene['id'] + ' | ' + scene['title'], font=FONT, fill='#172c20')
    output = ROOT / '_local' / 'qa' / (slug + '-tour-review.jpg')
    output.parent.mkdir(exist_ok=True)
    sheet.save(output, quality=90)
    print(slug + ': ' + str(len(tour['scenes'])) + ' scenes reviewed on sheet')
