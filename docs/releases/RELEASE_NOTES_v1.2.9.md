# Dungeon Echo v1.2.9

v1.2.9 is the convergence and release-finalization patch for the post-v1.2.8 runtime work. It does not change combat balance, save namespaces or the 1→100 content route.

## Fixed and finalized

- Chinese and English are now fixed production routes: `/dungeon-echo/` and `/dungeon-echo/en/` boot the same gameplay graph and share the same browser saves.
- The legacy translation-after-render production stack is retired. `locale-event-owner-v130.js`, `locale-runtime-v122.js` and `locale-completeness-v128.js` are not shipped or loaded by the release bundle.
- Remaining English core screens are owned by `core-screen-owner-v153.js`; town and fortune-wheel Canvas copy is limited to the exact sinks in `town-canvas-locale-v153.js`.
- Compatible historical equipment receives additive language-neutral `baseId`, `rarityId` and `slotId` fields through `stable-item-id-migration-v150.js`; stored item names and save namespaces are not rewritten.
- Greedy Expedition Return Scroll extraction uses one two-stage Commerce owner with `arming → ready → completing` guards, keyboard-repeat suppression and interruption semantics. Gamepad Return delegates to the same owner.
- Gamepad polling and several former presentation followers are lifecycle/event driven rather than permanently active in the background.
- Repository documentation and release history are collected under the current public-project layout without moving active production paths.

## Release boundary

- Repository semantic version: **1.2.9**.
- Static cache generation remains **153**. Semantic version and cache generation are intentionally separate concerns.
- `runtime-bootstrap.js` loads `release-stamp-v129.js` using generation 153, then boots the fixed-route/data/screen owners in deterministic order.
- `ops/release/static-files.txt` ships the v1.2.9 stamp and the generation-153 fixed-route owners, while retired translation followers remain excluded.
- The game-only bundle is built with `ops/release/build-site-bundle.sh` and overlays only `/dungeon-echo/`, preserving the existing site and Moyu release tree.
- The historical unified three-bundle boundary remains Dungeon Echo v1.2.7 + site v1.3.3 + Moyu v1.11.3.

## Save compatibility

No progress reset is required. v1.2.9 preserves `de-run-v6`, `de-greedy-meta-v1`, the wheel state key, profile/class/content identities and compatible historical equipment records. Localization identity is display-only and does not fork gameplay data.

## Validation provenance

The focused deterministic release contracts are the repository evidence for the v1.2.9 boundary, especially `test/release.cjs`, `test/release-freeze-v1.2.cjs`, `test/final-fixed-locale-v153.cjs`, `test/extraction-channel.cjs`, `test/runtime-debt-contract-v141.cjs` and save-integrity coverage. No fresh full GitHub Actions PASS is claimed while the repository's current Actions allowance is unavailable.

Real-browser evidence is still required before declaring public deployment complete: repeated Return Scroll T×2 extraction, shared-save continuity between Chinese/English routes, representative English full-session leakage checks, PC/mobile/gamepad parity, and origin/public health checks from the exact deployed revision.
