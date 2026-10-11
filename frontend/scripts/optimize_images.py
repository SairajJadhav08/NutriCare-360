"""
Turn the full-size generated images in frontend/image-sources into small, responsive WebP files
under public/images. image-sources sits outside public/ and src/, so the originals are never
bundled or deployed. Re-run after adding or replacing an image:

    python frontend/scripts/optimize_images.py

Each image is written at a few widths (e.g. yoga/cat-cow-stretch-480.webp) so the browser
can pick the smallest one that looks sharp via srcset. Requires Pillow.
"""
import os
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # frontend/
SRC = os.path.join(ROOT, 'image-sources')
OUT = os.path.join(ROOT, 'public', 'images')
QUALITY = 76

# (source name prefix or exact stem, output path stem, widths, aspect ratio w/h or None to keep)
RULES = [
    ('feature-meal',          'feature-meal',          [640, 1200], 4 / 3),
    ('feature-meds',          'feature-meds',          [640, 1200], 4 / 3),
    ('feature-yoga',          'feature-yoga',          [640, 1200], 4 / 3),
    ('auth-side',             'auth-side',             [600, 896],  4 / 5),
    ('empty-meals',           'empty-meals',           [240],       1),
    ('empty-reminders',       'empty-reminders',       [240],       1),
    ('empty-prescriptions',   'empty-prescriptions',   [240],       1),
]
YOGA_WIDTHS = [240, 480, 960]


def center_crop(im, ratio):
    w, h = im.size
    if ratio is None or abs(w / h - ratio) < 0.01:
        return im
    if w / h > ratio:
        nw = round(h * ratio)
        x = (w - nw) // 2
        return im.crop((x, 0, x + nw, h))
    nh = round(w / ratio)
    y = (h - nh) // 2
    return im.crop((0, y, w, y + nh))


def write(im, stem, widths, ratio):
    im = center_crop(im.convert('RGB'), ratio)
    os.makedirs(os.path.dirname(os.path.join(OUT, stem)), exist_ok=True)
    total = 0
    for w in widths:
        w = min(w, im.width)
        h = round(w * im.height / im.width)
        path = os.path.join(OUT, f'{stem}-{w}.webp')
        im.resize((w, h), Image.LANCZOS).save(path, 'WEBP', quality=QUALITY, method=6)
        total += os.path.getsize(path)
    return total


def find_source(stem):
    # Prefer PNG (lossless original) over a JPG export of the same image
    for ext in ('.png', '.jpg', '.jpeg', '.webp'):
        p = os.path.join(SRC, stem + ext)
        if os.path.exists(p):
            return p
    return None


def main():
    if not os.path.isdir(SRC):
        sys.exit(f'No source folder at {SRC}')
    before = after = 0
    for src_stem, out_stem, widths, ratio in RULES:
        p = find_source(src_stem)
        if not p:
            print(f'  missing  {src_stem}')
            continue
        before += os.path.getsize(p)
        after += write(Image.open(p), out_stem, widths, ratio)
        print(f'  ok       {out_stem}')

    for f in sorted(os.listdir(SRC)):
        stem, ext = os.path.splitext(f)
        if not stem.startswith('yoga-') or ext.lower() not in ('.png', '.jpg', '.jpeg', '.webp'):
            continue
        p = os.path.join(SRC, f)
        before += os.path.getsize(p)
        after += write(Image.open(p), f'yoga/{stem[5:]}', YOGA_WIDTHS, 4 / 3)
        print(f'  ok       yoga/{stem[5:]}')

    after += write_brand()

    # Existing hero photo, and a link-preview image cropped from the meal photo
    hero = os.path.join(SRC, 'hero.png')
    if os.path.exists(hero):
        before += os.path.getsize(hero)
        after += write(Image.open(hero), 'hero', [640, 1024], 1)
        print('  ok       hero')
    print(f'\nSources {before / 1e6:.1f} MB -> all web variants {after / 1e6:.2f} MB')


