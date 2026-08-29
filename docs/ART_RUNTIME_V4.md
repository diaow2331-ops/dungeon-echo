# Dungeon Echo Art Runtime v4

`art-runtime-v4.js` is the terrain/presentation coordinator for the current art pass.

## Runtime ownership

- `game/ui/art-runtime-v2.js`: unified entity art (hero actions, loot, monsters, props, nine guardians, floor-100 boss).
- `game/ui/art-runtime-v4.js`: terrain materials, wall relief, depth atmosphere, and fresh entity-runtime cache coordination.
- `game/ui/town-art-v157.js`: Greedy Expedition town scene.

The former `art-runtime-v3.js` overlay duplicated monster, guardian, boss and ambient rendering already consolidated into the unified entity runtime. v4 removes that double-draw path rather than stacking another entity layer.

## Terrain language

The terrain layer mirrors the `classic-100` theme progression (`themeBandSize = 4`, clamped to the final theme after floor 81) and adds presentation-only material cues including masonry seams, moss, blood veins, ember cracks, frost fractures, drowned ripples, void runes, forge plates, webs, bones and star residue.

All terrain marks are deterministic from map coordinates and depth. They do not use gameplay RNG and do not mutate map data, FOV, collision, combat, items, saves or progression.

## Cache handoff

Production HTML still contains the historical direct `art-runtime-v2.js?v=157` tag. `production-bootstrap.js` reserves the legacy guard before that tag executes; v4 then performs one fresh `art-runtime-v2.js?v=160` load after DOM bootstrap. This prevents stale entity art from winning the guard race while avoiding a risky whole-route HTML rewrite during the art pass.
