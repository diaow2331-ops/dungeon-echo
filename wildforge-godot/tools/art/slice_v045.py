#!/usr/bin/env python3
"""Deterministic, no-resize Art Atlas slicer for Wildforge v0.45.
Source masters remain untouched. Outputs are lossless RGBA PNG crops at source pixel density.
"""
from __future__ import annotations
from collections import deque
from pathlib import Path
from statistics import median
import argparse
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE = ROOT / "assets" / "source_masters"
OUT = ROOT / "assets" / "production"
CHECKER_SIZE = {
    "06_furniture_crafting_trade.jpg": 6,
    "07_inventory_icons.jpg": 8,
    "08_tools_weapons.jpg": 8,
    "10_player_animation_master.jpg": 8,
}

SPECS = {
    # Inventory / resources.
    "ui/items/wood.png": ("07_inventory_icons.jpg", (10, 40, 115, 185)),
    "ui/items/stone.png": ("07_inventory_icons.jpg", (330, 55, 430, 185)),
    "ui/items/soil.png": ("07_inventory_icons.jpg", (435, 55, 530, 185)),
    "ui/items/sandstone.png": ("07_inventory_icons.jpg", (545, 55, 635, 185)),
    "ui/items/coal.png": ("07_inventory_icons.jpg", (660, 55, 745, 185)),
    "ui/items/copper_ore.png": ("07_inventory_icons.jpg", (15, 205, 115, 335)),
    "ui/items/copper_bar.png": ("07_inventory_icons.jpg", (865, 205, 955, 335)),
    "ui/items/raw_meat.png": ("07_inventory_icons.jpg", (585, 350, 665, 500)),
    "ui/items/trail_ration.png": ("07_inventory_icons.jpg", (915, 345, 1005, 505)),
    "ui/items/plank.png": ("07_inventory_icons.jpg", (25, 665, 125, 815)),
    "ui/items/ancient_core.png": ("07_inventory_icons.jpg", (1375, 835, 1530, 1015)),
    # Tools / weapons.
    "ui/items/wood_pick.png": ("08_tools_weapons.jpg", (10, 20, 95, 170)),
    "ui/items/stone_pick.png": ("08_tools_weapons.jpg", (125, 20, 195, 170)),
    "ui/items/copper_pick.png": ("08_tools_weapons.jpg", (325, 20, 395, 170)),
    "ui/items/delver_pick.png": ("08_tools_weapons.jpg", (1070, 1290, 1140, 1530)),
    "ui/items/starter_blade.png": ("08_tools_weapons.jpg", (1035, 385, 1100, 560)),
    "ui/items/stone_blade.png": ("08_tools_weapons.jpg", (345, 575, 390, 765)),
    # Physical facilities.
    "ui/items/storage_box.png": ("06_furniture_crafting_trade.jpg", (20, 215, 140, 325)),
    "ui/items/workbench.png": ("06_furniture_crafting_trade.jpg", (145, 340, 270, 500)),
    "ui/items/campfire.png": ("06_furniture_crafting_trade.jpg", (455, 520, 555, 685)),
    # Player: one production frame per existing visual state for the first live-art pass.
    "player/idle.png": ("10_player_animation_master.jpg", (35, 25, 100, 155)),
    "player/run.png": ("10_player_animation_master.jpg", (640, 20, 710, 160)),
    "player/jump.png": ("10_player_animation_master.jpg", (110, 165, 170, 325)),
    "player/fall.png": ("10_player_animation_master.jpg", (235, 165, 300, 325)),
    "player/attack.png": ("10_player_animation_master.jpg", (1000, 185, 1065, 335)),
}

EXPECTED_SIZE = {
    "06_furniture_crafting_trade.jpg": (1536, 1024),
    "07_inventory_icons.jpg": (1536, 1024),
    "08_tools_weapons.jpg": (1468, 1536),
    "10_player_animation_master.jpg": (1440, 1536),
}


