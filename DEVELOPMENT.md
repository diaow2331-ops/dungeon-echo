# Development Guide

Dungeon Echo is deliberately a static browser game. The production build does not require a package manager, bundler, application server or database.

The engineering goal is not to make the repository look maximally abstract. It is to keep gameplay changes understandable, testable and safe to deploy.

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

- `game.js` — core state, map generation, turn loop and mechanics that genuinely belong inside the combat/state engine.
- `gameplay-tuning.js` — production rules and human-first class tuning.
- `equipment-system.js` — equipment generation, class-relative fit, intrinsic value support and deep-floor scaling.
- `progression-system.js` — talents and long-run progression; future milestone skill evolution belongs here when the boundary is practical.
- `town-system.js` — conquered-depth checkpoints, town progression state and wheel policy.
- `commerce-system.js` — finite town supply stock and chapter-scaled supply pricing.
- `forge-system.js` — bounded +3 refinement choices and +5 masterwork completion.
- `content-system.js` — late-floor themes, guardian content bridge and future bespoke boss states where they can remain data/content driven.
- `desktop-controls.js` — desktop/gamepad input adapter.
- `profiles/` — production data plus short deterministic regression fixtures.

The intended direction is gradual extraction from `game.js`, not a rewrite. A new module should own a real responsibility, not duplicate state merely to look modular.

## Save data

The game stores local progress in browser `localStorage`. When changing save structures:

1. preserve old keys when practical;
2. add migration/default handling instead of assuming a fresh save;
3. test loading a pre-change save as well as creating a new save;
4. avoid silently deleting player progress to repair malformed data;
5. keep production and development/test state clearly separated.

## Balance workflow

`BALANCE_NOTES.md` records the current balance findings and human-play baseline.

When changing class or combat balance, evaluate at least:

- damage rhythm;
- incoming damage / healing pressure;
- resource usage;
- positioning burden;
- equipment dependence;
- retreat incentives;
- early/mid/late-floor behavior.

Do not optimize only for bot clear rate. Simulation is useful for locating suspicious walls and regressions; it is not a substitute for real-player decisions such as kiting, shopping, retreating or intentionally taking risk.

## Tests

The release-oriented command set is:

```bash
node test/production.cjs
node test/descent100.cjs
node test/smoke.cjs
node test/release.cjs
```

- `production.cjs` boots the exact script list declared by `index.html` and verifies the `classic-100` production contract.
- `descent100.cjs` drives the deterministic 1→100 content/descent contract.
- `smoke.cjs` preserves broad historical feature/save coverage on development fixtures.
- `release.cjs` checks the static public package and deployment-facing resource contract.

`node test/sim.cjs` remains an optional balance diagnostic. Run it when a change materially affects combat, generation, progression or economy; do not run large simulations as a ritual for unrelated documentation/UI work.

For focused JavaScript changes, syntax checking remains cheap and useful:

```bash
node --check game.js
node --check gameplay-tuning.js
node --check equipment-system.js
node --check progression-system.js
node --check town-system.js
node --check commerce-system.js
node --check forge-system.js
node --check content-system.js
node --check desktop-controls.js
```

Prefer the smallest test set that can actually falsify the change, then expand only when the affected surface requires it.

## AI-assisted engineering workflow

AI-assisted contributions are part of this project's development workflow. OpenAI ChatGPT has been used for repository-wide inspection, architecture reasoning, debugging, test design, gameplay/economy analysis, deployment review and documentation work.

For AI-assisted changes, apply the same standard as any other contribution:

- the maintainer defines the goal and decides whether the proposed behavior belongs in the game;
- inspect the real repository state before proposing broad changes;
- prefer concrete diffs and reproducible evidence over confident prose;
- validate generated or suggested code with the smallest relevant deterministic checks;
- do not merge a change only because an AI system described it as correct;
- keep authorship/assistance disclosures factual and do not imply OpenAI endorsement.

AI is used here as an engineering collaborator and reasoning tool; repository ownership, product judgment, merge control and deployment remain human-controlled.

## Production deployment assumptions

The production directory must remain directly hostable by a static web server:

- no Node process required at runtime;
- no PHP/API/database required for the core game;
- the deployed file set is explicit and verifiable;
- deployment should preserve rollback capability;
- save state remains local unless an optional online feature is intentionally designed later.

Current public locations:

- `https://play.91hwl.cn/dungeon-echo/`
- `https://91hwl.cn/toys/dungeon-echo/`

## Architecture rule of thumb

If a change can be implemented as a self-contained system without duplicating private core state, prefer a module. If the mechanic genuinely belongs inside the turn/state engine, modify `game.js` directly and extract only when a stable boundary becomes clear.

Architecture exists to reduce regression risk and make gameplay iteration safer. It is not a goal by itself.
