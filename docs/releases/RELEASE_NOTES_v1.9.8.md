# Dungeon Echo v1.9.8

## Allocation-free hot cache guards

- Minimap unchanged-state checks use structured primitive comparisons instead of joined-string cache keys.
- Static dungeon-layer, visibility-layer and scene-filter caches compare primitive revision/camera/turn state directly.
- Player-light, vignette and authored-town backdrop caches avoid composite string-key allocation on hot paths.
- The v1.9.5–v1.9.7 render lifecycle, DOM and static-scene optimizations remain intact.

## Rejected dynamic-gradient experiment

- Reusable glow sprites and then native dynamic-gradient caches were prototyped during development.
- The native gradient experiment was intentionally removed before release while the hot-cache guards were being simplified.
- Commit `6745c83` retired its dedicated regression test.
- The shipped v1.9.8 runtime continues to construct equipment, amulet and torch dynamic gradients normally.

## High-DPI audit

- In the same Chrome environment at DPR 1, 2 and 3, the game Canvas backing dimensions remained unchanged.
- No hidden 4×/9× backing-pixel multiplication was found, so no DPR downscaling behavior change shipped.

## Compatibility and authority

- No combat, economy or progression tuning changes.
- Save schema remains version 2 and storage epoch remains v130.
- Existing local saves remain compatible.
- game/core/game.js remains the sole live gameplay/render/input/persistence authority.

## Release identity

- Semantic version: 1.9.8
- Public cache generation: 198
- Runtime bootstrap: v40
- Visible release stamp: game/core/release-stamp-v198.js
