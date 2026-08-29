'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const localeSource=fs.readFileSync(path.join(root,'game','locale','locale-data-v134.js'),'utf8');
const gameSource=fs.readFileSync(path.join(root,'game','core','game.js'),'utf8');

assert(!/MutationObserver|setInterval|requestAnimationFrame/.test(localeSource),'fixed-route locale data must stay observer and animation free');
assert(gameSource.includes("const ENGLISH_ROUTE = !!")&&gameSource.includes('const ui = (zh, en) => ENGLISH_ROUTE ? en : zh;'),'game core must select copy from the fixed route');
assert(gameSource.includes('visibleWorldName(THEMES[themeIdx(depth)].name)'),'HUD theme names must be localized at their source');
assert(gameSource.includes('nameEl.textContent = visibleItemName(it);')&&gameSource.includes('nameEl.textContent = visibleSlotName(slot);'),'equipment HUD must emit localized item and slot names');
assert(gameSource.includes('Build Fit ${fit} · Item Value ${value}')&&gameSource.includes("ui('轻触物品查看属性，再选择装备或丢弃。','Select an item to inspect it, then equip or drop it.')"),'equipment tooltip copy must be bilingual at its source');
assert(gameSource.includes('You hit ${visibleWorldName(m.name)} for ${dmg} damage.')&&gameSource.includes('You shot ${visibleWorldName(m.name)} for ${dmg} damage.'),'basic melee and ranged logs must emit English directly');
assert(gameSource.includes('Picked up [${visibleItemName(it.item)}]')&&gameSource.includes('You opened the chest and obtained [${visibleItemName(loot)}].'),'pickup and chest logs must emit localized item names directly');

for (const token of [
  "ui('你死了','You Died')",
  "ui('胜利！','Victory!')",
  'Deepest: <b>${b.bestDepth || 0}</b>',
  "ui('贪婪远征','Greedy Expedition')",
  "ui('经典回响','Classic Echo')",
  "ui('贪婪远征：开','Greedy Expedition: On')",
  'HP ${c.hpBase} · ATK ${c.atkBase} · Potions ${c.potions} · Scrolls ${c.scrolls}',
  'function visibleShopRowName(row)',
  "${ui('购买','Buy')}",
  "ui('最深到达','Deepest Floor')",
  "ui('药水','Potion')",
  'Echo Town · Tier ${tier}',
  "ui('仓库','Stash')",
  'Expedition Ready',
  "ui('强化','Forge')",
  "ui('存入','Store')",
  "ui('取出','Withdraw')",
  'Reset Wheel ${rc} G',
  'Exit Fullscreen',
  'Progress saved locally.',
  "ui('破甲重击!','ARMOR BREAK!')",
  "ui('蓄力落空','CHARGE MISSED')",
]) assert(gameSource.includes(token),`canonical English-visible sink missing: ${token}`);

for (const raw of [
  "title.textContent = kind === 'dead' ? '你死了' : '胜利！';",
  "const modeTag = greedyMode ? '贪婪远征' : '经典回响';",
  "gbtn.textContent = greedyMode ? '贪婪远征：开' : '贪婪远征：关';",
  "if (goldEl) goldEl.textContent = `金币 ${player.gold}`;",
  "floater(player, '破甲重击!'",
  "floater(m, '蓄力落空'",
  "if (copy) copy.textContent = `第 ${depth} 层 · ${classDef().name} · 进度已写入本地。`;",
]) assert(!gameSource.includes(raw),`residual fixed-route Chinese sink remains: ${raw}`);

function boot(locale){
  const document={documentElement:{dataset:{deLocale:locale}}};
  const context={document,window:{}};
  context.window.window=context.window;
  context.window.document=document;
  vm.runInNewContext(localeSource,context,{filename:'game/locale/locale-data-v134.js'});
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