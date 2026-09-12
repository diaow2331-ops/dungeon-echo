# Wildforge Godot Vertical Slice

This directory is an isolated technical proof for the future commercial client. The existing `wildforge/` HTML/Canvas build remains the reference implementation and is not replaced yet.

## Gate
The Godot client only becomes authoritative if this slice is materially better on touch devices for movement, jump, mining, placement and melee combat.

## Scope
- Small destructible 2D block world
- CharacterBody2D movement with acceleration, coyote time and jump buffering
- Context primary action: melee enemy or mine aimed block
- Block placement
- One hostile creature with knockback
- Camera smoothing and lightweight hit feedback
- Low-obstruction touch input: floating left/right sticks, one contextual place button

Explicitly excluded for now: factions, trade, caravans, annexation, inventory depth and boss content. Persistence and migration are now part of the Godot client; the Canvas build remains the gameplay/reference source for systems not yet migrated.

## v0.02 Feel Gate

Before any faction/economy migration, the slice must make the basic verbs feel good: move, jump, land, mine, place, strike, take a hit. v0.02 adds explicit melee windup/active/recovery timing, micro hitstop, enemy stun/flash, camera look-ahead, landing squash, mining crack progress, procedural impact bursts, and touch deadzones.

## Art policy during the engine proof

Final art is intentionally deferred. The proof uses procedural placeholder shapes so gameplay timing can be evaluated independently of polish. Once the feel gate passes, Godot's 2D pipeline will own production art: nearest-filter pixel atlases, TileSet/TileMapLayer-based presentation over chunk data, AnimatedSprite2D/AnimationPlayer character animation, CanvasItem shaders, 2D lights, particles and themed Control UI. Art assets must never become gameplay authority; world simulation stays data-driven.

## v0.03 rhythm milestone

- Faster reversal and bounded apex gravity improve movement response without adding a dash button.
- Melee taps have a short input buffer plus a small grounded attack step; acquisition range stays wider than actual hit range.
- Touch mining keeps only a 90 ms aim-stick grace so minor thumb jitter does not erase progress.
- Crawler damage is no longer passive contact damage: chase -> telegraph -> committed lunge -> recovery.
- Player hits interrupt enemy windup/lunge. Final art remains deferred.

## v0.04 material loop milestone

- Mining now produces a physical material pickup instead of silently deleting world data.
- Pickups use a short bounded magnet radius and feed one player-owned slice material wallet.
- Placement consumes material only after a valid world mutation succeeds; failed placement is free.
- Pickup collection is idempotent to prevent same-frame duplication.
- This wallet is a vertical-slice mechanic, not the production inventory migration.

## v0.05 chunk foundation

- The authoritative world remains one `cells` dictionary. Chunks are cache/presentation only.
- Static terrain drawing is split into 16x16 chunk views, so a tile edit redraws only its chunk.
- Terrain collision is split into chunk bodies and deferred outside the physics callback.
- Ordinary edits rebuild exactly one collision chunk; cardinal chunk neighbors are touched only on boundaries.
- Negative world coordinates use floor-based chunk indexing.
- The headless runner now requires explicit PASS markers so a script parse failure cannot masquerade as success.

## v0.06 crafting loop

- Sparse pass-through trees feed the same physical pickup path as mined blocks.
- The slice ports only the canonical early recipes `1 wood -> 4 plank` and `8 plank -> 1 workbench`.
- One context action changes from craft to station placement and then back to block placement; no extra permanent mobile buttons are added.
- A cross-implementation parity gate prevents the Godot slice from silently drifting from the Canvas reference recipe ratios.

## v0.07 survival loop

- Canonical hunger values are ported unchanged: 100 max, 82 start, 100/720 drain per second, 2 starvation damage every 4 seconds.
- One sparse hunt target proves physical raw-meat drops without migrating the full enemy catalog.
- Canonical food values are preserved: raw meat +9 hunger; trail ration +38.
- Canonical survival recipes are preserved: 6 stone + 2 wood -> campfire; 2 raw meat + 1 wood at a nearby campfire -> trail ration.
- Empty/low hunger applies the same movement penalties as the Canvas reference; a nearby campfire provides the canonical daytime rest-heal rate.
- The single compact context action handles urgent eating, cooking and campfire placement without adding permanent touch buttons.

