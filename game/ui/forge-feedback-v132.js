/* Dungeon Echo forge feedback v1.3.2.
 * Presentation-only observer for the canonical town forge owned by game/core/game.js.
 * It snapshots one forge click before core handles it, then compares the same item after
 * core completes the synchronous mutation. It never performs a forge, spends Gold, writes
 * storage, owns input, creates Canvas, or changes DE_TEST gameplay APIs.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_FORGE_FEEDBACK_V132) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100') return;

  const localeData = window.DE_LOCALE_DATA || null;
  const routeLang = String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase();
  const english = localeData ? !!localeData.isEnglish : routeLang === 'en';
  const copy = (zh, en) => english ? en : zh;
  const defer = typeof queueMicrotask === 'function' ? queueMicrotask : (fn => Promise.resolve().then(fn));
  const MAX_FORGE = 5;
  let pending = null;
  let toastTimer = 0;
  let decorateQueued = false;

  const esc = value => String(value).replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
  }[ch]));
  const LABELS = Object.freeze({
    atk:['攻击','ATK'], def:['防御','DEF'], hp:['生命','HP'], crit:['暴击','Crit'],
    leech:['吸血','Leech'], gold:['金币获取','Gold Find'], thorns:['反伤','Thorns'], regen:['击杀回复','Kill Heal'],
  });
  const percentStat = key => key === 'crit' || key === 'leech' || key === 'gold';

  function itemAt(where, index) {
    const meta = api.meta;
    if (!meta) return null;
    const list = where === 'stash' ? meta.stash : meta.bag;
    return Array.isArray(list) ? list[index] || null : null;
  }

  function snapshot(item) {
    if (!item) return null;
    return Object.freeze({
      item,
      forge: Math.max(0, Number(item.forge) || 0),
      stats: Object.freeze({ ...(item.stats || {}) }),
      gold: Math.max(0, Number(api.meta && api.meta.gold) || 0),
    });
  }

  function visibleName(item) {
    if (localeData && typeof localeData.itemName === 'function') return localeData.itemName(item);
    return String(item && item.name || '');
  }

  function statDelta(before, after) {
    const out = [];
    const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
    for (const key of keys) {
      const delta = (Number(after && after[key]) || 0) - (Number(before && before[key]) || 0);
      if (!delta) continue;
      if (localeData && typeof localeData.affixText === 'function') {
        out.push(localeData.affixText(key, delta));
        continue;
      }
      const pair = LABELS[key] || [key, key];
      out.push(`${english ? pair[1] : pair[0]} +${delta}${percentStat(key) ? '%' : ''}`);
    }
    return out;
  }

  function stageText(item) {
    const level = Math.max(0, Math.min(MAX_FORGE, Number(item && item.forge) || 0));
    return copy(`锻造 +${level}/${MAX_FORGE}`, `Forge +${level}/${MAX_FORGE}`);
  }

  function ensureStyle() {
    if (document.getElementById('de-forge-feedback-v132-style')) return;
    const style = document.createElement('style');
    style.id = 'de-forge-feedback-v132-style';
    style.textContent = `
      #de-forge-toast-v132{position:fixed;left:50%;top:16%;transform:translateX(-50%);z-index:10020;min-width:280px;max-width:min(520px,calc(100vw - 28px));padding:11px 14px;border:1px solid rgba(224,167,58,.48);border-radius:10px;background:linear-gradient(180deg,rgba(34,22,14,.97),rgba(14,11,9,.97));box-shadow:0 12px 38px rgba(0,0,0,.48),inset 0 1px rgba(255,232,180,.06);color:#e9dac0;font:600 12px/1.45 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;pointer-events:none}
      #de-forge-toast-v132 b{display:block;color:#f3d47e;font-size:13px;margin-bottom:2px}
      #de-forge-toast-v132 small{display:block;color:#ac9a84;font-weight:500;margin-top:2px}
      .de-forge-stage-v132{display:block!important;margin-top:3px!important;color:#c9ad72!important;font-size:10px!important;letter-spacing:.02em}
      .de-forge-stage-v132.max{color:#e9c467!important;text-shadow:0 0 8px rgba(224,167,58,.25)}
      @media(max-width:700px){#de-forge-toast-v132{top:11%;min-width:0;width:calc(100vw - 28px)}}
      @media(prefers-reduced-motion:reduce){#de-forge-toast-v132{transition:none}}
    `;
    document.head.appendChild(style);
  }

  function showToast(title, detail, sub) {
    ensureStyle();
    let el = document.getElementById('de-forge-toast-v132');
    if (!el) {
      el = document.createElement('div');
      el.id = 'de-forge-toast-v132';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.innerHTML = `<b>${esc(title)}</b>${detail ? `<div>${esc(detail)}</div>` : ''}${sub ? `<small>${esc(sub)}</small>` : ''}`;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }

  function decorateRows() {
    decorateQueued = false;
    if (api.state !== 'town' || !api.meta) return false;
    let changed = false;
    for (const button of document.querySelectorAll('[data-forge]')) {
      const [where, rawIndex] = String(button.dataset.forge || '').split(':');
      const item = itemAt(where, Number(rawIndex));
      const row = button.closest('.town-row');
      const label = row && row.children && row.children[0];
      if (!item || !label) continue;
      let badge = label.querySelector('.de-forge-stage-v132');
      if (!badge) {
        badge = document.createElement('small');
        badge.className = 'de-forge-stage-v132';
        label.appendChild(badge);
        changed = true;
      }
      const next = stageText(item);
      if (badge.textContent !== next) { badge.textContent = next; changed = true; }
      badge.classList.toggle('max', (Number(item.forge) || 0) >= MAX_FORGE);
    }
    return changed;
  }

  function scheduleDecorate() {
    if (decorateQueued) return false;
    decorateQueued = true;
    defer(decorateRows);
    return true;
  }

  function beforeForge(event) {
    const target = event && event.target;
    const button = target && typeof target.closest === 'function' ? target.closest('[data-forge]') : null;
    if (!button || api.state !== 'town') return;
    const [where, rawIndex] = String(button.dataset.forge || '').split(':');
    const index = Number(rawIndex);
    const item = itemAt(where, index);
    if (!item) return;
    pending = Object.freeze({ where, index, before:snapshot(item) });
  }

  function afterForge(event) {
    const target = event && event.target;
    const button = target && typeof target.closest === 'function' ? target.closest('[data-forge]') : null;
    if (!button || !pending) {
      if (api.state === 'town') scheduleDecorate();
      return;
    }
    const record = pending;
    pending = null;
    const item = itemAt(record.where, record.index);
    if (!item || item !== record.before.item) { scheduleDecorate(); return; }
    const after = snapshot(item);
    if (!after || after.forge <= record.before.forge) { scheduleDecorate(); return; }
    const deltas = statDelta(record.before.stats, after.stats);
    const spent = Math.max(0, record.before.gold - after.gold);
    const title = copy(`强化成功 · +${record.before.forge} → +${after.forge}`, `Forge success · +${record.before.forge} → +${after.forge}`);
    const detail = [visibleName(item), ...deltas].filter(Boolean).join(' · ');
    const sub = copy(`消耗 ${spent} 金币 · ${stageText(item)}`, `Spent ${spent} Gold · ${stageText(item)}`);
    showToast(title, detail, sub);
    scheduleDecorate();
  }

  document.addEventListener('click', beforeForge, true);
  document.addEventListener('click', afterForge, false);
  document.addEventListener('click', () => { if (api.state === 'town') scheduleDecorate(); }, false);
  document.addEventListener('keydown', () => defer(() => { if (api.state === 'town') scheduleDecorate(); }), false);
  window.addEventListener('focus', () => { if (api.state === 'town') scheduleDecorate(); });
  window.addEventListener('pageshow', () => { if (api.state === 'town') scheduleDecorate(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && api.state === 'town') scheduleDecorate(); });

  ensureStyle();
  if (api.state === 'town') scheduleDecorate();
  window.__DE_FORGE_FEEDBACK_V132 = Object.freeze({
    version:'v1.3.2', owner:'forge-feedback-v132', locale:english?'en':'zh-CN', maxForge:MAX_FORGE,
    snapshot, statDelta, stageText, decorateRows, scheduleDecorate, showToast,
  });
})();
