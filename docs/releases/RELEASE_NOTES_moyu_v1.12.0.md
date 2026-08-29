# Clock Out Alive / 摸鱼到下班 v1.12.0

v1.12.0 is the P0 foundation cutover for the Moyu product plan.

## Canonical runtime

- `moyu/game.js` is now the only production gameplay source.
- Release packaging copies canonical `game.js` and `index.html` byte-for-byte instead of rebuilding them from 15 slices, runtime patches and three build adapters.
- The full v1.11.5 reconstruction chain is retained under `moyu/archive/v1.11.5/` as recovery evidence and cannot enter the release bundle.

## Viewport-first play surface

- Desktop frame width is capped from the real visual viewport height and the frame's live top offset, keeping the complete game frame visible in the first viewport on ordinary browser windows.
- 390px portrait phones use nearly the full safe width; the measured Canvas grows from the previous ~182px height to ~197px while preserving the 1200:620 aspect ratio.
- Portrait phones show a concise landscape/fullscreen enhancement hint.
- Canvas logical coordinates remain 1200×620, so display fitting does not change physics or collision coordinates.

## Browser acceptance

Focused headless Chrome acceptance passed at effective viewports 1600×761, 1920×941 and 390×844 with no horizontal overflow, no runtime console errors, a fully visible game frame, and successful transition into active play.

P1 scene-specific actions, risk pickups, scoring routes, run history and Daily Shift remain separate follow-up work.
