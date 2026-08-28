Clock Out Alive / 摸鱼到下班 v1.11.5 deployment bundle

This bundle atomically replaces only `/moyu/` inside the existing `/srv/91hwl-play/current` release tree and preserves the current Dungeon Echo tree.

The packaged game includes:
- stable base `style.css`
- accepted `visual-v1113.css` typography/readability layer, served with the v1.11.5 cache key
- one final `game.js` reconstructed from the accepted v1.11.0 base runtime, accepted v1.11.1 presentation patch, accepted v1.11.2 language bridge, v1.11.3 first-paint adaptation, accepted v1.11.4 quality patch, then the focused v1.11.5 stored-language precedence fix
- final HTML adapted at build time with v1.11.5 release fingerprints, prepaint language resolution and browser-translation suppression
- VERSION 1.11.5

The v1.11.5 runtime makes first paint and runtime language resolution use the same explicit precedence: query parameter, valid shared cookie, valid local preference, then browser language. A stored `en` can no longer be treated merely as a truthy conditional and collapse to Chinese when the shared cookie is absent.

All v1.11.4 quality guards remain: one-shot keyboard repeat suppression, primary mouse-button filtering, event-driven Canvas layout invalidation, memoized presentation-state DOM synchronization, and final-width spacing reserve for long-mutating BUGs. Route length, obstacle weights, rewards, hitbox, endings and local saves remain unchanged.

The deployer verifies checksums, release/cache fingerprints, prepaint/notranslate markers, the explicit language-precedence contract, readable result/control scale, all earlier quality guards, and the absence of active player-halo and drifting-coworker draw calls. It then runs origin/public health checks. Failures after switching current trigger rollback.