## v0.09 hunt differentiation

- Early meat hunting now uses a dedicated Bramble Boar instead of a loot-tagged crawler.
- The boar stalks, telegraphs a charge, commits through the charge, then exposes a recovery window.
- Close contact alone is harmless; the tell can be interrupted, while a committed charge has higher resistance.
- Raw meat remains the canonical 1–2 stack reward and still feeds the same survival inventory authority.

## v0.10 exploration milestone

- Two deterministic shallow ruin pockets sit outside the spawn neighborhood on opposite sides of the slice.
- Each ruin exposes real coal/copper world tiles plus one guard-locked relic cache.
- Cache rewards preserve the Canvas shallow-ruin contract: one Ancient Core, bounded coal, bounded copper ore.
- Relic caches reuse the primary-action/harvestable path; no new permanent mobile button is introduced.
- Exploration rewards enter the same proof stock authority used by mining, crafting and survival.

## v0.11 copper-return milestone

- The two shallow ruin expeditions together contain enough copper/fuel for exactly one canonical Red Copper Pick upgrade path.
- Copper ore is smelted only beside an Ember Pit: 2 ore + 1 coal -> 1 bar.
- Red Copper Pick is crafted only beside a Craft Table: 5 bars + 2 wood -> 1 unique pick.
- The upgrade auto-equips and raises real mining power from the stone tier's 1.75 to the canonical 2.30.
- This is the first complete leave-camp -> recover resource -> return -> convert to capability loop.

## v0.12 deep-gate milestone

- One deeper relic annex sits behind a two-block sealed ruin barrier.
- Sealed ruin tiles require 2.30 mining power, so the stone pick cannot bypass the copper-return loop.
- The annex contains exactly 6 copper ore + 3 coal, enough for three additional canonical copper bars.
- One Ancient Core + 3 copper bars + 2 wood at a Craft Table creates the canonical Relic Delver Pick.
- Relic Delver Pick auto-equips at canonical 2.70 mining power.

## v0.13 persistence milestone

The Godot client now owns a versioned save schema (`SAVE_VERSION = 13`) instead of behaving like a disposable proof scene. Persistent authority includes world-cell mutations, player transform/health/hunger, the single stock wallet, equipped tools, placed Craft Tables/Ember Pits, felled resource trees, opened relic caches, and defeated relic guards. Ordinary ambient enemies remain regenerative local actors and are intentionally excluded.

Saves are written every ~20 seconds and on application pause/close. Loading rebuilds scene presentation from persistent authority and explicitly clears transient movement, touch, mining and attack state so a resumed session cannot inherit stale momentum/input. `tests/save_test.gd` performs in-memory and disk round trips; tests never auto-load the user's normal save path.

## v0.14 save-safety milestone

Persistence now uses transactional writes: a candidate save is written and validated at a temporary path, the previous valid primary is rotated to a single backup, and only then is the candidate atomically promoted. Loading tries the primary first and automatically falls back to the previous valid backup if the primary is missing, malformed or fails schema validation. No successful save leaves a `.tmp` file behind.

This milestone intentionally keeps save schema 13 because the payload shape did not change; gameplay milestone numbers and persistence-schema versions are governed independently.

## v0.15 world-scale milestone

The deterministic proof world expands from 85 to 257 columns (`-128..128`) and from depth 27 to 47, while retaining 16x16 chunk presentation/collision. Remote deterministic copper/coal veins create room for later travel content without turning every distant tile into authored state.

Persistence schema 14 stores `WORLD_GENERATION_VERSION` plus only player-authored cell overrides. A fresh generated world stores zero terrain deltas; mining one baseline tile stores one AIR delta; restoring the original tile removes that delta again. v0.13/schema-13 full-map saves migrate only their old `-42..42`, depth-27 authority over the current deterministic baseline, so newly expanded frontier remains intact.

