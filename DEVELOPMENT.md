# Development Guide

Dungeon Echo is deliberately a static browser game. The production build does not require a package manager, bundler, application server or database.

The engineering goal is to keep gameplay changes understandable, testable and safe to deploy without turning the repository into an abstraction exercise.

## Entry points

- `index.html` — production route, fixed to `classic-100`.
- `dev.html` — internal development harness for short deterministic profiles.

Do not add player-facing starting-depth selection back into `index.html`.

The development harness is useful, but it is not a second product surface. If it drifts from production UI/behavior, treat that as repository debt.

## Local server

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
http://localhost:8000/dev.html
```

## Current module boundaries

- `game.js` — core state, map generation, turn loop and mechanics requiring direct engine access.
- `gameplay-tuning.js` — production rules and human-first class tuning.
- `equipment-system.js` — equipment generation, class-relative fit, intrinsic value and deep-floor scaling.
- `progression-system.js` — talents and 20/40/60/80 milestone skill evolution.
- `town-system.js` — conquered-depth checkpoints, town progression and wheel policy.
- `commerce-system.js` — finite town supply stock and chapter-scaled pricing.
- `forge-system.js` — bounded +3 refinement choices and +5 masterwork completion.
- `content-system.js` — late-floor themes plus guardian/finale state machines.
- `desktop-controls.js` — desktop/gamepad input adapter.
- `profiles/` — production data plus deterministic regression fixtures.

The intended direction remains gradual extraction from `game.js`, not a rewrite. A new module should own a real responsibility instead of duplicating state merely to increase module count.

## Save data

The game stores progress in browser `localStorage`. When changing persistent structures:

1. preserve old keys when practical;
2. add compatible defaults/migration instead of assuming a fresh save;
3. test a pre-change save and a fresh save;
4. avoid silently deleting player progress to repair malformed data;
5. keep temporary combat/UI state out of persisted state.

Presentation-only art/CSS/UI changes should not require a save migration.

## Balance workflow

`BALANCE_NOTES.md` records the human-play baseline.

When changing class or combat balance, evaluate at least:

- damage rhythm;
- incoming damage / healing pressure;
- resource usage;
- positioning burden;
- equipment dependence;
- retreat incentives;
- early/mid/late-floor behavior;
- guardian-specific counterplay.

Do not optimize only for bot clear rate. Simulation is useful for locating suspicious walls and regressions; it is not a substitute for human decisions such as kiting, shopping, retreating or intentionally taking risk.

## Tests

High-value release checks:

```bash
node test/production.cjs
node test/descent100.cjs
node test/guardian-content.cjs
node test/skill-evolution.cjs
node test/smoke.cjs
node test/release.cjs
```

- `production.cjs` boots the production script list and verifies the `classic-100` contract.
- `descent100.cjs` protects the deterministic 1→100 content/descent chain.
- `guardian-content.cjs` protects warning/resolution state transitions and finale phases.
- `skill-evolution.cjs` protects milestone delivery and behavior-changing class routes.
- `smoke.cjs` preserves broad historical feature/save coverage on development fixtures.
- `release.cjs` checks the public package and deployment-facing resource contract.

`node test/sim.cjs` remains an optional balance diagnostic. Use it when a change materially affects combat, generation, progression or economy; do not run large simulations as a ritual for documentation/art work.

For focused JavaScript changes, syntax checking is cheap:

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

## Release boundary

The public static file set is controlled by `ops/release/static-files.txt`.

Development-only files, tests and short profiles must not leak into the production package. New production art/scripts must enter the allowlist deliberately and be covered by the release contract.

The current deployment model overlays `/dungeon-echo/` into the existing immutable `91hwl-play` release tree and atomically switches the shared `current` symlink. Failed health checks must preserve rollback behavior.

## AI-assisted engineering workflow

AI-assisted contributions follow the same standard as any other change:

- inspect the real repository state first;
- prefer concrete diffs and reproducible evidence;
- use focused validation;
- do not merge because an AI system merely described a change as correct;
- preserve production-entry, save and deployment contracts;
- keep collaboration disclosures factual and avoid implying endorsement.

OpenAI ChatGPT has been used for repository inspection, debugging, systems reasoning, regression strategy, gameplay/economy analysis, deployment review and documentation/implementation assistance. Repository ownership and final judgment remain human-controlled.

## Architecture rule of thumb

If a change can be implemented as a self-contained system without duplicating private core state, prefer a module. If a mechanic genuinely belongs inside the turn/state engine, modifying `game.js` can be correct.

Architecture exists to reduce regression risk and make iteration safer. It is not a goal by itself.
