# Dungeon Echo v1.8 — Named Relic Identity Audit

Date: 2026-09-01
Branch: `feature/dungeon-v180-town-relic-sets`

## Audit question
Does the 36-piece named-relic catalogue feel like authored equipment worth collecting, or like ordinary stat bundles with better labels?

## Findings

### 1. Piece identity was already materially improved
All six sets own a story, every one of the 36 pieces owns an individual name and lore fragment, and named relics carry at most one random secondary affix. This is the correct foundation and remains unchanged.

### 2. The complete-set reward was too generic
Before this pass, all six 6/6 rewards collapsed back into generic numeric outcomes: kill healing, potion power or critical power. Three late sets ended in critical-power bonuses and two sets ended in kill healing. That weakened the reason to remember *which* six-piece set had been completed.

The 6/6 tier now carries one distinct gameplay capstone per set, all routed through the already-canonical equipment mechanic engine:
- Ashen Watch → after Wait, next direct enemy hit -50%.
- Drowned Bell Company → Potion clears Grievous immediately.
- Star-Hunter Oath → after class skill, next basic attack next turn +40%.
- Rust-Bell Saints → Wait restores 2 additional skill-cooldown turns.
- Void Court → basic-attack kill refunds 2 additional skill-cooldown turns.
- Shattered Moon Rite → after class skill, next direct enemy hit -40%.

The 2/6 and 4/6 bonuses remain bounded stat/build nudges. The distinctive playstyle change is reserved for all six specified pieces.

### 3. Ordinary slot scarcity leaked into set collection
Ordinary loot intentionally uses a 30/25/15/15/10/5 weapon/armor/helmet/boots/ring/amulet mix. Applying that distribution to a six-piece named set made the amulet an accidental 5% bottleneck and the weapon six times as common.

Named relics now use an equal six-way authored-piece selection *after* a named relic is rolled. Ordinary loot distribution is untouched.

### 4. Same-floor named identity had insufficient entropy
The earlier named hash depended on run seed, floor, slot, rarity, base and class. Multiple drops with the same coarse tuple could repeatedly resolve to the same set/piece. A 12,000-item Legendary probe at Floor 80 exposed severe slot collapse before the fix.

The generator now reuses the already-consumed initial slot roll as per-drop entropy. It consumes **no additional gameplay RNG** and therefore does not shift the downstream random sequence merely because named relics exist.

Post-fix probe, 12,000 Legendary-equivalent generated items at Floor 80:
- 6,938 named relics.
- weapon 17.0%
- armor 17.0%
- helmet 16.6%
- boots 16.0%
- ring 17.1%
- amulet 16.3%

This is close to the intended one-sixth distribution.

### 5. Tooltip hierarchy still let the affix compete with identity
Named relic tooltip hierarchy now reads:
1. fixed piece name;
2. set identity and equipped count;
3. the piece's lore;
4. fixed relic signature;
5. 2/4/6 set path, with the 6/6 capstone visibly distinguished;
6. total item stats;
7. at most one visually subdued secondary affix.

The random affix remains useful, but it is no longer presented as if it were equally important to the authored relic.

## Authority / compatibility
- `set-rules-v180.js` owns set identity, lore, signatures, equal named-piece selection, threshold bonuses and capstone mapping.
- `game.js` owns RNG state, item construction, live mechanic consumption, equipment state and UI.
- The capstones reuse existing canonical mechanic behaviors instead of creating six parallel combat systems.
- Storage epoch remains `v130`; no new persistent relic schema is required.
