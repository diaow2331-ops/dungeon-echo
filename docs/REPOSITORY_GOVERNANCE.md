# Repository Governance Standard

This repository contains multiple independently releasable browser games. Maintenance follows two nested authority layers:

1. `games.json` is the repository-level product catalog authority.
2. Each game owns its own version file, source boundary, release builder and internal runtime authorities.

## Source isolation

- Dungeon Echo production bytes are exactly the files admitted by `ops/release/static-files.txt`.
- Clock Out Alive source is contained under `moyu/`.
- Board Trio source is contained under `board-games/`.
- A game source root must not import, load or reach into another game's runtime files.
- Site/home code may link to public routes; route linking is not runtime coupling.
- No cross-game relative imports, shared mutable globals, storage namespaces or gameplay event buses are permitted.

## Shared-code rule

There is no shared gameplay runtime by default. A new shared module requires all of the following in the same change: at least two concrete consumers, a named responsibility, a sole authority, a dependency direction, a release-packaging rule, and an updated boundary test. Stateful gameplay logic is presumed game-local unless a separate architecture decision proves otherwise.

## Release metadata authority

Component version files are the sole machine-readable version authorities. `docs/CURRENT_RELEASES.md` is a human-readable pointer and must match those files exactly; it must never become an independent version source.

A focused release for one game must not downgrade or rewrite another game's release pointer. `test/current-release-pointers.cjs` enforces this against every game listed in `games.json` plus the public-site version.
Feature tests must read canonical version files when they need release/cache markers; historical feature-test filenames may remain for provenance, but their assertions must not become a second version authority. Presentation tests should prefer stable structure/behavior contracts over exact localized copy unless the copy itself is the contract.

## Change scope

A focused product PR should normally touch one game source root plus the minimum repository/release metadata required for that product. Changes spanning two games require an explicit integration reason in the PR description. Refactors must not move files between game roots merely for cosmetic consistency.

## Required local gates

- Dungeon internal authority: `bash ops/check-authority-local.sh`
- Cross-game isolation: `bash ops/repo/check-game-boundaries.sh`
- Current release suite: `node test/current-suite.cjs`

Hosted Actions are not required while quota is unavailable; local evidence remains mandatory.

## Release discipline

Build from a clean reviewed commit. Builders package immutable tracked bytes and must not rewrite the dependency graph. Deployers must preserve unrelated games, switch releases atomically and roll back on failed health checks.

## Branch discipline

`main` is the only long-lived production branch. Use short-lived focused branches, merge through PR, then delete merged heads. Historical branches are not archives; Git history, release notes and governance logs provide provenance.
