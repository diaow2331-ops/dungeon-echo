/* Dungeon Echo production deterministic economy-pricing authority v1.6.0.
 *
 * Sole production authority for the pricing/stock algorithms named in the authority map:
 * equipment forge/sell, town supply, tavern toast, quick dive and wheel operations.
 *
 * Boundary rule: no item valuation, gold/stock mutation, transaction commit, RNG, UI or storage.
 */
(() => {
  'use strict';

  const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, Number(value) || 0));
  const nonNegativeInt = value => Math.max(0, Math.floor(Number(value) || 0));

  function round5(value) {
    return Math.max(5, Math.round((Number(value) || 0) / 5) * 5);
  }

  function townTier(bestDepth) {
    const best = Math.max(1, Number(bestDepth) || 1);
    return clamp(Math.ceil(best / 10), 1, 10);
  }

  function townPriceScale(tier) {
    const t = clamp(Number(tier) || 1, 1, 10) - 1;
    return 1 + 0.42 * t + 0.065 * t * t;
  }

  function townSupplyPrice(basePrice, tier, projectDiscount=0) {
    const discount = clamp(Number(projectDiscount) || 0, 0, 0.15);
    return round5((Number(basePrice) || 0) * townPriceScale(tier) * (1 - discount));
  }

  function townMarketRestockCost(tier) {
    const t = clamp(Number(tier) || 1, 1, 10);
    return round5(55 + t * 20);
  }

  function townSupplyStock(id, tier, projectBonus=0) {
    const t = clamp(Number(tier) || 1, 1, 10);
    const bonus = clamp(Math.floor(Number(projectBonus) || 0), 0, 3);
    let base = 0;
    switch (id) {
      case 'potion': base = 4 + Math.floor((t - 1) / 3); break;
      case 'scroll': base = 2 + Math.floor((t - 1) / 4); break;
      case 'escape': base = t >= 5 ? 2 : 1; break;
      case 'key': base = 2 + (t >= 4 ? 1 : 0) + (t >= 8 ? 1 : 0); break;
      case 'insurance': base = 1; break;
      default: return 0;
    }
    return base + bonus;
  }

  function dungeonTier(depth) {
    return clamp(Math.ceil(Math.max(1, Number(depth) || 1) / 10), 1, 10);
  }

  function dungeonHealPrice(depth, hp, maxHp, basePrice=24) {
    const max = Math.max(1, Number(maxHp) || 1);
    const current = clamp(Number(hp) || 0, 0, max);
    const missing = max - current;
    if (missing <= 0) return 0;
    const tier = dungeonTier(depth);
    const t = tier - 1;
    const depthScale = 1 + 0.32 * t + 0.04 * t * t;
    const missingScale = 0.60 + 0.60 * (missing / max);
    return round5((Number(basePrice) || 24) * depthScale * missingScale);
  }

  function forgeCost(itemValue, forgeLevel=0, projectDiscount=0) {
    const value = Math.max(0, Number(itemValue) || 0);
    const level = nonNegativeInt(forgeLevel);
    const raw = 30 + Math.round(value * 1.2) * (level + 1);
    const discount = clamp(Number(projectDiscount) || 0, 0, 0.25);
    return discount > 0 ? Math.max(5, Math.round(raw * (1 - discount))) : raw;
  }

  function forgeRetemperCost(itemValue, forgeLevel=0, retemperCount=0, projectDiscount=0) {
    const value = Math.max(0, Number(itemValue) || 0);
    const level = nonNegativeInt(forgeLevel);
    const count = Math.min(9, nonNegativeInt(retemperCount));
    const raw = 45 + value * 0.55 + level * 30 + count * 55;
    const discount = clamp(Number(projectDiscount) || 0, 0, 0.25);
    return round5(raw * (1 - discount));
  }

  function sellPrice(itemValue, forgeLevel=0) {
    const value = Math.max(0, Number(itemValue) || 0);
    const level = nonNegativeInt(forgeLevel);
    return Math.max(4, Math.round(value * 0.45) + level * 15);
  }

  function quickDiveCost(fromDepth, floors) {
    const count = nonNegativeInt(floors);
    const depth = Math.max(1, Math.floor(Number(fromDepth) || 1));
    return count * (8 + depth * 4);
  }

  function tavernToastCost(visits=0, tier=1) {
    const t = clamp(Number(tier) || 1, 1, 10);
    return Math.round((90 + nonNegativeInt(visits) * 70 + t * 25) / 5) * 5;
  }

  function wheelSpinCost(spins=0, tier=1) {
    const t = clamp(Number(tier) || 1, 1, 10);
    return 40 + nonNegativeInt(spins) * 20 + t * 20;
  }

  function wheelResetCost(resets=0, tier=1) {
    const t = clamp(Number(tier) || 1, 1, 10);
    return 60 + nonNegativeInt(resets) * 40 + t * 45;
  }

  const api = Object.freeze({
    version:'v1.6.0-production',
    authority:'economy-pricing',
    sources:Object.freeze(['game/core/game.js']),
    round5,
    townTier,
    townPriceScale,
    townSupplyPrice,
    townSupplyStock,
    townMarketRestockCost,
    dungeonTier,
    dungeonHealPrice,
    forgeCost,
    forgeRetemperCost,
    sellPrice,
    quickDiveCost,
    tavernToastCost,
    wheelSpinCost,
    wheelResetCost,
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.DE_ECONOMY_RULES_V130 = api;
})();
