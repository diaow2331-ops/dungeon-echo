# Dungeon Echo v1.3.5

Post-launch experience hotfix based on direct Chrome playtesting.

## Expedition Record
- Replaces the blank Greedy-only presentation with a persistent cross-run Expedition Record.
- Classic and Greedy runs both contribute runs, deepest floor, kills, deaths and victories.
- Safe returns and guardian defeats are tracked explicitly; Greedy vault/wheel achievements remain economy-only.
- Legacy Greedy/history data migrates as a lower bound, and New Adventure preserves the global record.
- 14 bilingual achievements now show locked/unlocked state and visible progress.

## Ground loot and UI polish
- Canonical Canvas now resolves ground equipment through the reviewed v13 weapon/wearable tier sheets.
- Removes the hard square rarity frame in favor of a softer rarity glow and grounding ring.
- Native white page/log scrollbars are replaced with the dungeon theme.
- HUD Save is styled consistently with Fullscreen and Audio.
- The Expedition Record gets an immediately accessible corner close control.
- Classic HUD hides the Greedy-only Return resource; English stairs copy restores Quick Dive cost/context.

## Reference principle
Shattered Pixel Dungeon was used as a design reference for separating per-run statistics from global/profile badges. No third-party runtime code was copied.
