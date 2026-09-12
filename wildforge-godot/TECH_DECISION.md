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
