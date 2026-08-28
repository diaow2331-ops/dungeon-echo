# Dungeon Echo Art Source Atlases

This directory is the source-art library. It is deliberately separate from the runtime assets directly under `art/`.

## Rules

- Source sheets here are **not runtime atlases** until they have been extracted, normalized and repacked into deterministic cell grids.
- Do not add `art/source-atlases/**` to `ops/release/static-files.txt`.
- Existing runtime assets (`loot-atlas.png`, `hero-atlas-v11.png`, `monster-atlas-v11.png`, guardian/final-boss art, etc.) remain authoritative until a replacement has an explicit coordinate map and fallback plan.
- Generated sheets may contain uneven transparent padding or non-pixel-perfect spacing. Never wire them directly by assuming equal cells.
- Prefer harvesting the best individual source object from a candidate/alternate pair, then repacking it.

## Batch 2026-08-29

Primary candidate source sheets:

1. `candidate/loot-equipment-source-v2.png`
   - weapons, armor, rings, consumables, key/gold, helmets, boots, amulets
   - future target: normalized loot/equipment atlas
2. `candidate/monster-deep-source-v2.png`
   - deep-floor monster archetypes and variants
   - future target: additive monster atlas covering currently unmapped archetypes
3. `candidate/hero-action-source-v2.png`
   - Warrior / Ranger / Mage / Assassin action-state source art
   - future target: normalized hero action atlas
4. `candidate/dungeon-props-source-v1.png`
   - torches, bones, obelisks, crates, barrels, webs, crystals, lava, portals, altars, gates, camp/shop fixtures
   - future target: additive environment-prop atlas

Alternate sheets are retained for selective harvesting. Large collage boards are art-direction references only and should not ship in gameplay releases.

## Promotion workflow

`source sheet -> per-object extraction -> alpha cleanup -> scale/anchor normalization -> deterministic grid -> mapping table -> code integration -> release manifest`

The current priority is to promote the four candidate sheets above one by one rather than generate more near-duplicate source sheets.
