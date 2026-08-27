Clock Out Alive / 摸鱼到下班 v1.11.3 deployment bundle

This bundle atomically replaces only `/moyu/` inside the existing `/srv/91hwl-play/current` release tree and preserves Dungeon Echo v1.2.6.

The packaged game includes:
- stable base `style.css`
- release-specific `visual-v1113.css` for one consistent result/control/supporting-copy type scale
- one final `game.js` reconstructed from the accepted v1.11.0 base runtime, accepted v1.11.1 presentation patch, accepted v1.11.2 language bridge, then the narrow v1.11.3 runtime stamp
- final HTML adapted at build time with release fingerprints, prepaint language resolution and browser-translation suppression
- VERSION 1.11.3

The v1.11.3 HTML resolves the explicit/shared language before the main UI paints and marks the document as notranslate. This prevents the visible Chinese→English delay and prevents browser auto-translation from rewriting the deliberately selected UI language.

The deployer verifies checksums, release/cache fingerprints, prepaint/notranslate markers, language propagation, readable result/control scale, the ground-only dust guard, and the absence of active player-halo and drifting-coworker draw calls. It then runs origin/public health checks. Failures after switching current trigger rollback.
