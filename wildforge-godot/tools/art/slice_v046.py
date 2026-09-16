"""Wildforge v0.46 environment slicer.
No source resize: crop + checker-alpha cleanup only, then lossless PNG.
"""
from __future__ import annotations
from collections import deque
from pathlib import Path
from statistics import median
import hashlib, json
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "assets" / "source_masters"
OUT = ROOT / "assets" / "production"
SPECS = {
    "terrain/dirt.png": ("01_terrain_dirt_stone.jpg", (30, 85, 185, 240)),
    "terrain/stone.png": ("01_terrain_dirt_stone.jpg", (30, 470, 185, 625)),
    "terrain/coal_overlay.png": ("04_cave_ores.jpg", (40, 500, 180, 575)),
    "terrain/copper_overlay.png": ("04_cave_ores.jpg", (190, 500, 330, 575)),
    "environment/wild_tree.png": ("03_forest_trees.jpg", (190, 690, 430, 1015)),
}
EXPECTED = {name: (1536, 1024) for name in {
    "01_terrain_dirt_stone.jpg", "03_forest_trees.jpg", "04_cave_ores.jpg"
}}

def checker_colors(im: Image.Image, square: int = 8):
    groups = [[], []]
    px = im.load(); w, h = im.size
    for y in range(min(24, h)):
        for x in range(w):
            r, g, b = px[x, y][:3]
            if max(r, g, b) - min(r, g, b) <= 12:
                groups[((x // square) + (y // square)) & 1].append((r, g, b))
    return [tuple(int(median([p[i] for p in group])) for i in range(3)) for group in groups]


def extract(im: Image.Image, box, colors, square: int = 8) -> Image.Image:
    x0, y0, x1, y1 = box
    crop = im.crop(box).convert("RGBA")
    w, h = crop.size; px = crop.load()
    candidate = [[False] * w for _ in range(h)]
    for y in range(h):
        gy = y0 + y
        for x in range(w):
            gx = x0 + x; r, g, b, _ = px[x, y]
            er, eg, eb = colors[((gx // square) + (gy // square)) & 1]
            diff = max(abs(r-er), abs(g-eg), abs(b-eb))
            chroma = max(r, g, b) - min(r, g, b)
            candidate[y][x] = diff <= 42 and chroma <= 20
    seen = [[False] * w for _ in range(h)]; queue = deque()
    for x in range(w):
        for y in (0, h - 1):
            if candidate[y][x] and not seen[y][x]:
                seen[y][x] = True; queue.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if candidate[y][x] and not seen[y][x]:
                seen[y][x] = True; queue.append((x, y))
    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0 <= nx < w and 0 <= ny < h and candidate[ny][nx] and not seen[ny][nx]:
                seen[ny][nx] = True; queue.append((nx, ny))
    for y in range(h):
        for x in range(w):
            if seen[y][x]:
                r, g, b, _ = px[x, y]; px[x, y] = (r, g, b, 0)
    bounds = crop.getchannel("A").getbbox()
    if not bounds:
        raise RuntimeError(f"empty crop: {box}")
    l, t, r, b = bounds; pad = 4
    return crop.crop((max(0,l-pad), max(0,t-pad), min(w,r+pad), min(h,b+pad)))

def main() -> None:
    loaded = {}; colors = {}; hashes = {}; rows = []
    for rel, (source_name, box) in SPECS.items():
        source_path = SRC / source_name
        if source_name not in loaded:
            image = Image.open(source_path).convert("RGB")
            if image.size != EXPECTED[source_name]:
                raise RuntimeError(f"source dimension changed: {source_name}: {image.size}")
            loaded[source_name] = image
            colors[source_name] = checker_colors(image)
            hashes[source_name] = hashlib.sha256(source_path.read_bytes()).hexdigest()
        sprite = extract(loaded[source_name], box, colors[source_name])
        output = OUT / rel; output.parent.mkdir(parents=True, exist_ok=True)
        sprite.save(output, "PNG", compress_level=6)
        rows.append({"path": "assets/production/" + rel, "source": source_name,
            "source_sha256": hashes[source_name], "source_dimensions": list(EXPECTED[source_name]),
            "source_crop": list(box), "output_dimensions": list(sprite.size),
            "resized": False, "format": "PNG"})
        print(rel, sprite.size, "<-", source_name, box)
    manifest = {"schema": 1, "rule": "crop_and_alpha_only_no_resize", "outputs": rows}
    (OUT / "manifest_v046.json").write_text(json.dumps(manifest, indent=2) + "\n")

if __name__ == "__main__":
    main()
