# Dungeon Echo — Echo Town authored-art audit (v1.9 candidate)

Date: 2026-09-02  
Baseline: public v1.8.1 + living-town return-loop work on `main`.

## Goal

The v1.8 town was mechanically richer than its visual presentation. The plaza still read as a functional game screen, while Smithy, Market, Tavern and Relic Hall depended mostly on small construction sprites and text cards.

This pass raises the town from “service menu with a walkable banner” to a place with a stronger environment identity, without moving any gameplay authority out of the existing domain/core owners.

## Authored environment assets

| Asset | Dimensions | Approx. size | Runtime role |
| --- | ---: | ---: | --- |
| `art/town-backdrop-v190.webp` | 1600×900 | 262 KiB | Main walkable plaza backdrop |
| `art/town-blacksmith-v190.webp` | 1024×768 | 156 KiB | Stash / Smith service plate |
| `art/town-market-v190.webp` | 1024×768 | 164 KiB | Market / trade-road service plate |
| `art/town-tavern-v190.webp` | 1024×768 | 109 KiB | Ember Tavern service plate |
| `art/town-relic-hall-v190.webp` | 1024×768 | 145 KiB | Relic Hall collection plate |

The five WebP assets total roughly 0.83 MiB. Only the main town backdrop is preloaded; service scenes remain CSS-backed lazy assets so initial title/dungeon load does not pay for all town art.
## Integration

- `game/core/game.js` prefers the new plaza backdrop and retains `town-backdrop-v11.webp` as a loading/failure fallback.
- Smithy, Market, Tavern and Relic Hall receive large environment plates in both fixed locale routes.
- Existing town-growth atlas sprites still communicate construction level; the new plates provide environment identity rather than replacing progression state.
- New return events now light the matching NPC news state: Apothecary Batch, Smithy Caravan Commission and Long-Table Supply Pool.
- Mobile uses bounded plate heights and cover crops; desktop grants the scenes more visual weight.
- Dialogue remains above the environment layer and keeps the existing portrait/state authority.

## Authority and save boundary

This is a presentation pass. It adds no currency, RNG stream, save field, combat rule, item rule, equipment rule, construction rule or new runtime owner.

The canonical boundaries remain:
- town growth/event policy: `game/domain/town/town-growth-rules-v180.js`;
- gameplay mutation, persistence, Canvas town interaction and service rendering: `game/core/game.js`;
- static environment styling: `style.css`;
- fixed Chinese/English route structure: `index.html`, `en/index.html`.

Storage epoch remains unchanged.

## Browser validation

Local production-graph validation was executed with Chromium against the actual fixed-route HTML.

Desktop viewport: 1440×1000.
- Town shell: 1414×984.
- Seven town tabs remained equal-width.
- Plaza, Gear, Market, Tavern and Relic Hall were exercised.
- No console errors or page errors.

Mobile viewport: 412×915.
- Town shell: 400×903.
- Document width remained 412 px with no horizontal overflow.
- Seven tabs remained reachable through the existing compact navigation.
- Plaza, Gear, Market, Tavern and Relic Hall were exercised.
- No console errors or page errors.

The screenshots were treated as local review evidence and are intentionally not committed as production assets.
