/* Dungeon Echo production defense semantics v2.
 * Keeps equipment DEF as armor and applies flat reduction / Warrior Ironhide as a
 * separate mitigation layer without rewriting the large legacy combat core.
 * v2 removes permanent defense/talent polling and synchronizes from real state transitions.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_DEFENSE_MODEL) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100') return;

  const players = new WeakMap();
  const monsters = new WeakMap();
  const defer = typeof queueMicrotask === 'function' ? queueMicrotask : (fn => Promise.resolve().then(fn));
  let syncQueued = false;

  function stackText() {
    try { return String(new Error().stack || ''); } catch (e) { return ''; }
  }
  const inStack = (stack, name) => stack.indexOf(name) >= 0;
  const classId = () => api.classId || (api.meta && api.meta.classId) || 'warrior';
  const isEnglish = () => !!(window.DE_I18N && window.DE_I18N.isEnglish);

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
      if (host) host.title = isEnglish()
        ? `Armor ${armor()} · Fixed DR ${fixedReduction(p)} (ranged uses 50% Armor; Armor Break ignores Armor only)`
        : `护甲 ${armor()} · 固定减伤 ${fixedReduction(p)}（远程只按 50% 护甲；破甲仅忽略护甲）`;
    }
    return { armor: armor(), fixed: fixedReduction(p) };
  }

  function scheduleSync() {
    if (syncQueued) return false;
    syncQueued = true;
    defer(() => { syncQueued = false; syncDefenseModel(); });
    return true;
  }

  document.addEventListener('keydown', scheduleSync, true);
  document.addEventListener('click', scheduleSync, true);
  window.addEventListener('focus', scheduleSync);
  window.addEventListener('pageshow', scheduleSync);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleSync(); });
  syncDefenseModel();

  window.__DE_DEFENSE_MODEL = {
    version: 'v2',
    owner: 'defense-system',
    armor,
    fixedReduction,
    warriorReduction,
    adjustedAttack,
    installPlayer,
    installMonster,
    rawAttack,
    sync: syncDefenseModel,
    schedule: scheduleSync,
  };
})();

/* P0 talent exhaustion safety.
 * The legacy core enters the talent screen even when TALENTS is empty. Progression owns
 * finite rank caps, so long-lived saves eventually need a repeatable non-power fallback.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_TALENT_SAFETY) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100' || !Array.isArray(api.TALENTS)) return;

  const defer = typeof queueMicrotask === 'function' ? queueMicrotask : (fn => Promise.resolve().then(fn));
  let syncQueued = false;
  const english = () => !!(window.DE_I18N && window.DE_I18N.isEnglish);
  const OVERFLOW = {
    id: 'overflow_supply',
    get name() { return english() ? 'Ember Resupply' : '余烬整备'; },
    get desc() { return english() ? 'All scalable talents are capped: gain +1 Potion and +1 Teleport Scroll.' : '可成长天赋已达上限：获得药水 +1、卷轴 +1。'; },
    apply(p) {
      p.potions = (Number(p.potions) || 0) + 1;
      p.scrolls = (Number(p.scrolls) || 0) + 1;
    },
  };

  function eligible() {
    const ranks = window.DE_TALENT_RANKS;
    if (!ranks || typeof ranks.eligible !== 'function') return api.TALENTS.slice();
    const pool = ranks.eligible();
    return Array.isArray(pool) ? pool : [];
  }

  function desiredPool() {
    const pool = eligible();
    return pool.length ? pool : [OVERFLOW];
  }

  function syncPool() {
    if (api.state === 'talent') return false;
    const pool = desiredPool();
    api.TALENTS.splice(0, api.TALENTS.length, ...pool);
    return true;
  }

  const esc = value => String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));

  function repairTalentScreen() {
    if (api.state !== 'talent') return false;
    const grid = document.getElementById('talent-grid');
    if (!grid || (grid.querySelector && grid.querySelector('button[data-talent]'))) return false;
    const pool = desiredPool().slice(0, 3);
    api.TALENTS.splice(0, api.TALENTS.length, ...pool);
    grid.innerHTML = pool.map(t =>
      `<button type="button" class="class-card" data-talent="${esc(t.id)}"><h3>${esc(t.name)}</h3><p>${esc(t.desc)}</p></button>`
    ).join('');
    return true;
  }

  function sync() {
    if (api.state === 'talent') return repairTalentScreen();
    return syncPool();
  }

  function scheduleSync() {
    if (syncQueued) return false;
    syncQueued = true;
    defer(() => { syncQueued = false; sync(); });
    return true;
  }

  document.addEventListener('keydown', scheduleSync, true);
  document.addEventListener('click', scheduleSync, true);
  window.addEventListener('focus', scheduleSync);
  window.addEventListener('pageshow', scheduleSync);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleSync(); });
  sync();

  window.__DE_TALENT_SAFETY = {
    version: 'v1',
    owner: 'defense-system',
    overflow: OVERFLOW,
    eligible,
    desiredPool,
    syncPool,
    repairTalentScreen,
    sync,
    schedule: scheduleSync,
  };
})();
