# Dungeon Echo v1.2.10

Dungeon Echo v1.2.10 is the public launch release paired with Clock Out Alive v1.11.5 and the 91hwl site v1.3.4.

## Player-facing changes

- Desktop one-shot actions are edge-triggered: holding J/K/Q/E/T/Space/Esc/M/F/R/Enter no longer repeats tactical or toggle actions through OS key repeat. WASD and arrow movement still repeat normally.
- Mid-width PC/laptop windows (901–1180px) no longer squeeze the 40×28 dungeon beside a fixed 300px sidebar. The dungeon moves above a two-column bag/log area while large desktop and existing mobile layouts remain unchanged.
- Portrait touch layouts keep secondary action targets at a minimum 44px and Attack/Skill at 52px.
- Fixed Chinese and English routes remain on one gameplay/save graph, and the launch locale hotfix prevents browser auto-translation from reintroducing mixed-language UI.
- The Greedy Expedition town is presented as a bounded workspace with Gear & Stash, Market, Fortune and Progress panels.

## Preserved contracts

- 1→100 progression, difficulty, rewards, equipment and save namespaces are unchanged.
- Return Scroll keeps the existing arming → ready → completing state machine.
- Chinese and English remain fixed routes on the same gameplay/save graph.
- Runtime bootstrap ownership remains v13.

## Version and cache boundary

`VERSION` is the semantic release authority and remains **1.2.10**.

The final public v1.2.10 line uses cache generation **155**. The first v1.2.10 release candidate used generation 154; the fixed-locale launch hotfix advanced the public cache generation to 155 without changing the semantic game version.

Source entry files intentionally keep the stable source cache generation 153. `ops/release/build-site-bundle.sh` rewrites only those cache query parameters to public generation 155 when producing the immutable artifact.

Module filename revisions are independent again: for example `town-workspace-v156.js` is an internal owner revision, not semantic version 1.2.11 and not cache generation 156. New-path modules did not require a public cache-generation bump.

## Release packaging

The immutable bundle includes the v1.2.10 release stamp, public cache generation 155, the fixed-route locale owners, the bounded town workspace and exact SHA256 manifests.

The source Chinese and English footers must already match `VERSION` before packaging. The builder no longer repairs an old semantic version string during artifact construction; semantic drift is treated as a repository error.

Validation is targeted and deterministic. `test/release.cjs` builds the Dungeon bundle and inspects both packaged entries for the current public cache generation. `test/release-freeze-v1.2.cjs` locks the semantic version, source footers, release stamp, README and release-note boundary together.

## Publication status

The public launch acceptance covers representative desktop/mobile use, fixed Chinese/English routes, save continuity, the bounded town workspace and repeated Return Scroll T×2 behavior. Long-run balance/economy/guardian evidence remains post-launch validation rather than a launch blocker.

Post-launch changes should be player-evidence driven and shipped as focused patch releases rather than broad rewrites.
