# Dungeon Echo v1.2.3

v1.2.3 is a narrow mobile-responsiveness and visual-cleanup patch on top of the completed v1.2.2 game/art baseline.

## Fixed

- Removed the always-on player aura and skill-ready ellipse from the presentation overlay on both desktop and mobile.
- Prevented mobile-only entity glow layers from appearing at incorrect screen positions when the 15×15 / 17×17 camera is active.
- Reduced non-fullscreen Android browser jitter by taking the mobile HUD/control dock out of sticky/backdrop-filter composition while browser chrome is present.
- Stopped the mobile action-bar MutationObserver from repeatedly triggering itself through `textContent` rewrites.
- Made primary touch actions respond on pointer-down rather than waiting for the browser's pointer-up click; directional hold-repeat also starts earlier.
- Reduced optional mobile overlay paint work while preserving the correctly camera-translated core canvas, guardian telegraphs, gameplay state and map rendering.

## Unchanged

- Combat numbers, class balance, Mana costs/recovery and enemy stats.
- Loot, economy, forging, town services and progression.
- `classic-100` route and save schema (`de-run-v6` version 2 / `de-greedy-meta-v1`).
- Desktop keyboard/gamepad controls.
- Hero, monster, guardian, final-boss, equipment and town art assets.

This patch is intentionally the final device/visual cleanup before returning to repository cleanup, 91hwl presentation and launch work.
