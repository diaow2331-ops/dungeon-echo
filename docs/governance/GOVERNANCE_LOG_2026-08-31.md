# Governance Log — 2026-08-31

## Audit trigger

Global Dungeon Echo audit requested before the next production update, with emphasis on modularity, unique authorities and preventing code mixing across the repository's games.

## Findings

- `game/core/game.js` remained intentionally authoritative but was still carrying deterministic town/checkpoint and pricing formulas that already had pure-domain destinations.
- `town-rules-v130.js` existed as a staged library, so leaving duplicate formulas in core would prolong dual-maintenance risk.
- `economy-rules-v130.js` already shipped, but several deterministic pricing helpers were still dormant while equivalent formulas lived in core.
- `games.json` defined product ownership, but there was no executable cross-game source-boundary gate.
- The prior Dungeon development worktree had diverged from `origin/main`; v1.6 work therefore started from a fresh `origin/main` worktree to avoid mixing Board Trio work or stale branch history.

## Governance actions

- Promoted town checkpoint/readiness policy through an atomic authority transfer.
- Promoted deterministic town/expedition pricing policy through the existing economy authority.
- Kept all transactions, state mutation, rendering, input, RNG and persistence in canonical core.
- Added `test/games-boundaries.cjs` and `ops/repo/check-game-boundaries.sh` to block cross-game runtime coupling.
- Added `docs/REPOSITORY_GOVERNANCE.md` as the repository-level maintenance contract.
- Updated test sandboxes to load the new town authority rather than weakening the production missing-authority guard.

## Verification policy

The release candidate must pass `bash ops/check-authority-local.sh`, `bash ops/repo/check-game-boundaries.sh` and `node test/current-suite.cjs` on the exact committed tree before it is pushed for review. The immutable bundle is built again from merged `main` before deployment.

Deployment provenance is intentionally not appended by mutating the repository after release: the merged PR/commit and the server's immutable `/srv/91hwl-play/releases/` entry are the deployment record. This avoids creating a post-test source revision solely to write down the revision that was already deployed.
