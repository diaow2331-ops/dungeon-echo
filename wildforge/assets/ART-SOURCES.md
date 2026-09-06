# Wildforge runtime art sources

The runtime `core-art.webp` is a curated derivative atlas assembled from the user's original Wildforge source sheets stored in Google Drive under `Wildforge / Art Atlas / Batch 01`.

Source sheets:
- `01_environment_tileset.png` — terrain blocks and surface environment motifs.
- `02_characters_enemies_animations.png` — player, cargo-carry, guard, raider and creature frames.
- `03_trade_outpost_props.png` — frontier beacon, cargo, storage, workbench and settlement props.
- `04_items_ui_icons.png` — material, cargo, utility and UI inventory icons.

Runtime policy:
- `core-art.webp` is the compact browser atlas and remains the only image authority loaded by gameplay.
- Canvas rendering keeps `imageSmoothingEnabled=false` for crisp pixel edges.
- Missing art continues to use the canonical procedural fallback instead of creating a second renderer.
- Source sheets remain external working assets; only reviewed, mapped crops enter the runtime atlas.
