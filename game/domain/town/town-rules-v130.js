/* Dungeon Echo staged town rules v1.3.0.
 *
 * Pure town/checkpoint policy extracted from the canonical core and quarantined town work.
 * This library owns NO production authority yet and is not shipped.
 *
 * Boundary rule: town owns checkpoint/readiness policy only. Economy owns prices/costs;
 * inventory owns item movement; render/UI owns presentation; persistence owns storage.
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

  function expeditionReadiness(supplies={}) {
    const potions = nonNegativeInt(supplies.potions);
    const escapes = nonNegativeInt(supplies.escapes);
    const keys = nonNegativeInt(supplies.keys);
    const ready = potions >= 2 && escapes >= 1;
    const missing = [];
    if (potions < 2) missing.push('potions');
    if (escapes < 1) missing.push('escape');
    return Object.freeze({
      ready,
      potions,
      escapes,
      keys,
      missing: Object.freeze(missing),
    });
  }

  const api = Object.freeze({
    version: 'v1.3.0-staged',
    authority: 'none',
    sources: Object.freeze([
      'game/core/game.js',
      'archive/quarantine-v130/gameplay/town/town-system.js',
    ]),
    CHECKPOINTS,
    unlockedCheckpoints,
    deepestUnlockedCheckpoint,
    isCheckpointUnlocked,
    normalizeCheckpointSelection,
    checkpointUnlockedByGuardian,
    expeditionReadiness,
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.DE_TOWN_RULES_V130 = api;
})();
