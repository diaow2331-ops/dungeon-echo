# Development Guide

Dungeon Echo is deliberately a static browser game. The production build does not require a package manager, bundler or backend.

## Entry points

- `index.html` — production route; fixed to `classic-100`.
- `dev.html` — development route; exposes short deterministic profiles used for regression and balance work.

Do not add player-facing starting-depth selection back into `index.html`.

## Local server

Recommended:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
http://localhost:8000/dev.html
```

## Current module boundaries

- `game.js` — legacy core state, map generation and turn loop.
- `gameplay-tuning.js` — production rules and class tuning.
- `equipment-system.js` — equipment generation, class-relative value and deep-floor scaling.
- `progression-system.js` — talents and long-run progression.
- `town-system.js` — town flow and conquered-depth checkpoints.
- `content-system.js` — late-floor/chapter content extensions.
- `desktop-controls.js` — desktop/gamepad input adapter.
- `profiles/` — production data plus short regression fixtures.

The intended direction is gradual extraction from `game.js`, not a rewrite.

## Save data

The game stores local progress in browser `localStorage`. When changing save structures:

1. preserve old keys when possible;
2. add migration/default handling instead of assuming a fresh save;
3. test loading a pre-change save as well as creating a new save;
4. avoid silently deleting player progress to repair malformed data.

## Balance workflow

`BALANCE_NOTES.md` is the current human-play baseline.

When changing class or combat balance, evaluate at least:

- damage rhythm;
- incoming damage / healing pressure;
- resource usage;
- positioning burden;
- equipment dependence;
- early/mid/late-floor behavior.

Do not optimize only for bot clear rate.

## Tests

The release-oriented command set is:

```bash
node test/production.cjs
node test/descent100.cjs
node test/smoke.cjs
```

- `production.cjs` boots the exact script list declared by `index.html` and verifies the
  `classic-100` route, production modules, human-play tuning and guardian content.
- `descent100.cjs` drives the deterministic 1→100 content/descent contract.
- `smoke.cjs` preserves the broad historical feature coverage on the `classic-30`
  development fixture. It is useful regression evidence, but it is not the public-route
  default contract.

`node test/sim.cjs` remains the optional balance diagnostic. It is intentionally excluded
from the fast release gate because bot win rate is not a human-play acceptance criterion.

For a focused JavaScript change, syntax checking is cheap and useful:

```bash
node --check game.js
node --check gameplay-tuning.js
node --check equipment-system.js
node --check progression-system.js
node --check town-system.js
node --check content-system.js
node --check desktop-controls.js
```

Only run broader simulation when the change affects combat, generation, progression, economy or save behavior.

## Production deployment assumptions

The final production directory should remain directly hostable by a static web server:

- no Node process required at runtime;
- no PHP/API required for the core game;
- `index.html` should use conservative caching;
- versioned JS/CSS/art assets may use long-lived caching later;
- save state remains local unless an optional online feature is intentionally added in the future.

## Architecture rule of thumb

If a change can be implemented as a self-contained system without reaching into private core state, prefer a module. If the mechanic genuinely belongs inside the turn/state engine, modify `game.js` directly and extract only when the boundary is clear.

Architecture exists to reduce regression risk; it is not a reason to duplicate state or add adapter layers with no gameplay value.
