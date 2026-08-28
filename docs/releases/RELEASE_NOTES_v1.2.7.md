# Dungeon Echo v1.2.7 — Ownership and release-coherence hardening

Dungeon Echo v1.2.7 is a maintenance release built on the accepted v1.2.6 gameplay baseline. It does not reopen combat balance, economy, loot values, guardian numbers, save schemas or the shipped art direction.

The release focuses on making the existing game easier to reason about and safer to evolve: one mechanism should have one production owner, and every public surface should report the same release boundary.

## What changed

### Explicit mechanic ownership

- `equipment-system.js` remains the sole production owner of in-dungeon equipment-swap turn cost.
- Shrine wagers and cask downside resolution now live in `risk-reward-system.js` instead of `production-bootstrap.js`.
- Permanent level/HP/ATK growth limits and event-time XP parking now live in `progression-guard-system.js`.
- Consumed shrine/rest cleanup and utility-NPC chokepoint relocation now live in `npc-stability-system.js`.
- `production-bootstrap.js` is reduced to production-entry policy and the legacy equipment-atlas presentation bridge instead of acting as a gameplay bag.

### Runtime cleanup

- The production permanent-growth guard no longer depends on a 150 ms polling loop. It uses initial synchronization plus action-driven microtask synchronization.
- Saves that are already at their permanent level cap have latent over-cap XP clamped before it can become a transient level gain.
- Existing stronger legacy saves still form the compatibility floor for permanent-growth bounds.

### Release coherence

- `VERSION` advances to **1.2.7**.
- The visible release stamp advances to `release-stamp-v127.js`.
- Production CSS/JS references and late-loaded runtime followers share cache generation `127`.
- The release allowlist includes the explicit progression, risk/reward and NPC-stability owners.
- The deployment gate verifies the v1.2.7 owner files and their cache fingerprints before switching the live release.
- The 91hwl Dungeon Echo project page reports v1.2.7 in visible copy and JSON-LD metadata.

## Companion web release

The same repository boundary also carries the previously completed web work:

- **91hwl site v1.3.3** — locale/theme prepaint, browser auto-translation suppression and typography/control-scale normalization.
- **Clock Out Alive / 摸鱼到下班 v1.11.3** — matching locale prepaint/notranslate behavior, type-scale cleanup and the v1.11.3 deterministic build layer.

`ops/release/build-web-toys-release.sh` now produces all three public bundles from one exact tagged revision instead of freezing Dungeon Echo on v1.2.6.

## Compatibility

- Public route remains `classic-100` / 1→100.
- Save keys and save schemas are unchanged.
- Equipment, combat, guardian, skill-evolution, town-economy and drop values are unchanged by the v1.2.7 release-preparation patch.
- The v1.2.6 Help and Expedition Record owners remain intentionally reused; they are presentation owners, not a new save/runtime generation.

## Validation evidence

During the governance work leading to this release:

- isolated progression-owner checks passed for the owner contract, 80→50 rollback, HP/ATK bounds, latent XP clamp and XP park/restore;
- isolated NPC-stability checks passed for consumed-rest cleanup, shrine/shop relocation, >=3-exit landing tiles, non-overlap and single persistence;
- GitHub diff review confirmed the ownership refactors were scoped and did not change gameplay numbers or persistence schemas;
- release contracts were updated to require the v1.2.7 cache generation and explicit owner files.

The current execution environment cannot perform a full repository checkout because `github.com` DNS resolution is unavailable there. Therefore a complete local production/browser PASS is not claimed by these notes. Final release completion still requires bundle construction on a usable checkout/deployment host, origin/public health checks and human desktop/mobile verification.
