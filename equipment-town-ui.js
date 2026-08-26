/* Dungeon Echo town equipment art parity v1.
 * Presentation-only bridge: town bag/stash/equipbar reuse the same v13 tier resolver as
 * the dungeon. No inventory, commerce, forge, save or equipment state is mutated here.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__DE_TOWN_EQUIPMENT_ART) return;

  const api = window.DE_TEST;
  const tierArt = window.__DE_EQUIPMENT_TIER_ART;
  if (!api || api.profileId !== 'classic-100' || !tierArt || typeof tierArt.sourceForItem !== 'function') return;

  const SHEETS = Object.freeze({
    weapon: { url:'art/equipment-weapons-v13.png', cols:6, rows:4 },
    wearable: { url:'art/equipment-wearables-v13.png', cols:6, rows:5 },
  });
  const sourceForItem = tierArt.sourceForItem;

  const style = document.createElement('style');
  style.id = 'de-town-equipment-art-v1';
  style.textContent = `
    .town-equip-art{display:inline-block;width:32px;height:32px;flex:0 0 32px;background-repeat:no-repeat;image-rendering:pixelated;filter:drop-shadow(0 2px 2px rgba(0,0,0,.72));vertical-align:middle}
    .town-item-art-label{display:inline-flex!important;align-items:center;gap:8px;min-width:0}
    .town-item-art-label small{margin-left:2px}
    @media(max-width:700px){.town-equip-art{width:28px;height:28px;flex-basis:28px}}
  `;
  if (document.head && document.head.appendChild) document.head.appendChild(style);

  function applyArt(el, item) {
    if (!el || !item || !el.style || typeof el.style.setProperty !== 'function') return false;
    const src = sourceForItem(item);
    if (!src) return false;
    const [sheetId, sx, sy] = src;
    const sheet = SHEETS[sheetId];
    if (!sheet) return false;
    const px = sheet.cols > 1 ? sx / (sheet.cols - 1) * 100 : 0;
    const py = sheet.rows > 1 ? sy / (sheet.rows - 1) * 100 : 0;
    el.style.setProperty('background-image', `url("${sheet.url}")`);
    el.style.setProperty('background-size', `${sheet.cols * 100}% ${sheet.rows * 100}%`);
    el.style.setProperty('background-position', `${px}% ${py}%`);
    return true;
  }

  function ensureRowIcon(row, item) {
    if (!row || !item || typeof row.querySelector !== 'function') return false;
    const label = row.querySelector(':scope > span:first-child');
    if (!label) return false;
    let icon = label.querySelector('.town-equip-art');
    if (!icon) {
      icon = document.createElement('span');
      icon.className = 'town-equip-art';
      icon.setAttribute('aria-hidden', 'true');
      label.insertBefore(icon, label.firstChild || null);
    }
    if (label.classList && typeof label.classList.add === 'function') label.classList.add('town-item-art-label');
    return applyArt(icon, item);
  }

  function syncRows(rootSelector, buttonSelector, attr, items) {
    const root = document.querySelector && document.querySelector(rootSelector);
    if (!root || !Array.isArray(items) || typeof root.querySelectorAll !== 'function') return 0;
    let changed = 0;
    for (const row of Array.from(root.querySelectorAll('.town-row'))) {
      const button = row.querySelector(buttonSelector);
      if (!button) continue;
      const i = Number(button.getAttribute(attr));
      const item = Number.isInteger(i) && i >= 0 ? items[i] : null;
      if (item && ensureRowIcon(row, item)) changed++;
    }
    return changed;
  }

  function syncEquipbar(meta) {
    if (!meta || !meta.equip) return 0;
    let changed = 0;
    for (const slot of ['weapon','armor','helmet','boots','ring','amulet']) {
      const item = meta.equip[slot];
      const icon = document.querySelector && document.querySelector(`#eq-${slot} .loot-icon`);
      if (item && icon && applyArt(icon, item)) changed++;
    }
    return changed;
  }

  function sync() {
    if (api.state !== 'town') return 0;
    const meta = api.meta;
    if (!meta) return 0;
    let changed = syncEquipbar(meta);
    changed += syncRows('#town-bag', '[data-deposit]', 'data-deposit', meta.bag || []);
    changed += syncRows('#town-stash', '[data-withdraw]', 'data-withdraw', meta.stash || []);
    return changed;
  }

  sync();
  const timer = setInterval(sync, 180);
  window.addEventListener('beforeunload', () => clearInterval(timer), { once:true });
  window.__DE_TOWN_EQUIPMENT_ART = {
    version:'v1', applyArt, ensureRowIcon, syncRows, syncEquipbar, sync,
  };
})();
