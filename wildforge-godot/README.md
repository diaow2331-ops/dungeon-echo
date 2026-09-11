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
