/* Dungeon Echo underground shop equipment preview v1.
 * Presentation-only: reuses the shipped v13 tier resolver to preview the actual
 * equipment offered by the dungeon merchant. It never changes stock, price or purchases.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_EQUIPMENT_SHOP_ART) return;

  const api = window.DE_TEST;
  const tierArt = window.__DE_EQUIPMENT_TIER_ART;
  if (!api || typeof api.getShopStock !== 'function' || !tierArt || typeof tierArt.sourceForItem !== 'function') return;

  const SHEETS = Object.freeze({
    weapon: { url: 'art/equipment-weapons-v13.png', cols: 6, rows: 4 },
    wearable: { url: 'art/equipment-wearables-v13.png', cols: 6, rows: 5 },
  });

  // Warm both v13 atlases as soon as the visual layer is ready. They are reused by the
  // dungeon bag, equipment bar, character overlay, town and merchant UI, so starting the
  // requests here avoids a visible first-open decode/load flash without touching gameplay.
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
    #shop-list .shop-equip-label{display:inline-flex;align-items:center;gap:10px;min-width:0}
    #shop-list .shop-equip-art{display:inline-block;width:36px;height:36px;flex:0 0 36px;background-repeat:no-repeat;image-rendering:pixelated;filter:drop-shadow(0 2px 2px rgba(0,0,0,.72))}
    @media(max-width:700px){#shop-list .shop-equip-art{width:30px;height:30px;flex-basis:30px}}
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

  function sync() {
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
    }
    return changed;
  }

  const root = document.getElementById('shop-list');
  let observer = null;
  if (root && typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(sync);
    observer.observe(root, { childList: true, subtree: true });
  }

  // combat-controls must run after gameplay-tuning/defense/desktop controls have completed
  // their synchronous bootstrap. Loading it at window.load gives the new J/K input layer the
  // final capture-stage ownership without reordering the stable production script chain.
  function loadCombatControls() {
    if (window.__DE_COMBAT_CONTROLS_V1 || document.querySelector('script[data-de-combat-controls]')) return;
    const script = document.createElement('script');
    script.src = 'combat-controls.js';
    script.async = false;
    script.dataset.deCombatControls = 'v1';
    document.body.appendChild(script);
  }
  if (document.readyState === 'complete') setTimeout(loadCombatControls, 0);
  else window.addEventListener('load', () => setTimeout(loadCombatControls, 0), { once: true });

  window.__DE_EQUIPMENT_SHOP_ART = { version: 'v1', sync, applyArt, preload, loadCombatControls };
})();
