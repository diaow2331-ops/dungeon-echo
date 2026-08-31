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

## Repository-suite drift found during release gate

- Latest `main` had already advanced Board Trio to `0.6.0`, while three current-suite tests still hard-coded `0.5.0` and cache generation `050`.
- The stale assertions made an unrelated Dungeon Echo release fail even though Board Trio itself was current.
- Replaced the stale version/cache literals with contract checks that bind HTML/runtime markers to `board-games/VERSION` and the page-declared cache generation. Historical behavior assertions remain unchanged.
- This repair is repository governance only: no Board Trio gameplay source was modified.

## Cross-component release pointer coherence

- After Dungeon Echo v1.6.0 and Board Trio v0.6.1 were both on `main`, the canonical version files were current but `docs/CURRENT_RELEASES.md` still listed Board Trio as v0.5.0. This was documentation drift, not a product rollback.
- Corrected the Board Trio release pointer to v0.6.1 without changing Board runtime code.
- Added `test/current-release-pointers.cjs` to verify every game in `games.json` plus the public-site version against its canonical version file.
- Added that gate to `test/current-suite.cjs` and codified component version files as the sole machine-readable release authorities.
- This closes a repository-level failure mode where a focused release for one game could silently publish stale metadata for another game.

## Security and release-composition follow-up

A second global pass after the v1.6.0 modular merge found two production-hygiene defects outside Dungeon gameplay code:

- the public repository safety gate was failing because historical/current site build inputs still contained a personal contact address, while SECURITY.md explicitly forbids nonessential personal identifiers in the public tree;
- component deployers copied the entire previous play.91hwl.cn release root before replacing one game, so unrelated files could persist forever. The live root demonstrated this with an authentication-exporter archive and a hidden Board rollback directory.

Remediation:

- removed personal mailbox and personal social routes from the current public source/build chain;
- routed sensitive reports through the repository Security Policy and ordinary bugs through Issues;
- promoted `test/public-repo-safety.cjs` into the current suite and added a current public-site governance gate;
- added `ops/release/play-release-root-policy.sh` as the only root-composition authority;
- changed all three component deployers to preserve only approved shared-root entries and to assert the result before activation;
- added `test/play-release-root-policy.cjs` and packaged the same policy into every component release bundle;
- advanced the public-site presentation version to v1.11.7 and synchronized component labels from their canonical version files instead of hard-coded duplicate versions.

Pre-merge verification on the rebased working tree: `node test/current-suite.cjs` completed 45 current gates with 0 failures; repository event safety, public-repository safety, cross-game boundaries and release-root policy all passed.
