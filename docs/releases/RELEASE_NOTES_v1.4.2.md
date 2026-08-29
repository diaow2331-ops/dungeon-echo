# Dungeon Echo v1.4.2

Release boundary: cache generation 178, runtime bootstrap v30.

## Paged Echo Town

- Echo Town now stays inside a fixed viewport instead of becoming a long document.
- Plaza, Gear, Market, Tavern, Fortune, and Depart are dedicated pages with a persistent compact header.
- Town NPC interactions open the matching page directly; tabs provide immediate mouse, touch, and keyboard access.
- Each service page owns its overflow, so town navigation never moves the underlying game page.

## Larger living plaza

- The default town page is a 1120 × 460 walkable panorama using the authored high-detail backdrop.
- Hero, NPC, interaction glow, and nameplate scale follow the larger canvas for stronger silhouettes and readable detail.
- Growth/readiness summaries stay beneath the plaza without competing with inventory or economy panels.
- Mobile uses the same page model with a compact three-column tab grid.

The single-authority architecture and save epoch remain unchanged: canonical `game/core/game.js` still owns town state, movement, rendering, interaction routing, and persistence.
