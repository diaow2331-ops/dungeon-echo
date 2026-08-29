# v1.3.0 quarantine

This directory is the temporary home for previously completed Dungeon Echo work that was removed from the active production graph while authority ownership is repaired.

Nothing under this directory is loaded by production or admitted by `ops/release/static-files.txt`.

The contents are intentionally preserved, not discarded. They include mature gameplay systems, town/economy work, UI polish, input experiments, localization/runtime shims and art runtimes from the v1.2 line.

## Categories

- `gameplay-systems/` — the former `game/systems/` tree: commerce, equipment, forge, progression, town, pressure, defense, risk/reward and content systems.
- `ui-legacy/` — former presentation followers and workspace UI.
- `input-legacy/` — former input adapters including the second combat input owner.
- `locale-legacy/` — former locale/display interceptors and migrations.
- `art-runtime/` — the retired overlay art asset graph from the pre-v1.3.0 runtime.
- `persistence/` — save validation/migration/reset shims that previously wrote or transformed gameplay storage outside the core owner.

## Restoration rule

Do not copy a quarantined runtime back into `index.html` or `runtime-bootstrap.js`.

To restore a feature:

1. choose its responsibility in `docs/authority-map-v130.json`;
2. migrate the useful logic/data/art into that authority or a narrow read-only helper it owns;
3. delete duplicated state and event ownership from the old implementation;
4. add an authority contract proving there is still one writer/renderer/input owner;
5. only then add the new active file to `ops/release/static-files.txt`.

The quarantine is a reference library for reconstruction, not an alternate runtime.