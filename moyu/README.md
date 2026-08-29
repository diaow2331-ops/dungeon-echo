# 摸鱼到下班 · Clock Out Alive

Current release candidate: **v1.12.1**. Production route: `https://play.91hwl.cn/moyu/`.

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
