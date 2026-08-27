'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const localeSource=fs.readFileSync(path.join(root,'locale-data-v134.js'),'utf8');
const gameSource=fs.readFileSync(path.join(root,'game.js'),'utf8');

assert(!/MutationObserver|setInterval|requestAnimationFrame/.test(localeSource),'fixed-route locale data must stay observer and animation free');
assert(gameSource.includes("const ENGLISH_ROUTE = !!")&&gameSource.includes('const ui = (zh, en) => ENGLISH_ROUTE ? en : zh;'),'game core must select copy from the fixed route');
assert(gameSource.includes('visibleWorldName(THEMES[themeIdx(depth)].name)'),'HUD theme names must be localized at their source');
assert(gameSource.includes('nameEl.textContent = visibleItemName(it);')&&gameSource.includes('nameEl.textContent = visibleSlotName(slot);'),'equipment HUD must emit localized item and slot names');
assert(gameSource.includes('Build Fit ${fit} · Item Value ${value}')&&gameSource.includes("ui('轻触物品查看属性，再选择装备或丢弃。','Select an item to inspect it, then equip or drop it.')"),'equipment tooltip copy must be bilingual at its source');
assert(gameSource.includes('You hit ${visibleWorldName(m.name)} for ${dmg} damage.')&&gameSource.includes('You shot ${visibleWorldName(m.name)} for ${dmg} damage.'),'basic melee and ranged logs must emit English directly');
assert(gameSource.includes('Picked up [${visibleItemName(it.item)}]')&&gameSource.includes('You opened the chest and obtained [${visibleItemName(loot)}].'),'pickup and chest logs must emit localized item names directly');

function boot(locale){
  const document={documentElement:{dataset:{deLocale:locale}}};
  const context={document,window:{}};
  context.window.window=context.window;
  context.window.document=document;
  vm.runInNewContext(localeSource,context,{filename:'locale-data-v134.js'});
  return context.window.DE_LOCALE_DATA;
}

const en=boot('en');
assert(en&&en.isEnglish&&en.locale==='en','English route owns English locale data');
assert.equal(en.worldName('巨鼠'),'Dire Rat');
assert.equal(en.worldName('精英·巨鼠'),'Elite · Dire Rat');
assert.equal(en.worldName('石砌地窟'),'Stone Crypt');
assert.equal(en.slotName('weapon'),'Weapon');
assert(en.itemName({rarity:2,slot:'weapon',base:{name:'铁剑'},name:'稀有·铁剑'}).includes('Rare·Iron Sword'),'equipment names must be derived from stable locale catalogs');

const zh=boot('zh-CN');
assert.equal(zh.worldName('精英·巨鼠'),'精英·巨鼠','Chinese route keeps canonical world names');
assert.equal(zh.slotName('weapon'),'武器','Chinese route keeps canonical slot names');

new Function(gameSource);
console.log('game_core_locale_v140=PASS');
