Clock Out Alive / 摸鱼到下班 v1.16.0 deployment bundle

This bundle atomically replaces only `/moyu/` inside the existing `/srv/91hwl-play/current` release tree and preserves Dungeon Echo.

v1.16.0 builds on the canonical-runtime + viewport-first v1.12.x foundation and the v1.13.x playfield/game-feel passes while preserving the existing gameplay layer:
- `public/moyu/game.js` is copied byte-for-byte from tracked `moyu/game.js`; release-time source reconstruction is gone.
- `responsive-v1120.css` keeps phone safe areas, uses nearly the full portrait width for the 1200:620 playfield and exposes a landscape/fullscreen hint.
- the runtime caps desktop frame width from the real visual viewport height so the complete game frame stays in the first viewport on ordinary browser windows.
- logical world size, core Jump / Double Jump input, route length, endings and local saves stay compatible.
- workstation boss rushes, drifting meeting gaps and bouncing gym dumbbells give scenes distinct timing reads.
- Leave Slip offers one temporary collision save at the cost of Combo; Risk Form temporarily doubles near-miss bonuses; Coffee stays +35m.
- near-miss has normal and Perfect tiers, creating a deliberate high-risk score route without permanent stats.
- completed runs now write a browser-local Last Run summary plus Top 5 ledger; no account or progression stat is introduced.
- optional Daily Shift uses a local-date deterministic seed for gameplay randomness plus one rotating office modifier; normal mode stays random and unchanged.
- Daily records carry their date/modifier into Last Run and Top 5 so repeat attempts are visibly comparable.
- v1.13.1 adds Perfect Near Miss burst feedback, every-fifth-Combo Flow milestones and a visible Combo lifetime bar.
- ground takeoff, double jump and hard landing now have distinct feedback; boss spot-check warnings are longer and clearer without changing collision geometry.
- the runner now uses a right-facing 3/4 gait with opposing limbs and velocity-driven airborne poses; the 44×66 gameplay body remains unchanged.
- v1.14.0 ships a tracked 4×4 transparent hero sprite sheet with idle/run/jump/double-jump/fall/land/hurt/victory frames; runtime foot anchoring and the 44×66 physics body remain authoritative.
- the former vector runner remains only as an asset-load fallback; the deployer and healthcheck validate the reviewed sprite checksum before activation.
- v1.14.1 redraws Boss, BUG, temporary request, mail, coffee spill and dumbbell hazards with clearer office silhouettes and state cues while preserving their canonical collision geometry and timing.
- the hero now uses the dedicated jump-start frame during initial takeoff; jump velocity and hitboxes remain unchanged.
- v1.15.0 turns portrait mobile into a camera-cropped playfield (~322px tall at 390×844) instead of shrinking the whole 1200×620 world to ~197px tall.
- v1.16.0 uses `RUN_PROGRESS_SCALE=.020`, bringing the normal 14:00→18:00 route close to four minutes while obstacle pixel speed and jump physics stay unchanged.
- v1.16.0 adds visual-only workstation, meeting, pantry and gym motion layers so each scene reads immediately in motion.
- menu brochure/archive panels are hidden until they are relevant, the hero visual is larger, and subtle motion-depth planes make the office read as moving space.
- active runs hide brochure chrome and non-actionable panels, compact the HUD and keep pause geometry stable so the canvas no longer jumps between states.
- desktop menu presentation exposes more of the office scene; portrait mobile removes redundant live text and keeps only core run information.
- the runner is rendered 10% larger for readability without changing physics or collision geometry.

The former v1.11.5 slice/patch/build chain remains in the repository archive only and is not included in this deployment bundle.

The deployer verifies checksums, canonical v1.16.0 fingerprints, viewport-fit guards, language ownership and the accepted gameplay-quality markers before activation. Failures after switching current trigger rollback.
