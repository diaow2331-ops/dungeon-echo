# Dungeon Echo v1.9.7

## Static dungeon scene layer

- Wall/floor geometry is composed once per generated or restored floor into a reusable full-map bitmap.
- Runtime drawing crops only the active viewport from that bitmap.
- Animated stairs and torches remain live and are drawn above the static layer.

## Viewport visibility layer

- The FOV darkness mask is now a viewport-sized cached bitmap rather than per-frame tile fills.
- A rebuild starts from one opaque viewport fill, then only clears/dims explored cells.
- The cache invalidates when FOV, camera, viewport size or floor identity changes.

## Shared scene filtering

- Decals, traps, secrets, NPCs, items, monsters, stairs and torches are filtered once per turn/FOV state.
- Animation frames reuse object-reference lists, so entity motion and combat VFX remain live without repeating visibility scans.

## Echo Town static backdrop layer

- The authored town image crop and global shade are composed into one reusable bitmap.
- Growth visuals, NPC population, event notices and foreground fire remain dynamic.
- The existing v1.9.5 adaptive town cadence and split wheel/town Canvas lifecycle remain intact.

## Browser regression evidence

Measured in the same headless Chrome environment against v1.9.6:
- dungeon idle main-Canvas drawImage calls over 1.2s: roughly 1008–1445 → 54
- dungeon action drawImage calls over 700ms: roughly 1120–1785 → 45–60
- dungeon action fillRect calls over 700ms: roughly 532–1080 → 70–100
- dungeon action TaskDuration across three paired samples: 214/246/331ms → 172/224/178ms
- dungeon idle script time also fell from roughly 14–15ms to roughly 10–12ms
- first town A/B pass showed lower idle and movement TaskDuration while preserving live town animation

These figures are environment-specific regression evidence, not a device-wide performance guarantee.

## Compatibility and authority

- No combat, economy or progression tuning changes.
- Save schema remains version 2 and storage epoch remains v130.
- Existing local saves remain compatible.
- game/core/game.js remains the sole live gameplay/render/input/persistence authority.

## Release identity

- Semantic version: 1.9.7
- Public cache generation: 197
- Runtime bootstrap: v39
- Visible release stamp: game/core/release-stamp-v197.js
