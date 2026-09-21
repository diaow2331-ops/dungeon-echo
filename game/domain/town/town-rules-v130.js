/* Dungeon Echo production town checkpoint/readiness policy v1.6.0.
 *
 * Sole production authority for deterministic town checkpoint unlocks and
 * expedition-readiness thresholds. Core owns town state, transactions, UI,
 * rendering, persistence and input; this library never mutates them.
 */
(() => {
  'use strict';

  const CHECKPOINTS = Object.freeze([1, 11, 21, 31, 41, 51, 61, 71, 81, 91]);
  const positiveInt = value => Math.max(1, Math.floor(Number(value) || 1));
  const nonNegativeInt = value => Math.max(0, Math.floor(Number(value) || 0));

  function unlockedCheckpoints(bestDepth) {
    const best = nonNegativeInt(bestDepth);
    return Object.freeze(CHECKPOINTS.filter(depth => depth === 1 || best >= depth));
  }

  function deepestUnlockedCheckpoint(bestDepth) {
    const rows = unlockedCheckpoints(bestDepth);
    return rows[rows.length - 1] || 1;
  }

  function isCheckpointUnlocked(targetDepth, bestDepth) {
    const target = positiveInt(targetDepth);
    return unlockedCheckpoints(bestDepth).includes(target);
  }

  function normalizeCheckpointSelection(selectedDepth, bestDepth) {
    const selected = positiveInt(selectedDepth);
    return isCheckpointUnlocked(selected, bestDepth)
      ? selected
      : deepestUnlockedCheckpoint(bestDepth);
  }

  function checkpointUnlockedByGuardian(guardianDepth) {
    const depth = positiveInt(guardianDepth);
    if (depth % 10 !== 0) return null;
    const target = depth + 1;
    return CHECKPOINTS.includes(target) ? target : null;
  }

  function expeditionSupplyNeeds(supplies={}) {
    const potions = nonNegativeInt(supplies.potions);
    const escapes = nonNegativeInt(supplies.escapes);
    return Object.freeze({
      potion: Math.max(0, 2 - potions),
      escape: Math.max(0, 1 - escapes),
    });
  }

  function expeditionReadiness(supplies={}) {
    const potions = nonNegativeInt(supplies.potions);
    const escapes = nonNegativeInt(supplies.escapes);
    const keys = nonNegativeInt(supplies.keys);
    const needs = expeditionSupplyNeeds({potions, escapes});
    const missing = [];
    if (needs.potion > 0) missing.push('potions');
    if (needs.escape > 0) missing.push('escape');
    return Object.freeze({
      ready: needs.potion === 0 && needs.escape === 0,
      potions,
      escapes,
      keys,
      missing: Object.freeze(missing),
    });
  }

  /* Return convalescence policy (v1.9.2): a safe return patches wounds only up to
   * half of max HP. Anything beyond that is a deliberate town spend (tavern),
   * so arriving wounded is no longer a free full heal on the next departure.
   */
  function townConvalescenceHp(currentHp, maxHp) {
    const max = positiveInt(maxHp);
    const hp = Math.max(0, Math.floor(Number(currentHp) || 0));
    const patched = Math.ceil(max * 0.5);
    return Math.max(1, Math.min(max, Math.max(hp, patched)));
  }

  const api = Object.freeze({
    version: 'v1.6.0-production',
    authority: 'town-checkpoint-readiness-policy',
    sources: Object.freeze(['game/core/game.js']),
    CHECKPOINTS,
    unlockedCheckpoints,
    deepestUnlockedCheckpoint,
    isCheckpointUnlocked,
    normalizeCheckpointSelection,
    checkpointUnlockedByGuardian,
    expeditionSupplyNeeds,
    expeditionReadiness,
    townConvalescenceHp,
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.DE_TOWN_RULES_V130 = api;
})();
