/* Dungeon Echo v1.2.8 pre-game save integrity guard.
 * Runs before game.js and only inspects Dungeon Echo's own persistence keys.
 * Valid compatible saves are left byte-for-byte untouched. Malformed/unsafe blobs are
 * removed before the core renderer can restore or interpolate their strings into HTML.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || window.__DE_SAVE_INTEGRITY_V128) return;

  const RUN_KEY = 'de-run-v6';
  const META_KEY = 'de-greedy-meta-v1';
  const GREEDY_KEY = 'de-greedy-on-v1';
  const RUN_VERSION = 2;
  const PROFILE_ID = 'classic-100';
  const MAP_W = 40;
  const MAP_H = 28;
  const MAX_RAW = 1_500_000;
  const MAX_TEXT = 4096;
  // Raw < > or double quotes can break the current legacy innerHTML/attribute sinks.
  // Ampersands are allowed: an HTML character reference is not re-tokenized as markup.
  const FORBIDDEN_TEXT = /[<>"\u0000-\u0008\u000b\u000c\u000e-\u001f]/;
  const BAD_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
  const CLASSES = new Set(['warrior', 'ranger', 'mage', 'assassin']);

  const report = { removed:[], kept:[], ignored:[] };
  const plain = value => !!value && typeof value === 'object' && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const intIn = (value, lo, hi) => Number.isInteger(value) && value >= lo && value <= hi;
  const safeText = value => typeof value === 'string' && value.length <= MAX_TEXT && !FORBIDDEN_TEXT.test(value);
  const safeSeed = value => (typeof value === 'string' && value.length <= MAX_TEXT && !/[\u0000-\u001f]/.test(value)) || finite(value);

  function safeTree(value, state = { nodes:0, depth:0 }) {
    state.nodes++;
    if (state.nodes > 50000 || state.depth > 12) return false;
    if (value == null || typeof value === 'boolean') return true;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'string') return safeText(value);
    if (Array.isArray(value)) {
      if (value.length > 2000) return false;
      const next = { nodes:state.nodes, depth:state.depth + 1 };
      for (const row of value) {
        if (!safeTree(row, next)) return false;
        state.nodes = next.nodes;
      }
      return true;
    }
    if (!plain(value)) return false;
    const keys = Object.keys(value);
    if (keys.length > 512 || keys.some(key => BAD_KEYS.has(key) || !safeText(key))) return false;
    const next = { nodes:state.nodes, depth:state.depth + 1 };
    for (const key of keys) {
      if (!safeTree(value[key], next)) return false;
      state.nodes = next.nodes;
    }
    return true;
  }

  function validGrid(grid, explored = false) {
    if (!Array.isArray(grid) || grid.length !== MAP_H) return false;
    for (const row of grid) {
      if (!Array.isArray(row) || row.length !== MAP_W) return false;
      for (const cell of row) {
        if (explored) {
          if (typeof cell !== 'boolean' && cell !== 0 && cell !== 1) return false;
        } else if (!Number.isInteger(cell) || cell < 0 || cell > 32) return false;
      }
    }
    return true;
  }

  function validCoordEntity(row) {
    if (!plain(row)) return false;
    if ('x' in row && !intIn(row.x, 0, MAP_W - 1)) return false;
    if ('y' in row && !intIn(row.y, 0, MAP_H - 1)) return false;
    return true;
  }

  function validList(list, max) {
    return Array.isArray(list) && list.length <= max && list.every(validCoordEntity);
  }

  function validPlayer(player) {
    if (!plain(player)) return false;
    if (!intIn(player.x, 0, MAP_W - 1) || !intIn(player.y, 0, MAP_H - 1)) return false;
    if (!finite(player.hp) || !finite(player.hpBase) || !finite(player.atkBase)) return false;
    if (!Array.isArray(player.inv) || player.inv.length > 12) return false;
    if (!plain(player.equip)) return false;
    return true;
  }

  function validRun(raw) {
    if (!plain(raw) || raw.version !== RUN_VERSION || raw.profileId !== PROFILE_ID) return false;
    // Core compatibility: legacy v2 classic saves may omit mode and are treated as classic.
    if (raw.mode != null && raw.mode !== 'classic' && raw.mode !== 'greedy') return false;
    if (raw.state !== 'playing' && raw.state !== 'town') return false;
    // Core also falls back to Warrior when an old save lacks classId.
    if (raw.classId != null && !CLASSES.has(raw.classId)) return false;
    if (!finite(raw.depth) || raw.depth < 1 || raw.depth > 100000) return false;
    if (!finite(raw.turns) || raw.turns < 0 || raw.turns > 1e9) return false;
    if (!finite(raw.rng)) return false;
    if (!safeSeed(raw.seed)) return false;
    if (!validPlayer(raw.player)) return false;
    if (!validGrid(raw.map, false) || !validGrid(raw.explored, true)) return false;
    if (!validList(raw.monsters || [], 512)) return false;
    if (!validList(raw.items || [], 512)) return false;
    if (!validList(raw.npcs || [], 128)) return false;
    if (!validList(raw.traps || [], 256)) return false;
    if (!Array.isArray(raw.secrets || []) || (raw.secrets || []).length > 256) return false;
    if (!Array.isArray(raw.shopStock || []) || (raw.shopStock || []).length > 128) return false;
    if (!Array.isArray(raw.logLines || []) || (raw.logLines || []).length > 30) return false;
    // Seed is displayed with textContent and used only for hashing; do not subject it to HTML-sink rules.
    const treeView = { ...raw, seed:'' };
    return safeTree(treeView);
  }

  function validMeta(raw) {
    if (!plain(raw) || raw.v !== 1 || !CLASSES.has(raw.classId)) return false;
    if (raw.bag != null && (!Array.isArray(raw.bag) || raw.bag.length > 12)) return false;
    if (raw.stash != null && (!Array.isArray(raw.stash) || raw.stash.length > 200)) return false;
    if (raw.equip != null && !plain(raw.equip)) return false;
    if (raw.talents != null && (!Array.isArray(raw.talents) || raw.talents.length > 64)) return false;
    return safeTree(raw);
  }

  function remove(key, reason) {
    try { localStorage.removeItem(key); report.removed.push({ key, reason }); }
    catch (_e) { report.removed.push({ key, reason:'storage-error' }); }
  }

  function inspectJson(key, validate) {
    let rawText = null;
    try { rawText = localStorage.getItem(key); }
    catch (_e) { report.ignored.push({ key, reason:'storage-unavailable' }); return; }
    if (rawText == null) { report.ignored.push({ key, reason:'absent' }); return; }
    if (typeof rawText !== 'string' || rawText.length > MAX_RAW) { remove(key, 'oversize'); return; }
    let raw;
    try { raw = JSON.parse(rawText); }
    catch (_e) { remove(key, 'invalid-json'); return; }
    if (!validate(raw)) { remove(key, 'invalid-shape-or-text'); return; }
    report.kept.push(key);
  }

  if (typeof localStorage !== 'undefined') {
    inspectJson(RUN_KEY, validRun);
    inspectJson(META_KEY, validMeta);
    try {
      const greedy = localStorage.getItem(GREEDY_KEY);
      if (greedy != null && greedy !== '0' && greedy !== '1') remove(GREEDY_KEY, 'invalid-toggle');
      else if (greedy != null) report.kept.push(GREEDY_KEY);
    } catch (_e) { report.ignored.push({ key:GREEDY_KEY, reason:'storage-unavailable' }); }
  }

  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('de-save-integrity-v128', JSON.stringify(report));
  } catch (_e) { /* diagnostic only */ }

  window.__DE_SAVE_INTEGRITY_V128 = {
    version:'v2', report, validRun, validMeta, safeTree,
    limits:{ maxRaw:MAX_RAW, maxText:MAX_TEXT, mapWidth:MAP_W, mapHeight:MAP_H }
  };
})();
