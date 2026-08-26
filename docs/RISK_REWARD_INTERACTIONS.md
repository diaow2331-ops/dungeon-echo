# Dungeon Risk / Reward Interactions

Post-v1.1 stabilization treats optional dungeon interactables as decisions rather than free pickups.

## Shrine contract

Accepting a shrine always consumes one turn and removes the consumed shrine from collision/pathing.

The production outcome bands are:

- 28% — **Mending**: heal about 35% max HP and clear poison; at full HP, gain one potion instead.
- 22% — **Blood offering**: lose 18% max HP (never directly below 1 HP), receive a Rare-or-better equipment roll.
- 20% — **Greed contract**: receive `18 + depth × 3` carried gold and wake two nearby enemies.
- 18% — **Guardian trial**: summon one reinforced altar guardian; its elite kill path supplies the actual high-value reward.
- 12% — **Curse**: apply poison and grievous pressure.

Shrines no longer grant permanent base ATK or base HP. Long-run permanent progression is owned by the bounded progression system, not farmable random floor props.

## Casks

The existing cask reward table remains intact. Breaking a cask already costs the movement turn used to enter its tile, so no second turn is charged.

After the normal cask result resolves, one additional deterministic risk check occurs:

- 18% — wake one nearby monster;
- 12% — contamination applies poison and grievous pressure;
- 70% — no additional downside.

A cask can resolve its risk at most once. The risk roll is derived from the run seed / depth / turn / position and does not consume the core reward RNG merely to decide whether a risk exists.

## Design rules

- Optional props must not be guaranteed positive expected-value faucets.
- Risk should create a tactical/resource consequence, not merely display a bad-flavored message.
- High-value rewards should require an explicit price (HP, enemies, status pressure, or combat trial).
- One-shot props must not become collision blockers after use.
- Interactions must preserve save compatibility and remain reproducible enough for focused bug reports.
