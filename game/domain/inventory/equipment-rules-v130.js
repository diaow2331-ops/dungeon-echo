/* Dungeon Echo production inventory-derived-rules authority v1.3.0.
 *
 * Pure deterministic item/equipment calculations. The module owns derived inventory rules only;
 * live bag/equipment state, RNG, equip commands, rendering, persistence and economy transactions
 * remain with their current production owners.
 */
(() => {
  'use strict';

  const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, Number(value) || 0));

  const AFFINITY = Object.freeze({
    warrior:  Object.freeze({ atk:1.00, def:0.65, hp:1.26, crit:0.82, leech:1.08, gold:0.90, thorns:1.34, regen:1.24 }),
    ranger:   Object.freeze({ atk:1.12, def:0.75, hp:0.96, crit:1.24, leech:1.08, gold:1.02, thorns:0.70, regen:1.02 }),
    mage:     Object.freeze({ atk:1.18, def:0.68, hp:0.94, crit:1.14, leech:1.02, gold:0.96, thorns:0.58, regen:1.12 }),
    assassin: Object.freeze({ atk:1.18, def:0.62, hp:0.94, crit:1.34, leech:1.18, gold:0.94, thorns:0.54, regen:0.96 }),
  });

  const FIT_WEIGHT = Object.freeze({
    warrior:  Object.freeze({ atk:3.00, def:1.70, hp:0.90, crit:1.00, leech:1.60, gold:0.10, thorns:2.55, regen:1.90 }),
    ranger:   Object.freeze({ atk:3.30, def:1.50, hp:0.62, crit:2.05, leech:1.45, gold:0.14, thorns:0.70, regen:1.15 }),
    mage:     Object.freeze({ atk:3.60, def:1.30, hp:0.66, crit:1.85, leech:1.30, gold:0.12, thorns:0.50, regen:1.30 }),
    assassin: Object.freeze({ atk:3.50, def:1.20, hp:0.62, crit:2.35, leech:1.75, gold:0.11, thorns:0.45, regen:1.00 }),
  });

  const MIN_GROW_DIV = Object.freeze({ atk:6, def:10, thorns:8, regen:8 });
  const RARITY_TARGETS = Object.freeze([26, 30, 22, 14, 8]);
  const DEEP_THRESHOLDS = Object.freeze([14, 22, 32, 44, 58, 74, 92]);
  const SLOT_BONUS = Object.freeze({
    helmet: Object.freeze([
      Object.freeze({ hp:6 }), Object.freeze({ hp:10, regen:1 }), Object.freeze({ hp:16, regen:1 }),
      Object.freeze({ hp:24, regen:2 }), Object.freeze({ hp:34, regen:2 }), Object.freeze({ hp:46, regen:3 }), Object.freeze({ hp:60, regen:4 }),
    ]),
    boots: Object.freeze([
      Object.freeze({ hp:8 }), Object.freeze({ hp:14 }), Object.freeze({ def:1, hp:22 }),
      Object.freeze({ def:1, hp:32 }), Object.freeze({ def:2, hp:44 }), Object.freeze({ def:3, hp:58 }), Object.freeze({ def:4, hp:76 }),
    ]),
    amulet: Object.freeze([
      Object.freeze({ hp:6, crit:1 }), Object.freeze({ hp:12, crit:2 }), Object.freeze({ hp:20, crit:3 }),
      Object.freeze({ hp:30, crit:5 }), Object.freeze({ hp:42, crit:7 }), Object.freeze({ hp:56, crit:9 }), Object.freeze({ hp:72, crit:10 }),
    ]),
  });

  function itemStatScore(stats) {
    const source = stats || {};
    return Math.round((Number(source.atk) || 0) * 3 + (Number(source.def) || 0) * 3 +
      (Number(source.hp) || 0) * .6 + (Number(source.crit) || 0) * 1.5 +
      (Number(source.leech) || 0) * 1.2 + (Number(source.gold) || 0) * .15 +
      (Number(source.thorns) || 0) * 2 + (Number(source.regen) || 0));
  }

  function classFitScore(stats, classId='warrior') {
    const weights = FIT_WEIGHT[classId] || FIT_WEIGHT.warrior;
    const source = stats || {};
    let total = 0;
    for (const [key, weight] of Object.entries(weights)) total += (Number(source[key]) || 0) * weight;
    return Math.max(0, Math.round(total));
  }

  function scaleAffixRange(source, multiplier, kind) {
    const src = source || {};
    const mult = Number(multiplier) || 1;
    const out = { ...src };
    const positiveFloor = value => (value > 0 ? 1 : 0);
    if (src.lo !== undefined) out.lo = Math.max(positiveFloor(src.lo), Math.round(src.lo * mult));
    if (src.hi !== undefined) out.hi = Math.max(out.lo || 0, Math.round(src.hi * mult));
    if (src.hiGrow !== undefined) out.hiGrow = Math.max(out.lo || 0, Math.round(src.hiGrow * mult));
    if (src.growDiv !== undefined) {
      const scaled = Math.max(2, Math.round(src.growDiv / Math.max(0.55, mult)));
      out.growDiv = Math.max(MIN_GROW_DIV[kind] || 2, scaled);
    }
    return out;
  }

  function affinityRange(source, classId, kind) {
    const affinity = AFFINITY[classId] || AFFINITY.warrior;
    return scaleAffixRange(source, affinity[kind] || 1, kind);
  }

  function rarityWeight(baseWeight, rarityIndex, depth) {
    const base = Number(baseWeight) || 0;
    const target = RARITY_TARGETS[rarityIndex] === undefined ? base : RARITY_TARGETS[rarityIndex];
    const d = clamp(depth || 1, 1, 100);
    const t = (d - 1) / 99;
    return Math.max(0.1, base + (target - base) * t);
  }

  function depthBonus(slot, depth) {
    const rows = SLOT_BONUS[slot];
    if (!rows) return null;
    const d = clamp(depth || 1, 1, 100);
    let index = -1;
    for (let i = 0; i < DEEP_THRESHOLDS.length; i++) if (d >= DEEP_THRESHOLDS[i]) index = i;
    return index >= 0 ? { ...rows[index] } : null;
  }

  const api = Object.freeze({
    version:'v1.3.0-production',
    authority:'inventory-derived-rules',
    sources:Object.freeze(['game/core/game.js']),
    AFFINITY,
    FIT_WEIGHT,
    MIN_GROW_DIV,
    RARITY_TARGETS,
    DEEP_THRESHOLDS,
    SLOT_BONUS,
    itemStatScore,
    classFitScore,
    scaleAffixRange,
    affinityRange,
    rarityWeight,
    depthBonus,
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.DE_INVENTORY_RULES_V130 = api;
})();
