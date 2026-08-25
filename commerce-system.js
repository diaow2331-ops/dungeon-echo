/* Dungeon Echo production commerce v1.
 * Owns town supply stock and chapter-scaled consumable pricing for classic-100.
 *
 * Design goals:
 * - opening the town panel never rerolls stock;
 * - stock refreshes only when a new expedition cycle returns (meta.runs changes) or a
 *   new 10-floor town tier is reached;
 * - common supplies stay finite and economically relevant across the 1→100 journey;
 * - the module uses its own small localStorage record so core meta sanitization does not
 *   have to know about merchant stock yet.
 *
 * Equipment offers and intrinsic buy/sell valuation remain follow-up work under #10/#3.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_COMMERCE_SYSTEM) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100') return;
  window.__DE_COMMERCE_SYSTEM = 'v1';

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

  function townTier() {
    const best = Math.max(1, Number(api.meta && api.meta.bestDepth) || 1);
    return clamp(Math.ceil(best / 10), 1, 10);
  }

  function priceScale(tier = townTier()) {
    // A chapter curve, not raw-floor inflation. Tier 1 keeps the historical baseline;
    // tier 10 is ~10x, while supply quantities are finite. This is deliberately an
    // interim anchor until #7 audits the full 1→100 gold curve.
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
    const ours = !!el.querySelector('[data-de-townbuy]');
    if (!force && ours && el.dataset.deCommerceSig === sig) return;

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
    el.dataset.deCommerceSig = sig;
  }

  // Our buttons intentionally do not use the core `data-townbuy` attribute. Commerce owns
  // the transaction and finite stock; the old unlimited town buyer never sees the click.
  document.addEventListener('click', e => {
    const btn = e.target && e.target.closest ? e.target.closest('[data-de-townbuy]') : null;
    if (!btn) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    purchase(btn.dataset.deTownbuy);
  }, true);

  // Core town actions frequently call renderTown(), which rewrites #town-shop with the
  // legacy unlimited list. Observe that surface and immediately restore the production
  // merchant without adding another polling interval.
  const town = document.getElementById('town-screen');
  let observer = null;
  if (town && typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(() => renderShop(false));
    observer.observe(town, { childList: true, subtree: true });
  }

  // Initial town entry may already be rendered before this dynamically loaded module.
  renderShop(true);
  window.addEventListener('beforeunload', () => { if (observer) observer.disconnect(); }, { once: true });

  window.DE_COMMERCE = {
    tier: townTier,
    priceScale,
    priceFor,
    getState: () => ensureState() ? JSON.parse(JSON.stringify(state)) : null,
    refreshForDebug() { state = freshState(); saveState(); renderShop(true); },
  };
})();