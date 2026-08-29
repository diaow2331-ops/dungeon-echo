# Dungeon Echo v1.4.0

Release boundary: cache generation 176, runtime bootstrap v28.

## Core combat and class identity

- `J` is the explicit directional basic attack; `K` is the class skill and `C` remains a compatibility alias.
- Ranger and Arcanist basic attacks are truly ranged, stop at walls, and no longer trigger implicitly from movement.
- Mana is canonical saved player state with class-specific pools, skill costs, turn recovery, attack rewards, and stronger wait recovery.
- Each class begins with its signature weapon; off-class weapons still drop and remain useful for selling, stashing, and forging, but cannot be equipped.
- Legacy saves with an off-class weapon equipped migrate without losing the item.

## UX recovery

- Greedy Expedition intent survives New Run reload and class selection.
- Inventory clicks select and explain first; Equip and Drop are explicit actions on desktop and touch.
- Common desktop game viewports fit without document scrolling while preserving Canvas aspect ratio.
- Low health exposes a prominent potion action; repeated combat lines aggregate; notable ground loot is easier to read.
- Greedy town keeps primary actions available and treats the fortune wheel as secondary content.

## Reliability and architecture

- Shop, rest, and shrine NPC placement now preserves walkable floor connectivity, preventing corridor softlocks.
- Gameplay, rendering, input, turn flow, Mana, saves, and migration remain in canonical `game/core/game.js`; runtime followers remain presentation-only.
- The v130 storage epoch remains stable, and the immutable deployment bundle retains checksum verification, atomic switching, health checks, and rollback.
