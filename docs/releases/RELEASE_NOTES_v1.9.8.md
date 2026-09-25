# Dungeon Echo v1.9.8

## Dynamic gradient cache

- Equipment loot auras reuse native CanvasGradient objects inside rounded pixel-position buckets.
- Amulet aura gradients reuse the same cache mechanism.
- Torch glow keeps its visible flicker, but radius changes are quantized into nine cached buckets per torch position.
- Cached gradients remain tied to their original Canvas context and geometry; only exact compatible states reuse them.

## High-DPI audit

- The game does not multiply Canvas backing dimensions by devicePixelRatio.
- In the same Chrome environment at DPR 1, 2 and 3, the game Canvas stayed at 1280×896 while CSS display dimensions remained unchanged.
- This means there is no hidden 4×/9× backing-pixel penalty from the current high-DPI path, so no DPR downscaling change is included.

## Browser regression evidence

Measured against v1.9.7 on verified, separate local HTTP origins:
- idle native radial-gradient creation over 1.2s: 11–18 → 0–4
- action native radial-gradient creation over 700ms: 7–13 → 0–4
- dynamic-gradient cache tests cap torch flicker at nine native gradient variants for 240 sampled animation states
- headless TaskDuration was too noisy across runs to use as a release claim, so it is intentionally excluded from the performance conclusion

These figures are environment-specific regression evidence, not a device-wide performance guarantee.

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
