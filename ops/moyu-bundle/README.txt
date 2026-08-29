Clock Out Alive / 摸鱼到下班 v1.12.0 deployment bundle

This bundle atomically replaces only `/moyu/` inside the existing `/srv/91hwl-play/current` release tree and preserves Dungeon Echo.

v1.12.0 is the canonical-runtime + viewport-first P0 cutover:
- `public/moyu/game.js` is copied byte-for-byte from tracked `moyu/game.js`; release-time source reconstruction is gone.
- `responsive-v1120.css` keeps phone safe areas, uses nearly the full portrait width for the 1200:620 playfield and exposes a landscape/fullscreen hint.
- the runtime caps desktop frame width from the real visual viewport height so the complete game frame stays in the first viewport on ordinary browser windows.
- logical world size, collision coordinates, Jump / Double Jump, obstacles, route length, endings and local saves are unchanged.

The former v1.11.5 slice/patch/build chain remains in the repository archive only and is not included in this deployment bundle.

The deployer verifies checksums, canonical v1.12.0 fingerprints, viewport-fit guards, language ownership and the accepted gameplay-quality markers before activation. Failures after switching current trigger rollback.
