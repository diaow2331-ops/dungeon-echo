# Dungeon Echo v1.5.0

Release focus: combat feel, expedition readiness, and small-screen control density without introducing a second gameplay authority or a save reset.

## Player-facing changes

- Class-specific hit and critical SFX make Warrior, Ranger, Arcanist, and Assassin attacks read differently.
- Critical hits, monster kills, dodges, guardian warnings, and player damage now have stronger bounded visual/audio feedback.
- Optional haptics are stored with audio preferences and respect reduced-motion behavior; restoring the recommended audio mix does not override the haptics choice.
- Mobile controls use a denser thumb layout while retaining the canonical Attack / Skill / Quick Dive actions.
- Desktop dungeon viewports now use 23×17, 27×19, or 31×21 camera bands instead of falling directly from mobile framing to the full 40×28 map.
- Echo Town can complete the recommended 2-Potion + 1-Return-Scroll core kit in one action when stock and Gold allow it.
- Town readiness now explains stock shortages or exact Gold shortfall and marks risky departure without forbidding it.
- Starting a new classic or Greedy run clears transient hit, arrow, trauma, hit-stop, and hurt-flash presentation state.

## Balance and compatibility

- Engagement pressure attacks are reduced to 45% normal / 55% elite-or-boss damage scaling to keep the extra pressure readable rather than punitive.
- Monster HP/ATK, guardian progression, loot tables, and the v130 save epoch are otherwise unchanged.
- Existing v130 saves and persistent audio/guide/expedition preferences remain compatible.

## Release authority

- Semantic version: `1.5.0`
- Cache generation: `179`
- Gameplay/render/input/persistence owner: `game/core/game.js`
- Production storage epoch: `v130`
