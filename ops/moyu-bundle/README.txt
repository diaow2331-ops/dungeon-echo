Clock Out Alive / 摸鱼到下班 v1.11.4 deployment bundle

This bundle atomically replaces only `/moyu/` inside the existing `/srv/91hwl-play/current` release tree and preserves the current Dungeon Echo tree.

The packaged game includes:
- stable base `style.css`
- accepted `visual-v1113.css` typography/readability layer, served with the v1.11.4 cache key
- one final `game.js` reconstructed from the accepted v1.11.0 base runtime, accepted v1.11.1 presentation patch, accepted v1.11.2 language bridge, v1.11.3 first-paint adaptation, then the focused v1.11.4 quality patch
- final HTML adapted at build time with v1.11.4 release fingerprints, prepaint language resolution and browser-translation suppression
- VERSION 1.11.4

The v1.11.4 runtime keeps the existing route length, obstacle weights, rewards, hitbox, endings and local saves. It adds four guarded quality changes: keyboard repeat suppression for one-shot actions, event-driven Canvas layout invalidation, memoized presentation-state DOM synchronization, and final-width spacing reserve for long-mutating BUGs.

The deployer verifies checksums, release/cache fingerprints, prepaint/notranslate markers, language propagation, readable result/control scale, the ground-only dust guard, all four v1.11.4 quality guards, and the absence of active player-halo and drifting-coworker draw calls. It then runs origin/public health checks. Failures after switching current trigger rollback.
