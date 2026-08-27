/* Dungeon Echo production forge refinement v2.
 * Keeps the core deterministic +1..+5 forge ladder, then adds one build-defining
 * refinement decision at +3 and an automatic masterwork completion at +5.
 *
 * Existing legacy items that were already forged past +3 before this module existed are
 * not rewritten. New refinement metadata is stored directly on the item and therefore
 * survives the existing meta JSON save path without changing core save schema.
 *
 * v2 removes the permanent 500ms pending-choice poll. Restored +3 choices are reopened
 * from real input/focus/visibility transitions, and forge UI strings are localized at the
 * render boundary instead of relying on DOM mutation translation.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_FORGE_SYSTEM) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100') return;
  window.__DE_FORGE_SYSTEM = 'v2';

  const META_KEY = 'de-greedy-meta-v1';
  const defer = typeof queueMicrotask === 'function' ? queueMicrotask : (fn => Promise.resolve().then(fn));
  let pendingForge = null;
  let activeItem = null;
  let pendingScanQueued = false;

  const PATHS = {
    weapon: [
      { id: 'keen', name: '锋锐', nameEn: 'Keen', desc: '更稳定地走暴击路线。', descEn: 'Commit the weapon to a steadier critical-hit route.', refine: { crit: 4 }, master: { crit: 4 } },
      { id: 'blooded', name: '饮血', nameEn: 'Blooded', desc: '用持续吸血换取推进续航。', descEn: 'Trade raw burst for sustained leech while pushing deeper.', refine: { leech: 3 }, master: { leech: 3 } },
    ],
    armor: [
      { id: 'bastion', name: '壁垒', nameEn: 'Bastion', desc: '把生存重心转向生命，而不是继续堆纯 DEF。', descEn: 'Shift survivability toward HP instead of stacking only DEF.', refine: { hp: 20 }, master: { hp: 20 } },
      { id: 'barbed', name: '荆棘', nameEn: 'Barbed', desc: '近战换血时获得更强反伤收益。', descEn: 'Gain stronger thorns value when trading hits in melee.', refine: { thorns: 5 }, master: { thorns: 5 } },
    ],
    helmet: [
      { id: 'vital', name: '生息', nameEn: 'Vital', desc: '扩大生命池，提高失误容错。', descEn: 'Expand the HP pool to increase room for mistakes.', refine: { hp: 18 }, master: { hp: 18 } },
      { id: 'restoring', name: '回春', nameEn: 'Restoring', desc: '强化击杀后的长期续航。', descEn: 'Strengthen long-run sustain after kills.', refine: { regen: 3 }, master: { regen: 2 } },
    ],
    boots: [
      { id: 'stout', name: '稳步', nameEn: 'Stout', desc: '以生命换取稳定推进。', descEn: 'Use extra HP to make forward progress more forgiving.', refine: { hp: 16 }, master: { hp: 16 } },
      { id: 'hunter', name: '猎步', nameEn: 'Hunter', desc: '轻量暴击方向，适合游侠/刺客等主动拉扯构筑。', descEn: 'A light crit route for Ranger/Assassin kiting builds.', refine: { crit: 3 }, master: { crit: 3 } },
    ],
    ring: [
      { id: 'precision', name: '洞察', nameEn: 'Precision', desc: '把戒指定型为暴击核心。', descEn: 'Turn the ring into a critical-hit centerpiece.', refine: { crit: 5 }, master: { crit: 5 } },
      { id: 'sanguine', name: '血契', nameEn: 'Sanguine', desc: '把戒指定型为吸血续航核心。', descEn: 'Turn the ring into a leech-and-sustain centerpiece.', refine: { leech: 4 }, master: { leech: 4 } },
    ],
    amulet: [
      { id: 'fury', name: '狂意', nameEn: 'Fury', desc: '直接强化攻击，适合高压输出路线。', descEn: 'Directly increase ATK for high-pressure damage routes.', refine: { atk: 3 }, master: { atk: 3 } },
      { id: 'focus', name: '凝神', nameEn: 'Focus', desc: '把项链定型为暴击/爆发方向。', descEn: 'Commit the amulet to a crit-and-burst route.', refine: { crit: 5 }, master: { crit: 5 } },
    ],
  };

  const esc = value => String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));

  const isEnglish = () => !!(window.DE_I18N && window.DE_I18N.isEnglish);
  const ui = (zh, en) => isEnglish() ? en : zh;
  const translate = value => {
    const src = String(value == null ? '' : value);
    const i18n = window.DE_I18N;
    if (!isEnglish() || !i18n || typeof i18n.translate !== 'function') return src;
    try { return String(i18n.translate(src)); } catch (_e) { return src; }
  };

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

  function pathLabel(path) {
    return path ? (isEnglish() ? path.nameEn : path.name) : '';
  }

  function displayItemName(item) {
    if (!item) return '';
    const path = pathFor(item);
    if (!path) return translate(item.name);
    const base = translate(item.refineBaseName || String(item.name || '').split(' · ')[0]);
    const suffix = item.masterworked ? ui(' · 淬炼', ' · Masterwork') : '';
    return `${base} · ${pathLabel(path)}${suffix}`;
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
        const fit = Number(item.score) || 0;
        const value = typeof api.itemValueScore === 'function' ? api.itemValueScore(item) : fit;
        const metric = ui(`适配 ${fit} · 价值 ${value}`, `Fit ${fit} · Value ${value}`);
        label.innerHTML = `${esc(displayItemName(item))}${forgeTag}<small>${esc(metric)}</small>`;
      }
      const sell = row.querySelector ? row.querySelector('[data-sell]') : null;
      if (sell && typeof api.sellPrice === 'function') {
        const price = api.sellPrice(item);
        sell.textContent = ui(`卖 ${price}G`, `Sell ${price}G`);
        sell.title = ui(`出售得 ${price} G`, `Sell for ${price} G`);
      }
      if (typeof api.forgeCost === 'function') {
        const lvl = Number(item.forge) || 0;
        const maxed = lvl >= 5;
        const cost = api.forgeCost(item);
        btn.title = maxed
          ? ui('已至 +5 极致', 'Maxed at +5')
          : ui(`强化到 +${lvl + 1}，需 ${cost} G`, `Forge to +${lvl + 1} · Cost ${cost} G`);
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
    const zh = { atk: '攻击', def: '防御', hp: '生命', crit: '暴击%', leech: '吸血%', thorns: '反伤', regen: '击杀回复' };
    const en = { atk: 'ATK', def: 'DEF', hp: 'HP', crit: 'Crit%', leech: 'Leech%', thorns: 'Thorns', regen: 'Kill Heal' };
    const labels = isEnglish() ? en : zh;
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
    // Save data stays language-neutral in behavior: canonical item names remain Chinese-era
    // compatibility strings, while the renderer chooses the visible locale.
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
    const title = ui(
      `+3 精炼：为【${displayItemName(item)}】定一个方向`,
      `+3 Refinement: choose a path for [${displayItemName(item)}]`
    );
    const copy = ui(
      '精炼不会失败，也不会毁坏装备。这个选择会在 +5 时继续淬炼强化。',
      'Refinement cannot fail or destroy the item. Your choice receives a second upgrade at +5.'
    );
    el.innerHTML = `
      <div class="de-forge-card" role="dialog" aria-modal="true" aria-labelledby="de-forge-title">
        <h3 id="de-forge-title">${esc(title)}</h3>
        <p>${esc(copy)}</p>
        <div class="de-forge-grid">${rows.map(r =>
          `<button type="button" class="de-forge-choice" data-de-refine="${r.id}"><b>${esc(pathLabel(r))} · ${esc(statText(r.refine))}</b><small>${esc(isEnglish() ? r.descEn : r.desc)}</small></button>`
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
    syncTownRows();
  }

  function schedulePendingScan() {
    if (pendingScanQueued) return;
    pendingScanQueued = true;
    defer(() => {
      pendingScanQueued = false;
      scanPending();
    });
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

  // Pending +3 choices are reopened from real lifecycle/input transitions. This covers
  // restored saves entering town and removes the permanent 500ms follower from production.
  document.addEventListener('keydown', schedulePendingScan, true);
  document.addEventListener('click', schedulePendingScan, true);
  document.addEventListener('visibilitychange', schedulePendingScan);
  window.addEventListener('focus', schedulePendingScan);
  window.addEventListener('load', schedulePendingScan, { once: true });
  defer(scanPending);

  window.DE_FORGE_REFINEMENT = {
    version: 'v2',
    paths: PATHS,
    applyMasterwork,
    open: openRefine,
    scanPending,
    schedulePendingScan,
    syncTownRows,
    displayItemName,
  };
})();