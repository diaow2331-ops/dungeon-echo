/* Dungeon Echo production forge refinement v1.
 * Keeps the core deterministic +1..+5 forge ladder, then adds one build-defining
 * refinement decision at +3 and an automatic masterwork completion at +5.
 *
 * Existing legacy items that were already forged past +3 before this module existed are
 * not rewritten. New refinement metadata is stored directly on the item and therefore
 * survives the existing meta JSON save path without changing core save schema.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_FORGE_SYSTEM) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100') return;
  window.__DE_FORGE_SYSTEM = 'v1';

  const META_KEY = 'de-greedy-meta-v1';
  let pendingForge = null;
  let activeItem = null;

  const PATHS = {
    weapon: [
      { id: 'keen', name: '锋锐', desc: '更稳定地走暴击路线。', refine: { crit: 4 }, master: { crit: 4 } },
      { id: 'blooded', name: '饮血', desc: '用持续吸血换取推进续航。', refine: { leech: 3 }, master: { leech: 3 } },
    ],
    armor: [
      { id: 'bastion', name: '壁垒', desc: '把生存重心转向生命，而不是继续堆纯 DEF。', refine: { hp: 20 }, master: { hp: 20 } },
      { id: 'barbed', name: '荆棘', desc: '近战换血时获得更强反伤收益。', refine: { thorns: 5 }, master: { thorns: 5 } },
    ],
    helmet: [
      { id: 'vital', name: '生息', desc: '扩大生命池，提高失误容错。', refine: { hp: 18 }, master: { hp: 18 } },
      { id: 'restoring', name: '回春', desc: '强化击杀后的长期续航。', refine: { regen: 3 }, master: { regen: 2 } },
    ],
    boots: [
      { id: 'stout', name: '稳步', desc: '以生命换取稳定推进。', refine: { hp: 16 }, master: { hp: 16 } },
      { id: 'hunter', name: '猎步', desc: '轻量暴击方向，适合游侠/刺客等主动拉扯构筑。', refine: { crit: 3 }, master: { crit: 3 } },
    ],
    ring: [
      { id: 'precision', name: '洞察', desc: '把戒指定型为暴击核心。', refine: { crit: 5 }, master: { crit: 5 } },
      { id: 'sanguine', name: '血契', desc: '把戒指定型为吸血续航核心。', refine: { leech: 4 }, master: { leech: 4 } },
    ],
    amulet: [
      { id: 'fury', name: '狂意', desc: '直接强化攻击，适合高压输出路线。', refine: { atk: 3 }, master: { atk: 3 } },
      { id: 'focus', name: '凝神', desc: '把项链定型为暴击/爆发方向。', refine: { crit: 5 }, master: { crit: 5 } },
    ],
  };

  const esc = value => String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));

  function saveMeta() {
    const meta = api.meta;
    if (!meta) return;
    try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) { /* storage unavailable */ }
  }

  function itemAt(where, index) {
    const meta = api.meta;
    if (!meta) return null;
    const arr = where === 'stash' ? meta.stash : meta.bag;
    return Array.isArray(arr) ? arr[index] || null : null;
  }

  function addStats(item, stats) {
    if (!item || !stats) return;
    item.stats = item.stats || {};
    for (const [k, v] of Object.entries(stats)) item.stats[k] = (Number(item.stats[k]) || 0) + Number(v || 0);
    const fit = window.DE_EQUIP_FIT_SCORE;
    item.score = typeof fit === 'function'
      ? fit(item.stats)
      : (typeof api.eqScoreOf === 'function' ? api.eqScoreOf(item.stats) : Number(item.score) || 0);
    item.fitScore = item.score;
  }

  function pathFor(item) {
    const rows = PATHS[item && item.slot] || PATHS.armor;
    return rows.find(r => r.id === item.refinePath) || null;
  }

  function syncTownRows() {
    if (api.state !== 'town' || !api.meta) return;
    document.querySelectorAll('[data-forge]').forEach(btn => {
      const parts = String(btn.dataset.forge || '').split(':');
      const where = parts[0];
      const index = Number(parts[1]);
      const item = itemAt(where, index);
      const row = btn.closest ? btn.closest('.town-row') : null;
      if (!item || !row) return;
      const label = row.children && row.children[0];
      if (label) {
        const forgeTag = item.forge ? ` +${item.forge}` : '';
        const value = typeof api.itemValueScore === 'function' ? api.itemValueScore(item) : (Number(item.score) || 0);
        label.innerHTML = `${esc(item.name)}${forgeTag}<small>适配 ${Number(item.score) || 0} · 价值 ${value}</small>`;
      }
      const sell = row.querySelector ? row.querySelector('[data-sell]') : null;
      if (sell && typeof api.sellPrice === 'function') {
        const price = api.sellPrice(item);
        sell.textContent = `卖 ${price}G`;
        sell.title = `出售得 ${price} G`;
      }
      if (typeof api.forgeCost === 'function') {
        const lvl = Number(item.forge) || 0;
        const maxed = lvl >= 5;
        const cost = api.forgeCost(item);
        btn.title = maxed ? '已至 +5 极致' : `强化到 +${lvl + 1}，需 ${cost} G`;
      }
    });
  }

  function ensureStyle() {
    if (document.getElementById('de-forge-style')) return;
    const style = document.createElement('style');
    style.id = 'de-forge-style';
    style.textContent = `
      #de-forge-refine{position:fixed;inset:0;z-index:9998;display:grid;place-items:center;background:rgba(7,5,4,.78);backdrop-filter:blur(2px)}
      #de-forge-refine .de-forge-card{width:min(680px,calc(100vw - 32px));padding:22px;border:1px solid rgba(224,167,58,.42);border-radius:12px;background:#18100c;box-shadow:0 18px 70px rgba(0,0,0,.55)}
      #de-forge-refine h3{margin:0 0 8px;color:#f2d27b}#de-forge-refine p{margin:6px 0 14px;color:#b7a48d}
      #de-forge-refine .de-forge-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      #de-forge-refine button{padding:14px;text-align:left}.de-forge-choice b{display:block;margin-bottom:5px;color:#f1d28a}.de-forge-choice small{display:block;color:#a99986;line-height:1.45}
      @media(max-width:620px){#de-forge-refine .de-forge-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function statText(stats) {
    const labels = { atk: '攻击', def: '防御', hp: '生命', crit: '暴击%', leech: '吸血%', thorns: '反伤', regen: '击杀回复' };
    return Object.entries(stats || {}).map(([k, v]) => `${labels[k] || k} +${v}`).join(' · ');
  }

  function closeRefine() {
    const el = document.getElementById('de-forge-refine');
    if (el) el.remove();
    activeItem = null;
  }

  function chooseRefine(item, path) {
    if (!item || !path || item.refinePath) return;
    item.refineBaseName = item.refineBaseName || item.name;
    item.refinePath = path.id;
    item.refineName = path.name;
    item.refineVersion = 1;
    item.refinePending = false;
    addStats(item, path.refine);
    item.name = `${item.refineBaseName} · ${path.name}`;
    saveMeta();
    closeRefine();
    syncTownRows();
  }

  function openRefine(item) {
    if (!item || item.refinePath || !item.refinePending) return;
    const rows = PATHS[item.slot] || PATHS.armor;
    ensureStyle();
    closeRefine();
    activeItem = item;
    const el = document.createElement('div');
    el.id = 'de-forge-refine';
    el.innerHTML = `
      <div class="de-forge-card" role="dialog" aria-modal="true" aria-labelledby="de-forge-title">
        <h3 id="de-forge-title">+3 精炼：为【${esc(item.name)}】定一个方向</h3>
        <p>精炼不会失败，也不会毁坏装备。这个选择会在 +5 时继续淬炼强化。</p>
        <div class="de-forge-grid">${rows.map(r =>
          `<button type="button" class="de-forge-choice" data-de-refine="${r.id}"><b>${esc(r.name)} · ${esc(statText(r.refine))}</b><small>${esc(r.desc)}</small></button>`
        ).join('')}</div>
      </div>`;
    document.body.appendChild(el);
  }

  function applyMasterwork(item) {
    if (!item || item.masterworked || (Number(item.forge) || 0) < 5) return false;
    const path = pathFor(item);
    if (!path) return false;
    addStats(item, path.master);
    item.masterworked = true;
    item.masterworkVersion = 1;
    const base = item.refineBaseName || item.name;
    item.name = `${base} · ${path.name}·淬炼`;
    saveMeta();
    syncTownRows();
    return true;
  }

  function markRefinePending(item) {
    if (!item || item.refinePath || item.refinePending) return;
    item.refinePending = true;
    item.refineVersion = 1;
    saveMeta();
    openRefine(item);
  }

  function scanPending() {
    if (api.state !== 'town' || !api.meta || document.getElementById('de-forge-refine')) return;
    const pools = [...(api.meta.bag || []), ...(api.meta.stash || [])];
    const item = pools.find(it => it && it.refinePending && !it.refinePath);
    if (item) openRefine(item);
  }

  // Record the exact item/forge level before the core town handler performs its normal
  // deterministic +1 step. We do not stop propagation; the old forge cost and base stat
  // increment remain canonical.
  document.addEventListener('click', e => {
    const btn = e.target && e.target.closest ? e.target.closest('[data-forge]') : null;
    if (!btn || api.state !== 'town') return;
    const parts = String(btn.dataset.forge || '').split(':');
    const where = parts[0];
    const index = Number(parts[1]);
    const item = itemAt(where, index);
    pendingForge = item ? { where, index, item, before: Number(item.forge) || 0 } : null;
  }, true);

  // game.js registered its bubbling town handler before this dynamically loaded module,
  // so this listener observes the completed forge result without duplicating cost logic.
  document.addEventListener('click', e => {
    const btn = e.target && e.target.closest ? e.target.closest('[data-forge]') : null;
    if (!btn || !pendingForge) return;
    const p = pendingForge;
    pendingForge = null;
    const item = itemAt(p.where, p.index);
    if (!item || item !== p.item) return;
    const after = Number(item.forge) || 0;
    if (after !== p.before + 1) return;

    if (after === 3 && !item.refinePath) markRefinePending(item);
    if (after === 5 && item.refinePath && !item.masterworked) applyMasterwork(item);
    syncTownRows();
  }, false);

  document.addEventListener('click', e => {
    const btn = e.target && e.target.closest ? e.target.closest('[data-de-refine]') : null;
    if (!btn || !activeItem) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const rows = PATHS[activeItem.slot] || PATHS.armor;
    const path = rows.find(r => r.id === btn.dataset.deRefine);
    if (path) chooseRefine(activeItem, path);
  }, true);

  // Pending +3 choices are rare; reuse one small observer timer rather than tying this
  // feature to core renderTown internals. It does no work outside town.
  const timer = setInterval(scanPending, 500);
  window.addEventListener('beforeunload', () => clearInterval(timer), { once: true });

  window.DE_FORGE_REFINEMENT = {
    paths: PATHS,
    applyMasterwork,
    open: openRefine,
  };
})();