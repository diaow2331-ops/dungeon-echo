'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync(path.join(__dirname, '..', 'commerce-system.js'), 'utf8');
assert(!source.includes('new MutationObserver'), 'commerce must not observe the town shop DOM');
assert(source.includes('scheduleCommerceUi'), 'commerce event-driven UI scheduler missing');
assert(source.includes("nameEn: 'Return Scroll'"), 'explicit English supply identity missing');
assert(source.includes('dataset.deLocale'), 'commerce must read fixed-route locale identity');
assert(!source.includes('window.DE_I18N'), 'commerce must not depend on runtime translation state');

const listeners = { document:{}, window:{} };
const microtasks = [];
global.queueMicrotask = fn => microtasks.push(fn);
global.MutationObserver = class { constructor(){ throw new Error('commerce must not construct a MutationObserver'); } };

const townShop = {
  innerHTML:'', dataset:{},
  querySelector(sel){ return sel === '[data-de-townbuy]' && this.innerHTML.includes('data-de-townbuy') ? {} : null; },
};
const shopGold = { textContent:'' };
const hint = { textContent:'' };
let logHtml = '';
const log = { insertAdjacentHTML(_where, html){ logHtml = html + logHtml; } };

global.document = {
  documentElement:{dataset:{deLocale:'en'}},
  getElementById(id){
    if (id === 'town-shop') return townShop;
    if (id === 'shop-gold') return shopGold;
    if (id === 'hint') return hint;
    if (id === 'log') return log;
    return null;
  },
  addEventListener(type, fn){ (listeners.document[type] ||= []).push(fn); },
};

const store = new Map();
global.localStorage = {
  getItem(k){ return store.has(k) ? store.get(k) : null; },
  setItem(k,v){ store.set(k,String(v)); },
};

const meta = {
  bestDepth:1, runs:1, gold:500, potions:1, scrolls:0, escapes:1, keys:0, insurance:0,
};
const floorRules = {
  killLoot:{ gold:.2, potion:.3, equip:.8 }, lootCounts:{ potionLo:1,potionHi:1 },
  minPotions:1, baseMonsterCount:5, monsterPerDepth:.1, minMonsters:5, maxMonsters:24, eliteChance:.1,
};
const api = {
  profileId:'classic-100', state:'town', meta, player:null, monsters:[], npcs:[], depth:1, greedy:true, turns:0,
  runProfile:{ shop:{ potionPrice:16,scrollPrice:28,escapePrice:26,keyPrice:22,insurancePrice:120,healPrice:24 }, floorRules },
  getShopStock(){ return []; },
  endTurn(){ api.turns++; },
  persistRun(){},
  useEscape(){ api.state='town'; return true; },
};
global.window = {
  DE_TEST:api,
  addEventListener(type, fn){ (listeners.window[type] ||= []).push(fn); },
};

vm.runInThisContext(source, { filename:'commerce-system.js' });
assert.equal(window.__DE_COMMERCE_SYSTEM, 'v6');
assert(window.DE_COMMERCE && window.DE_COMMERCE.version === 'v6');
assert.equal(window.DE_COMMERCE.locale, 'en');
assert(typeof window.DE_COMMERCE.scheduleCommerceUi === 'function');
assert(townShop.innerHTML.includes('Healing Potion'), 'town supply row must render English directly');
assert(townShop.innerHTML.includes('Held 1 · Stock'), 'town stock metadata must render English directly');
assert(townShop.innerHTML.includes('Town Tier 1'), 'town commerce note must render English directly');
assert(!/[\u3400-\u9fff]/.test(townShop.innerHTML), 'English commerce shop must not leak CJK copy');

// The renderer is restored by a queued state/input sync rather than a DOM observer.
townShop.innerHTML = '<p>legacy core shop</p>';
window.DE_COMMERCE.scheduleCommerceUi();
assert.equal(microtasks.length >= 1, true, 'commerce UI repair must be queued');
while (microtasks.length) microtasks.shift()();
assert(townShop.innerHTML.includes('data-de-townbuy'), 'queued commerce sync must restore owned shop rows');

// Extraction messages use the same explicit fixed-route locale boundary.
api.state='playing';
api.player={ hp:20, escapes:1, hpBase:20, gold:0 };
assert(window.DE_COMMERCE.beginExtraction(), 'first extraction step should arm');
assert(hint.textContent.includes('Return Scroll begins to resonate') || logHtml.includes('Return Scroll begins to resonate'),
  'English extraction start copy missing');
assert(window.DE_COMMERCE.extractionReady(), 'extraction should become ready after one enemy turn');
assert(window.DE_COMMERCE.completeExtraction(), 'second extraction step should enter town');
assert(!/[\u3400-\u9fff]/.test(hint.textContent + logHtml), 'English extraction feedback must not leak CJK');

console.log('commerce_event_locale_v130=PASS');
