Clock Out Alive / 摸鱼到下班 v1.13.1 deployment bundle

This bundle atomically replaces only `/moyu/` inside the existing `/srv/91hwl-play/current` release tree and preserves Dungeon Echo.

v1.13.1 builds on the canonical-runtime + viewport-first v1.12.x foundation and applies a playfield-first presentation pass while preserving the existing gameplay layer:
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
- active runs hide brochure chrome and non-actionable panels, compact the HUD and keep pause geometry stable so the canvas no longer jumps between states.
- desktop menu presentation exposes more of the office scene; portrait mobile removes redundant live text and keeps only core run information.
- the runner is rendered 10% larger for readability without changing physics or collision geometry.

The former v1.11.5 slice/patch/build chain remains in the repository archive only and is not included in this deployment bundle.

The deployer verifies checksums, canonical v1.13.1 fingerprints, viewport-fit guards, language ownership and the accepted gameplay-quality markers before activation. Failures after switching current trigger rollback.
