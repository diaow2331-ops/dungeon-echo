# Dungeon Echo v1.3.1

Dungeon Echo v1.3.1 completes the reviewed recovery pass on public cache generation **170**.

## Restored player value

- Four-class directional combat effects render inside the canonical gameplay Canvas.
- Town NPCs, dungeon interaction props, the complete loot atlas and missing deep-monster art are production assets again.
- Town departures can start from conquered depth bands instead of forcing every expedition back to Floor 1.
- Town supplies again use finite saved stock, town-tier prices and progression-based refreshes instead of an infinite flat-price shop.
- The town fortune wheel again has a bounded saved lifecycle: each slot pays once, resets cost Gold, prices scale with town tier and death cannot reroll the board for free.
- Warrior, Ranger, Arcanist and Assassin regain two-choice skill evolutions at Floors 20 / 40 / 60 / 80 through the canonical `C` skill contract.
- Guardians from Floor 10 through Floor 90 regain deterministic telegraphs and counterplay.
- Floor 100 again uses three HP-driven phases: Throne Mark, Void Line and Heart Nova.

## Architecture and compatibility

All recovered behavior is owned by `game/core/game.js` or an already-admitted pure authority. No historical gameplay wrapper, overlay Canvas, extra animation loop, storage sidecar, monkey patch or competing input listener returns.

The v130 storage epoch and existing run schema remain unchanged. A v1.3.0 run does not require a migration or forced reset.

## Release boundary

- Semantic version: **1.3.1**.
- Public cache generation: **170**.
- The immutable ZIP contains final served bytes, exact source revision, checksums, offline activation, public/origin health checks and automatic rollback.

## Validation

Targeted deterministic validation covers the single-authority graph, fixed Chinese/English routes, town checkpoints, the finite market and wheel lifecycle, skill-evolution behavior, guardian warning/resolution state, JavaScript syntax and the final unpacked artifact checksum/manifest. GitHub PR review remains the integration boundary; long-run human balance evidence continues under Issues #3, #4, #5, #7, #10 and #11.
