# Wildforge production art

This directory is the only runtime destination for production art.
Google Drive Art Atlas sheets are source material, not runtime dependencies.

Rules:
- Keep `textures/canvas_textures/default_texture_filter=0` (nearest).
- Preserve every source atlas at original resolution as the master; do not downscale by default.
- Crop/export runtime sprites losslessly to PNG where possible; never add another JPEG generation to JPEG-backed sourceboards.
- Create a reduced asset only when measured device memory/load/frame-time data justifies that specific downgrade, while retaining the master.
- Runtime filenames use stable gameplay IDs, not atlas batch numbers.
- Item icons go in `ui/items/<item_id>.png`.
- Player frames go in `player/<state>.png` until animation atlases replace single frames.
- Terrain slices go in `terrain/<tile_id>.png`.
- Backgrounds go in `backgrounds/`.
- Visual files never carry inventory, combat, economy, faction, or quest authority.
- Missing production art must fall back safely to the current procedural/text presentation.

Current P0 source order is tracked in `res://data/art_manifest.json`.
Music is intentionally deferred and does not block this visual pass.

## v0.46 environment batch

`manifest_v046.json` adds source-density, lossless production crops for dirt, stone, coal/copper ore overlays and the canonical wild tree. Runtime presentation scales these assets; files are not pre-downsampled. Unmatched biome materials continue to use their existing safe fallback until dedicated art is available.
