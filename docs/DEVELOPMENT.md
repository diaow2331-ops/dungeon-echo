# Dungeon Echo Development Guide

Dungeon Echo is a static browser game. The engineering goal is to restore and extend features without recreating the multi-owner runtime that caused v1.2 regressions.

## Start with ownership

Before changing code, answer two questions:

1. What responsibility does this change belong to?
2. Which single production file owns that responsibility?

Use `docs/authority-map-v130.json`. If no owner exists, define one deliberately before implementation. Do not create a temporary wrapper that silently becomes a second owner.

## Active vs quarantined code

Active production code lives in the release allowlist: `ops/release/static-files.txt`.

Previously completed work lives under `archive/quarantine-v130/`. The quarantine is a source library for reconstruction. Never import or load it directly in production.

Typical restoration examples:

- commerce/forge/progression logic → port into the gameplay authority or a formally extracted single system owner;
- J/K combat controls → integrate into the sole input/combat owner rather than restoring `combat-controls.js` as another key handler;
- town UI → rebuild as DOM-only presentation over explicit core data/events, not by patching gameplay methods;
- detailed Boss/monster/town art → promote assets into canonical `art/` and render them directly from the core renderer, not from an overlay Canvas;
- save validation → integrate into the persistence owner rather than running a second localStorage writer.

## Active module boundaries

### `game/core/game.js`

May mutate gameplay state and render the canonical game surfaces. All gameplay behavior currently converges here while the repository is being normalized.

### `game/core/production-bootstrap.js`

May perform the pre-boot storage epoch reset and explicit New Adventure reset orchestration. It must not become a second live gameplay state machine.

### `game/core/runtime-bootstrap.js`

May load approved DOM/CSS followers only. It may not load gameplay wrappers, Canvas overlays or storage migrations.

### `game/input/desktop-controls.js`

May translate Gamepad API input into canonical commands. It may not call gameplay systems, mutate `DE_TEST` or write gameplay storage.

### `game/locale/*`

May supply language data and fixed-route navigation. No Canvas interception or gameplay mutation.

### `game/ui/*`

May own bounded DOM/CSS presentation. No gameplay state ownership, no competing gameplay input, no gameplay persistence and no second Canvas renderer.

## Development checklist

For every restoration or new feature:

- identify the owner;
- keep state in one place;
- keep one event owner per command;
- keep one renderer per surface;
- keep one writer per persistent namespace;
- prefer data/config interfaces over runtime monkey-patches;
- update `docs/authority-map-v130.json` when ownership intentionally changes;
- run `node test/single-authority-v130.cjs` before opening a release PR.

## Release graph

Source equals artifact. The builder copies allowlisted source files and does not rewrite the dependency graph.

Current semantic version: `1.7.0`.
Current public cache generation: `181`.
