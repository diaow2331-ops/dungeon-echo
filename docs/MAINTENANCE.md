# Dungeon Echo Maintenance Guide

This document describes the v1.3.2 single-authority maintenance contract.

## Core rule

**One responsibility has exactly one production authority.**

The canonical ownership table is `docs/authority-map-v130.json`. Human-readable rationale and restoration rules are in `docs/ARCHITECTURE_SINGLE_AUTHORITY.md`.

## Current production graph

- `game/core/game.js` — gameplay state, turn/combat flow, economy, progression, town gameplay, Canvas rendering, keyboard/touch gameplay input and gameplay persistence.
- `game/core/production-bootstrap.js` — pre-core storage epoch reset and New Adventure reset orchestration only.
- `game/core/runtime-bootstrap.js` — approved DOM/CSS follower loader only.
- `game/input/desktop-controls.js` — gamepad transport only.
- `game/locale/fixed-locale-entry-v130.js` — fixed-route language navigation only.
- `game/ui/responsive-final-v154.js` — responsive CSS only.
- `game/ui/help-copy-v126.js` — bounded Help DOM copy only.

The release allowlist is `ops/release/static-files.txt`. If a file is not in that list, it is not production.

## Quarantine policy

The authority reset does not discard completed work. Historical systems and art are stored under `archive/quarantine-v130/`.

Never restore an archived file by adding it back to an entry page or runtime loader. Instead:

1. classify the feature responsibility;
2. identify its sole owner;
3. port useful logic/data/art into that owner or a read-only helper it explicitly owns;
4. remove duplicated state/event/render ownership from the old design;
5. update the authority contract;
6. only then admit the new active file to the release allowlist.

## Forbidden maintenance patterns

- follower code assigning/replacing gameplay API methods;
- multiple modules writing the same gameplay localStorage keys;
- a second module obtaining a 2D context for the dungeon/town Canvas;
- masking the canonical renderer in order to redraw a character/monster/loot layer;
- competing gameplay `keydown`/touch handlers;
- release-time `sed` or other build mutations that change the dependency graph;
- production references to `archive/`.

## Version and cache generation

- Semantic version: `1.3.2`.
- Public cache generation: `170`.
- `VERSION` owns the semantic version.
- Source HTML/JS is already deployable; the release builder copies it and must not rewrite dependencies.

## Storage

v1.3.0 uses storage epoch `v130`. Historical Dungeon Echo gameplay state is cleared instead of migrated.

Gameplay persistence belongs to core. The old save-integrity and item-ID migration shims are quarantined reference implementations. If validation or migration returns later, it must be integrated into the sole persistence owner rather than executed as an independent writer.

## Release procedure

1. Run `node test/single-authority-v130.cjs`.
2. Build with `bash ops/release/build-site-bundle.sh <output.zip>`.
3. Deploy only the immutable artifact through `ops/site-bundle/deploy.sh`.
4. Require `dungeon_echo_healthcheck=PASS` and `dungeon_echo_site_deploy=PASS`.
5. After deployment, inspect the public site. CI success does not replace online acceptance.

## Regression triage

When a regression appears, first ask **which owner produced it**. If the answer is ambiguous, treat that ambiguity as an architecture bug before applying a visual or behavioral patch.
