# Quarantined responsibility index

Previously completed work is preserved here by category. Future restoration must go through the current sole owner for that responsibility.

- `gameplay-systems/`: commerce, equipment, forging, progression, town, combat/content pressure, defense, risk/reward. Future owner: `game/core/game.js` until a formally extracted single owner replaces that responsibility.
- `ui-legacy/`: shop/town workspace, forge feedback, expedition pressure/record, audio/mobile polish. Future role: DOM-only UI or a narrow hook owned by core; no gameplay mutation.
- `input-legacy/`: old combat and desktop/gamepad handlers. Keyboard/touch owner: `game/core/game.js`; gamepad transport owner: `game/input/desktop-controls.js`.
- `locale-legacy/`: old Canvas text interceptors, screen translators and item migrations. Future owner: fixed-route locale data/source; no Canvas interception.
- `persistence/`: save validation, item migration and New Adventure reset shims. Gameplay persistence owner: `game/core/game.js`; `production-bootstrap.js` may only perform pre-boot epoch reset.
- `art-runtime-code/`: entity overlays, terrain coordinator, town overlay, directional hero, line FX and visual/loot overlays. Useful art may return only through the canonical renderer.
- `art-runtime/`: detailed Boss, monster, prop, hero and loot runtime assets. Assets may be promoted into canonical `art/` only when `game.js` directly renders them.

A quarantine item is not re-enabled in place. Useful behavior, data, copy or art is ported into its owner while the old wrapper remains archived.