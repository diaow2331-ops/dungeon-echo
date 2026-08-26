# Dungeon Echo v1.2.2 — Final Game Polish

v1.2.2 is the final gameplay/UX polish release before repository and 91hwl.cn governance become the primary workstreams.

It keeps the v1.2 combat, mana, economy, save schema and 1→100 content intact. This patch focuses on language stability, character/loot presentation and forge feedback.

## Stable Chinese / English sessions

Human testing of v1.2.1 showed that the old layered localization architecture could still stall the page. Multiple full-page observers and polling followers were reacting to the same continuously changing HUD and Adventure Log.

v1.2.2 retires that production chain.

- `i18n.js`, `i18n-runtime.js`, `i18n-content.js` and `ux-hotfix-v121.js` are no longer loaded or shipped by the production release manifest.
- `locale-runtime-v122.js` selects one locale per page load.
- 中文 / English selection lives on the title screen.
- Choosing another language persists the preference and reloads through `?lang=zh` / `?lang=en`.
- There is no whole-run live language hot switch.
- Dynamic translation is event-driven for newly rendered content and a few narrow status nodes; there is no locale polling loop and no global character-data observer.
- Canvas text localization is cached rather than re-translated every paint.
- Save/profile/item identities remain language-independent.

This also consolidates the high-frequency English display rules for equipment, common monsters/guardians, combat damage, Gold pickup, Mana feedback, forge copy, tutorial steps and standing hints.

## Character-art residual cleanup

The hero artwork is now the sole character-art owner in production.

Earlier presentation layers could still leave equipment-derived visuals around the hero: a rarity ellipse from the core renderer, geometric weapon/armor/helmet/charm accents, and v13 equipment imagery from the visual overlay. On camera-constrained viewports those overlay coordinates could visibly separate from the hero.

v1.2.2 ships `character-art-cleanup-v122.js` to quarantine those obsolete presentation paths:

- suppress the core equipment-rarity ellipse around the hero;
- suppress the legacy post-hero weapon/armor/helmet/charm geometry block;
- block v13 weapon/wearable atlas images from the character overlay canvas;
- suppress the obsolete ring and amulet character effects;
- preserve the hero sprite, class ambience, skill-ready presence, enemy effects, UI equipment art, town equipment art and ground-loot art.

This layer is presentation-only and does not mutate equipped items, stats, combat, saves or inventory state.

## Ground-loot presentation pass

The existing v13 equipment sprites remain authoritative. v1.2.2 adds a restrained world-presentation layer around visible loot:

- soft grounding shadow;
- subtle type/rarity aura;
- rarity-weighted ground ring;
- low-intensity pickup glint;
- reduced-motion support.

The effect only renders loot that is inside the current viewport, near the player and in line of sight. It does not reveal items through unexplored walls and does not modify item RNG, rarity, stats, pickup rules or drop rates.

Character equipment overlays remain suppressed; this pass does not put gear back on top of the hero artwork.

## Forge feedback pass

The canonical deterministic +1 → +5 forge ladder is unchanged. The existing +3 refinement and +5 masterwork systems are unchanged numerically.

The town forge now provides clearer feedback after the canonical result has already occurred:

- `+N → +N+1` success feedback;
- actual Gold spent;
- actual stat deltas;
- persistent `Forge +N/5` / `锻造 +N/5` stage labels in town rows;
- explicit +3 refinement-unlocked feedback;
- explicit refinement-path confirmation;
- explicit +5 masterwork-completed feedback.

The feedback layer only observes the canonical result. It does not write forge level, item stats or town Gold.

## Release verification improvement

The site health check no longer depends on a version string embedded in HTML copy. It validates the game HTML and the deployed `/dungeon-echo/VERSION` endpoint separately, while continuing to protect `/moyu/` and `/healthz`.

## Compatibility

- Existing `de-run-v6` version-2 run saves remain compatible.
- Existing `de-greedy-meta-v1` town/meta saves remain compatible.
- No migration or storage reset is required.
- Enemy/Boss numbers are unchanged from v1.2.1.
- Mana profiles are unchanged.
- Loot/economy/drop rates are unchanged.

## Validation note

No fresh complete GitHub Actions suite is claimed. The Actions quota remained unavailable on this release line. v1.2.2 is governed through narrow reviewable diffs, targeted static contracts, release-manifest checks and human browser testing; human play remains authoritative for feel and long-run balance.

## Deployment target

- Game: `https://play.91hwl.cn/dungeon-echo/`
- English: `https://play.91hwl.cn/dungeon-echo/?lang=en`
- Version: **1.2.2**
