# 摸鱼到下班 · Clock Out Alive

Current release candidate: **v1.12.0**. Production route: `https://play.91hwl.cn/moyu/`.

v1.12 starts from one production authority instead of rebuilding gameplay at release time:

- `game.js` — the only canonical gameplay runtime.
- `index.html` — final production shell; no build adapter rewrites it.
- `style.css` — stable base presentation.
- `visual-v1113.css` — accepted readability layer, retained as a static asset.
- `responsive-v1120.css` — viewport-first desktop/mobile presentation.
- `archive/v1.11.5/` — recovery evidence for the former 15-slice + patch + adapter chain. It is not a release input.

`ops/release/build-moyu-bundle.sh` now packages tracked canonical bytes directly. The bundled `game.js` is byte-for-byte identical to `moyu/game.js`; no patch command or runtime build adapter participates in v1.12 packaging.

## v1.12.0 P0

The gameplay rules remain the accepted v1.11.5 rules: 14:00 → 18:00, Jump / Double Jump, existing obstacle weights, hitboxes, rewards, discoveries, endings and local saves.

The display contract changes. `fitGameFrameToViewport()` measures the real visual viewport and the frame's current top position, then caps the rendered frame width so the complete game frame fits above the fold on ordinary desktop browser windows. Canvas backing pixels are still transformed to the fixed logical `1200 × 620` world, so CSS sizing does not change collision or physics coordinates.

On portrait phones the page uses nearly the full safe width for the frame, keeps the 1200:620 ratio, and shows a short landscape/fullscreen hint. Fullscreen remains optional; the core game is still playable with one tap action in portrait.

P1 scene-specific actions, risk pickups, stronger near-miss scoring, run history and Daily Shift are intentionally not part of this P0 cutover.
