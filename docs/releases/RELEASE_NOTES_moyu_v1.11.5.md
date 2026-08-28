# Clock Out Alive / 摸鱼到下班 v1.11.5

v1.11.5 is a narrow language-consistency release on top of the v1.11.4 play-quality candidate. It does not change gameplay balance, route length, rewards, endings, saves or art.

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

## Preserved

- v1.11.4 one-shot keyboard-repeat guards and primary mouse-button filtering.
- v1.11.4 event-driven Canvas layout invalidation and presentation-state memoization.
- v1.11.4 final-width spacing reserve for long-mutating BUGs.
- v1.11.3 first-paint/notranslate and typography work.
- v1.11.1 no-player-halo / ground-only jump dust and v1.11.2 shared-language bridge.
- `DAY_END_DISTANCE=2200`, the four-scene 14:00 → 18:00 route, obstacle weights, speed curve, player hitbox, rewards, endings and all existing local-save keys.

## Release contract

The deterministic build chain is now:

`v1.11.0 source slices → v1.11.1 patch → v1.11.2 patch → v1.11.3 prepaint adapter → v1.11.4 quality patch/adapter → v1.11.5 language patch/adapter`.

The release test, single-game bundle builder, deployer and healthcheck all gate the explicit stored-language fallback and reject the previous ambiguous expression.

Public deployment is intentionally deferred until Dungeon Echo's companion quality candidate is also finished so both games can be published and accepted together.
