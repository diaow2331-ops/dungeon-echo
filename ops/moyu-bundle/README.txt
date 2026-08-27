Clock Out Alive / 摸鱼到下班 v1.11.1 deployment bundle

This bundle atomically replaces only `/moyu/` inside the existing `/srv/91hwl-play/current` release tree and preserves Dungeon Echo.

The packaged game includes:
- base `style.css`
- release-specific `visual-v1111.css`
- one final `game.js` produced from the accepted v1.11.0 base runtime plus the deterministic v1.11.1 build-time patch
- VERSION 1.11.1

The deployer verifies bundle checksums, release fingerprints, the ground-only dust guard, the absence of active player-halo and drifting-coworker draw calls, then runs origin/public health checks. Failures after switching current trigger rollback.