def _checker_colors(image: Image.Image, square: int, sample_rows: int = 24):
    values = [[], []]
    pixels = image.load()
    width, height = image.size
    for y in range(min(sample_rows, height)):
        for x in range(width):
            r, g, b = pixels[x, y][:3]
            if max(r, g, b) - min(r, g, b) <= 12:
                values[((x // square) + (y // square)) & 1].append((r, g, b))
    return [tuple(int(median([p[i] for p in group])) for i in range(3)) for group in values]


def _extract(image: Image.Image, box, bg_colors, square: int, source_name: str):
    x0, y0, x1, y1 = box
    crop = image.crop(box).convert("RGBA")
    width, height = crop.size
    pixels = crop.load()
    candidate = [[False] * width for _ in range(height)]
    for y in range(height):
        gy = y0 + y
        for x in range(width):
            gx = x0 + x
            r, g, b, _ = pixels[x, y]
            er, eg, eb = bg_colors[((gx // square) + (gy // square)) & 1]
            diff = max(abs(r - er), abs(g - eg), abs(b - eb))
            chroma = max(r, g, b) - min(r, g, b)
            if source_name == "06_furniture_crafting_trade.jpg":
                # This sheet uses a denser baked gray checker. Remove only bright neutral pixels
                # connected to the crop boundary; dark outlines keep furniture/metal intact.
                candidate[y][x] = chroma <= 22 and min(r, g, b) >= 118
            else:
                candidate[y][x] = diff <= 42 and chroma <= 20

    seen = [[False] * width for _ in range(height)]
    queue = deque()
    for x in range(width):
        for y in (0, height - 1):
            if candidate[y][x] and not seen[y][x]:
                seen[y][x] = True
                queue.append((x, y))
    for y in range(height):
        for x in (0, width - 1):
            if candidate[y][x] and not seen[y][x]:
                seen[y][x] = True
                queue.append((x, y))
    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height and candidate[ny][nx] and not seen[ny][nx]:
                seen[ny][nx] = True
                queue.append((nx, ny))

    for y in range(height):
        gy = y0 + y
        for x in range(width):
            gx = x0 + x
            r, g, b, _ = pixels[x, y]
            if seen[y][x]:
                pixels[x, y] = (r, g, b, 0)
                continue
            if any(0 <= nx < width and 0 <= ny < height and seen[ny][nx]
                   for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))):
                er, eg, eb = bg_colors[((gx // square) + (gy // square)) & 1]
                diff = max(abs(r - er), abs(g - eg), abs(b - eb))
                chroma = max(r, g, b) - min(r, g, b)
                if diff < 62 and chroma < 28:
                    alpha = max(0, min(255, int((diff - 38) * 255 / 24)))
                    pixels[x, y] = (r, g, b, alpha)

    bounds = crop.getchannel("A").getbbox()
    if not bounds:
        raise RuntimeError(f"empty crop {box}")
    left, top, right, bottom = bounds
    padding = 4
    return crop.crop((max(0, left - padding), max(0, top - padding),
                      min(width, right + padding), min(height, bottom + padding)))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, default=DEFAULT_SOURCE)
    args = parser.parse_args()
    loaded = {}
    colors = {}
    source_hashes = {}
    production_rows = []
    for rel, (source_name, box) in SPECS.items():
        source_path = args.source_root / source_name
        if source_name not in loaded:
            image = Image.open(source_path).convert("RGB")
            if image.size != EXPECTED_SIZE[source_name]:
                raise RuntimeError(f"source dimension changed: {source_name}: {image.size}")
            loaded[source_name] = image
            colors[source_name] = _checker_colors(image, CHECKER_SIZE[source_name])
            source_hashes[source_name] = hashlib.sha256(source_path.read_bytes()).hexdigest()
        out_path = OUT / rel
        out_path.parent.mkdir(parents=True, exist_ok=True)
        sprite = _extract(loaded[source_name], box, colors[source_name], CHECKER_SIZE[source_name], source_name)
        # Intentionally no resize/downsample. PNG is lossless.
        sprite.save(out_path, "PNG", compress_level=6)
        production_rows.append({
            "path": "assets/production/" + rel,
            "source": source_name,
            "source_sha256": source_hashes[source_name],
            "source_dimensions": list(EXPECTED_SIZE[source_name]),
            "source_crop": list(box),
            "output_dimensions": list(sprite.size),
            "resized": False,
            "format": "PNG",
        })
        print(f"{rel}: {sprite.size[0]}x{sprite.size[1]} <- {source_name} {box}")
    provenance = {
        "schema": 1,
        "rule": "crop_and_alpha_only_no_resize",
        "outputs": production_rows,
    }
    (OUT / "manifest_v045.json").write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
