# Dungeon Echo v1.2.8

v1.2.8 is a focused English-locale completeness hotfix on top of v1.2.7.

## Fixed

- English dungeon sessions no longer allow equipment slot labels to fall back to Chinese after the core renderer updates the existing slot nodes.
- Dynamic Adventure Log text now translates in place, including trap damage, cask outcomes, pickups, floor summaries, Greedy Expedition descent copy, combat lines, potion use, cooldowns and level-up messages.
- Mixed fragments such as `Cask裂开，滚出 10 Gold.` and `Picked up 一瓶Healing Potion.` are normalized into complete English sentences.
- The English gameplay header no longer appends the Chinese `地牢回响` subtitle beside `Dungeon Echo`.

## Implementation

- Adds `locale-completeness-v128.js` after the stable `locale-runtime-v122.js` owner.
- Watches only dynamic presentation roots such as the equipment bar, Adventure Log, backpack, tooltip, hint, overlay and town/service panels.
- Observes `characterData` as well as newly inserted nodes so in-place renderer updates cannot reintroduce Chinese text.
- Keeps equipment labels explicitly English in English sessions.
- Reuses the existing locale owner's item, monster and theme-name translations rather than changing saved identities.
- Uses no polling timer and does not mutate gameplay state, RNG, saves, balance, economy or input semantics.

## Release contract

- Production cache generation advances to `128`.
- The release bundle must contain `locale-completeness-v128.js` and the deployer rejects a v1.2.8 package if its scoped observer/equipment/log contracts are absent.
- `v1.2.7` remains immutable; v1.2.8 receives its own release stamp and tag.

## Verification required

Repository/static checks are not human-browser evidence. Before calling v1.2.8 complete, verify a real `?lang=en` session on desktop and mobile, including equipment labels and several newly generated Adventure Log messages.
