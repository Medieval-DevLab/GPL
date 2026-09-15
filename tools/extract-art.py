"""
Pull the photographic regions out of the mockups into `public/art/`.

The mockups carry photography we are licensed to reuse (see STRATEGY.md D4), and roughly a
quarter of the pixels above the fold in each one is photographic — hero images, client
premises, advisor portraits. We have none, which `docs/UI-AUDIT.md` records as finding F3.

    python tools/extract-art.py              # write crops + a contact sheet
    python tools/extract-art.py --sheet-only # re-check the crops without rewriting them

## Why the crops are hand-specified

The first version of this detected photographs automatically, on the theory that the flat
UI is not colourful and photographs are. That failed: the mockup renders are heavily
desaturated (mean saturation ~0.05–0.10, barely above the flat purple chrome), so the
detection mask came out sparse, and closing it merged three separate option-card photos
together with the panel between them. A hand-written manifest that is checked by looking
at a contact sheet is both more accurate and easier to trust.

Boxes are in the mockups' native 1536×1024 coordinate space.
"""

import argparse
import pathlib
import sys

from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
MOCKUPS = ROOT / "Mockups"
OUT = ROOT / "public" / "art"
SHEET = ROOT / "docs" / "art-contact-sheet.png"

# mockup stem fragment -> [(output name, left, top, right, bottom)]
MANIFEST: dict[str, list[tuple[str, int, int, int, int]]] = {
    # "Three potential clients are looking for a partner"
    "0018b0": [
        ("hero-boardroom", 1012, 84, 1336, 278),
        # Stop above y=400: the A/B/C medallion overlaps the photo's lower edge.
        ("client-retail-store", 325, 308, 631, 400),
        ("client-energy-turbines", 658, 308, 932, 400),
        ("client-health-campus", 968, 308, 1242, 400),
        ("portrait-priya", 47, 731, 104, 788),
    ],
    # "Orion Retail is interested, but cautious"
    "006d58": [
        ("hero-client-meeting", 925, 84, 1300, 265),
        ("thumb-retail-store", 320, 268, 566, 381),
    ],
    # "Is this lead worth pursuing?"
    "0087a0": [
        ("hero-retail-exterior", 932, 84, 1275, 246),
    ],
    # "What offer should we make to Orion Retail?"
    "00ba6c": [
        ("hero-negotiation", 950, 84, 1300, 265),
        ("portrait-riya", 47, 731, 104, 788),
    ],
    # "How do you want to reach Orion Retail?"
    "00c080": [
        ("hero-retail-plaza", 940, 84, 1320, 258),
        ("approach-billboard", 313, 296, 626, 400),
        # Start below y=320 to clear the "Recommended for your profile" ribbon.
        ("approach-one-to-one", 640, 320, 952, 404),
        ("approach-networking", 966, 296, 1230, 404),
    ],
    # "What should we propose to Orion Retail?"
    "00dca4": [
        ("hero-retail-interior", 915, 84, 1285, 265),
        ("solution-in-store-tech", 320, 434, 600, 530),
        ("solution-workshop", 638, 434, 916, 530),
        ("solution-screen", 952, 434, 1218, 530),
        ("portrait-arjun", 47, 731, 104, 788),
    ],
    # "A solid round. Momentum is building."
    "003dd8": [
        ("portrait-aisha", 1432, 126, 1510, 224),
    ],
    # "Orion Retail Group" — understand the client
    "000d30": [
        ("hero-storefront-wide", 910, 84, 1265, 272),
        ("portrait-sarah", 1208, 358, 1282, 436),
    ],
}


def find_mockup(fragment: str) -> pathlib.Path | None:
    for p in sorted(MOCKUPS.glob("*.png")):
        if fragment in p.stem:
            return p
    return None


def contact_sheet(crops: list[tuple[str, Image.Image]]) -> None:
    """
    One labelled grid of every crop. A crop list that has not been looked at is a crop
    list you cannot trust — this project's whole verification discipline is "look at it".
    """
    cols, cell, pad, label = 5, 240, 10, 18
    rows = (len(crops) + cols - 1) // cols
    sheet = Image.new(
        "RGB",
        (cols * (cell + pad) + pad, rows * (cell + pad + label) + pad),
        (245, 244, 250),
    )
    d = ImageDraw.Draw(sheet)
    for i, (name, im) in enumerate(crops):
        c, r = i % cols, i // cols
        x, y = pad + c * (cell + pad), pad + r * (cell + pad + label)
        t = im.copy()
        t.thumbnail((cell, cell))
        sheet.paste(t, (x + (cell - t.width) // 2, y + (cell - t.height) // 2))
        d.text((x, y + cell + 3), f"{i + 1}. {name}", fill=(40, 36, 60))
    SHEET.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(SHEET)
    print(f"\ncontact sheet -> {SHEET.relative_to(ROOT)}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sheet-only", action="store_true")
    args = ap.parse_args()

    if not MOCKUPS.is_dir():
        print(f"no mockups at {MOCKUPS}", file=sys.stderr)
        return 1

    OUT.mkdir(parents=True, exist_ok=True)
    crops: list[tuple[str, Image.Image]] = []
    missing = 0

    for fragment, boxes in MANIFEST.items():
        path = find_mockup(fragment)
        if path is None:
            print(f"! no mockup matching {fragment!r}", file=sys.stderr)
            missing += 1
            continue
        im = Image.open(path).convert("RGB")
        for name, *box in boxes:
            crop = im.crop(tuple(box))
            crops.append((name, crop))
            if not args.sheet_only:
                crop.save(OUT / f"{name}.webp", "WEBP", quality=86, method=6)
            print(f"  {name:26s} {crop.width:4d}x{crop.height:4d}  <- {fragment}")

    contact_sheet(crops)
    total_kb = sum(f.stat().st_size for f in OUT.glob("*.webp")) / 1024
    print(f"{len(crops)} crops, {total_kb:.0f} kB total in {OUT.relative_to(ROOT)}")
    return 1 if missing else 0


if __name__ == "__main__":
    raise SystemExit(main())
