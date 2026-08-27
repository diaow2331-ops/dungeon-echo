# Dungeon Echo v1.2.4

v1.2.4 is a narrow UI-navigation hotfix on top of v1.2.3.

## Fixed

- Restores the title-screen **How to Play / 玩法说明** screen.
- Restores the title-screen **Expedition Log / 远征录** screen.
- Restores the town → Expedition Log → town navigation path instead of exposing the dungeon canvas underneath.
- Makes Help and Expedition Log first-class members of the native fixed full-screen UI layer in `style.css`.
- Adds release/deploy contracts so future bundles cannot silently omit that screen-layer ownership.

## Unchanged

- Combat, Mana, loot, economy, progression and RNG are unchanged.
- Save schema and existing local saves are unchanged.
- v1.2.3 mobile input, four-way D-pad and visual cleanup remain intact.

The bug was caused by the Help and Expedition Log screens being present and correctly wired in JavaScript but omitted from the fixed full-screen CSS selector. The final v1.2.4 fix lives in the native stylesheet rather than a runtime monkeypatch.