## WF-Foundation 0.1 — block and edit authority

The production-world refactor begins by reducing mutation entry points before adding more simulation. Block hardness, mining threshold, drop identity, solidity and placeability now come from `data/blocks.json` through `SliceBlockRegistry`; they are no longer scattered across mining/drop match statements.

All runtime player terrain edits and station placements route through `SliceWorldEditAuthority`. Decisions already carry actor, owner and legal-status metadata even though Foundation 0.1 still treats generated land as wilderness. World generation and save restoration remain internal baseline writers; gameplay actors are not allowed to mutate the cell dictionary directly.

This structure was informed by inspection of mature MIT Godot sandbox projects such as Coheronia's data-driven block registry, but the Wildforge implementation is independently written around its existing world/save contracts. `tests/world_authority_test.gd` validates runtime decisions and `tests/world_authority_contract.mjs` fails if gameplay scripts regress to direct world-cell access.

## WF-Foundation 0.2 ownership authority

World ownership is persistent authority, not a visual label. Region claims and cell/structure claims resolve independently of terrain tiles, and structure claims override broader territorial claims. Runtime edits now classify legality as `legal`, `illegal`, or `wartime` without making claimed terrain magically indestructible. Permits, owner-faction work and declared war all pass through the same edit decision path. Save schema 15 persists ownership claims while remaining compatible with schema-14 delta saves and schema-13 full-map saves.


## WF-Foundation 0.3 chunk streaming

World data remains fully authoritative while render/collision chunks are streamed around the player with bounded load radii and a one-chunk hysteresis margin. Off-screen edits update terrain/delta state without instantiating presentation or physics; approaching that region rebuilds from the latest authority. Chunk activation/deactivation signals are the shared lifecycle hook for future vegetation, settlement workers, guards and other sparse local actors.

## WF-Foundation 0.4 chunk lighting

Block optical properties are data-driven in `data/blocks.json`; light absorption/emission no longer belongs in presentation code. `SliceLightingAuthority` computes sunlight and local-source propagation only for streamed chunks plus a one-chunk halo, and keeps the resulting scalar light field as derived cache rather than save authority.

Terrain edits invalidate nearby lighting, local emitters propagate across chunk boundaries, and distant unloaded emitters do not allocate caches. Approaching a region rebuilds light from current terrain, while unloading releases its light cache. Lighting is intentionally absent from save payloads. Final colored lighting, shaders and art-directed grading remain presentation work layered above this foundation.
## WF-Foundation 0.5 chunk fluid authority

Water and lava now live in a dedicated `SliceFluidAuthority` instead of overloading terrain block IDs. Fluid amount/type are persistent world authority, while rendering and lighting remain derived presentation. A sparse chunk index means each 10 Hz simulation tick visits only liquid cells in streamed chunks plus a one-chunk halo; distant liquid remains stored but asleep until the player approaches.

Flow is bounded and conservative: unobstructed liquid falls first, blocked liquid equalizes laterally, capacity is clamped to one cell-volume, and propagation crosses chunk boundaries without waking the whole world. Water/lava contact uses one explicit reaction entry point with measured consumption. Placing solid terrain displaces fluid through the same world edit path.

Fluid optical data is registry-driven in `data/fluids.json`; water attenuates light and lava contributes emission to the existing chunk-lighting authority. Save schema 16 persists fluid cells, while schema 15 ownership saves, schema 14 delta saves and schema 13 full-map saves remain migration sources. `tests/fluid_test.gd` locks conservation, cross-chunk flow, active/halo sleeping, reaction accounting, lighting integration and authoritative persistence.

## WF-Foundation 0.6 sparse world actor projection

Persistent world actors are no longer defined by whether a scene node happens to be loaded. `SliceWorldActorAuthority` owns stable identities, chunk location and presence for deterministic ruin guards/caches; active chunks project those records into local Godot nodes and unload them again through the existing chunk lifecycle. No second distance manager or parallel streamer is introduced.

