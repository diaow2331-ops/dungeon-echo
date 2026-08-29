/* Dungeon Echo underground shop equipment preview v4.
 * Presentation-only: reuses the shipped v13 tier resolver to preview the actual
 * equipment offered by the dungeon merchant. It never changes stock, price, purchases
 * or production UX boot order.
 *
 * v4 adds class-fit deltas against the currently equipped item so shopping decisions
 * are readable without reducing every build choice to raw item rarity.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_EQUIPMENT_SHOP_ART) return;

  const api = window.DE_TEST;
  const tierArt = window.__DE_EQUIPMENT_TIER_ART;
  if (!api || typeof api.getShopStock !== 'function' || !tierArt || typeof tierArt.sourceForItem !== 'function') return;

  const routeLang = String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase();
  const english = routeLang === 'en';
  const t = (zh, en) => english ? en : zh;
  const SHEETS = Object.freeze({
    weapon: { url: 'art/equipment-weapons-v13.png', cols: 6, rows: 4 },
    wearable: { url: 'art/equipment-wearables-v13.png', cols: 6, rows: 5 },
  });
  const MOVEMENT_KEYS = new Set(['ArrowUp','ArrowLeft','ArrowDown','ArrowRight','w','W','a','A','s','S','d','D']);
  const defer = typeof queueMicrotask === 'function' ? queueMicrotask : (fn => Promise.resolve().then(fn));

  const preload = [];
  if (typeof Image !== 'undefined') {
    for (const sheet of Object.values(SHEETS)) {
      const img = new Image();
      img.decoding = 'async';
      img.src = sheet.url;
      preload.push(img);
    }
  }

  const style = document.createElement('style');
  style.id = 'de-equipment-shop-art-v1';
  style.textContent = `
    #shop-list .shop-equip-label{display:inline-flex;align-items:center;gap:10px;min-width:0;flex-wrap:wrap}
    #shop-list .shop-equip-art{display:inline-block;width:36px;height:36px;flex:0 0 36px;background-repeat:no-repeat;image-rendering:pixelated;filter:drop-shadow(0 2px 2px rgba(0,0,0,.72))}
    #shop-list .shop-equip-fit{display:block;flex-basis:100%;margin-left:46px;color:#948674;font:700 10px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace}
    #shop-list .shop-equip-fit.up{color:#8dbb87}#shop-list .shop-equip-fit.down{color:#c48778}#shop-list .shop-equip-fit.new{color:#d6b665}
    @media(max-width:700px){#shop-list .shop-equip-art{width:30px;height:30px;flex-basis:30px}#shop-list .shop-equip-fit{margin-left:40px}}
  `;
  if (document.head) document.head.appendChild(style);

  function applyArt(el, item) {
    if (!el || !item) return false;
    const src = tierArt.sourceForItem(item);
    if (!src) return false;
    const [sheetId, sx, sy] = src;
    const sheet = SHEETS[sheetId];
    if (!sheet) return false;
    const px = sheet.cols > 1 ? sx / (sheet.cols - 1) * 100 : 0;
    const py = sheet.rows > 1 ? sy / (sheet.rows - 1) * 100 : 0;
    el.style.backgroundImage = `url("${sheet.url}")`;
    el.style.backgroundSize = `${sheet.cols * 100}% ${sheet.rows * 100}%`;
    el.style.backgroundPosition = `${px}% ${py}%`;
    return true;
  }

  function fitScore(item) {
    if (!item || !item.stats) return 0;
    if (typeof window.DE_EQUIP_FIT_SCORE === 'function') return Number(window.DE_EQUIP_FIT_SCORE(item.stats)) || 0;
    return Number(item.fitScore) || Number(item.score) || 0;
  }

  function fitText(item) {
    const p = api.player;
    const slot = item && item.slot;
    const current = p && p.equip && slot ? p.equip[slot] : null;
    const next = fitScore(item);
    if (!current) return { cls:'new', text:t(`职业适配 ${next} · 新部位`, `Class fit ${next} · empty slot`) };
    const prev = fitScore(current);
    const delta = next - prev;
    if (delta > 0) return { cls:'up', text:t(`职业适配 ${next} · 比当前 +${delta}`, `Class fit ${next} · +${delta} vs equipped`) };
    if (delta < 0) return { cls:'down', text:t(`职业适配 ${next} · 比当前 ${delta}`, `Class fit ${next} · ${delta} vs equipped`) };
    return { cls:'same', text:t(`职业适配 ${next} · 与当前持平`, `Class fit ${next} · even with equipped`) };
  }

  function sync() {
    queued = false;
    if (api.state !== 'shop') return 0;
    const root = document.getElementById('shop-list');
    if (!root) return 0;
    const stock = api.getShopStock();
    if (!Array.isArray(stock)) return 0;
    let changed = 0;
    for (const row of Array.from(root.querySelectorAll('.shop-row'))) {
      const buy = row.querySelector('[data-buy]');
      if (!buy) continue;
      const i = Number(buy.getAttribute('data-buy'));
      const offer = Number.isInteger(i) && i >= 0 ? stock[i] : null;
      if (!offer || offer.kind !== 'equip' || !offer.item) continue;
      const label = row.querySelector('span');
      if (!label) continue;
      let icon = label.querySelector('.shop-equip-art');
      if (!icon) {
        icon = document.createElement('span');
        icon.className = 'shop-equip-art';
        icon.setAttribute('aria-hidden', 'true');
        label.insertBefore(icon, label.firstChild || null);
        label.classList.add('shop-equip-label');
      }
      if (applyArt(icon, offer.item)) changed++;

      let note = label.querySelector('.shop-equip-fit');
      if (!note) {
        note = document.createElement('small');
        note.className = 'shop-equip-fit';
        label.appendChild(note);
      }
      const fit = fitText(offer.item);
      note.className = `shop-equip-fit ${fit.cls}`;
      if (note.textContent !== fit.text) note.textContent = fit.text;
    }
    return changed;
  }

  let queued = false;
  function schedule() {
    if (queued) return false;
    queued = true;
    defer(sync);
    return true;
  }

  function scheduleFromKey(e) {
    if (api.state === 'shop' || MOVEMENT_KEYS.has(String(e && e.key || ''))) schedule();
  }

  function scheduleFromClick(e) {
    const target = e && e.target;
    if (api.state === 'shop') { schedule(); return; }
    if (!target || typeof target.closest !== 'function') return;
    if (target.closest('#game')) schedule();
  }

  document.addEventListener('keydown', scheduleFromKey, true);
  document.addEventListener('click', scheduleFromClick, true);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && api.state === 'shop') schedule(); });
  window.addEventListener('focus', () => { if (api.state === 'shop') schedule(); });
  window.addEventListener('pageshow', () => { if (api.state === 'shop') schedule(); });
  if (api.state === 'shop') schedule();

  window.__DE_EQUIPMENT_SHOP_ART = {
    version:'v4', owner:'equipment-shop-ui', locale:english?'en':'zh-CN', sync, schedule, scheduleFromKey, scheduleFromClick, applyArt, fitScore, fitText, preload,
    movementKeys:MOVEMENT_KEYS,
  };
})();
