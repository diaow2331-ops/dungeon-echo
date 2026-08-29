# Dungeon Echo Maintenance Guide

Dungeon Echo is maintained as a **single-authority, main-only production repository**.

## Start here

Before changing product code, read these files in order:

1. `docs/authority-map-v130.json` — machine-readable production ownership.
2. `docs/ARCHITECTURE_SINGLE_AUTHORITY.md` — why the ownership boundary exists.
3. `docs/MAINTENANCE.md` — this operational contract.
4. `test/README.md` — current gates versus historical evidence.
5. the newest `docs/releases/RELEASE_NOTES_v*.md` — current shipped product boundary.

`VERSION`, `docs/authority-map-v130.json`, the authored entry pages, runtime bootstrap,
release/deploy contracts and release stamp must agree at every release boundary.
Do not copy semantic-version/cache literals into governance prose merely to make a check pass.

## Core rule

**One responsibility has exactly one production authority.**

The canonical gameplay owner is `game/core/game.js`. It owns live gameplay state, turn flow,
combat execution, town gameplay, Canvas rendering, keyboard/touch gameplay input, gameplay
persistence, expedition records, audio preferences and the SFX graph.

Narrow supporting authorities are allowed only for responsibilities explicitly listed in
`docs/authority-map-v130.json`. Pure domain libraries may calculate rules, but must not acquire
live gameplay state, input, Canvas, timers, or storage ownership.

## Production graph

The synchronous entry graph is defined by the authored Chinese/English entry pages and locked by
`test/current-production-entry-v132.cjs`. Late runtime followers are loaded only by
`game/core/runtime-bootstrap.js` and must remain presentation-only.

The release allowlist is `ops/release/static-files.txt`. A file outside that allowlist is not part
of the immutable game artifact.

## Quarantine and recovery

Historical implementations live under `archive/`, especially `archive/quarantine-v130/`.
They are evidence, not dormant production modules.

Never restore a historical feature by reconnecting its old runtime. Recover product value by:

1. identifying the responsibility and its current owner;
2. extracting the useful rule/data/art;
3. integrating it into that owner or a pure helper owned by it;
4. removing duplicate state/input/render/storage ownership in the same PR;
5. updating authority and focused regression contracts.

## Repository workflow

`main` is the only long-lived production branch and is protected. Product changes must use:

`player evidence → focused branch → focused local gates → pull request → squash/rebase merge → branch deletion`

No required GitHub Actions status check is configured while hosted Actions quota is unavailable.
That does **not** permit skipping local gates. Do not dispatch hosted workflows as a substitute.

Prefer one focused PR per product responsibility. Do not mix unrelated gameplay, art, repository
cleanup and deployment changes merely to reduce PR count.

## Test policy

`node test/current-suite.cjs` is the explicit full current repository/release gate.
`bash ops/check-authority-local.sh` is the explicit authority gate.

Historical tests remain useful recovery evidence but are not release claims. See `test/README.md`.
Never claim the whole suite passed unless it was actually executed on the exact source tree.

## Storage

The current storage epoch remains `v130`. New Adventure clears run state while preserving the
bounded cross-run/device preferences explicitly owned by `game/core/production-bootstrap.js`:
first-run guide, audio mix, expedition record and Greedy-mode intent.

Gameplay persistence itself belongs to core. Do not reintroduce a sidecar save writer or migration
runtime.

## Release and deployment

1. Start from an exact, clean GitHub `main` tree.
2. Run the focused gates for the changed responsibility.
3. Run `bash ops/check-authority-local.sh`.
4. Run `node test/current-suite.cjs` for a release/freeze.
5. Build the immutable bundle with `ops/release/build-site-bundle.sh`.
6. Deploy that exact artifact through `ops/site-bundle/deploy.sh`.
7. Require the deploy/health checks to pass and verify the public route in a real browser.

The server deployment checkout must not be treated as a development worktree. If `/opt/dungeon-echo`
is not writable by the normal development account, fix ownership through the authorized root
maintenance path rather than bypassing Git safety or editing the deployed tree in place.

## Regression triage

When a regression appears, first ask **which owner produced it**. If the answer is ambiguous,
treat the ambiguity as an architecture bug before applying a visual or behavioral patch.
