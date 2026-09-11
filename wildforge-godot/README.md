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

Explicitly excluded: factions, trade, caravans, annexation, inventory depth, boss content and save migration. Those stay in the Canvas reference until the feel gate passes.

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
