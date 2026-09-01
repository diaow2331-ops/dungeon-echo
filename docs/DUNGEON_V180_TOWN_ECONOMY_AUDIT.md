# Dungeon Echo v1.8 — Town Construction Economy Audit

Date: 2026-09-01  
Branch: `feature/dungeon-v180-town-relic-sets`

## Problem

The first v1.8 construction draft gave the four three-stage town projects a combined cost of only **4,970 G**. Runtime sampling showed that this was far below the Gold naturally produced by the dungeon at the same progression bands. As a result, town construction risked becoming an automatic button press as soon as a tier unlocked rather than a real competing use of banked expedition wealth.

A deterministic Free Expedition audit sampled 50 generated/cleared floors at each ten-floor band and counted carried Gold plus spawned Gold piles:

| Floor | Avg gross Gold | P25 | Median | P75 |
| ---: | ---: | ---: | ---: | ---: |
| 10 | 588 | 540 | 585 | 646 |
| 20 | 1,175 | 1,120 | 1,203 | 1,254 |
| 30 | 1,652 | 1,529 | 1,656 | 1,782 |
| 40 | 2,163 | 1,952 | 2,146 | 2,357 |
| 50 | 2,599 | 2,473 | 2,590 | 2,754 |
| 60 | 3,056 | 2,841 | 3,047 | 3,263 |
| 70 | 3,608 | 3,312 | 3,607 | 3,873 |
| 80 | 3,990 | 3,730 | 3,978 | 4,241 |
| 90 | 4,577 | 4,265 | 4,562 | 4,920 |

These are gross floor values, not guaranteed banked income: they assume the floor is cleared and available Gold is collected. Death risk, skipped rooms, forging, supplies, tavern spending and other sinks remain outside this number.

## Correction

The project curve is now:

| Project | Stage 1 | Stage 2 | Stage 3 |
| --- | ---: | ---: | ---: |
| Rekindled Smithy | 750 G | 2,200 G | 5,200 G |
| East-Gate Trade Road | 650 G | 1,900 G | 4,800 G |
| Relic Hall Expansion | 950 G | 3,000 G | 6,500 G |
| Ember Tavern | 850 G | 2,700 G | 6,000 G |

Total full-town investment: **35,500 G**.

At each stage's unlock band, an individual project now costs roughly **0.7–1.7 fully-cleared baseline floors of gross Gold**. That is deliberately moderate: construction should compete with equipment forging and permanent services, but should not turn the town into a grind wall.

## Design constraints preserved

- Town tier remains the primary progression gate.
- Relic Hall stages still require catalogue milestones in addition to Gold.
- Existing saves keep already-built project levels; no migration reset is introduced.
- Project effects are unchanged. This pass changes only the Gold commitment required for future construction.
- Gold mutation remains core-owned. The town-growth policy continues to own only authored project definitions and requirements.
- The storage epoch remains `v130`.

## Regression guard

`town-growth-v180.cjs` now asserts:

- three bounded stages per project;
- each later stage costs more than twice the previous stage;
- the complete authored town build totals 35,500 G;
- the first Smithy upgrade requires the new 750 G threshold;
- Relic Hall resource gating is still evaluated independently once sufficient Gold is present.
