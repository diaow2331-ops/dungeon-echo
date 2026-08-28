# Active browser runtime

All active Dungeon Echo JavaScript lives under this directory. The repository root intentionally contains no runtime `.js` files.

## `core/`

Core runtime and release boundary:

- `game.js` — map/state/turn engine.
- `production-bootstrap.js` — production profile selection and narrow compatibility bootstrap.
- `save-integrity-system.js` — pre-core persistent-state validation.
- `runtime-bootstrap.js` — late presentation/locale follower loader shared by both fixed routes.
- `release-stamp-v129.js` — current v1.2.9 semantic release stamp.

## `systems/`

Explicit gameplay owners for equipment, town, commerce, forging, progression, encounter content, pressure, defense and risk/reward behavior.

A system file should own a concrete gameplay responsibility. Do not split modules merely to increase module count, and do not duplicate canonical state across owners.

## `input/`

Synchronous input ownership:

- `desktop-controls.js` — keyboard/gamepad adapter and semantic Return delegation.
- `combat-controls.js` — J Attack / K Skill + Mana contract.

Input modules may delegate to gameplay owners but must not silently fork their state machines.

## `locale/`

Fixed-route display/data ownership:

- `locale-data-v134.js` and `core-locale-data-v139.js` — route-aware display data.
- `fixed-locale-entry-v130.js` — Chinese/English route navigation and legacy `?lang=` convergence.
- `stable-item-id-migration-v150.js` — additive language-neutral item display IDs.
- `core-screen-owner-v153.js` — exact remaining English core screen sinks.
- `town-canvas-locale-v153.js` — exact Town / Fortune Wheel Canvas text sinks.

These files must not fork gameplay saves, reintroduce whole-document translation, or add generic polling/MutationObserver followers.

## `ui/`

Bounded presentation followers, including visual cleanup, shop presentation, forge feedback, combat hints, audio, mobile UX, Help and Expedition Record.

Files here may observe/render presentation state but must not become hidden owners of combat balance, economy, RNG or persistent gameplay identity.

## Repository rule

New active JavaScript belongs in one of these ownership folders. Do not add compatibility copies or loose `.js` files back to the repository root. Historical code belongs under `archive/`, and production release membership remains explicit in `ops/release/static-files.txt`.
