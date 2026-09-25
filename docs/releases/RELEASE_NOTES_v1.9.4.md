# Dungeon Echo v1.9.4

## Gameplay depth

- Expedition contracts now escalate by ten-floor segment, coupling deeper risk with matching reward.
- Safe return preserves wounds instead of restoring full HP for free; tavern recovery remains the explicit full-heal town service.
- Return Scrolls now channel for two full turns. Any damage breaks the ritual and consumes the scroll.
- Equip, unequip and discard commands can no longer bypass the return-channel turn cost.
- Return-channel interruption uses post-recovery/pre-hazard HP, so passive regeneration cannot hide poison or enemy damage.

## Monster tactics

- Ordinary monsters remember the last tile where they actually saw the player; they no longer follow the hidden live player position through walls.
- Ranged enemies prefer a bounded standoff band, fire from legal sight lines and reposition when too close.
- Crowding-aware pursuit avoids occupied tiles when an equivalent route exists.
- Erratic enemies remain deterministic under controlled RNG while making purposeful engaged movement.
- Ordinary enemies take one move-or-attack decision per player turn.
- Guardian and final-boss bespoke telegraphs/cadence remain isolated from this ordinary-monster AI pass.
- The experimental Guardian Fury damage escalation was reviewed and removed from the release candidate.

## Player decision clarity

- Explicit ranged J attacks keep facing-line targets first, then use a narrow one-tile-forward aim assist.
- Aim assist never targets behind the player, never shoots through walls and never spends a turn without a legal target.
- The town departure page now summarizes start floor, wound state, supplies, selected contract and the actual contract pressure at that checkpoint.
- Safe returns and deaths now leave a concise town recap showing what was banked or lost.
- Contextual guidance now explains contract escalation, bounded aim assist and the two-turn return ritual when those systems are first encountered.

## Compatibility and authority

- Save schema remains version 2 and storage epoch remains v130.
- Existing local saves remain compatible.
- game/core/game.js remains the sole live gameplay state, turn, RNG, input and persistence authority.
- Domain modules remain deterministic policy/calculation owners only.

## Release identity

- Semantic version: 1.9.4
- Public cache generation: 194
- Runtime bootstrap: v36
- Visible release stamp: game/core/release-stamp-v194.js
