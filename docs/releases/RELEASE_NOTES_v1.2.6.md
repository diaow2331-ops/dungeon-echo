# Dungeon Echo v1.2.6

v1.2.6 is a UI/localization quality hotfix on top of v1.2.5.

## Fixed

- English **How to Play** no longer mixes Chinese device-control copy into the English page.
- Device-specific Help text is now coherent for desktop/mobile in both Chinese and English.
- **Expedition Record / 远征录** is fully localized instead of leaving its title, statistics and achievements in Chinese on English sessions.
- Opening Expedition Record before a Greedy Expedition profile exists no longer produces an empty panel.

## Improved

- Expedition Record now always shows the complete 12-achievement catalog.
- Locked achievements remain visible so progression goals are discoverable before they are completed.
- Each achievement shows progress and a compact progress bar.
- The record header shows unlocked count, deepest floor, expedition count, total kills, deaths, vault Gold and wheel spins.
- A zero-state explains when progress tracking begins without creating or mutating a save.
- Desktop, tablet and mobile layouts receive dedicated record-grid breakpoints.

## Unchanged

- Combat, Mana, loot, economy, progression, RNG and input semantics are unchanged.
- Save schema is unchanged. v1.2.6 only reads the existing `de-greedy-meta-v1` record for presentation.
- Existing v1.2.3–v1.2.5 mobile, navigation and cache-coherence fixes remain intact.
