/* Dungeon Echo production defense semantics v1.
 * Keeps equipment DEF as armor and applies flat reduction / Warrior Ironhide as a
 * separate mitigation layer without rewriting the large legacy combat core.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_DEFENSE_MODEL) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100') return;

  const players = new WeakMap();
  const monsters = new WeakMap();

  function stackText() {
    try { return String(new Error().stack || ''); } catch (e) { return ''; }
  }
  const inStack = (stack, name) => stack.indexOf(name) >= 0;
  const classId = () => api.classId || (api.meta && api.meta.classId) || 'warrior';

  function warriorReduction(p = api.player) {
    if (!p || classId() !== 'warrior') return 0;
    return 1 + Math.floor((Math.max(1, Number(p.lvl) || 1) - 1) / 5);
  }

  function storedFlat(p = api.player) {
    if (!p) return 0;
    const row = players.get(p);
    return Math.max(0, Number(row ? row.flat : p.flatDr) || 0);
  }

  function fixedReduction(p = api.player) {
    return Math.max(0, Math.round(storedFlat(p))) + warriorReduction(p);
  }

  function installPlayer(p) {
    if (!p || typeof p !== 'object' || players.has(p)) return false;
    const desc = Object.getOwnPropertyDescriptor(p, 'flatDr');
    if (desc && desc.configurable === false) return false;
    const row = { flat: Math.max(0, Number(p.flatDr) || 0) };
    players.set(p, row);
    try {
      Object.defineProperty(p, 'flatDr', {
        enumerable: true,
        configurable: true,
        get() {
          const stack = stackText();
          // Core pDef historically adds flatDr + Warrior reduction to equipment DEF.
          // Cancel that legacy contribution only while pDef is being evaluated, so pDef
          // becomes armor-only. Normal reads/save serialization still see the real flat DR.
          if (inStack(stack, 'pDef')) return -warriorReduction(p);
          return row.flat;
        },
        set(value) {
          const stack = stackText();
          // gameplay-tuning's older guardian-special bridge temporarily doubled flatDr
          // to compensate for the old ranged formula. The separated model supersedes it;
          // ignore only those temporary specialHit writes and preserve real talent changes.
          if (inStack(stack, 'specialHit')) return;
          row.flat = Math.max(0, Number(value) || 0);
        },
      });
      return true;
    } catch (e) {
      players.delete(p);
      return false;
    }
  }

  function adjustedAttack(value, stack, p = api.player) {
    const raw = Math.max(0, Number(value) || 0);
    const dr = fixedReduction(p);
    if (!dr) return raw;
    // Put fixed DR into the raw attack term before the legacy core applies armor. This
    // keeps damage logs, floaters, enemy leech and thorns consistent with actual HP loss.
    if (inStack(stack, 'monsterRangedAttack')) return Math.max(0, raw - dr / 0.80);
    if (inStack(stack, 'monsterAttack')) return Math.max(0, raw - dr);
    if (inStack(stack, 'killMonster')) return Math.max(0, raw - dr / 0.55);
    return raw;
  }

  function installMonster(m) {
    if (!m || typeof m !== 'object' || monsters.has(m)) return false;
    const desc = Object.getOwnPropertyDescriptor(m, 'atk');
    if (desc && desc.configurable === false) return false;
    const row = { atk: Math.max(0, Number(m.atk) || 0) };
    monsters.set(m, row);
    try {
      Object.defineProperty(m, 'atk', {
        enumerable: true,
        configurable: true,
        get() { return adjustedAttack(row.atk, stackText()); },
        set(value) { row.atk = Math.max(0, Number(value) || 0); },
      });
      return true;
    } catch (e) {
      monsters.delete(m);
      return false;
    }
  }

  function rawAttack(m) {
    const row = m && monsters.get(m);
    return row ? row.atk : Math.max(0, Number(m && m.atk) || 0);
  }

  function armor() {
    const p = api.player;
    if (!p) return 0;
    installPlayer(p);
    return typeof api.pDef === 'function' ? Math.max(0, Number(api.pDef()) || 0) : 0;
  }

  function syncDefenseModel() {
    const p = api.player;
    if (p) installPlayer(p);
    for (const m of api.monsters || []) installMonster(m);

    const def = document.getElementById && document.getElementById('st-def');
    if (def && p) {
      const host = def.parentElement || (typeof def.closest === 'function' ? def.closest('.stat') : null);
      if (host) host.title = `护甲 ${armor()} · 固定减伤 ${fixedReduction(p)}（远程只按 50% 护甲；破甲仅忽略护甲）`;
    }
    return { armor: armor(), fixed: fixedReduction(p) };
  }

  function scheduleSync() {
    syncDefenseModel();
    queueMicrotask(syncDefenseModel);
  }

  document.addEventListener('keydown', scheduleSync, true);
  document.addEventListener('click', scheduleSync, true);
  syncDefenseModel();
  const timer = setInterval(syncDefenseModel, 100);
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('beforeunload', () => clearInterval(timer), { once: true });
  }

  window.__DE_DEFENSE_MODEL = {
    version: 'v1',
    armor,
    fixedReduction,
    warriorReduction,
    adjustedAttack,
    installPlayer,
    installMonster,
    rawAttack,
    sync: syncDefenseModel,
  };
})();
