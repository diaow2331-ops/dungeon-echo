# Dungeon Echo v1.3.0 modular reintegration plan

This plan describes how the clean single-authority baseline can become modular again **without recreating multiple authorities**.

The current authority map remains `docs/authority-map-v130.json`. Planned directories below are destinations, not active owners.

## Design rule

Modularization separates responsibilities. It does not duplicate them.

A responsibility can have many data files and read-only helpers, but exactly one production writer/state-machine/renderer owner.

## Planned domain modules

### `game/domain/combat/`

Future scope:
- attack resolution;
- class skill resolution;
- monster attack/ranged attack;
- damage mitigation/status resolution;
- combat-specific pressure rules.

Quarantine sources:
- `archive/quarantine-v130/gameplay/combat/`
- selected logic from `archive/quarantine-v130/input/combat-controls.js`.

Authority-transfer condition: combat functions and combat-mutated state must leave `game.js` atomically when this owner is introduced. Input modules may issue commands but may not calculate combat outcomes.

### `game/domain/inventory/`

Future scope:
- item identity and equipment slots;
- equip/unequip/bag operations;
- equipment scoring and derived item rules.

Quarantine source: `archive/quarantine-v130/gameplay/equipment/`.

Prefer pure item-rule functions first. Persistent player inventory state remains with the current persistence/gameplay owner until a later explicit transfer.

### `game/domain/economy/`

Future scope:
- shop pricing/stock policy;
- sell values;
- forge costs/results;
- town purchase rules.

Quarantine source: `archive/quarantine-v130/gameplay/economy/`.

The UI may display quotes but only this domain owner may decide/commit economic outcomes after extraction.

### `game/domain/progression/`

Future scope:
- XP/level rules;
- talent/evolution thresholds;
- depth/checkpoint progression guards.

Quarantine source: `archive/quarantine-v130/gameplay/progression/`.

### `game/domain/town/`

Future scope:
- town gameplay state transitions;
- stash/depart/return behavior;
- town services and NPC gameplay contracts.

Quarantine source: `archive/quarantine-v130/gameplay/town/`.

Town Canvas drawing is not automatically transferred with town gameplay. Rendering remains with the renderer owner unless separately transferred.

### `game/domain/content/`

Future scope:
- encounter/content tables;
- challenge/depth pressure configuration;
- risk/reward tables and deterministic tuning data.

Quarantine source: `archive/quarantine-v130/gameplay/content-risk/`.

This is the preferred first extraction area because data tables and pure selection rules can be modularized with relatively little state ownership risk.

## Planned infrastructure modules

### `game/render/`

Long-term destination for renderer decomposition. At first, helpers should be pure drawing functions called only by the sole renderer owner. Do not create a second animation loop or overlay Canvas.

Quarantine sources:
- `archive/quarantine-v130/art/code/` for reusable mapping/deterministic visual ideas only;
- `archive/quarantine-v130/art/assets/runtime/` for art promotion.

When renderer ownership is eventually transferred, core must stop drawing the transferred surface in the same PR.

### `game/persistence/`

Potential future single persistence owner for run/meta serialization, validation and storage keys.

Quarantine source: `archive/quarantine-v130/persistence/`.

Do not extract this early. Persistence is high-risk because two writers can silently diverge. If extracted, all gameplay save writes must move atomically from core.

### `game/input/`

Current split:
- keyboard/touch gameplay semantics: core;
- gamepad transport: `desktop-controls.js`.

Quarantine source: `archive/quarantine-v130/input/`.

If a future command router becomes the sole input owner, core listeners must be removed in the same PR. Do not layer new key listeners over old ones.

### `game/ui/`

UI modules are bounded followers. They may render DOM/CSS from explicit state/events, but must not own gameplay outcomes.

Quarantine shelves:
- `archive/quarantine-v130/ui/combat/`
- `archive/quarantine-v130/ui/town/`
- `archive/quarantine-v130/ui/platform/`.

### `game/locale/`

Locale modules own route identity and display data. Translation-after-render and Canvas interception stay retired.

Quarantine shelves:
- `archive/quarantine-v130/locale/data/`
- `archive/quarantine-v130/locale/route/`
- `archive/quarantine-v130/locale/interceptors/` (reference-only).

## Recommended reintegration order

1. **Content/data extraction** — deterministic tables and pure content selection helpers.
2. **Inventory pure rules** — scoring, slot compatibility, item descriptors without moving live state.
3. **Economy pure rules** — price/cost calculations, then transaction ownership atomically.
4. **Progression** — thresholds and pure rules, then state transitions.
5. **Town gameplay** — services and state transitions.
6. **Combat** — highest gameplay risk; restore J/K concepts only through the sole combat/input contract.
7. **UI/platform polish** — after the domain interfaces they observe are stable.
8. **Art promotion** — promote detailed assets into the canonical renderer directly, one family at a time.
9. **Persistence extraction** — last, only if it materially improves maintainability.

## Required shape of every reintegration PR

Every PR restoring quarantined work must state:

- responsibility;
- quarantine source;
- old production authority;
- new production authority, if ownership changes;
- state written by the owner;
- commands/events accepted;
- read-only data/events exposed to followers;
- old writer/listener/renderer removed in the same PR;
- authority contract updated.

A PR fails architecture review if both the old and new implementation can mutate the same responsibility at runtime.

## Art-specific rule

Art assets are data, not render authorities.

A new atlas can be added to canonical `art/` without creating a new Canvas owner. The renderer owner decides which atlas cell is displayed. Overlay-era code that masks the core image and redraws it is not a valid restoration path.

## Current stopping point

Until a reintegration PR explicitly transfers authority, `game/core/game.js` remains the sole owner of the gameplay responsibilities listed in the current authority map. The organized quarantine allows feature work to resume without losing previous implementation effort or reintroducing the old runtime topology.