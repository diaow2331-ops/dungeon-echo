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
## Cross-game source boundary

Game source roots are isolation boundaries, not convenience folders. `moyu/` and `board-games/` may not import or reference Dungeon runtime/profile files or each other. The Dungeon artifact is defined by `ops/release/static-files.txt` and may not package another game source root.

Shared runtime code is not created merely to reduce duplication. A future `shared/` module requires a separate authority decision, pure/stateless behavior unless explicitly approved, at least two real consumers, and a repository-boundary test updated in the same change. Until then, duplicate small presentation helpers are preferable to cross-game coupling.

Run `bash ops/repo/check-game-boundaries.sh` before merging any change that touches game source roots, `games.json`, or release builders.

## Shared play-root composition

The three game source roots are independent even though they are mounted under one public host. ops/release/play-release-root-policy.sh is the repository-level authority for composition of the shared play.91hwl.cn root. Individual deployers must copy only approved root entries from the previous immutable release and replace only their own route.

Never use a whole-root carry-forward as a convenience. That pattern can make unrelated archives, authentication utilities or old rollback directories persist indefinitely and turns deployment history into an accidental source of truth.

## Incubating fourth game: Wildforge

`wildforge/` is an intentionally **unpublished incubation root** beginning with the v0.1.0 landscape-first playable baseline. It is isolated from Dungeon Echo, Clock Out Alive and Board Trio, but it is not yet listed in `games.json`, admitted to the shared play-root policy or included in aggregate public deployment.

Promotion rule: only after representative desktop + landscape-touch play validates the core Explore → Mine → Collect → Craft → Build → Fight → Upgrade → Explore deeper loop should Wildforge receive a catalog record, immutable production deployer/healthcheck, shared-root admission and public-site presentation in one release change.
