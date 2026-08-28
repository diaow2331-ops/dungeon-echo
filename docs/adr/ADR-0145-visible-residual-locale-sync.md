# ADR-0145: Translate only the visible residual locale screen

## Context

The fixed Chinese/English routes now own most gameplay presentation at source. The transitional English bridge remains only for six Chinese-first core screens in `game.js`: title, class select, pause, overlay, dungeon shop and town.

After ADR-0144, the bridge stopped scanning the whole document body but still translated all six residual roots after every key/click/focus transition, including hidden screens while normal dungeon play was active.

## Decision

`locale-event-owner-v130.js` v145 resolves the residual roots that are actually visible and translates only those roots. Hidden-class, `hidden`-attribute and `aria-hidden=true` roots are excluded.

The input listeners remain event-driven and microtask-deferred so transitions such as opening pause/shop/town are observed after the core handler changes visibility. During ordinary dungeon play, where none of the six residual screens is visible, the bridge performs zero legacy tree scans.

## Consequences

- No new localization layer is introduced.
- The residual allowlist remains six screens and must continue shrinking.
- Gameplay/save/balance/cache-generation behavior is unchanged.
- This does not replace the final source-localization work for the six remaining core renderers.
- Browser verification is still required before claiming runtime PASS.
