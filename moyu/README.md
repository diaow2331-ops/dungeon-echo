# 摸鱼到下班 · Clock Out Alive

Current release candidate: **v1.11.1**. Production route: `https://play.91hwl.cn/moyu/`.

The game is governed as a deterministic static release:

- `index.html` — product shell, HUD and accessibility structure.
- `style.css` — stable cross-device base layout.
- `visual-v1111.css` — narrow v1.11.1 result-typography correction.
- `src/game.part01.js` … `game.part15.js` — accepted v1.11.0 runtime slices.
- `patches/runtime-v1111.patch` — audited build-time visual patch applied after the slices are reconstructed.

The release builder verifies the accepted v1.11.0 base runtime SHA before applying the patch, then verifies the exact v1.11.1 runtime SHA. The patch is applied during packaging; browsers receive one final `game.js` and do not execute a patch layer.

v1.11.1 specifically removes the active player halo, prevents airborne second-jump dust at floor level, removes drifting translucent background coworkers, and normalizes result-card typography. Core run length, collision geometry, difficulty, endings and local saves remain unchanged.

The game remains static-first, bilingual, desktop/mobile compatible and account-free. Optional end-of-run message submission remains non-blocking and only activates when a configured endpoint exists.
