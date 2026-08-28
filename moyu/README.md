# 摸鱼到下班 · Clock Out Alive

Current release candidate: **v1.11.5**. Production route: `https://play.91hwl.cn/moyu/`.

The game remains a deterministic static release:

- `index.html` — stable product shell/HUD template.
- `style.css` — stable cross-device base layout.
- `visual-v1113.css` — accepted v1.11.3 typography/readability layer, reused unchanged with the current cache key.
- `build-v1113.cjs` — deterministic first-paint/prepaint adapter.
- `build-v1114.cjs` — deterministic v1.11.4 quality/fingerprint adapter.
- `build-v1115.cjs` — deterministic v1.11.5 language-consistency/fingerprint adapter.
- `src/game.part01.js` … `game.part15.js` — accepted v1.11.0 runtime slices.
- `patches/runtime-v1111.patch` — accepted v1.11.1 presentation patch.
- `patches/runtime-v1112.patch` — accepted v1.11.2 shared-language bridge.
- `patches/runtime-v1114.patch` — accepted input/performance/fairness patch.
- `patches/runtime-v1115.patch` — focused stored-language precedence fix.

Packaging reconstructs and verifies the accepted v1.11.0 base runtime, applies v1.11.1 and verifies its exact intermediate SHA, applies v1.11.2, performs the v1.11.3 first-paint adaptation, applies the v1.11.4 quality patch, then applies the v1.11.5 language-consistency patch and final fingerprints. Browsers still receive one final `game.js`; no patch layer executes in the browser.

v1.11.5 fixes one release-quality defect in the language owner. The prepaint script already resolved language as explicit `?lang=zh|en` → shared `91hwl_lang` cookie → stored preference → browser language. The runtime fallback previously used an ambiguous `||` / ternary expression: with no cookie and a stored `en`, the first paint could be English and the runtime could subsequently fall back to Chinese. The runtime now uses the same explicit precedence as prepaint and validates stored values as only `zh` or `en`.

All v1.11.4 gameplay-quality changes remain unchanged: one-shot keyboard repeat suppression, primary-button mouse input, event-driven Canvas layout measurement, memoized presentation-state synchronization and final-width spacing reserve for long-mutating BUGs.

The four-scene 14:00 → 18:00 route, `DAY_END_DISTANCE`, player hitbox, obstacle weights, speed curve, rewards, endings and local saves are unchanged. The v1.11.3 notranslate/typography work and earlier no-halo, ground-only jump-dust and shared-language fixes also remain intact.
