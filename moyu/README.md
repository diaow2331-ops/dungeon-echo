# 摸鱼到下班 · Clock Out Alive

Current release candidate: **v1.13.0**. Production route: `https://play.91hwl.cn/moyu/`.

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
