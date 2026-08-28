/* Dungeon Echo stable item identity migration v1.5.0.
 * Adds language-neutral identity fields to existing equipment records without renaming,
 * deleting, rebalancing or changing save namespaces/schemas.
 *
 * This is intentionally opportunistic: old and current saves are normalized on page boot;
 * newly generated legacy-shaped items remain compatible and are normalized on the next boot.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || window.__DE_STABLE_ITEM_ID_MIGRATION_V150) return;

  const data = window.DE_LOCALE_DATA;
  if (!data || typeof data.baseId !== 'function' || typeof data.rarityId !== 'function') return;

  const RUN_KEY = 'de-run-v6';
  const META_KEY = 'de-greedy-meta-v1';
  const report = { run:0, meta:0, live:0, writes:0 };

  function normalizeItem(item) {
    if (!item || typeof item !== 'object' || Array.isArray(item) || typeof item.slot !== 'string') return 0;
    let changed = 0;
    const baseId = String(data.baseId(item) || '');
    const rarityId = String(data.rarityId(item.rarity) || '');
    const slotId = String(item.slot || '');
    if (baseId && item.baseId !== baseId) { item.baseId = baseId; changed++; }
    if (rarityId && item.rarityId !== rarityId) { item.rarityId = rarityId; changed++; }
    if (slotId && item.slotId !== slotId) { item.slotId = slotId; changed++; }
    return changed;
  }

  function normalizeList(list) {
    if (!Array.isArray(list)) return 0;
    let changed = 0;
    for (const item of list) changed += normalizeItem(item);
    return changed;
  }

  function normalizeEquip(equip) {
    if (!equip || typeof equip !== 'object' || Array.isArray(equip)) return 0;
    let changed = 0;
    for (const item of Object.values(equip)) changed += normalizeItem(item);
    return changed;
  }

  function normalizeOfferRows(rows) {
    if (!Array.isArray(rows)) return 0;
    let changed = 0;
    for (const row of rows) if (row && typeof row === 'object') changed += normalizeItem(row.item);
    return changed;
  }

  function normalizeRun(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return 0;
    let changed = 0;
    if (raw.player && typeof raw.player === 'object') {
      changed += normalizeList(raw.player.inv);
      changed += normalizeEquip(raw.player.equip);
    }
    changed += normalizeOfferRows(raw.items);
    changed += normalizeOfferRows(raw.shopStock);
    return changed;
  }

  function normalizeMeta(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return 0;
    let changed = 0;
    changed += normalizeList(raw.bag);
    changed += normalizeList(raw.stash);
    changed += normalizeEquip(raw.equip);
    changed += normalizeOfferRows(raw.wheelSlots);
    return changed;
  }

  function migrateStored(key, normalizer, bucket) {
    if (typeof localStorage === 'undefined') return 0;
    let rawText = null, raw = null;
    try { rawText = localStorage.getItem(key); } catch (_e) { return 0; }
    if (!rawText) return 0;
    try { raw = JSON.parse(rawText); } catch (_e) { return 0; }
    const changed = normalizer(raw);
    if (!changed) return 0;
    try {
      localStorage.setItem(key, JSON.stringify(raw));
      report[bucket] += changed;
      report.writes++;
      return changed;
    } catch (_e) { return 0; }
  }

  function migrateLive() {
    const api = window.DE_TEST;
    if (!api) return 0;
    let changed = 0;
    if (api.player) {
      changed += normalizeList(api.player.inv);
      changed += normalizeEquip(api.player.equip);
    }
    changed += normalizeOfferRows(api.items);
    if (api.meta) changed += normalizeMeta(api.meta);
    if (typeof api.getShopStock === 'function') {
      try { changed += normalizeOfferRows(api.getShopStock()); } catch (_e) {}
    }
    report.live += changed;
    return changed;
  }

  migrateStored(RUN_KEY, normalizeRun, 'run');
  migrateStored(META_KEY, normalizeMeta, 'meta');
  migrateLive();

  window.__DE_STABLE_ITEM_ID_MIGRATION_V150 = Object.freeze({
    version:'v150', owner:'stable-item-id-migration', report,
    normalizeItem, normalizeRun, normalizeMeta, migrateLive,
    keys:Object.freeze({ run:RUN_KEY, meta:META_KEY }),
  });
})();
