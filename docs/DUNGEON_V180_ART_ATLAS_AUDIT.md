# Dungeon Echo v1.8 — Town and Named-Relic Art Atlas Audit

## Finding

The v1.8 systems had moved ahead of their presentation. The six named sets owned 36 fixed collection pieces and four class-specific weapon appearances, but bag, equipment, ground loot and the Relic Hall still fell back to the ordinary equipment sheets. Town construction persisted four 0–3 project states, while its panels showed those states as text and the plaza represented them with small procedural marks.

That gap weakened the two things the update is meant to make valuable: an individual relic's identity and the visible memory of investing in town.

## Admitted atlas batch

- `art/named-relic-atlas-v180.webp`: 9 × 6, 171 px cells, 54 transparent sprites. Rows follow the six authoritative set definitions. Columns are four class weapons plus armor, helmet, boots, ring and amulet.
- `art/town-growth-atlas-v180.webp`: 4 × 4, 314 px cells, 16 transparent sprites. Rows are smithy, market, tavern and Relic Hall; columns are construction stages 0–3.
- `art/source-atlases/runtime-maps/v180-town-relic-art.map.json`: exact dimensions, cell sizes and semantic order. Runtime files remain directly under `art/`; the source-library map does not ship.

Both generated masters were normalized to integer cells and converted to alpha WebP. Runtime payload is about 0.75 MB for the pair instead of roughly 4.3 MB for the unnormalized PNG masters.

## Presentation wiring

- Named relics now override generic loot art in the bag, equipment bar and ground renderer.
- Relic Hall collection cards show the same authored sprite; undiscovered pieces retain a subdued silhouette instead of revealing their full color identity.
- Every town-project card and service-stage header shows the current 0–3 building state from one atlas.
- The pure set and town-growth policies remain the only semantic authorities. Art row/column maps translate their existing IDs into presentation cells; they do not duplicate names, lore, requirements, stats or persistence.

## Release boundary

This batch stays on `feature/dungeon-v180-town-relic-sets`. Public `main` remains v1.7.0 until the full v1.8 freeze and final regression. The two runtime atlases are release-allowlisted and preloaded on both authored locale routes.