Save schema remains 16 because the external payload shape is unchanged. Guard/cache presence is now read from actor authority instead of scanning loaded groups, so autosaving while a region is unloaded cannot silently record living actors as dead. Defeat/open actions update the same authority before their projection disappears, and streaming the chunk back in cannot resurrect removed actors or duplicate surviving ones. `tests/actor_streaming_test.gd` locks unload/save/reproject/removal behavior.

## WF-Foundation 0.7 vegetation and forestry authority

Trees now come from deterministic world vegetation data instead of three eager scene nodes. `data/vegetation.json` defines harvest durability and drops, while `SliceWorldActorAuthority` owns persistent tree identity and projects trees only inside active chunks. Distant forest belts therefore exist in world authority without consuming scene-tree objects until approached.

Vegetation follows the same baseline-plus-delta rule as terrain. Save schema 17 stores only removed deterministic trees and planted trees; a fresh forest costs zero vegetation rows, felling one baseline tree adds one removal, and restoring that baseline tree collapses the delta again. Schema-16 migration applies its historical `trees` list only to the three legacy onboarding positions so newly generated forests are never erased by an older save.

Tree ownership is resolved from current `SliceWorldOwnershipAuthority` unless a planted tree has an explicit owner override. Territorial transfer therefore changes the legal owner of existing forest without rewriting every tree. Plant/fell APIs are authority operations ready for later faction forestry, permits and theft consequences; Foundation 0.7 does not yet add logging jobs or axe progression. `tests/vegetation_test.gd` locks streaming, ownership transfer, delta persistence, legacy migration and stale-projection cleanup.

## WF-Foundation 0.8 structure authority

Structures are blueprints over real world cells, not decorative scene labels and not a parallel HP system. `SliceStructureAuthority` registers deterministic structure identities and expected tiles, then derives integrity and repair deficits directly from authoritative terrain. Existing ruin chambers and the deep sealed gate are the first baseline structures.

Ownership is not duplicated inside structures. Structure claims are delegated to `SliceWorldOwnershipAuthority`; annexation changes the owner seen by a structure without rewriting its blueprint. Repairs use the same `SliceWorldEditAuthority` path as other runtime edits, including protected/non-player-placeable blueprint tiles. Baseline structure condition requires no new save schema: terrain deltas persist damage and ownership claims persist sovereignty, so integrity reconstructs on load.

## WF-Foundation 0.9 seeded world generator

Natural terrain is no longer authored from a sine surface plus fixed ore coordinates. `SliceWorldGenerator` uses Godot's native `FastNoiseLite` with one explicit seed and separate deterministic channels for surface relief, biome classification, caves, coal, copper and vegetation. Ruins and future settlements remain structure overlays above that natural baseline instead of being baked into terrain generation.

The proof world expands to 1025 columns (`-512..512`) and depth 79 while presentation/collision stay chunk-streamed. Save schema 18 binds terrain/ownership/fluid/vegetation deltas to both `WORLD_GENERATION_VERSION` and `world_seed`. Loading a different seeded save rebuilds terrain, structures, vegetation projections and regenerative local actors before applying persistent deltas. Schema 17 and older saves are explicitly recognized as generation-v1/default-seed worlds; they may migrate only under that historical assumption, never by silently applying old deltas to an arbitrary seed.

## v0.16 traveler foundation

The formal new-game role is now a traveler rather than an innate miner. A fresh player owns one ordinary blade, no pick, no axe and no free placement reserve. Mining power is zero until a real mining tool is acquired; trees require an axe-capable role rather than treating melee weapons as logging tools. Historical `starter_pick` support remains only for old proof saves/tests and is not granted to new players.

One authoritative world day lasts 720 real seconds. Hunger is deliberately slower than the old proof balance (about 30 real minutes from full to empty), ordinary movement never regenerates health, and campfire healing requires a fed, stationary, non-combat rest state at 0.4 HP/s. Save schema 19 persists the world clock and the explicit absence/presence of extraction tools; schema 18 and older saves migrate without inventing an axe or a new-game pick.
