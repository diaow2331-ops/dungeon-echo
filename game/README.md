# Active browser runtime

The active runtime is deliberately small. Historical functionality is preserved under `archive/quarantine-v130/`, not executed from `game/`.

## Authority rule

**One responsibility has exactly one production authority.**

The canonical map lives in `docs/authority-map-v130.json`.

## `core/`

- `game.js` — sole owner of gameplay state, turn flow, combat, economy, progression, town behavior, dungeon/town Canvas rendering, keyboard/touch gameplay input and gameplay persistence.
- `production-bootstrap.js` — pre-core storage epoch reset and production authority declaration. It must not become a gameplay system.
- `runtime-bootstrap.js` — loads only approved DOM/CSS followers. It must not load gameplay wrappers or Canvas overlays.
- `release-stamp-v130.js` — visible semantic release stamp only.

## `input/`

- `desktop-controls.js` — gamepad transport only. It converts Gamepad API input into canonical commands and must not call gameplay systems, mutate `DE_TEST` or write gameplay storage.

Keyboard and touch gameplay input stay in `game.js` until/unless they are deliberately extracted into one replacement owner.

## `locale/`

- `locale-data-v134.js` / `core-locale-data-v139.js` — language data.
- `fixed-locale-entry-v130.js` — fixed-route language navigation and bounded language preference UI.

No locale module may intercept Canvas methods or become a gameplay/save owner.

## `ui/`

Only DOM/CSS followers approved by `runtime-bootstrap.js` belong here. Current production followers are responsive layout and help copy. UI files must not draw over the dungeon/town Canvas, patch gameplay APIs, write gameplay state or capture gameplay key commands.

## Quarantine

Previously implemented systems, UI, combat controls, localization shims, persistence helpers and overlay art runtimes are preserved under `archive/quarantine-v130/` by responsibility.

They are reference implementations. Restore behavior by porting it into the sole owner named by `docs/authority-map-v130.json`; never load a quarantine wrapper directly.

## Release boundary

`ops/release/static-files.txt` is the production allowlist. `archive/` and `game/systems/` must never appear in the artifact while the v1.3.0 authority baseline is active.
