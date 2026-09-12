# Wildforge Commercial Client — Godot Technical Decision (PoC)

## Engine pin
Godot 4.7.2 stable, Standard/GDScript, GL Compatibility renderer for the first mobile-focused slice.

## Authority rule
`wildforge/` v0.43.1 remains the gameplay/reference authority until the Godot feel gate passes. `wildforge-godot/` is a parallel commercial-client proof, not a rewrite mandate.

## Feel gate
Godot is promoted only if a touch-device build is materially better than the Canvas reference in all five areas:
1. movement and camera response;
2. jump timing/control;
3. mining feedback and target precision;
4. melee hit/knockback response;
5. unobtrusive landscape touch controls.

If the advantage is not obvious, stop migration and retain Canvas. No faction/economy migration happens before this gate.

## Architecture rules
- World data is authoritative; visual/physics nodes are projections of nearby data.
- Never create one Node per permanent world tile in the commercial world. The PoC collision shapes are intentionally temporary; production uses chunks.
- Frontier/faction simulation stays pure data and sparse local actors remain the presentation strategy.
- Player, combat, UI and camera are engine-side systems; macro simulation must not depend on scene-tree population.
- Android is a first-class target, not a WebView wrapper target.

## Server policy
The 2-core / 1.7 GiB cloud VM is build/test infrastructure only. Do not leave the Godot editor or a game process running persistently. Use `--headless` for CI-style checks and software-rendered Xvfb only for short visual smoke tests.

Observed initial PoC headless runtime: ~123 MB peak RSS for 180 iterations, ~23% average CPU on this VM, ~1.6 s wall time.

### Art migration rule

Do not migrate or redraw the full Wildforge art set before the Godot feel gate passes. Placeholder geometry is acceptable through the control/combat/mining validation phase. After approval, migrate art in layers: tiles/biomes -> player/enemy animation -> effects/lighting -> settlements/props -> UI skin. Keep nearest-neighbor filtering and a fixed pixel-density contract; use shaders/lighting as enhancement, not as a substitute for readable sprite art.

## Feel gate v0.03

The slice must prefer readable committed attacks over passive contact damage. Input forgiveness is allowed only as bounded timing windows (jump buffer, attack buffer, mining aim grace); it must not become aim magnetism or hidden auto-play.

## Material loop rule

The Godot slice may keep a tiny player-owned material wallet to prove mine -> pickup -> collect -> place conservation. It must not become a second production inventory/economy authority before the migration gate is passed.

## Chunk authority rule

`SliceWorld.cells` remains the only block-world authority. Render chunks and collision chunks may cache that state, but they must not store independent tile truth. Runtime edits invalidate only the affected chunk and cardinal boundary neighbor.

## Early crafting parity rule

During migration, any recipe copied from the Canvas reference must be guarded by a cross-implementation parity test. The slice may port only the minimum recipes needed to prove a loop; it must not fork a second balance table.

## Survival parity rule

Hunger, nourishment, starvation cadence and survival recipes are migration data, not new balance work. Until the Godot client becomes authoritative, these values must remain parity-guarded against the Canvas reference. Survival consumes the same slice item stock used by harvesting/crafting; no second food inventory is allowed.

## Early enemy-role rule

Different survival rewards must come from meaningfully different combat roles, not recolored or loot-tagged copies of one enemy. Early hunt targets require readable commitment, counterplay, and a reward identity distinct from ambient harassment enemies.

## Exploration authority rule

Exploration sites are deterministic world-generation data plus sparse local actors. Ore remains authoritative block data; relic caches and guards are local projections. Cache rewards must feed the same player stock and must not introduce a parallel loot wallet.

## Return-loop rule

Exploration rewards are not complete content until they convert into a measurable player capability. v0.11 therefore binds ruin copper to the existing campfire/workbench stations and preserves canonical crafting ratios while keeping the Godot feel-scale implementation.

## Capability-gated exploration rule

New regions should open from capabilities already earned through the same world loop, not from arbitrary level numbers. v0.12 uses authoritative sealed world tiles requiring copper-pick power, then converts the existing Ancient Core reward through the canonical Relic Delver Pick recipe.

