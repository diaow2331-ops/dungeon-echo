/* Dungeon Echo production content-classification authority v1.3.0.
 *
 * Pure floor/content classification extracted from the canonical core. This module is
 * shipped before game.js and is the sole production owner of deterministic floor eligibility.
 *
 * Boundary rule: content may answer "what is eligible on this floor"; it must not spawn,
 * mutate runtime state, consume RNG, touch the DOM, write storage or apply combat effects.
 */
(() => {
  'use strict';

  const positiveDepth = value => Math.max(1, Math.floor(Number(value) || 1));
  const nonNegativeInt = value => Math.max(0, Math.floor(Number(value) || 0));
  const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

  function themeIndex(depth, themeCount, bandSize) {
    const count = Math.max(1, nonNegativeInt(themeCount));
    const band = Math.max(1, nonNegativeInt(bandSize));
    return Math.min(count - 1, Math.floor((positiveDepth(depth) - 1) / band));
  }

  function monsterPool(monsters, depth) {
    const list = Array.isArray(monsters) ? monsters.filter(Boolean) : [];
    if (!list.length) return Object.freeze([]);
    const d = positiveDepth(depth);
    const direct = list.filter(m => d >= Number(m.min) && d <= Number(m.max));
    if (direct.length) return Object.freeze(direct.slice());

    let best = list[0];
    let bestDist = Infinity;
    for (const monster of list) {
      const min = Number(monster.min) || 1;
      const max = Number(monster.max) || min;
      const mid = (min + max) / 2;
      const dist = Math.abs(mid - d);
      if (dist < bestDist) {
        best = monster;
        bestDist = dist;
      }
    }
    return Object.freeze([best]);
  }

  function desiredMonsterCount(depth, floorRules={}) {
    const d = positiveDepth(depth);
    const base = nonNegativeInt(floorRules.baseMonsterCount);
    const perDepth = nonNegativeInt(floorRules.monsterPerDepth);
    const min = Math.max(nonNegativeInt(floorRules.minMonsters || 5), 4);
    const max = Math.max(min, nonNegativeInt(floorRules.maxMonsters || min));
    return clamp(base + d * perDepth, min, max);
  }

  function isFinalFloor(depth, maxDepth, echoMode=false) {
    return !echoMode && positiveDepth(depth) >= positiveDepth(maxDepth);
  }

  function canDescend(depth, maxDepth, echoMode=false) {
    return !!echoMode || positiveDepth(depth) < positiveDepth(maxDepth);
  }

  function midBossesAtDepth(midBosses, depth, echoMode=false) {
    if (echoMode) return Object.freeze([]);
    const d = positiveDepth(depth);
    const list = Array.isArray(midBosses) ? midBosses : [];
    return Object.freeze(list.filter(b => b && positiveDepth(b.depth) === d));
  }

  function isShopFloor(depth, shopFloors, maxDepth, echoMode=false) {
    const d = positiveDepth(depth);
    const explicit = Array.isArray(shopFloors) && shopFloors.some(v => positiveDepth(v) === d);
    const endless = !!echoMode && d > positiveDepth(maxDepth) && d % 4 === 0;
    return explicit || endless;
  }

  function isRestFloor(depth, restFloors, maxDepth, echoMode=false) {
    const d = positiveDepth(depth);
    const explicit = Array.isArray(restFloors) && restFloors.some(v => positiveDepth(v) === d);
    const endless = !!echoMode && d > positiveDepth(maxDepth) && d % 10 === 5;
    return explicit || endless;
  }

  function echoGuardianFloor(depth, maxDepth, echoMode=false) {
    const d = positiveDepth(depth);
    return !!echoMode && d > positiveDepth(maxDepth) && d % 5 === 0;
  }

  const api = Object.freeze({
    version: 'v1.3.0-production',
    authority: 'content-classification',
    sources: Object.freeze([
      'game/core/game.js',
    ]),
    themeIndex,
    monsterPool,
    desiredMonsterCount,
    isFinalFloor,
    canDescend,
    midBossesAtDepth,
    isShopFloor,
    isRestFloor,
    echoGuardianFloor,
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.DE_CONTENT_RULES_V130 = api;
})();
