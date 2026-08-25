# Guardian encounter mechanics

This document records the intended counterplay for the ten-floor guardian encounters as they move from generic trait combinations to readable, stateful fights.

## Implemented stateful encounters

### Floor 10 — telegraphed armor break

The guardian visibly charges its armor-breaking strike for one full turn. Melee characters can disengage; ranged targets can break line/range. If the attack condition is no longer valid on the next turn, the heavy strike is lost.

**Counterplay:** create distance or break the ranged attack condition during the warning turn.

### Floor 20 — Frost Ring

Every few turns, the guardian reserves its next normal action and telegraphs a radius-2 frost ring around itself. The ring resolves on the following turn.

**Counterplay:** leave the highlighted 5×5 danger area before the next turn resolves. The guardian retains regeneration as secondary pressure, but the encounter identity is positioning rather than generic slow.

### Floor 30 — Ember Mark

The guardian periodically marks the player's current tile and gives one full turn of warning. The marked tile detonates on the following turn while the guardian gives up its normal action for that turn.

**Counterplay:** move off the marked tile. Staying still to greed another attack is the explicit risk.

### Floor 40 — Hunter Line

The guardian locks either the player's current row or column, displays the full firing lane, and spends its next normal action on the shot. The shot only lands if the player remains in the lane, stays within range, and terrain does not block the line.

**Counterplay:** sidestep one tile perpendicular to the line, move out of range, or put a wall between the guardian and the player.

### Floor 50 — Mending Channel

When wounded enough to make the heal meaningful, the guardian begins a one-turn healing channel and gives up its next normal action. The channel records the guardian's HP at the start of the tell.

**Counterplay:** deal any damage during the warning turn. Damage interrupts the heal completely; giving the guardian space allows it to recover 15% of maximum HP.

### Floor 60 — Blood Tether

The guardian periodically forms a visible blood tether and reserves its next normal action for the drain. The tether resolves only if the player remains within three tiles.

**Counterplay:** use the warning turn to reach distance four or greater. Staying close allows the attack to land and preserves the guardian's leech identity without relying on a generic enrage stat spike.

### Floor 70 — Rupture Cross

The guardian telegraphs a short cross centered on itself: three tiles horizontally and vertically. It gives up its next normal action while the cross charges.

**Counterplay:** step off both the guardian's row and column before resolution. Regeneration and death burst remain secondary pressure, while the primary mechanic is spatial lane control.

### Floor 80 — Arcane Strip

The guardian snapshots the player's current location and lights a five-tile horizontal or vertical strip through it. The strip orientation follows the dominant axis between guardian and player, and the guardian spends its next normal action on the barrage.

**Counterplay:** move one tile perpendicular to the highlighted short line. Passive regeneration was removed so this fight is about reading the strip rather than racing a hidden sustain clock.

### Floor 90 — Echo Trial

The guardian runs a fixed three-step exam using mechanics the player has already learned: a single-tile mark, a long firing line, then a radius-2 blast. The sequence always repeats in that order rather than choosing a surprise pattern.

**Counterplay:** recall the earlier lessons—leave the marked tile, break the line, then leave the close-range blast. The encounter checks recognition under pressure instead of hiding a new rule at floor 90.

### Floor 100 — End-Abyss Sovereign

The final boss is a true three-phase encounter driven by remaining HP rather than a passive pile of generic traits.

- **Phase 1 (>66% HP) — Throne Mark:** marks the player's current tile for next-turn detonation.
- **Phase 2 (33–66% HP) — Void Line:** locks a full row or column; the shot can be sidestepped or broken by terrain.
- **Phase 3 (≤33% HP) — Heart Nova:** repeatedly charges a radius-2 close-range blast on a shorter cadence.

The floor-100 runtime copy suppresses passive regeneration and enrage. A small leech component remains as secondary pressure, while every major damage window is telegraphed and consumes the boss's next normal action.

**Counterplay:** phase 1 tests greed, phase 2 tests line/terrain reading, and phase 3 tests disciplined disengagement. The finale deliberately recombines learned movement rules instead of introducing an unavoidable last-minute one-shot.

## Validation contract

`test/guardian-content.cjs` deterministically covers the core state transitions for the guardian system, including warning-turn action reservation, evade/hit paths, healing interruption, distance breaks, fixed floor-90 sequence order and all three floor-100 HP phases.

The focused harness does not replace all-four-class human play. It exists to protect the readable state-machine rules from regressions while human runs continue to evaluate timing, arena geometry and build-specific difficulty.
