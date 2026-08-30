# 摸鱼到下班 · Clock Out Alive

Current release candidate: **v1.25.0**. Production route: `https://play.91hwl.cn/moyu/`.

## v1.25.0 authentic-art coherence

v1.25.0 reconnects the runner and all four office rooms to the already approved `办公室跑酷像素素材图集.png`; no new artwork is generated. A tracked 4×4 hero atlas preserves the existing 44×66 physics body while improving the idle, run, jump, fall, hurt and victory silhouettes. A separate tracked 2×2 backdrop atlas supplies Workstation, Meeting, Pantry and Gym scenes with a shared visual language.

The backdrop renderer adds only a readable collision runway and slow visual parallax. Jump gravity, hitboxes, route length, obstacle cadence, three-strike buffer and endings remain unchanged. Both manifests record the source title and SHA-256 so releases can verify provenance and exact bytes.

v1.12 starts from one production authority instead of rebuilding gameplay at release time:

- `game.js` — the only canonical gameplay runtime.
- `index.html` — final production shell; no build adapter rewrites it.
- `style.css` — stable base presentation.
- `visual-v1113.css` — accepted readability layer, retained as a static asset.
- `responsive-v1120.css` — viewport-first desktop/mobile presentation.
- `archive/v1.11.5/` — recovery evidence for the former 15-slice + patch + adapter chain. It is not a release input.

`ops/release/build-moyu-bundle.sh` now packages tracked canonical bytes directly. The bundled `game.js` is byte-for-byte identical to `moyu/game.js`; no patch command or runtime build adapter participates in v1.12 packaging.

## v1.12.0 P0 foundation

The gameplay rules remain the accepted v1.11.5 rules: 14:00 → 18:00, Jump / Double Jump, existing obstacle weights, hitboxes, rewards, discoveries, endings and local saves.

The display contract changes. `fitGameFrameToViewport()` measures the real visual viewport and the frame's current top position, then caps the rendered frame width so the complete game frame fits above the fold on ordinary desktop browser windows. Canvas backing pixels are still transformed to the fixed logical `1200 × 620` world, so CSS sizing does not change collision or physics coordinates.

On portrait phones the page uses nearly the full safe width for the frame, keeps the 1200:620 ratio, and shows a short landscape/fullscreen hint. Fullscreen remains optional; the core game is still playable with one tap action in portrait.

## v1.12.1 P1 first gameplay layer

v1.12.1 keeps Jump / Double Jump as the only required action while giving each office segment a more distinct judgement:

- **Workstation:** boss spot-check rushes belong to this scene, so preserving the second jump matters when the warning fires.
- **Meeting:** later meeting gates drift vertically by a small readable amount instead of presenting one fixed opening.
- **Pantry:** high-route risk forms appear more often, creating an explicit choice between a safe line and a higher-scoring line.
- **Gym:** dumbbells can bounce, so the landing point itself becomes part of the read.

Two temporary pickups join Coffee without adding permanent progression. A green **Leave Slip** absorbs one collision for eight seconds but drops the current Combo; a gold **Risk Form** lasts seven seconds and doubles near-miss bonuses. Coffee remains the simple +35m option.

Near-miss now has two score tiers: a normal close pass and a tighter **Perfect Near Miss**. Risk Form doubles only the near-miss component, so the fastest score route asks the player to deliberately take a harder line rather than collect an automatic upgrade.

Top-run history / richer run summary and Daily Shift remain separate follow-up work. No equipment, levels or permanent stat grind are introduced.


## v1.12.2 local run ledger

v1.12.2 adds replay feedback without adding progression power. Every completed run now writes a compact local Run Summary and feeds a Top 5 history ranked by score, then peak Combo, Perfect near-misses and total near-misses. The history is browser-local and requires no account.

The summary records outcome / cause, clock and scene, score distance, peak Combo, near-miss count, Perfect count and discoveries unlocked during that run. Game-over and both 18:00 endings also surface the run's peak Combo and near-miss line immediately in the result card.

This is the planned P1 replay-value step before any Daily Shift experiment.
## v1.13.0 playfield-first presentation

