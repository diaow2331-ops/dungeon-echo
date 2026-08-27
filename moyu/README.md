# 摸鱼到下班 · Clock Out Alive

Current release candidate: **v1.11.3**. Production route: `https://play.91hwl.cn/moyu/`.

The game remains a deterministic static release:

- `index.html` — stable product shell/HUD template.
- `style.css` — stable cross-device base layout.
- `visual-v1113.css` — release-specific typography/readability layer.
- `build-v1113.cjs` — deterministic build-time prepaint/version adapter.
- `src/game.part01.js` … `game.part15.js` — accepted v1.11.0 runtime slices.
- `patches/runtime-v1111.patch` — accepted v1.11.1 presentation patch.
- `patches/runtime-v1112.patch` — accepted v1.11.2 language-preference bridge.

Packaging reconstructs and verifies the accepted v1.11.0 base runtime, applies v1.11.1 and verifies its exact intermediate SHA, applies v1.11.2, then performs the narrow v1.11.3 build-time adaptation and runs `node --check`. Browsers receive one final `game.js`; no patch layer executes in the browser.

v1.11.3 focuses on first-paint consistency and readable hierarchy. The final HTML resolves `?lang=zh|en` / the shared `91hwl_lang` preference before the main UI paints, carries explicit `translate="no"` + `notranslate` markers to prevent browser translation from rewriting the selected language, and uses a single typography ladder across result cards, controls, HUD/supporting copy and panels.

The result card body, coaching text and control hints are larger than v1.11.2; language/settings/fullscreen controls share a clearer 44px desktop control height. Mobile remains more compact but still follows the same hierarchy.

All accepted v1.11.1/v1.11.2 gameplay-facing fixes remain: no player focus halo, no floor dust on an airborne second jump, no drifting translucent coworkers, shared language propagation, unchanged `DAY_END_DISTANCE`, unchanged `PLAYER_HIT`, unchanged difficulty/endings/local saves.
