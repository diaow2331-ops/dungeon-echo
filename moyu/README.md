# 摸鱼到下班 · Clock Out Alive

Current release candidate: **v1.11.2**. Production route: `https://play.91hwl.cn/moyu/`.

The game is governed as a deterministic static release:

- `index.html` — product shell, HUD and accessibility structure.
- `style.css` — stable cross-device base layout.
- `visual-v1112.css` — v1.11.2 readable result/body/control scale.
- `src/game.part01.js` … `game.part15.js` — accepted v1.11.0 runtime slices.
- `patches/runtime-v1111.patch` — accepted v1.11.1 presentation patch.
- `patches/runtime-v1112.patch` — language-preference bridge and v1.11.2 runtime stamp, applied after v1.11.1 during packaging.

The release builder reconstructs and verifies the accepted v1.11.0 base runtime, applies the accepted v1.11.1 patch and verifies that intermediate SHA, then applies the v1.11.2 patch and runs JavaScript syntax/invariant checks. Browsers receive one final `game.js`; neither patch executes in the browser.

v1.11.2 keeps the v1.11.1 fixes (no player focus halo, no floor dust during the airborne second jump, no drifting translucent coworkers) and improves readability: larger result-card body copy, larger controls, and a more visible language button.

Language preference is now designed to follow the 91hwl product experience. `?lang=zh|en` has highest priority; a non-sensitive `91hwl_lang` parent-domain cookie provides cross-subdomain continuity; the game's existing local preference and browser language remain fallbacks. Changing language in the game also updates the shared preference.

Core run length, collision geometry, difficulty, endings and local saves remain unchanged. The game remains static-first, bilingual, desktop/mobile compatible and account-free. Optional end-of-run message submission remains non-blocking and only activates when a configured endpoint exists.
