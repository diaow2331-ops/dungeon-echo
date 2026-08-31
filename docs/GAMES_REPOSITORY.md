# 91hwl Games repository contract

`games.json` is the repository-level authority for playable products. A game is not considered integrated until its catalog entry, version authority and immutable release builder all exist.

Current source roots:

- Dungeon Echo: legacy repository root (`.`). Its internal single-authority architecture remains unchanged.
- Clock Out Alive: `moyu/`.
- Board Trio: `board-games/`.

The legacy Dungeon Echo root is intentional for compatibility. Moving it mechanically would churn production paths, tests and release contracts without improving gameplay. New games must use a self-contained source directory.

Every catalog entry must declare a unique `id`, public `route`, `sourceRoot`, `versionFile` and `builder`. Version files contain strict semver. Builders must be tracked executable files and package immutable bytes rather than rewriting gameplay at release time.

The aggregate release layer reads component version authorities; it does not own duplicate game versions. `test/games-catalog.cjs` enforces the catalog contract.

The former server-side `moyu-v1230-standalone` clone was retired on 2026-08-31 after verifying its two unique-looking commits were already represented in `main`: the soundtrack patch matched commit `8e210721`, and the Moyu portion of the office-atlas patch matched commit `66ded726`. The retired clone is archival evidence, not an active development source.

For a future game: create its source directory and version file, add its immutable builder/deployer/healthcheck, add one `games.json` record, run the catalog contract, then add the public-site presentation only after the playable route is live.
