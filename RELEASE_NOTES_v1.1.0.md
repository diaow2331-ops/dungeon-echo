# Dungeon Echo v1.1.0 — Art, Town & Guardian Remaster

Dungeon Echo v1.1.0 keeps the existing `de-run-v6` version-2 run save and `de-greedy-meta-v1` town save intact. No migration or progress reset is required.

## Art remaster

- Four production hero sprites now appear in the dungeon instead of sharing the small procedural presentation.
- Equipped weapon, armor, helmet and jewelry visibly change the hero's combat accents and rarity aura.
- Sixteen common monster archetypes receive a consistent high-detail atlas while uncovered archetypes retain a safe procedural fallback.
- All nine ten-floor guardians use bespoke silhouettes; the floor-100 End-Abyss Sovereign has its own final-boss art.
- Every external image path has a runtime fallback so a failed or slow asset request cannot block play.

## Town remaster

- The town uses a new painted refuge backdrop with animated fire and progression overlays.
- Town stages 1–10 visibly add lanterns, residents, banners and deep-echo effects as conquered depth increases.
- A compact growth panel explains the next expansion threshold, current supply readiness and the core town facilities.
- The fortune wheel is presented as optional entertainment rather than a progression pillar; stash, market, forge and conquered checkpoints remain the main preparation loop.

## Guardian encounter remaster

The ten guardian/finale nodes now use readable counterplay instead of relying primarily on larger stat lines and generic trait combinations.

- **Floor 10 — telegraphed armor break:** the heavy strike visibly charges for one turn and can be avoided by breaking its attack condition.
- **Floor 20 — Frost Ring:** leave the guardian's radius-2 warning area before the next turn.
- **Floor 30 — Ember Mark:** leave the marked tile rather than greed another stationary attack.
- **Floor 40 — Hunter Line:** sidestep the locked row/column, leave range, or use terrain to break the shot.
- **Floor 50 — Mending Channel:** damage the guardian during the tell to interrupt a 15% max-HP heal.
- **Floor 60 — Blood Tether:** reach distance four or greater before the drain resolves.
- **Floor 70 — Rupture Cross:** step off the guardian's short horizontal/vertical blast lanes.
- **Floor 80 — Arcane Strip:** move perpendicular to the highlighted five-tile barrage line.
- **Floor 90 — Echo Trial:** survive a fixed mark → line → close-blast sequence using previously learned counterplay.
- **Floor 100 — End-Abyss Sovereign:** a three-phase fight changes at 66% and 33% HP: Throne Mark → Void Line → Heart Nova.

Every new special reserves the guardian's next normal action. The encounter system does not create a hidden normal-hit + special double spike in the same turn.

Detailed tells and counterplay are documented in `docs/GUARDIAN_MECHANICS.md`.

## Validation

The v1.1 art/town change set previously reported:

- production entry: **29/29**;
- deterministic floor 1→100 victory chain: **13/13**;
- broad gameplay/save regression suite: **525/525**;
- release contract: **11/11**;
- site overlay deploy contract: **PASS**;
- homepage mount contract: **PASS**.

The later guardian state-machine pass adds a focused deterministic contract of **37/37** covering content rules, warning-turn reservation/restoration, evade/hit paths, healing interruption, distance breaks, floor-90 sequence order and all three floor-100 phase transitions.

These automated checks are engineering evidence, not a replacement for an all-four-class human-play pass. Boss cadence, arena geometry and build-specific difficulty remain part of the v1.1 release acceptance process.

## Compatibility and deployment

- Existing run/meta save schema versions remain unchanged.
- Public URLs and the existing shared `/srv/91hwl-play` overlay deployment model are unchanged.
- The intended upload package remains `91hwl-play-dungeon-echo-v1.1.0.zip`; the homepage version card is updated by the separate `91hwl-home-dungeon-echo-v1.1.0.zip` package.
- v1.1.0 is considered publicly deployed only after the rollback-capable deployment and public health checks succeed.

## Remaining post-v1.1 priorities

- all-four-class human 1→100 / guardian validation;
- milestone active-skill evolution;
- deeper town-service progression;
- Boss/equipment VFX and audio feedback;
- continued economy and long-run balance review from real-player evidence.