def square_mark(mark):
    """Crop the app-icon mark to its tile and pad it to a transparent square."""
    mark = mark.convert('RGBA')
    mark = mark.crop(mark.getchannel('A').getbbox())
    side = max(mark.size)
    sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    sq.paste(mark, ((side - mark.width) // 2, (side - mark.height) // 2), mark)
    return sq


def tab_icon(mark):
    """Tight crop around the heart on a rounded tile, so it stays readable at 16-48 px."""
    from PIL import ImageDraw
    rgb = mark.convert('RGB')
    # The heart is the saturated part; the tile around it is near-white pink
    sat = rgb.convert('HSV').getchannel('S').point(lambda v: 255 if v > 90 else 0)
    l, t, r, b = sat.getbbox()
    side = max(r - l, b - t)
    pad = round(side * 0.08)
    cx, cy = (l + r) // 2, (t + b) // 2
    half = side // 2 + pad
    crop = rgb.crop((cx - half, cy - half, cx + half, cy + half))
    tile = Image.new('RGBA', crop.size, (0, 0, 0, 0))
    mask = Image.new('L', crop.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, crop.width - 1, crop.height - 1), radius=round(crop.width * 0.22), fill=255)
    tile.paste(crop, (0, 0), mask)
    return tile


def write_brand():
    """Favicons, app icons, UI logo files and the link-preview image from the two logo PNGs."""
    total = 0
    mark_src = find_source('logo-mark')
    if mark_src:
        sq = square_mark(Image.open(mark_src))
        pub = os.path.join(ROOT, 'public')
        # Browser tab: .ico (16/32/48) plus PNGs, from a tight crop so the heart fills the icon
        tab = tab_icon(Image.open(mark_src))
        tab.save(os.path.join(pub, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])
        for size in (16, 32):
            tab.resize((size, size), Image.LANCZOS).save(os.path.join(pub, f'favicon-{size}.png'), optimize=True)
        # iOS fills transparency with black, so the touch icon sits on white
        touch = Image.new('RGB', (180, 180), 'white')
        touch.paste(sq.resize((164, 164), Image.LANCZOS), (8, 8), sq.resize((164, 164), Image.LANCZOS))
        touch.save(os.path.join(pub, 'apple-touch-icon.png'), optimize=True)
        for size in (192, 512):
            sq.resize((size, size), Image.LANCZOS).save(os.path.join(pub, f'icon-{size}.png'), optimize=True)
        # Logo in the UI (sidebar, nav, auth, footer): 1x and 2x
        os.makedirs(OUT, exist_ok=True)
        for size in (64, 128):
            path = os.path.join(OUT, f'logo-mark-{size}.webp')
            sq.resize((size, size), Image.LANCZOS).save(path, 'WEBP', quality=90, method=6)
            total += os.path.getsize(path)
        print('  ok       favicons, app icons, logo-mark')

    full_src = find_source('logo-full')
    if full_src:
        full = Image.open(full_src).convert('RGB')
        # Trim the white margin, then centre it on a white 1200x630 link-preview card
        bbox = Image.eval(full, lambda v: 255 - v).convert('L').point(lambda v: 255 if v > 4 else 0).getbbox()  # >4 keeps the pale pink tile
        logo = full.crop(bbox)
        scale = min(1000 / logo.width, 520 / logo.height)
        logo = logo.resize((round(logo.width * scale), round(logo.height * scale)), Image.LANCZOS)
        og = Image.new('RGB', (1200, 630), 'white')
        og.paste(logo, ((1200 - logo.width) // 2, (630 - logo.height) // 2))
        path = os.path.join(OUT, 'og-image.jpg')
        og.save(path, 'JPEG', quality=86, optimize=True, progressive=True)
        total += os.path.getsize(path)
        print('  ok       og-image.jpg (logo)')
    return total


if __name__ == '__main__':
    main()
