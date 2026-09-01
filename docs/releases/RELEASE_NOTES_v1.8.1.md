# Dungeon Echo v1.8.1 — Town Viewport & Fullscreen Polish

This patch does not add another art authority. It reuses the existing Living Town, NPC, growth, and relic atlases and presents them at a scale that matches the available viewport.

## Player-facing changes

- Enlarges the desktop town shell into a near-full-viewport workspace.
- Promotes Market, Tavern, and Fortune from narrow floating cards to wide service pages.
- Enlarges service artwork, named-relic thumbnails, town typography, and key controls.
- Enlarges the Fortune wheel from 230px to 380px on desktop and centers it in a full-height service panel.
- Adds a visible town fullscreen control; F remains the keyboard shortcut.
- Synchronizes fullscreen state between the global HUD control and the town control.
- Restricts the old optional-details min-height rule to actual details elements so it no longer compresses Fortune.
- Fixes the mobile town padding cascade so the town uses the available phone width.
- Preserves per-page scrolling for dense Relics and Market content.

## Authority / regression scope

- No new gameplay state owner.
- No new art atlas.
- No economy, combat, progression, loot, or save-format change.
- Cache generation: 183.
