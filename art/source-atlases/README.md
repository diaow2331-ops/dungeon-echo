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
2. `candidate/monster-deep-source-v2.png`
   - deep-floor monster archetypes and variants
3. `candidate/hero-action-source-v2.png`
   - Warrior / Ranger / Mage / Assassin action-state source art
4. `candidate/dungeon-props-source-v1.png`
   - torches, bones, obelisks, crates, barrels, webs, crystals, lava, portals, altars, gates, camp/shop fixtures

Alternate sheets are retained for selective harvesting. Large collage boards are art-direction references only and should not ship in gameplay releases.

## Normalized runtime candidates

The first normalization pass is complete and pinned by JSON maps under `runtime-maps/`:

- loot/equipment: 4×8, 31 live ids + 1 spare cell
- deep monsters: 4×4, first-pass direct coverage for `abomination`, `seraph`, `voidspawn`, `voidlord`
- hero actions: 4 classes × 4 states (`idle`, `attack`, `hurt`, `skill`)
- dungeon props: 6×4, 24 decorative/interaction-source props

The normalized PNGs are staged outside production until binary admission and visual QA are complete. No gameplay id, save key, stat or collision rule changes are implied by this art batch.

## Promotion workflow

`source sheet -> extraction/normalization -> deterministic grid -> mapping table -> binary admission -> code integration -> visual QA -> release manifest`

Do not merge a runtime atlas only because the source sheet looks good. Every promoted atlas must keep a stable coordinate map and an explicit fallback path.
