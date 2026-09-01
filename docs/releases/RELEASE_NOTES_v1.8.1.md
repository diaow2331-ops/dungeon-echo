# Dungeon Echo v1.8.1

## Scope
A focused desktop town presentation patch following the v1.8.0 Living Town II + Named Relics release. Gameplay rules, economy, saves, named sets and authored art atlases are unchanged.

## Changes
- Town overlay uses substantially more desktop viewport width instead of leaving large dead margins.
- Fortune wheel scales from the old ~230 px cap up to 390 px on large displays.
- Existing town-project, service and relic artwork is presented at a larger, more legible scale.
- Market, Tavern, Gear, Relic Hall and Departure layouts use denser desktop spacing while retaining their existing mobile rules.
- Plaza presentation may use a larger rendered footprint without introducing a second renderer or new art.
- A fullscreen control now lives inside the town header; it shares the existing canonical fullscreen toggle and state with the main HUD control.
- Town fullscreen explicitly expands the town shell to the fullscreen viewport.

## Release authority
- Semantic version: 1.8.1
- Cache generation: 183
- Storage epoch: v130 (unchanged)
- Runtime UX bootstrap: v35
- New visible release stamp: game/core/release-stamp-v181.js

## Validation
- Runtime-injected visual probe at 1648×928 covered Plaza, Gear, Market, Tavern, Fortune, Relic Hall and Departure.
- The Fortune canvas measured 390×390 in the desktop candidate instead of 230×230.
- Town fullscreen smoke probe entered the Fullscreen API successfully and expanded the shell to the fullscreen viewport.
- test/town-presentation-v181.cjs locks the new town/fullscreen presentation contract.
