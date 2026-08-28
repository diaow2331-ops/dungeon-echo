# Dungeon Echo v1.2.0 — Controls, Mana, Mobile & Bilingual Release

Dungeon Echo v1.2.0 is the second substantial public release after v1.1.0. It keeps the existing `de-run-v6` version-2 run save and `de-greedy-meta-v1` town/meta save intact; no progress reset or migration is required.

## J / K combat and class mana

v1.2.0 makes combat input explicit instead of relying on movement to double as attack input:

- **J** attacks in the current facing direction.
- **K** uses the active class skill.
- Walking into an adjacent enemy no longer serves as the primary attack command.
- Ranged classes preserve line-of-sight ranged attacks through the J attack path.
- Core J/K + mana controls load synchronously before the page can accept normal gameplay input.

Each class now has its own mana economy:

- Warrior — 60 max / 30 skill cost.
- Ranger — 70 max / 32 skill cost.
- Arcanist — 100 max / 42 skill cost.
- Assassin — 65 max / 34 skill cost.

Mana recovers through turns, attacks and deliberate wait/focus play. Real mana mutations are committed through the existing run-save path, so refreshing cannot restore a pre-cost or pre-recovery snapshot.

## Chinese / English localization

v1.2.0 adds a reversible bilingual presentation layer without changing gameplay IDs or save identities:

- `?lang=en` opens the English presentation directly.
- `?lang=zh` opens Chinese directly.
- First visit can follow browser language.
- Manual switching is persisted locally.
- Shell/HUD, class presentation, controls, help, onboarding, sound settings and accessibility follow one language owner.
- Equipment names/stats, monsters, guardians/finale, themes, town commerce, forging/refinement and high-value combat text are translated through a display-only content layer.
- Dynamic audio status is bilingual, including `⚙ Muted` / `⚙ 静音`.

The translation layer does not mutate item IDs, monster IDs, profile IDs or persistent save objects.

## Mobile-first controls and onboarding

The mobile experience is no longer a scaled desktop fallback:

- portrait and landscape layouts use dedicated thumb zones;
- the left D-pad owns movement/facing;
- Attack and Skill are promoted as primary right-thumb actions;
- holding a direction continues walking;
- supported devices receive lightweight haptic feedback;
- low-priority HUD controls compress on smaller screens;
- contextual onboarding uses mobile-specific wording;
- the onboarding strip clears the bottom action deck in portrait and the right-side action deck in landscape.

## Adaptive audio and reliable mobile resume

- Procedural scene music covers title, town, dungeon, deep dungeon, guardians and the final boss.
- Music and SFX have independent persistent **0–100%** controls.
- Recommended default mix is **30 Music / 85 SFX**.
- Keyboard **M** and the mobile Sound control use the same persisted master mute.
- WebAudio resume handling remains available after the first unlock so mobile Safari/Chrome can recover after backgrounding or interruption.
- Returning to the foreground triggers a best-effort resume; the next user gesture remains the policy-compatible fallback.

Core game SFX continue to connect to `AudioContext.destination` at play time, and the audio director intercepts those destination connections through the shared mixer bus, so legacy SFX remain governed by the SFX volume control.

## Human-play pressure follow-up

v1.2.0 adds a deliberately mild late-game pressure layer after the larger v1.1 human-play rebalance:

- floors **1–20 are unchanged**;
- ordinary enemy ATK ramps gradually to at most about **+8%** by floor 100;
- elites receive an additional **+3%** attack follow-up;
- guardians/finale receive only a small late basic-attack increase, roughly **5–6%**;
- no enemy HP increase is introduced by this layer;
- no hidden random armor penetration returns;
- loot rates, potion economy, shop economy and save schema are unchanged.

Readable telegraphs and movement counterplay remain the difficulty contract.

## Equipment presentation fixes

- Ground equipment resolves the real map item and uses the tier-specific v13 weapon/wearable atlas.
- Production handling recognizes the v12 loot-atlas bridge used by the live route.
- Old geometric character-equipment paint and later equipment-image overlays are suppressed so gear does not cover or deform the authoritative hero atlas.

## Production ownership and failure isolation

Release-line governance was tightened so gameplay-critical layers do not depend on late presentation boot timing:

- `combat-controls.js` loads synchronously after desktop/gamepad controls.
- `challenge-pressure.js` loads synchronously as the final gameplay/balance layer.
- `runtime-bootstrap.js` owns only late presentation followers: language runtime/content, onboarding, audio and mobile UX.
- an optional presentation-layer failure is bounded and does not intentionally prevent later presentation followers from attempting to start.
- all production modules remain explicitly listed in `ops/release/static-files.txt`.

## Compatibility

- `de-run-v6` run save remains version 2.
- `de-greedy-meta-v1` remains the town/meta save key.
- No item/profile identity migration.
- No browser storage reset.
- Public game and project URLs remain unchanged.

## Validation note

The repository contains focused static regression contracts for production entry ownership, J/K + mana, mana persistence, mobile audio resume/mute, bilingual audio status, onboarding clearance, gameplay content localization, challenge pressure and release boundaries.

GitHub Actions quota was exhausted during this release line, so the v1.2.0 freeze does **not** claim a fresh complete Actions suite. Changes were kept as focused reviewable diffs and targeted contracts. Human play remains the source of truth for combat feel and long-run balance.

## Deployment target

- Game: `https://play.91hwl.cn/dungeon-echo/`
- English: `https://play.91hwl.cn/dungeon-echo/?lang=en`
- Project page: `https://91hwl.cn/toys/dungeon-echo/`
- Version: **1.2.0**

The release is considered publicly deployed only after the file-upload activation path reports the site/home health PASS markers and the public endpoint shows v1.2.0.
