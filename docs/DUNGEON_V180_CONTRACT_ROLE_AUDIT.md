# Dungeon Echo v1.8 — Expedition Contract Role Audit

Date: 2026-09-01
Branch: `feature/dungeon-v180-town-relic-sets`

## Goal

The three optional Greedy Expedition contracts must create different optimization targets instead of letting Elite Hunt dominate Gold, XP and named-relic collection at the same time.

Target roles:

- **Elite Hunt** — strongest Gold / elite-loot route.
- **Relic Sweep** — strongest named-relic / six-piece collection route.
- **Veteran Oath** — strongest XP / character-level progression route while permanent levels still have runway; it unlocks at town Tier 2 and becomes unavailable at the permanent level ceiling.
- **Free Expedition** — stable baseline with no additional risk or premium.

## Baseline defect

The previous v1.8 relic implementation made named relics depend on Epic/Legendary equipment generation. Elite Hunt raises elite density and elites guarantee higher-rarity equipment drops, so the Hunt contract indirectly produced more named relics even though that was not its design role.

A representative pre-fix Floor-80 sample showed approximately:

| Contract | Liquid value | Named relics / floor |
| --- | ---: | ---: |
| Free Expedition | 4590 | 0.99 |
| Elite Hunt | 5139 | 1.40 |
| Relic Sweep | 4702 | 1.00 |
| Veteran Oath | 4603 | 1.31 |

That made Elite Hunt a near-universal answer.

## Correction

`expedition-rules-v170.js` now owns a **+16 percentage-point named-relic discovery bonus** for Relic Sweep only.

The set authority composes three bounded terms when an Epic/Legendary item is generated:

1. rarity base chance;
2. Relic Hall construction bonus (0–9 percentage points);
3. Relic Sweep contract bonus (0 or 16 percentage points).

The current maximum Legendary named chance is **83%**, so even a fully developed Relic Hall plus Relic Sweep never guarantees a named relic.

The existing Relic Sweep costs remain intact:

- +1 trap per floor;
- higher chest density;
- higher echo-event density.

No “missing-piece guarantee” was added. The Relic Hall can still bias the *set* being researched, but the exact six-piece slot remains uniformly selected among the six authored pieces.

## Quantitative verification

### Per-item Epic+ named rate

A deterministic 5,000-item sample per contract after the change produced:

| Depth | Free | Elite Hunt | Relic Sweep | Veteran Oath |
| ---: | ---: | ---: | ---: | ---: |
| 20 | 30.24% | 30.78% | **45.38%** | 30.46% |
| 50 | 33.24% | 33.24% | **49.32%** | 32.82% |
| 80 | 36.74% | 35.14% | **50.76%** | 36.66% |
| 90 | 38.38% | 39.90% | **54.30%** | 38.44% |

Relic Sweep therefore owns a clear item-level collection premium without changing ordinary gear frequency.

### Floor-level collection proxy including chest equipment

A second simulation generated the normal floor, killed its generated monsters and counted equipment drops plus one Rare+ equipment roll for each generated chest. The averages below use 90 deterministic floor seeds:

| Depth | Free | Elite Hunt | Relic Sweep | Veteran Oath |
| ---: | ---: | ---: | ---: | ---: |
| 50 | 1.02 | 1.18 | **1.64** | 0.93 |
| 80 | 1.12 | 1.36 | **1.71** | 1.19 |
| 90 | 1.22 | 1.47 | **1.69** | 1.10 |

This is a proxy rather than a player-behavior simulation: it assumes every generated chest is opened. It is intentionally used only to compare contract reward direction, not completion time.

### Gold and XP roles

Separate floor sampling still shows:

- Elite Hunt has the highest liquid Gold + sale-value output because of higher elite density and explicit elite bounties.
- Veteran Oath has the highest generated XP despite Elite Hunt producing more elites. At Floors 80–90, sampled Oath XP was roughly 9.2k–11.0k versus Hunt at roughly 8.5k–10.2k.

No Gold premium was added to Relic Sweep and no named-relic premium was added to Veteran Oath. The later 1→100 closure audit moved Veteran Oath from town Tier 4 to Tier 2 because fresh characters normally reach the permanent Level-50 ceiling around Floor 28; at that ceiling the town disables the Oath instead of offering a risk-only contract.

## Authority boundary

- `game/domain/expedition/expedition-rules-v170.js` owns contract-specific risk and reward modifiers, including the Relic Sweep named-discovery premium.
- `game/domain/inventory/set-rules-v180.js` owns named-relic base rates, bounded bonus composition, set identity and six-piece selection.
- `game/core/game.js` consumes both authorities and remains the sole owner of RNG state, item creation, combat, rewards and persistence.

This keeps contract semantics and named-set semantics separate while giving each subsystem one authoritative owner.