v1.13.0 is a presentation/game-feel pass rather than another feature bundle. During active runs the mission brochure, route strip, record panels and non-actionable HUD chips get out of the way; the playfield moves closer to the top of the viewport and the remaining score / Combo / scene / clock HUD is compact enough to stop covering hazards.

The start screen is now a left-weighted launch panel on desktop so the office itself remains visible before play. Scene transition copy no longer duplicates the same stage label in several places, the first-run tutorial is reduced to a small lower-edge hint, and the player visual is 10% larger without changing the 44×66 physics body or hitbox. Portrait mobile hides brochure chrome and redundant live text, leaving only the core HUD plus a rotate/fullscreen hint.

All v1.12.x gameplay systems remain intact: Daily Shift, scene-specific hazards, temporary risk pickups, near-miss scoring, two endings and local run history.

## v1.12.3 Daily Shift

v1.12.3 adds an optional local **Daily Shift** without changing the normal random mode. Enabling it fixes gameplay-affecting randomness to the player’s local calendar date, so obstacle order, spacing, pickups, office events and rare gameplay moments are reproducible for that day while cosmetic particles remain free to vary.

Each date also selects one office modifier: **Meeting Marathon** raises meeting pressure, **Buggy Build** raises BUG pressure, or **Coffee Shortage** reduces pickup opportunities. Daily runs are marked in Last Run / Top 5 with their date and modifier. There is no login, streak reward or permanent stat bonus.



## v1.24.0 original-art coherence + readable temporary buffs

v1.24.0 keeps the four-minute route and forgiving three-strike loop, but replaces the temporary Canvas redraws with compact runtime crops from the original high-resolution Moyu office-runner art board. Boss patrol/rush, BUG normal/tall/long, request drops, urgent mail, coffee spills, dumbbells, meeting-door identity art and Coffee / Risk Form / Leave Slip pickups now share the same source artwork. Boss and BUG telegraphs are longer, request landing warnings are clearer, pickup collection is slightly more forgiving, and active temporary buffs remain visible in the HUD.

## v1.23.0 reused office art atlas

v1.23.0 reconnects the previously produced office-runner art atlas to the live game instead of redrawing the hazards. Boss patrol/rush, all three BUG silhouettes, last-minute request drops, urgent mail, coffee spills, dumbbells, Coffee, Leave Slip and Risk Form now use compact sprite crops derived from the earlier accepted office art sheet. The runtime atlas is a tracked static asset; no image generation or release-time art reconstruction is involved.

Gameplay geometry remains authoritative: the 44×66 runner body, obstacle hitboxes, mutation sizes, jump physics, four-minute route, three-strike buffer, encounter cadence and endings are unchanged. The former Canvas hazard renderers remain only as an asset-load fallback, so a failed sprite request cannot make the game unplayable. The meeting gate keeps its existing readable safe-gap presentation for now because replacing that wide gameplay geometry with a narrow door sprite would misrepresent the collision space.

## v1.22.0 four-room soundtrack suite

v1.22.0 replaces the former 16-step shared chiptune hook with four independent sixteen-bar A/B scores: **Workstation / Afternoon Drift**, **Meeting / Quiet Daydream**, **Pantry / Coffee Refill**, and **Gym / Clock-out Sprint**. Each room owns its own melody, harmony, bass motion, arpeggio direction and drum pattern. Each A/B score runs roughly 32–40 seconds before its melody returns, while the next full pass flips arpeggio direction and cadence so the exact texture does not repeat for roughly 64–80 seconds—long enough to cover a full room instead of repeating every few seconds. Scene-half changes now continue the current score with a small tempo/arrangement lift rather than restarting bar one; the final ten minutes are a faster reprise of the Gym theme.

The English presentation is also treated as its own composition: the desktop menu uses a wider, shorter card with a single-line title and tighter copy, HUD labels are shortened, and gameplay jump keys now take priority after UI-button interaction so Space can no longer reactivate the language toggle.

The pass also fixes fresh-browser audio defaults: an absent saved volume is no longer parsed as numeric zero, so the first explicit sound enable correctly starts at the new music-forward 42% music / 72% SFX mix. The compact double-jump atlas frame is removed from runtime pose selection entirely; first and second jumps share the same airborne silhouette while the existing air-burst effect communicates the second impulse. The final-ten-minute exit hint also replaces the older Gym half-stage text instead of overlapping it.

