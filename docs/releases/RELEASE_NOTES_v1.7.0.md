# Dungeon Echo v1.7.0

## Release focus
Living Town + Expedition Variety. This release increases decision density without reopening the v1.6 single-authority architecture.

## Player-facing changes
- Town departure page now offers expedition contracts unlocked by town tier.
- Elite Hunt raises elite frequency and pays elite bounties.
- Relic Sweep raises chest/event frequency in exchange for an extra trap per floor.
- Veteran Oath raises ordinary enemy ATK and XP for higher-risk progression.
- Optional dungeon echo events: Blood Offering, Cursed Cache and Elite Trial.
- Elites can roll Frenzied, Vampiric or Volatile affixes.
- Ordinary monsters now gain a firmer depth-based ATK pressure curve: +7% at Floor 1, rising to +24% at Floor 100; elites add another +6%.
- Engagement strikes rise to 60% normal, 74% elite and 66% guardian/boss pressure.
- Selected heavy ordinary enemies gain the existing telegraphed Armor Break pattern, so they are stronger without becoming hidden-stat checks: create distance or break line-of-sight during the warning turn.
- Guardian and final-boss authored ATK values are not multiplied by the new ordinary-monster pressure curve.

## Architecture
- `game/domain/expedition/expedition-rules-v170.js` is the sole deterministic expedition-variation policy authority.
- `game/core/game.js` remains sole runtime owner for RNG, spawning, combat execution, rewards, state mutation, persistence, Canvas rendering and gameplay input.
- Storage epoch remains `v130`; old saves default contract selection to `none`.

## Release boundary
- Semantic version: `1.7.0`
- Cache generation: `181`
- Storage epoch: `v130`
