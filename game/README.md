# Active browser runtime

This directory contains active production presentation/localization code that does not need to remain loose at the repository root.

## `locale/`

Fixed-route display ownership only:

- `fixed-locale-entry-v130.js` — Chinese/English route navigation and legacy `?lang=` convergence.
- `stable-item-id-migration-v150.js` — additive language-neutral item display IDs.
- `core-screen-owner-v153.js` — exact remaining English core screen sinks.
- `town-canvas-locale-v153.js` — exact Town / Fortune Wheel Canvas text sinks.

These files must not fork gameplay saves, reintroduce whole-document translation, or add polling/MutationObserver followers.

## `ui/`

Bounded presentation followers:

- character/world-loot visual cleanup;
- forge feedback and combat hints;
- audio director;
- mobile UX;
- Help and Expedition Record presentation.

Files here may observe/render presentation state but must not become hidden owners of combat balance, economy, RNG or persistent gameplay identity.

Synchronous engine/gameplay/input files that are directly loaded by `index.html` and `en/index.html` remain at the repository root for the current release line. New presentation-only modules should prefer this directory instead of adding more loose root files.
