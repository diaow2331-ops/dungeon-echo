/* Dungeon Echo production commerce v2.
 * Owns town supply stock / chapter-scaled pricing and closes underground service exploits
 * for classic-100 without changing the core save schema.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_COMMERCE_SYSTEM) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100') return;
  window.__DE_COMMERCE_SYSTEM = 'v2';

  const STORAGE_KEY = 'de-town-commerce-v1';
  const META_KEY = 'de-greedy-meta-v1';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const shopCfg = (api.runProfile && api.runProfile.shop) || {};

  const SUPPLIES = {
    potion: {
      name: '治疗药水', held: m => Number(m.potions) || 0,
      base: Number(shopCfg.potionPrice) || 16,
      stock: tier => 4 + Math.floor((tier - 1) / 3),
      apply: m => { m.potions = (Number(m.potions) || 0) + 1; },
    },
    scroll: {
      name: '传送卷轴', held: m => Number(m.scrolls) || 0,
      base: Number(shopCfg.scrollPrice) || 28,
      stock: tier => 2 + Math.floor((tier - 1) / 4),
      apply: m => { m.scrolls = (Number(m.scrolls) || 0) + 1; },
    },
    escape: {
      name: '回城卷轴', held: m => Number(m.escapes) || 0,
      base: Number(shopCfg.escapePrice) || 26,
      stock: tier => tier >= 5 ? 2 : 1,
      apply: m => { m.escapes = (Number(m.escapes) || 0) + 1; },
    },
    key: {
      name: '锈蚀钥匙', held: m => Number(m.keys) || 0,
      base: Number(shopCfg.keyPrice) || 22,
      stock: tier => 2 + (tier >= 4 ? 1 : 0) + (tier >= 8 ? 1 : 0),
      apply: m => { m.keys = (Number(m.keys) || 0) + 1; },
    },
    insurance: {
      name: '保险符', held: m => Number(m.insurance) || 0,
      base: Number(shopCfg.insurancePrice) || 120,
      stock: () => 1,
      apply: m => { m.insurance = (Number(m.insurance) || 0) + 1; },
    },
  };

  let state = null;
  let lastFlash = '';
  let lastFlashUntil = 0;
  const chargedRests = new WeakSet();

  function townTier() {
    const best = Math.max(1, Number(api.meta && api.meta.bestDepth) || 1);
    return clamp(Math.ceil(best / 10), 1, 10);
  }

  function priceScale(tier = townTier()) {
    const t = clamp(Number(tier) || 1, 1, 10) - 1;
    return 1 + 0.42 * t + 0.065 * t * t;
  }

  function round5(n) {
    return Math.max(5, Math.round((Number(n) || 0) / 5) * 5);
  }

  function priceFor(id, tier = townTier()) {
    const def = SUPPLIES[id];
    if (!def) return 0;
    return round5(def.base * priceScale(tier));
  }

  function freshState() {
    const meta = api.meta || {};
    const tier = townTier();
    const stock = {};
    for (const [id, def] of Object.entries(SUPPLIES)) stock[id] = Math.max(0, Math.floor(def.stock(tier)));
    return {
      v: 1,
      cycleRun: Math.max(0, Math.floor(Number(meta.runs) || 0)),
      tier,
      stock,
    };
  }

  function validState(raw) {
    if (!raw || raw.v !== 1 || typeof raw !== 'object' || !raw.stock || typeof raw.stock !== 'object') return false;
    if (!Number.isInteger(raw.cycleRun) || raw.cycleRun < 0) return false;
    if (!Number.isInteger(raw.tier) || raw.tier < 1 || raw.tier > 10) return false;
    return Object.keys(SUPPLIES).every(id => Number.isInteger(raw.stock[id]) && raw.stock[id] >= 0 && raw.stock[id] <= 99);
  }

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return validState(raw) ? raw : null;
    } catch (e) { return null; }
  }

  function saveState() {
    if (!state) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
  }

  function saveMeta() {
    const meta = api.meta;
    if (!meta) return;
    try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) { /* storage unavailable */ }
  }

  function ensureState() {
    const meta = api.meta;
    if (!meta) return null;
    if (!state) state = loadState();
    const run = Math.max(0, Math.floor(Number(meta.runs) || 0));
    const tier = townTier();
    if (!validState(state) || state.cycleRun !== run || state.tier !== tier) {
      state = freshState();
      saveState();
    }
    return state;
  }

  function flash(text) {
    lastFlash = String(text || '');
    lastFlashUntil = Date.now() + 2200;
  }

  function purchase(id) {
    const meta = api.meta;
    const st = ensureState();
    const def = SUPPLIES[id];
    if (!meta || !st || !def) return false;
    const left = Number(st.stock[id]) || 0;
    const price = priceFor(id, st.tier);
    if (left <= 0) { flash(`${def.name}本轮已经售罄。`); renderShop(true); return false; }
    if ((Number(meta.gold) || 0) < price) { flash(`金币不足：${def.name}需要 ${price} G。`); renderShop(true); return false; }

    meta.gold -= price;
    def.apply(meta);
    st.stock[id] = left - 1;
    saveMeta();
    saveState();
    flash(`购入 ${def.name} ×1。`);
    renderShop(true);
    return true;
  }

  function renderShop(force = false) {
    if (api.state !== 'town' || !api.meta) return;
    const el = document.getElementById('town-shop');
    const st = ensureState();
    if (!el || !st) return;
    const meta = api.meta;
    const ids = ['potion', 'scroll', 'escape', 'key', 'insurance'];
    const flashText = Date.now() < lastFlashUntil ? lastFlash : '';
    const sig = JSON.stringify({
      run: st.cycleRun, tier: st.tier, gold: Number(meta.gold) || 0,
      stock: ids.map(id => st.stock[id]), held: ids.map(id => SUPPLIES[id].held(meta)), flash: flashText,
    });
    const ours = !!(el.querySelector && el.querySelector('[data-de-townbuy]'));
    if (!force && ours && el.dataset && el.dataset.deCommerceSig === sig) return;

    const rows = ids.map(id => {
      const def = SUPPLIES[id];
      const price = priceFor(id, st.tier);
      const left = Number(st.stock[id]) || 0;
      const held = def.held(meta);
      const disabled = left <= 0 || (Number(meta.gold) || 0) < price;
      return `<div class="shop-row" data-de-supply="${id}">` +
        `<span>${def.name} ×1 <small>持有 ${held} · 库存 ${left}</small></span>` +
        `<b>${price} G</b>` +
        `<button type="button" data-de-townbuy="${id}"${disabled ? ' disabled' : ''}>${left > 0 ? '购买' : '售罄'}</button>` +
        `</div>`;
    }).join('');

    el.innerHTML =
      `<p class="dim-note" style="margin:0 0 8px">城镇阶段 ${st.tier} · 本轮补给库存固定；完成一次远征返回后刷新，不会因反复打开商店刷新。</p>` +
      rows +
      `<p class="dim-note" data-de-commerce-note style="margin:8px 0 0">${flashText || '价格按已征服的十层阶段成长；装备交易将在后续价值体系中接入。'}</p>`;
    if (el.dataset) el.dataset.deCommerceSig = sig;
  }

  function dungeonTier(depth = api.depth) {
    return clamp(Math.ceil(Math.max(1, Number(depth) || 1) / 10), 1, 10);
  }

  function dungeonHealPrice(depth = api.depth, hp, maxHp) {
    const p = api.player || {};
    const max = Math.max(1, Number(maxHp) || (typeof api.pMaxHp === 'function' ? Number(api.pMaxHp()) : Number(p.hpBase)) || 1);
    const cur = clamp(Number(hp) || 0, 0, max);
    const missing = max - cur;
    if (missing <= 0) return 0;
    const tier = dungeonTier(depth);
    const t = tier - 1;
    const depthScale = 1 + 0.32 * t + 0.04 * t * t;
    const missingScale = 0.60 + 0.60 * (missing / max);
    return round5((Number(shopCfg.healPrice) || 24) * depthScale * missingScale);
  }

  function activeDungeonThreats(radius = 5) {
    const p = api.player;
    if (!p || !Array.isArray(api.monsters)) return [];
    const r = Math.max(1, Number(radius) || 5);
    return api.monsters.filter(m => {
      if (!m || Number(m.hp) <= 0) return false;
      const dist = Math.abs((Number(m.x) || 0) - (Number(p.x) || 0)) +
        Math.abs((Number(m.y) || 0) - (Number(p.y) || 0));
      return dist <= r || (Number(m.alert) || 0) > 0 || (Number(m.armorBreakCharge) || 0) > 0;
    });
  }

  const unsafeForTrade = () => activeDungeonThreats(5).length > 0;

  function dungeonMessage(text, cls = 'bad') {
    const log = document.getElementById && document.getElementById('log');
    if (log && typeof log.insertAdjacentHTML === 'function') {
      const safe = String(text).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
      log.insertAdjacentHTML('afterbegin', `<div class="${cls}">${safe}</div>`);
    }
    const hint = document.getElementById && document.getElementById('hint');
    if (hint) hint.textContent = `› ${text}`;
  }

  function syncDungeonShop() {
    if (api.state !== 'shop' || !api.player) return 'inactive';
    if (unsafeForTrade()) {
      if (typeof api.closeShop === 'function') api.closeShop();
      dungeonMessage('附近仍有敌人逼近，商人拒绝交易。先把战斗解决掉。');
      return 'blocked';
    }

    const stock = typeof api.getShopStock === 'function' ? api.getShopStock() : null;
    if (!Array.isArray(stock)) return 'missing';
    const index = stock.findIndex(row => row && row.kind === 'heal');
    if (index < 0) return 'no-heal';
    const row = stock[index];
    const max = typeof api.pMaxHp === 'function' ? Math.max(1, Number(api.pMaxHp()) || 1) :
      Math.max(1, Number(api.player.hpBase) || 1);
    const hp = clamp(Number(api.player.hp) || 0, 0, max);
    const missing = max - hp;
    const price = dungeonHealPrice(api.depth, hp, max);
    row.price = price || (Number(shopCfg.healPrice) || 24);
    row.name = missing > 0 ? `包扎伤口（回满 · 缺 ${missing}）` : '包扎伤口（已满血）';

    const list = document.getElementById && document.getElementById('shop-list');
    if (list && typeof list.querySelector === 'function') {
      const btn = list.querySelector(`[data-buy="${index}"]`);
      const host = btn && typeof btn.closest === 'function' ? btn.closest('.shop-row') : null;
      if (btn) btn.disabled = missing <= 0 || (Number(api.player.gold) || 0) < row.price;
      if (host && typeof host.querySelector === 'function') {
        const nameEl = host.querySelector('span');
        const priceEl = host.querySelector('b');
        if (nameEl) nameEl.textContent = row.name;
        if (priceEl) priceEl.textContent = missing > 0 ? `${row.price} G` : '—';
      }
    }
    const goldEl = document.getElementById && document.getElementById('shop-gold');
    if (goldEl) goldEl.textContent = `金币 ${Number(api.player.gold) || 0}`;
    return missing > 0 ? 'synced' : 'full';
  }

  function settleUsedRests(before) {
    if (!Array.isArray(before) || !before.length) return 0;
    let charged = 0;
    for (const rest of before) {
      if (!rest || !rest.used || chargedRests.has(rest)) continue;
      chargedRests.add(rest);
      charged++;
      if (api.state === 'playing' && typeof api.endTurn === 'function') api.endTurn();
      dungeonMessage('包扎伤口耗去一个回合；地牢不会在你休息时停下来。', 'good');
    }
    if (charged && typeof api.persistRun === 'function' && (api.state === 'playing' || api.state === 'town')) {
      api.persistRun();
    }
    return charged;
  }

  function armDungeonServiceSafety() {
    const rests = api.state === 'playing' && Array.isArray(api.npcs)
      ? api.npcs.filter(n => n && n.type === 'rest' && !n.used)
      : [];
    queueMicrotask(() => {
      settleUsedRests(rests);
      syncDungeonShop();
    });
  }

  document.addEventListener('click', e => {
    const btn = e.target && e.target.closest ? e.target.closest('[data-de-townbuy]') : null;
    if (!btn) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    purchase(btn.dataset.deTownbuy);
  }, true);

  document.addEventListener('keydown', armDungeonServiceSafety, true);
  document.addEventListener('click', armDungeonServiceSafety, true);

  const town = document.getElementById('town-screen');
  let observer = null;
  if (town && typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(() => renderShop(false));
    observer.observe(town, { childList: true, subtree: true });
  }

  renderShop(true);
  window.addEventListener('beforeunload', () => { if (observer) observer.disconnect(); }, { once: true });

  window.DE_COMMERCE = {
    version: 'v2',
    tier: townTier,
    priceScale,
    priceFor,
    dungeonTier,
    dungeonHealPrice,
    activeDungeonThreats,
    unsafeForTrade,
    syncDungeonShop,
    settleUsedRests,
    getState: () => ensureState() ? JSON.parse(JSON.stringify(state)) : null,
    refreshForDebug() { state = freshState(); saveState(); renderShop(true); },
  };
})();
