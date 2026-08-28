# Clock Out Alive / 摸鱼到下班 v1.11.5

v1.11.5 is the final pre-publication quality release paired with Dungeon Echo v1.2.10. It does not change gameplay balance, route length, rewards, endings, saves or art.

## Fixed

The v1.11.3 first-paint prepaint owner and the runtime language owner could disagree when all of the following were true:

- no explicit `?lang=zh|en` query was present;
- no shared `91hwl_lang` cookie had been written yet;
- `localStorage['91hwl_lang']` already contained `en`.

The prepaint path correctly rendered English, while the runtime's ambiguous `||` / ternary expression could treat the truthy string `en` as a boolean condition and resolve to Chinese. That could produce an English first paint followed by a Chinese runtime flip and then persist the wrong shared cookie.

The runtime now follows one explicit precedence chain:

1. valid `?lang=zh|en` query;
2. valid shared `91hwl_lang` cookie;
3. valid stored `91hwl_lang` preference (`zh` or `en` only);
4. browser language fallback.

## Final phone pass

`responsive-v1115.css` is packaged as a separate release asset so the stable PC presentation does not need to be rewritten.

- iPhone/Android display safe areas are respected through `env(safe-area-inset-*)` padding.
- Below 560px, Home and Settings collapse to fixed icon-width controls so the brand is no longer squeezed by the four top actions.
- Below 380px, the action row can wrap beneath the brand instead of overflowing.
- Runner Canvas aspect ratio, collision geometry, speed curve and tap-to-jump semantics are unchanged.

## Preserved

- v1.11.4 one-shot keyboard-repeat guards and primary mouse-button filtering.
- v1.11.4 event-driven Canvas layout invalidation and presentation-state memoization.
- v1.11.4 final-width spacing reserve for long-mutating BUGs.
- v1.11.3 first-paint/notranslate and typography work.
- v1.11.1 no-player-halo / ground-only jump dust and v1.11.2 shared-language bridge.
- `DAY_END_DISTANCE=2200`, the four-scene 14:00 → 18:00 route, obstacle weights, speed curve, player hitbox, rewards, endings and all existing local-save keys.

## Release contract

The deterministic build chain is:

`v1.11.0 source slices → v1.11.1 patch → v1.11.2 patch → v1.11.3 prepaint adapter → v1.11.4 quality patch/adapter → v1.11.5 language patch/adapter + responsive stylesheet`.

The release test, bundle builder, deployer and healthcheck gate the stored-language precedence, final responsive asset and all earlier quality guards.

Public deployment is performed together with Dungeon Echo v1.2.10 so the two Web Toys share one final repository revision and one acceptance window.
