/* Dungeon Echo progression guard owner.
 * Owns permanent level/stat growth bounds and event-time XP parking for classic-100.
 * Equipment swap turn cost remains owned by equipment-system.js.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_PROGRESSION_COMMITMENT && window.__DE_PROGRESSION_COMMITMENT.owner === 'progression-guard-system') return;

  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100' || !api.CLASSES) return;

  const GUARD_KEY = 'de-progression-guard-v1';
  const META_KEY = 'de-greedy-meta-v1';
  const DEFAULT_LEVEL_CAP = 50;
  const HP_HEADROOM = 160;
  const ATK_HEADROOM = 24;

  function loadGuard() {
    try {
      const raw = JSON.parse(localStorage.getItem(GUARD_KEY));
      if (raw && raw.v === 1 && raw.classes && typeof raw.classes === 'object') return raw;
    } catch (e) {}
    return { v: 1, classes: {} };
  }

  function saveGuard(raw) {
    try { localStorage.setItem(GUARD_KEY, JSON.stringify(raw)); } catch (e) {}
  }

  function guardRow() {
    const meta = api.meta;
    if (!meta) return null;
    const id = meta.classId || api.classId || 'warrior';
    const state = loadGuard();
    let row = state.classes[id];
    if (!row) {
      row = {
        legacyLvl: Math.max(1, Number(meta.lvl) || 1),
        legacyHp: Math.max(1, Number(meta.hpBase) || 1),
        legacyAtk: Math.max(0, Number(meta.atkBase) || 0),
      };
      state.classes[id] = row;
      saveGuard(state);
    }
    return { id, row };
  }

  function capsFor(level, info) {
    const c = api.CLASSES[info.id] || api.CLASSES.warrior;
    const lvl = Math.max(1, Number(level) || 1);
    return {
      level: Math.max(DEFAULT_LEVEL_CAP, Number(info.row.legacyLvl) || 1),
      hp: Math.max(Number(info.row.legacyHp) || 1, (Number(c.hpBase) || 1) + (lvl - 1) * 6 + HP_HEADROOM),
      atk: Math.max(Number(info.row.legacyAtk) || 0, (Number(c.atkBase) || 0) + (lvl - 1) + ATK_HEADROOM),
    };
  }

  function clampGrowth(obj, info) {
    if (!obj || !info) return false;
    let changed = false;
    let lvl = Math.max(1, Number(obj.lvl) || 1);
    const preliminary = capsFor(lvl, info);

    if (lvl > preliminary.level) {
      const excess = lvl - preliminary.level;
      obj.hpBase = Math.max(1, (Number(obj.hpBase) || 1) - excess * 6);
      obj.atkBase = Math.max(0, (Number(obj.atkBase) || 0) - excess);
      obj.lvl = preliminary.level;
      lvl = preliminary.level;
      changed = true;
    }

    const caps = capsFor(lvl, info);
    if ((Number(obj.hpBase) || 0) > caps.hp) { obj.hpBase = caps.hp; changed = true; }
    if ((Number(obj.atkBase) || 0) > caps.atk) { obj.atkBase = caps.atk; changed = true; }

    if (lvl >= caps.level) {
      const xpCap = caps.level * 15 - 1;
      const xp = Math.max(0, Number(obj.xp) || 0);
      if (xp > xpCap) { obj.xp = xpCap; changed = true; }
    }
    return changed;
  }

  function syncGrowth() {
    const meta = api.meta;
    if (!meta) return false;
    const info = guardRow();
    if (!info) return false;

    const metaChanged = clampGrowth(meta, info);
    const p = api.player;
    const playerChanged = p ? clampGrowth(p, info) : false;
    if (p && playerChanged && typeof api.pMaxHp === 'function') {
      p.hp = Math.min(Number(p.hp) || 0, api.pMaxHp());
    }
    if (metaChanged) {
      try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {}
    }
    return metaChanged || playerChanged;
  }

  function levelCap() {
    const info = guardRow();
    return info ? capsFor(api.meta && api.meta.lvl, info).level : null;
  }

  function hold() {
    const p = api.player;
    const cap = levelCap();
    if (!p || !cap || (Number(p.lvl) || 1) < cap) return null;
    const keep = Math.min(Math.max(0, Number(p.xp) || 0), cap * 15 - 1);
    p.xp = -1000000000;
    return () => {
      if (api.player === p) p.xp = keep;
    };
  }

  function arm() {
    if (api.state !== 'playing') {
      queueMicrotask(syncGrowth);
      return;
    }
    const release = hold();
    queueMicrotask(() => {
      if (release) release();
      syncGrowth();
    });
  }

  syncGrowth();
  document.addEventListener('keydown', arm, true);
  document.addEventListener('click', arm, true);

  window.__DE_XP_CAP_GUARD = {
    version: 'p0-v2',
    owner: 'progression-guard-system',
    levelCap,
    hold,
  };
  window.__DE_PROGRESSION_COMMITMENT = {
    version: 'p0-v3',
    owner: 'progression-guard-system',
    capsFor,
    clampGrowth,
    syncGrowth,
    equipmentTurnOwner: 'equipment-system',
  };
})();
