Clock Out Alive / 摸鱼到下班 v1.26.5 deployment bundle

This bundle atomically replaces only `/moyu/` inside the existing `/srv/91hwl-play/current` release tree and preserves Dungeon Echo.

v1.26.5 builds on the canonical-runtime + viewport-first v1.12.x foundation and the v1.13.x playfield/game-feel passes while preserving the existing gameplay layer:
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
- v1.16.1 reorders the existing six grounded run frames to `2,3,6,5,7,4` for a smoother stride loop; sprite bytes, FPS and physics stay unchanged.
- v1.17.0 expands portrait play to a viewport-responsive surface capped at 440px and shifts the visual crop toward the runner, preserving enough forward route to read hazards while leaving desktop and logical physics unchanged.
- menu brochure/archive panels are hidden until they are relevant, the hero visual is larger, and subtle motion-depth planes make the office read as moving space.
- active runs hide brochure chrome and non-actionable panels, compact the HUD and keep pause geometry stable so the canvas no longer jumps between states.
- desktop menu presentation exposes more of the office scene; portrait mobile removes redundant live text and keeps only core run information.
- the runner is rendered 10% larger for readability without changing physics or collision geometry.
- v1.18.0 replaces one-touch run death with a visible three-strike mistake buffer: the first two ordinary collisions break Combo and grant brief recovery invulnerability; the third collision ends the run.
- the opening 14:00 segment now starts with a non-mutating BUG, wider early spacing and delayed boss rushes so players can establish jump rhythm before the director escalates.
- the buffer state is shown in the live HUD and stored in Last Run / Top 5 summaries; Leave Slip still absorbs a hit before the mistake buffer is consumed.

- v1.19.0 retunes the four-minute route into short 3–5 hazard phrases with guaranteed breathing beats, scene-specific curated sequences and larger transition windows, reducing constant-input fatigue without shortening the shift.
- v1.19.0 lets the first clean 10-obstacle Combo in each scene recover one previously lost mistake buffer; the three-strike cap, physics and endings remain authoritative.
- v1.20.0 adds one readable LOW/HIGH pickup choice per scene: the low lane can be taken from the ground, the high lane requires a jump, and collecting either removes its sibling.
- v1.21.0 replaces progression-scaled backdrop drift with a physical visual-scroll clock: floor markers now move at runner speed, furniture uses mid-depth parallax and walls/ceiling move slowly, so the office no longer appears detached from fast hazards.
- v1.21.0 also shrinks the rendered runner from 104 to 96 logical pixels and drives the six-frame run cycle from travelled visual distance, reducing the oversized / skating look while keeping the 44×66 collision body unchanged.
- the v1.20 LOW/HIGH pickup gate experiment is removed from active gameplay; ordinary Coffee / Leave Slip / Risk Form pickups remain, avoiding floating route labels in the one-button runner.

- v1.21.1 normalizes first-jump / double-jump visual scale, aligns boss warning and collider timing with the real jump window, removes meeting-gate tutorial clutter, and deduplicates rare-event text overlays.

- v1.24.0 reconnects the previously produced office-runner art atlas: Boss patrol/rush, BUG normal/long/tall, request drops, urgent mail, coffee spills, dumbbells and the three temporary pickup types now render from tracked sprite crops.
- v1.24.0 keeps every existing collision rectangle, jump constant, route timing and encounter rule unchanged; the older Canvas hazard art remains only as an asset-load fallback.
- the meeting gate deliberately retains its wide safe-gap presentation because a narrow door sprite would visually contradict the existing collision geometry.
- v1.26.5 keeps the unified v1.26.4 world floor and raises active-play readability: desktop HUD/ticker/toasts are larger, fullscreen uses scale-aware 16–19px UI text, portrait mobile rises to 10–11px, and canvas warnings/floaters are enlarged without changing physics or collision geometry.
- the new 4×4 hero atlas and 2×2 scene atlas record their source title and SHA-256 in manifests, while the 44×66 physics body, hitboxes, jump timing, three-strike buffer, cadence and endings remain unchanged.
- v1.22.0 gives the four office scenes independent sixteen-bar A/B 8-bit themes with alternate full-phrase variations, keeps half-scene music continuous, and turns the final ten minutes into a Gym-theme reprise rather than another unrelated loop.
- v1.22.0 fixes English-mode Space input by releasing language-button focus and prioritizing gameplay jump keys while running; the English desktop menu is separately compacted instead of inheriting Chinese line lengths.
- v1.22.0 fixes fresh-browser audio defaults to the music-forward 42% music / 72% SFX, removes the compact double-jump sprite from runtime pose selection, and prevents the final exit hint from overlapping the older Gym-half message.

The former v1.11.5 slice/patch/build chain remains in the repository archive only and is not included in this deployment bundle.

The deployer verifies checksums, canonical v1.26.5 fingerprints, viewport-fit guards, language ownership and the accepted gameplay-quality markers before activation. Failures after switching current trigger rollback.
