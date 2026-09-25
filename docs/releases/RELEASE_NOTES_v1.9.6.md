# Dungeon Echo v1.9.6

## HUD dirty updates

- HUD nodes are resolved lazily once and retained in a cache instead of repeatedly calling getElementById.
- A whole-HUD state signature now exits unchanged frames before per-field dirty comparisons.
- Changed fields use guarded text, style, property, class and className writers.
- Repeated stable HUD updates therefore perform zero DOM writes and zero repeated element lookups.

## Stable Canvas caches

- Stable text measurements are cached by font + label.
- Dungeon player-light and vignette gradients are reused when their geometry is unchanged.
- Stable stair glow and town backdrop/fire gradients are cached.
- Town authored NPC labels reuse measured widths instead of calling measureText every redraw.

## Browser regression evidence

Measured in the same headless Chrome environment against v1.9.5:
- 240 empty wait turns: getElementById 8400 → 240
- 240 empty wait turns: textContent writes 4080 → 1
- 240 empty wait turns: class toggles 1200 → 0
- 7×240-turn median execution: roughly 76–82ms → 61–62ms
- settled town measureText calls over 1.5s: 98 → 7
- settled town stable linear/radial gradient creation over 1.5s: 14/14 → 1/1

These numbers are environment-specific regression evidence, not a device-wide performance guarantee.

## Compatibility and authority

- No combat, economy or progression tuning changes.
- Save schema remains version 2 and storage epoch remains v130.
- Existing local saves remain compatible.
- game/core/game.js remains the sole live gameplay/render/input/persistence authority.

## Release identity

- Semantic version: 1.9.6
- Public cache generation: 196
- Runtime bootstrap: v38
- Visible release stamp: game/core/release-stamp-v196.js
