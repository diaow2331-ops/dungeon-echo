'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync(path.join(__dirname, '..', 'equipment-system.js'), 'utf8');
assert(!/setInterval\s*\(/.test(source), 'equipment-system must not keep a 400ms polling interval');
assert(source.includes('scheduleEquipmentSync'), 'event-driven equipment sync owner missing');
assert(source.includes('Changing gear interrupted Return resonance'), 'English extraction-break copy missing');
assert(source.includes('dataset.deLocale'), 'gear-swap owner must read fixed-route locale identity');
assert(!source.includes('window.DE_I18N'), 'equipment owner must not depend on runtime translation state');

const listeners = { document: {}, window: {} };
const microtasks = [];
global.queueMicrotask = fn => microtasks.push(fn);
global.setInterval = () => { throw new Error('polling interval must not be created'); };

let logHtml = '';
const hint = { textContent: '' };
const log = { insertAdjacentHTML(_where, html) { logHtml = html + logHtml; } };
global.document = {
  documentElement:{dataset:{deLocale:'en'}},
  getElementById(id) { return id === 'log' ? log : id === 'hint' ? hint : null; },
  addEventListener(type, fn) { (listeners.document[type] ||= []).push(fn); },
};

global.localStorage = { setItem() {} };

const player = {
  inv: [], equip: { weapon:null, armor:null, helmet:null, boots:null, ring:null, amulet:null },
};
const profile = {
  affixRanges: {}, weaponBases: [], armorBases: [], ringBases: [], rarities: [], shop: { equipMult: 3 },
};
const api = {
  profileId: 'classic-100', runProfile: profile, CLASSES: { warrior:{} }, classId:'warrior',
  depth:22, state:'playing', player, items:[], meta:null,
  getShopStock(){ return []; },
  itemValueScore(it){ return Number(it.score) || 0; },
  endTurn(){ api.turns++; }, turns:0,
  persistRun(){ api.persisted = (api.persisted || 0) + 1; },
};
let extractionReason = '';
global.window = {
  DE_TEST: api,
  DE_COMMERCE: { clearExtraction(reason) { extractionReason = reason; } },
  addEventListener(type, fn) { (listeners.window[type] ||= []).push(fn); },
};

vm.runInThisContext(source, { filename:'equipment-system.js' });
assert.equal(window.__DE_EQUIPMENT_SYSTEM, 'v2');
assert(window.DE_EQUIPMENT_SYNC && typeof window.DE_EQUIPMENT_SYNC.scheduleSync === 'function');
assert(window.__DE_EQUIPMENT_SWAP_TURN && window.__DE_EQUIPMENT_SWAP_TURN.version === 'v2');
assert.equal(window.__DE_EQUIPMENT_SWAP_TURN.locale, 'en');
assert.equal((listeners.document.keydown || []).length, 1, 'one document key listener should schedule equipment sync');
assert((listeners.window.click || []).length >= 1, 'gear-swap capture owner missing');

// A newly generated floor item is normalized after the real action that created it.
const fresh = { name:'Test Helm', slot:'helmet', stats:{ hp:1 }, affixes:[] };
api.items.push({ type:'equip', item:fresh });
for (const fn of listeners.document.keydown || []) fn({ type:'keydown', key:'Enter' });
assert.equal(microtasks.length, 1, 'equipment sync should queue instead of polling');
while (microtasks.length) microtasks.shift()();
assert.equal(fresh.deEquipVersion, 2, 'fresh equipment must receive the production version tag');
assert.equal(fresh.originDepth, 22, 'fresh equipment must retain its generation depth');
assert.equal(fresh.stats.hp, 11, 'floor-22 helmet must receive its depth HP bonus once');
assert.equal(fresh.stats.regen, 1, 'floor-22 helmet must receive its depth regen bonus once');

// Same-turn events coalesce to one equipment pass.
for (const fn of listeners.document.keydown || []) fn({ type:'keydown', key:'x' });
for (const fn of listeners.document.click || []) fn({ type:'click', target:null });
assert.equal(microtasks.length, 1, 'same-turn equipment sync events should coalesce');
while (microtasks.length) microtasks.shift()();
assert.equal(fresh.stats.hp, 11, 're-sync must never duplicate deep-item bonuses');

// Swap turn cost remains one owner and surfaces fixed-route English copy.
const before = window.__DE_EQUIPMENT_SWAP_TURN.snapshotEquip();
player.equip.weapon = { name:'Blade', slot:'weapon', stats:{atk:1} };
assert(window.__DE_EQUIPMENT_SWAP_TURN.settleEquipChange(before), 'equipment change should settle exactly once');
assert.equal(api.turns, 1, 'equipment swap must cost one real turn');
assert(extractionReason.includes('Changing gear interrupted Return resonance'), 'English extraction interruption copy mismatch');
assert(logHtml.includes('You changed equipment; swapping gear costs one turn.'), 'English swap log copy mismatch');
assert(hint.textContent.includes('You changed equipment; swapping gear costs one turn.'), 'English swap hint copy mismatch');
assert(!/[\u3400-\u9fff]/.test(extractionReason + logHtml + hint.textContent), 'English gear-swap feedback must not leak CJK');

console.log('equipment_event_sync_v130=PASS');
