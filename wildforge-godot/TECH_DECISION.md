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