## v1.21.1 play-readability polish

v1.21.1 is a targeted player-facing cleanup after reviewing the live v1.21 run frame by frame. The compact double-jump sprite is now only a brief impulse pose, then returns to the same airborne silhouette scale as the first jump; the compact frame receives horizontal-only compensation so the character does not appear to shrink between jump stages. Boss spot-check warning timing now arrives near the real reaction window instead of far ahead of it, the boss collision silhouette is slightly inset, and the coach copy no longer tells players to jump too early.

The first meeting gate keeps its readable safe opening but drops the oversized diagonal tutorial line and embedded instructions. Rare office moments now use the event HUD plus ticker as their text channel instead of stacking duplicate discovery floaters over the playfield. Core physics, the three-strike loop, four-minute route, Daily Shift, endings and v1.21 motion-coherence model remain unchanged.

## v1.21.0 motion coherence pass

v1.21.0 focuses on why the runner still felt visually strange after the v1.18–v1.20 rule changes. The four-minute route uses a deliberately slow progression distance, but the office background had been scrolling from that same progression variable while hazards moved in physical canvas pixels. At 14:00, hazards crossed the screen at roughly 350 px/s while the ground texture moved only around 40–50 px/s. The result looked like skating: the runner and hazards moved in one world while the office floor and furniture belonged to another.

A separate `visualScrollPx` now accumulates actual `speed × dt`. Floor markers travel at physical runner speed, tile seams use near-ground parallax, furniture uses mid-depth parallax, and wall/ceiling structures use slow far-depth parallax. Route progress, clock timing, spawn pacing and collision geometry still use the existing four-minute progression model. The hero render is reduced from 104 to 96 logical pixels and its six-frame running cycle is advanced by visual travel distance rather than wall-clock FPS, so gait cadence follows speed changes instead of sliding over the floor.

The v1.20 LOW/HIGH pickup-pair experiment is intentionally removed from active play. In a one-button runner the floating lane labels read like debug UI rather than an organic office decision, and they competed with hazard readability. Coffee, Leave Slip and Risk Form remain as ordinary pickups. The opening safety rules are also moved from four-minute route-distance thresholds to real run time, and the first jump arc is lengthened slightly (lower gravity, similar peak height) so a visually reasonable reaction to a ground BUG does not land the runner on the obstacle's trailing edge.

## v1.20.0 route-choice pass

v1.20.0 turns pickups from mostly opportunistic bonuses into a small route decision. Once per office scene, the run exposes a paired LOW/HIGH pickup gate during a readable window: staying grounded claims the low option, while jumping takes the high option, and choosing one immediately removes the other. The pair changes by room so safety, score and utility compete without adding a new button or menu. Ordinary random pickups remain, the four-minute cadence stays intact, Daily Shift remains deterministic, and the choice gate never spawns while a fresh hazard is entering the screen.

## v1.19.0 four-minute cadence pass

v1.19.0 retunes encounter density around the actual ~4 minute route instead of continuously feeding hazards at the older short-run cadence. Normal hazards now arrive in short 3–5 obstacle phrases with guaranteed breathing beats, each room has its own curated two-to-three-hazard phrase vocabulary, scene/half-scene transitions reserve extra read time, and later scenes tighten without returning to constant input spam. A clean 10-obstacle Combo can recover one previously lost mistake buffer once per scene, turning the existing Combo system into a survival reward as well as score. Physics, the 3-strike cap, route length and endings remain unchanged.

## v1.18.0 forgiving run loop

v1.18.0 changes the normal run from one-touch failure to a three-strike structure. The first two ordinary collisions clear Combo, consume one visible buffer point and grant 1.15 seconds of recovery invulnerability; the third collision ends the run. Leave Slip still absorbs a collision before the mistake buffer is consumed. Last Run and Top 5 records now include mistake count.

The first minutes also ramp more deliberately: the opening hazard is a non-mutating BUG, early clear gaps are wider, BUG mutation is held back briefly, and workstation Boss rush behavior cannot trigger immediately. The goal is to let a new player establish the single-jump / double-jump rhythm before the director begins combining mechanics.

