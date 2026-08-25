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

## Remaining encounter work

Floors 80 / 90 and the floor-100 finale still use tested trait combinations as their primary behavior. They remain tracked by Issue #5 and should be converted incrementally so each encounter gains explicit telegraphing and class-neutral counterplay without replacing the whole combat engine at once.
