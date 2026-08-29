# Skill evolution milestones

Dungeon Echo keeps one active-skill input per class. The canonical `K` hotkey (`C` remains a compatibility alias) does not grow into a larger action bar; instead, the existing skill acquires behavior-changing choices as the run reaches floors 20 / 40 / 60 / 80.

Choices are stored as ids inside the existing `player.talents` array. Classic-run saves and Greedy Expedition meta saves already persist that array, so this system does not require a save-version bump.

## Choice delivery

At the first talent selection shown at or beyond an unchosen milestone, the normal talent pool is temporarily replaced by the two skill-evolution options for that milestone. Older saves that are already deeper than a milestone receive the earliest missing choice on a later talent selection instead of being invalidated.

## Warrior — Cleave

- **20:** Arc Sweep expands into diagonal close targets; Guard Stance turns the cast into a safer trading turn.
- **40:** Long Edge reaches two cardinal tiles; Battle Rhythm rewards multi-target cleaves with cooldown return.
- **60:** Blood March converts skill kills into sustain; Pressure concentrates more attack into the cleave itself.
- **80:** Tempest Cleave becomes a deep-floor area clearer; Moving Fortress commits to heavy defensive follow-through.

## Ranger — Dash

- **20:** Afterimage movement reduces retaliation; Light Step shortens the next dash cycle.
- **40:** Hunting Step resets on a skill kill; Free Transition refunds cooldown when Dash is used for movement rather than a kill.
- **60:** Drawn Momentum empowers the next real directional attack; Hunter's Lifeline converts dash kills into sustain.
- **80:** Endless Hunt maintains kill-chain mobility; Phantom Step combines stronger cast-turn defense with a smaller follow-up attack window.

## Arcanist — Arcane Bolt

- **20:** Forked Arcane hits a secondary visible target; Casting Barrier makes a stationary cast turn safer.
- **40:** Echo Chain expands multi-target pressure; Single-Target Focus rewards isolating a boss or elite.
- **60:** Overload Loop refunds cooldown on a kill; Forced Phase adds an extra push attempt to a surviving target.
- **80:** Arcane Storm splashes several secondary targets; Singularity Core commits to very strong isolated-target pressure.

## Assassin — Shadow Strike

- **20:** Decapitation Line increases pressure against an already wounded target; Smoke Escape reduces retaliation on the cast turn.
- **40:** Blood Return heals on a skill kill; Shadow-Blade Rhythm refunds cooldown on a kill.
- **60:** Death Mark arms a stronger next directional attack; Shadow Exit further prioritizes safe entry/exit.
- **80:** Endless Shadow Strike fully resets on a kill; Prey Still Lives refunds part of the cooldown and arms follow-up pressure when the target survives.

## Design constraints

- No new gameplay hotkey is introduced.
- Evolution must change targeting, area, timing, repositioning risk, sustain, or follow-up decisions rather than only add a permanent stat bonus.
- Existing skill audio, base movement, trap/pickup interaction, equipment-trigger windows, and the core turn lifecycle remain owned by `game.js`; the progression layer wraps the established skill call instead of duplicating the combat engine.
- Temporary cast modifiers are restored immediately after the established skill/monster turn finishes, preventing them from leaking into saved permanent stats.
