# Dungeon Echo v1.2.10

Dungeon Echo v1.2.10 is the final pre-publication quality release paired with Clock Out Alive v1.11.5.

## Player-facing changes

- Desktop one-shot actions are now edge-triggered: holding J/K/Q/E/T/Space/Esc/M/F/R/Enter no longer repeats tactical or toggle actions through OS key repeat. WASD and arrow movement still repeat normally.
- Mid-width PC/laptop windows (901–1180px) no longer squeeze the 40×28 dungeon beside a fixed 300px sidebar. The dungeon moves above a two-column bag/log area while large desktop and existing mobile layouts remain unchanged.
- Portrait touch layouts keep secondary action targets at a minimum 44px and Attack/Skill at 52px.

## Preserved contracts

- 1→100 progression, difficulty, rewards, equipment, art and save namespaces are unchanged.
- Return Scroll keeps the existing arming → ready → completing state machine.
- Chinese and English remain fixed routes on the same gameplay/save graph.
- Runtime ownership remains v13; only the immutable public cache generation advances from 153 to 154.

## Release packaging

The repository source entries remain on the accepted generation-153 direct references. `ops/release/build-site-bundle.sh` deterministically rewrites both packaged zh/en entries to cache generation 154, so existing browsers cannot reuse stale production/input bootstrap assets. The immutable bundle includes `responsive-final-v154.js`, the v1.2.10 release stamp and exact SHA256 manifests.

Validation is targeted and deterministic: `test/release.cjs` now builds the Dungeon bundle and inspects both packaged entries for generation 154 plus the responsive owner; the v1.2 release-freeze contract validates the semantic version/release stamp boundary. GitHub Actions are not treated as release evidence when no workflow/status result exists.

## Publication gate

After deployment, the remaining human acceptance is intentionally narrow:

- PC: large desktop plus a 901–1180px window, keyboard J/K/T/Enter/Esc and no double actions.
- Mobile: portrait/landscape touch, safe access to Attack/Skill/Potion/Return/Descend and no accidental repeat.
- English: no obvious CJK leakage in title, HUD, combat, equipment, town, pause, death and victory.
- Shared save continuity across `/dungeon-echo/` and `/dungeon-echo/en/`.
- Repeated Return Scroll T×2 does not freeze or consume twice.

No broad architecture, art or balance rewrite is part of this release.
