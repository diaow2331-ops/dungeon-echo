# Dungeon Echo v1.3.0

Dungeon Echo v1.3.0 is an authority reset. Public cache generation for the clean baseline is **169**.

## What changed

The v1.2 line accumulated useful systems and art through independent wrappers, overlays and migrations. Several of those modules could mutate the same gameplay functions, write the same browser state, capture the same commands or redraw the same Canvas surfaces.

v1.3.0 stops that pattern before more content is added.

- `game/core/game.js` is the sole gameplay state, combat/economy/progression/town, gameplay-persistence and dungeon/town Canvas authority.
- keyboard/touch gameplay input is owned by core;
- gamepad is transport-only;
- runtime loading is restricted to approved DOM/CSS followers;
- historical Canvas overlays, API wrappers and storage migrations are not active production code;
- production cache generation is 169 and source equals artifact.

## Previously completed work is preserved

This cleanup does **not** throw away the work done in v1.2.

Previously completed gameplay systems, town/economy modules, UI, combat controls, localization shims, persistence helpers and overlay art runtimes are preserved in `archive/quarantine-v130/`, grouped by responsibility and provenance.

The quarantine is intentionally not shipped. Features return by being ported into their sole current owner, not by re-enabling the old wrapper.

## Canonical production art

The clean baseline currently renders the canonical v11 hero, monster, guardian, final-boss and town art directly from core. Detailed overlay-era assets are preserved in quarantine and may be promoted into canonical `art/` later when the core renderer owns them directly.

## Storage epoch

v1.3.0 uses storage epoch `v130`. Historical Dungeon Echo gameplay storage is cleared rather than migrated. The old save-integrity/item-migration/New Run shims are preserved in quarantine only.

## Governance

The repository now contains:

- `docs/ARCHITECTURE_SINGLE_AUTHORITY.md`;
- `docs/authority-map-v130.json`;
- `archive/quarantine-v130/RESPONSIBILITY_INDEX.md`;
- a behavior-level `test/single-authority-v130.cjs` contract;
- release/deploy health checks that reject wrapper systems and quarantined paths.

The invariant is simple: **one responsibility, one production authority**.
