# Dungeon Echo v1.2.4

v1.2.4 is a narrow UI-navigation hotfix on top of v1.2.3.

## Fixed

- Restores the title-screen **How to Play / 玩法说明** overlay.
- Restores the title-screen **Expedition Log / 远征录** overlay.
- Restores the town → Expedition Log → town navigation path instead of exposing the dungeon canvas underneath.
- Adds an explicit production runtime contract for the Help and Expedition Log modal layer.

## Unchanged

- Combat, Mana, loot, economy, progression and RNG are unchanged.
- Save schema and existing local saves are unchanged.
- v1.2.3 mobile input, four-way D-pad and visual cleanup remain intact.

The bug was caused by the Help and Expedition Log screens being present and wired in JavaScript but omitted from the fixed full-screen modal CSS layer.
