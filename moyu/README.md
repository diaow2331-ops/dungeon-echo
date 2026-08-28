# 摸鱼到下班 · Clock Out Alive

Current release candidate: **v1.11.4**. Production route: `https://play.91hwl.cn/moyu/`.

The game remains a deterministic static release:

- `index.html` — stable product shell/HUD template.
- `style.css` — stable cross-device base layout.
- `visual-v1113.css` — accepted v1.11.3 typography/readability layer, reused unchanged with a v1.11.4 cache key.
- `build-v1113.cjs` — deterministic first-paint/prepaint adapter.
- `build-v1114.cjs` — deterministic v1.11.4 release fingerprint/quality-contract adapter.
- `src/game.part01.js` … `game.part15.js` — accepted v1.11.0 runtime slices.
- `patches/runtime-v1111.patch` — accepted v1.11.1 presentation patch.
- `patches/runtime-v1112.patch` — accepted v1.11.2 language-preference bridge.
- `patches/runtime-v1114.patch` — focused input/performance/fairness patch.

Packaging reconstructs and verifies the accepted v1.11.0 base runtime, applies v1.11.1 and verifies its exact intermediate SHA, applies v1.11.2, performs the v1.11.3 first-paint adaptation, then applies the focused v1.11.4 quality patch and final v1.11.4 fingerprints. Browsers still receive one final `game.js`; no patch layer executes in the browser.

v1.11.4 keeps the existing four-scene 14:00 → 18:00 run, `DAY_END_DISTANCE`, player hitbox, local saves, endings, obstacle weights and reward values unchanged. The quality pass instead fixes four runtime problems:

- keyboard auto-repeat can no longer consume the second jump, repeatedly toggle pause/audio/fullscreen/settings, or auto-accept the 18:00 clock-out window simply because Space is being held;
- Canvas backing-size/layout measurement is invalidated by real viewport/fullscreen changes instead of calling `getBoundingClientRect()` every animation frame;
- presentation `dataset` / route-scroll synchronization is memoized by state/pressure/route instead of repeating DOM/style work every frame;
- long-mutating BUGs reserve their final 116px width when scheduling the following obstacle, so the mutation no longer silently eats roughly 60px of intended clear space.

The v1.11.3 first-paint/notranslate and typography work remains intact. The final HTML still resolves `?lang=zh|en` / the shared `91hwl_lang` preference before the main UI paints, carries explicit `translate="no"` + `notranslate` markers, and reuses the accepted readable result/control hierarchy.

All earlier gameplay-facing fixes also remain: no player focus halo, no floor dust on an airborne second jump, no drifting translucent coworkers, shared language propagation, unchanged difficulty/endings/local saves.
