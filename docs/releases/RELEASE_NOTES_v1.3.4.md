# Dungeon Echo v1.3.4

Core gameplay hotfix following the first public v1.3.3 play sessions.

## Risk loop repaired

- Greedy expeditions now have a guaranteed Return Scroll world source on Floor 3 of every ten-floor band, plus a 16% extra floor chance; guardian and merchant sources remain.
- `T` still consumes the canonical Return Scroll resource and banks the expedition into Echo Town.
- Dungeon merchants now buy backpack equipment at the same canonical `sellPrice()` used by the economy owner.

## Loot is no longer tailored to the hero

- World weapon generation chooses an available weapon family independently of the selected class.
- Assassin runs can find bows, staves and swords; Ranger/Mage/Warrior runs likewise see the full dungeon weapon ecosystem.
- Class Fit remains decision information only and does not manipulate loot or transaction pricing.

## Combat pressure and Ranger consistency

- Melee pursuers that spend their action closing into cardinal contact now land a reduced 60% engagement strike, preventing indefinite zero-risk kiting while preserving a stronger full attack on later adjacent turns.
- Ordinary monsters receive a depth-aware HP/DEF durability curve; the reviewed guardian/final-boss pressure table is unchanged.
- Ranger Fleet Step now uses one symmetric four-direction traversal rule and can cut through a surviving enemy to the furthest legal landing tile.

## Save and site navigation restored

- The live HUD again exposes a direct **Save** control; saving does not consume a turn or leave the expedition.
- The pause screen adds **Save Now**, while **Save & Title** now persists correctly even from `paused` state by storing a resumable `playing` snapshot.
- The title screen restores the canonical `https://91hwl.cn/` return link without reconnecting the retired town-workspace runtime.

## Reference principles

Design behavior was checked against mature public roguelike implementations before coding: Shattered Pixel Dungeon's broad equipment generator, explicit shop sell flow, return-resource handling and actor-owned hostile turns, plus Brogue/rot.js turn-based actor principles. No third-party runtime code was copied.

## Verification

- focused post-launch regression harness: 14/14 PASS before release cut;
- v1.3.3 current suite with the new gameplay gate: 27/27 PASS;
- final v1.3.4 release suite and immutable bundle are required before deployment.
