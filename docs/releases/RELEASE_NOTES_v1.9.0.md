# Dungeon Echo v1.9.0

## Scope

A focused Echo Town depth-and-art release on top of v1.8.1. It combines the living-town return-loop pass with a new authored environment-art layer while preserving the existing combat, equipment, named-set and save authorities.

## Living Town

- Safe-return town business expands from three to six deterministic events.
- Trade Road Lv1 can unlock the Apothecary Batch: a bounded two-Potion bulk offer.
- Smithy Lv1 can unlock a Caravan Commission: a modest town-side Gold earner.
- Tavern Lv1 can unlock the Long-Table Supply Pool: a bounded Potion + Return Scroll offer.
- Project-gated events can only appear after the relevant construction exists.
- Street Rumor is now a deterministic projection of existing town state rather than a repetitive last-depth line.
- Pending town business, construction, Relic Hall focus and deeper expeditions can all enter ambient copy.
- New return events light the relevant NPC news state.
## Authored town environment art

- New 1600×900 Echo Town plaza backdrop.
- New 1024×768 environment scenes for Smithy, Market, Ember Tavern and Relic Hall.
- The plaza keeps the v1.1 backdrop as a loading/failure fallback.
- Only the main backdrop is preloaded; service scenes remain CSS-backed lazy assets.
- Desktop grants the new environments more visual weight; mobile uses bounded cover crops without horizontal overflow.
- Existing town-growth sprites continue to communicate construction stage.

## Release metadata

- Semantic version: 1.9.0
- Cache generation: 190
- Storage epoch: v130 (unchanged)
- Runtime UX bootstrap: v35
- Visible release stamp: game/core/release-stamp-v190.js
## Validation

- Local Chromium review covered Plaza, Gear, Market, Tavern and Relic Hall at 1440×1000 and 412×915.
- Mobile document width stayed at 412 px with no horizontal overflow.
- Browser console errors: 0; page errors: 0.
- Town-art focused contract: PASS.
- Living-town focused contract: PASS.
- Single-authority and cross-game boundary gates: PASS.
- Current repository suite before release-pointer promotion: 61 / 61 PASS.

No combat, dungeon RNG, named-set effect, item-stat or save-schema migration is introduced by this release.
