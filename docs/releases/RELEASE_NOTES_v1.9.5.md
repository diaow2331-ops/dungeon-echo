# Dungeon Echo v1.9.5

## Render lifecycle

- The canonical dungeon Canvas no longer runs a permanent animation loop while the title, pause screens, shop/shrine overlays or town are active.
- During a settled dungeon turn, rendering drops to a bounded ambient cadence and wakes immediately when movement, hitstop, projectiles, particles, floaters or combat VFX become active.
- Page visibility changes cancel both animation-frame and idle-timer work; active rendering resumes only when the visible gameplay state requires it.

## Minimap work reduction

- The minimap now keys its paint cache from floor/FOV revision, player position, entity counts and canvas dimensions.
- Unchanged visual frames skip the complete 40×28 minimap scan.
- FOV recomputation invalidates the cache explicitly, preserving exploration and visibility correctness.

## Town performance

- Echo Town now uses an adaptive renderer instead of a continuous full-rate loop.
- Settled town presentation uses a low-frequency ambient cadence.
- Avatar movement and wheel animation run near 30fps rather than forcing a 60fps full-town repaint.
- The town-scene and wheel canvases have independent paint eligibility: wheel spins no longer repaint the entire authored town scene, and avatar movement no longer redraws a static wheel.

## Browser validation

Measured in the same headless Chrome environment against v1.9.4:
- title idle rAF: about 60/s → 0/s
- dungeon idle main-thread task time: about 295ms/s → 62ms/s
- town idle main-thread task time: about 968ms/s → 263ms/s
- town movement task time: about 689ms/700ms → 345ms/700ms
- wheel-animation task time: about 894ms/s → 506ms/s

These measurements are environment-specific and are included as regression evidence, not a device-wide performance guarantee.

## Compatibility and authority

- No combat/economy/progression values change in this release.
- Save schema remains version 2 and storage epoch remains v130.
- Existing local saves remain compatible.
- game/core/game.js remains the sole live gameplay/render/input/persistence authority.

## Release identity

- Semantic version: 1.9.5
- Public cache generation: 195
- Runtime bootstrap: v37
- Visible release stamp: game/core/release-stamp-v195.js