## Persistence authority

Godot saves data, not the scene tree. World cells, player progression and durable world interactions are serialized; render chunks, effects, camera state, live input buffers and ordinary regenerative enemies are reconstructed. This keeps future art/node refactors independent from save compatibility. Save payloads are explicitly versioned and must pass a full memory + disk round-trip gate before a schema becomes authoritative.

## Transactional save writes

Never overwrite the only good save in place. Write + validate a temporary candidate, rotate the previous primary to one backup, then atomically rename the candidate to primary. Load must reject malformed/out-of-schema data before mutating game authority and may recover from the backup. A gameplay milestone does not force a save-schema bump when the serialized shape is unchanged.

### Deterministic baseline + delta persistence

World generation is deterministic and versioned. Persistent terrain authority records only deviations from that baseline, not the full generated map. This keeps autosave cost proportional to player edits rather than world area and makes larger worlds viable. When the generation contract changes, bump `WORLD_GENERATION_VERSION` and provide an explicit migration path rather than silently reinterpreting old deltas. Schema-13 full-map saves are migrated only across their historical bounds so new frontier generated by later versions is never erased by an old save.

## Sparse local actor projection

A durable world actor and its Godot node are different things. Stable world identity/presence must live in data authority; nodes are short-lived projections created only for active chunks. Chunk activation/deactivation is the single lifecycle hook for these projections. Never infer death, collection, annexation or other durable state from a node disappearing because its chunk unloaded, and never add a second proximity/streaming state machine for NPCs.

## Vegetation authority

Vegetation is deterministic world data plus sparse actor projection, not authored scene decoration. Baseline trees are regenerated from the versioned world contract; saves record only removals and planted additions. Ownership is resolved through the same territorial authority used by terrain so conquest can transfer forest rights without rewriting tree records. Planting, felling and future NPC forestry must mutate this authority rather than infer durable state from loaded tree nodes.

## Structure authority

A durable building is defined by stable structure identity plus a blueprint of expected world cells. The terrain dictionary remains the only physical truth: missing or replaced blueprint tiles are damage, and repair demand is derived from that difference. Do not store a second structure HP value.

Structure ownership must resolve through the existing ownership authority. A structure blueprint never owns a second faction field that can drift during annexation. Construction and repair must use `WorldEditAuthority`; deterministic baseline blueprints need no duplicate save payload because terrain deltas and ownership claims already reconstruct condition and sovereignty.

## Seeded generation authority

World seed and generation version are part of persistence authority. Natural terrain channels must be deterministic for a given `(generation_version, seed)` pair. Gameplay code must not hard-code remote ore/forest coordinates to simulate a world generator; authored ruins and settlements belong to the structure overlay layer. A save delta is invalid without the seed/generation contract that produced its baseline. Legacy pre-seed saves are treated only as the historical default seed and must use explicit migration logic.

## Traveler-role authority

New-game capability must come from owned tools, contracts and permissions, not from hidden innate mining/logging powers. The traveler starts combat-capable but extraction-incompetent: blade only, no pick, no axe. Historical proof tools may remain migration-compatible, but tests that need them must grant them explicitly rather than redefining the formal start state.

## World-time authority

Day/night time belongs to world simulation and persistence, not HUD animation. One full day is 720 real seconds. Survival, future settlement schedules, markets and faction simulation must read the same world clock; save/load restores that clock exactly instead of reconstructing time from presentation state.

## Settlement economy authority

Faction settlements are physical world overlays plus pure data economy, never a parallel decorative town scene. Structure condition derives from real cells, sovereignty derives from ownership claims, and settlement inventory/treasury live in one `SliceSettlementAuthority`.

Trade must conserve both sides of the transaction: player goods/currency and settlement stock/treasury change together or not at all. Prices may derive from authoritative shortages but presentation code never owns price state.

Any deterministic settlement added to the generated baseline requires a world-generation version bump and an explicit migration boundary. Legacy terrain deltas must not silently overwrite cells introduced by a newer settlement baseline.