The centered v1.17.0 menu presentation is retained. Physics body, jump velocities, four-minute route length, endings, scene order, Daily Shift seed behavior, audio system and existing local saves remain compatible.

## v1.17.0 portrait focus pass

v1.17.0 expands the 390×844 portrait playfield from the former 322px cap to a viewport-responsive 54svh surface capped at 440px. The canvas remains the same 1200×620 logical world, fills the taller frame without distortion, and shifts its crop slightly left so the runner sits closer to the edge and retains useful forward reaction distance. Desktop geometry, physics, hitboxes, pacing, controls and saved progress are unchanged.

## v1.16.1 run-cycle continuity patch

v1.16.1 changes only the six-frame grounded run ordering from `2,3,4,5,6,7` to `2,3,6,5,7,4`. The reviewed sprite sheet bytes, frame count, animation FPS, 104px visual size, 44×66 physics body, hitbox and movement rules are unchanged. The new ordering reduces the largest pose jumps in the loop and makes the stride read more continuously.

## v1.16.0 four-minute scene-life pass

v1.16.0 shortens the normal 14:00→18:00 route from roughly 6.6 minutes to about four minutes by moving route progression to `RUN_PROGRESS_SCALE=.020`. Obstacle pixel speed, jump velocity, collision geometry, the 2200 logical route and ending rules remain unchanged.

Each scene also gains a visual-only motion identity: workstation monitor activity, meeting projector/screen light, pantry coffee steam/machine activity and gym treadmill/mirror motion. These layers stay behind gameplay hazards and do not create fake collision objects.

## v1.15.0 experience pass

v1.15.0 addresses the remaining whole-game roughness rather than adding another mechanic. Portrait phones now use a cropped camera-style presentation of the unchanged 1200×620 logical world, increasing the active run view from roughly 382×197 to 382×318 displayed pixels while preserving physics and collision coordinates. The opening screen also drops brochure/archive panels so the playfield becomes the product immediately.

The hero visual grows from 92 to 104 display pixels without changing its 44×66 body. Running scenes gain restrained far/near motion planes and edge depth so the office reads as moving space instead of a static illustration. Desktop menu hierarchy is simplified at the same time.

## v1.14.1 hazard art pass

v1.14.1 closes the visual gap left by the hero sprite release without altering gameplay geometry. Boss, BUG, temporary-request drops, mail, coffee spills and dumbbells now use richer side-view office silhouettes, state cues and restrained motion while their original obstacle widths, heights, collision rectangles, rush/mutation/drop logic and timing remain authoritative.

The hero also uses its dedicated jump-start cell during the first takeoff frames; the underlying jump velocity and physics are unchanged. Meeting gates remain deliberately geometry-first because their readable opening is the mechanic.

## v1.14.0 sprite art pass

v1.14.0 replaces the production runner body with a tracked 4×4 transparent sprite sheet while keeping the accepted 44×66 physics body, hitbox, jump arc and route timing unchanged. The runtime selects idle, six-frame run, jump, double-jump, fall, landing, hurt and victory poses from gameplay state, anchors the visual to the authoritative player foot position and retains the former vector renderer as a load-failure fallback.

The sprite PNG and its frame manifest are release inputs with checksum and bundle-integrity gates, so production cannot silently ship a different art asset than the reviewed source. This is the first asset-backed art pass; boss and obstacle art remain a follow-up rather than being mixed into the same release.

## v1.13.1 game-feel pass

v1.13.1 keeps the v1.13.0 Playfield First layout and focuses on moment-to-moment feedback. Perfect Near Miss now produces a short burst, flash and layered cue; every fifth Combo produces a compact Flow milestone; the Combo HUD exposes its remaining lifetime instead of dropping without warning.

Ground takeoff, double jump and hard landing now have separate visual signatures without changing the 44×66 collision body. Boss spot-check rushes use a slightly longer readable warning and edge alert before acceleration. Combo 5+ also enables a subtle Flow motion layer so strong runs feel visibly different without adding permanent stats or a new control. The runner itself is now drawn as a right-facing 3/4 profile: the grounded gait uses opposing arm/leg motion around the hips and shoulders, while airborne posture blends continuously from ascent to tuck to landing preparation based on vertical velocity instead of snapping between front-facing puppet poses.

