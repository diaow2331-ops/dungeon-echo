Clock Out Alive / 摸鱼到下班 v1.11.2 deployment bundle

This bundle atomically replaces only `/moyu/` inside the existing `/srv/91hwl-play/current` release tree and preserves Dungeon Echo v1.2.6.

The packaged game includes:
- stable base `style.css`
- release-specific `visual-v1112.css` for readable result/body/control typography
- one final `game.js` produced from the accepted v1.11.0 base runtime, the accepted v1.11.1 visual patch, then the v1.11.2 language-preference bridge
- VERSION 1.11.2

The v1.11.2 runtime accepts `?lang=zh|en`, reads/writes the non-sensitive parent-domain `91hwl_lang` preference as a cross-subdomain fallback, and keeps its 91hwl home link aligned with the current language. Its own localStorage remains a fallback rather than the only source of truth.

The deployer verifies bundle checksums, release/cache fingerprints, language propagation, readable control/result scale, the ground-only dust guard, and the absence of active player-halo and drifting-coworker draw calls. It then runs origin/public health checks. Failures after switching current trigger rollback.
