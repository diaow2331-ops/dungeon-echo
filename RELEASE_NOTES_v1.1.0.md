# Dungeon Echo v1.1.0 — Art, Town, Guardian & Skill Evolution Remaster

**v1.1.0 is publicly deployed at `https://play.91hwl.cn/dungeon-echo/`.**

The release keeps the existing `de-run-v6` version-2 run save and `de-greedy-meta-v1` town save intact. No progress reset is required.

## Art remaster

- Four production hero sprites now appear in the dungeon.
- Sixteen common monster archetypes use a consistent high-detail atlas.
- All nine ten-floor guardians use bespoke silhouettes.
- The floor-100 End-Abyss Sovereign has unique final-boss art.
- Town presentation evolves across ten progression stages.
- Equipment/loot presentation is unified across weapons, armor, helmets, boots, rings and amulets.
- Swords, broad swords, axes, rune blades, daggers, bows and staves have distinct equipment silhouettes.
- Leather, chain, plate and mithril armor are visually distinct rather than sharing one generic treatment.
- New art paths retain runtime fallbacks so an individual asset failure does not block play.

## Town remaster

- New refuge backdrop with progression overlays.
- Town stages 1–10 add lanterns, residents, banners and deep-echo effects as conquered depth increases.
- A growth/readiness panel summarizes progression and preparation state.
- The fortune wheel remains optional entertainment; stash, market, forge and checkpoints remain the main preparation loop.

## Guardian encounter remaster

The ten guardian/finale nodes now use readable counterplay instead of relying primarily on larger stats and generic trait combinations.

- **10 — Telegraphed Armor Break**
- **20 — Frost Ring**
- **30 — Ember Mark**
- **40 — Hunter Line**
- **50 — Mending Channel**
- **60 — Blood Tether**
- **70 — Rupture Cross**
- **80 — Arcane Strip**
- **90 — Echo Trial**
- **100 — End-Abyss Sovereign**, with three HP-driven phases

New specials reserve the guardian's next normal action, preventing hidden normal-hit + special double spikes.

Detailed counterplay is documented in `docs/GUARDIAN_MECHANICS.md`.

## Skill evolution

Floors **20 / 40 / 60 / 80** each unlock a two-choice active-skill evolution.

- The active-skill key remains **`C`**.
- Warrior routes alter Cleave area, reach, protection, cooldown rhythm and sustain.
- Ranger routes alter Dash retaliation risk, mobility, kill chains and follow-up pressure.
- Arcanist routes alter Arcane Bolt secondary targeting, isolated-target focus, protection and push control.
- Assassin routes alter execution pressure, entry safety, kill sustain/cooldown and follow-up pressure.
- Choices use the existing `player.talents` storage path; no save-schema bump is required.

Detailed route intent is documented in `docs/SKILL_EVOLUTION.md`.

## Validation

Recorded engineering contracts for the v1.1 line include:

- production entry: **29/29**;
- deterministic floor 1→100 chain: **13/13**;
- broad gameplay/save suite: **525/525**;
- release contract: **11/11**;
- guardian state-machine contract: **37/37**;
- skill-evolution contract: **9/9**;
- site overlay deployment: **PASS**;
- homepage/detail deployment: **PASS**;
- public v1.1 health checks: **PASS**.

Automated checks protect engineering contracts; human play remains the source of truth for feel, pacing and balance.

## Compatibility

- Existing run/meta save keys and schema versions remain unchanged.
- Art/UI hotfixes do not clear browser `localStorage`.
- Item IDs, equipment stats, affixes and economy semantics remain stable across the visual equipment pass.
- Public URLs are unchanged.
- The existing shared `/srv/91hwl-play` immutable-release/rollback model remains the deployment contract.

## Post-v1.1 priorities

- representative all-four-class 1→100 human audit;
- deeper town-service progression;
- Boss/equipment/skill VFX and audio feedback;
- continued economy and long-run balance review from real-player evidence;
- repository/branch hygiene so current documentation stays aligned with the deployed product.
