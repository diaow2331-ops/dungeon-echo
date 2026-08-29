/* Dungeon Echo staged economy rules v1.3.0.
 *
 * Pure calculations extracted from the canonical core and quarantined commerce work.
 * This library owns NO production authority yet and is intentionally not shipped.
 *
 * Boundary rule: inventory/equipment decides an item's value score; economy only turns
 * that value into prices/costs. No duplicated equipment scoring lives here.
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

  function townSupplyPrice(basePrice, tier) {
    return round5((Number(basePrice) || 0) * townPriceScale(tier));
  }

  function townSupplyStock(id, tier) {
    const t = clamp(Number(tier) || 1, 1, 10);
    switch (id) {
      case 'potion': return 4 + Math.floor((t - 1) / 3);
      case 'scroll': return 2 + Math.floor((t - 1) / 4);
      case 'escape': return t >= 5 ? 2 : 1;
      case 'key': return 2 + (t >= 4 ? 1 : 0) + (t >= 8 ? 1 : 0);
      case 'insurance': return 1;
      default: return 0;
    }
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

  function forgeCost(itemValue, forgeLevel=0) {
    const value = Math.max(0, Number(itemValue) || 0);
    const level = nonNegativeInt(forgeLevel);
    return 30 + Math.round(value * 1.2) * (level + 1);
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

  function wheelSpinCost(spins=0) {
    return 40 + nonNegativeInt(spins) * 20;
  }

  function wheelResetCost(resets=0) {
    return 60 + nonNegativeInt(resets) * 40;
  }

  const api = Object.freeze({
    version:'v1.3.0-staged',
    authority:'none',
    sources:Object.freeze([
      'game/core/game.js',
      'archive/quarantine-v130/gameplay/economy/commerce-system.js',
    ]),
    round5,
    townTier,
    townPriceScale,
    townSupplyPrice,
    townSupplyStock,
    dungeonTier,
    dungeonHealPrice,
    forgeCost,
    sellPrice,
    quickDiveCost,
    wheelSpinCost,
    wheelResetCost,
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.DE_ECONOMY_RULES_V130 = api;
})();
