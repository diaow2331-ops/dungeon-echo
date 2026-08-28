# Dual Web Toys Release Candidate · 2026-08-28

This release candidate binds one repository revision to the final public launch set:

- Dungeon Echo v1.2.10, public cache generation 155.
- Clock Out Alive / 摸鱼到下班 v1.11.5.
- 91hwl product homepage/detail mount site v1.3.4.

## Version model

Dungeon Echo semantic version, public cache generation and internal module revisions are separate identifiers:

- semantic game release: `1.2.10`;
- public cache generation: `155`;
- internal owner/module revisions may be higher or lower (for example the town workspace uses `v156` filenames).

A module filename revision must never be interpreted as a semantic release or cache generation.

## Scope

Only release, responsive presentation, input-integrity, fixed-route locale and product-surface synchronization are included. Gameplay balance, collision geometry, reward values and save namespaces remain unchanged.

## Required build gates

- `node test/release.cjs`
- `node test/release-freeze-v1.2.cjs`
- `node test/moyu-release.cjs`
- `bash ops/release/build-home-mount-bundle.sh /tmp/91hwl-home-web-toys-v1.3.4.zip`

The produced immutable artifacts must come from the same final `main` revision. Build outside production; production only verifies and activates the prepared artifacts.

## Deployment order

1. Dungeon Echo v1.2.10.
2. Moyu v1.11.5.
3. 91hwl homepage/detail mount v1.3.4.

Each deployer is atomic and rollback-protected. The homepage/detail mount is intentionally last because its health check requires both public game VERSION endpoints to already expose the new versions.

## Human acceptance after deployment

Dungeon Echo: large PC + 901–1180px laptop layout, portrait/landscape mobile, J/K/T/Enter/Esc one-shot behavior, shared zh/en saves, repeated Return Scroll T×2 and representative English UI leakage check.

Moyu: PC run, narrow-phone header/safe-area behavior, touch jump/pause/ending flow, and stable zh/en first-paint/runtime language selection.

No further broad optimization should be added to this release candidate unless post-deployment evidence shows a concrete blocker.
