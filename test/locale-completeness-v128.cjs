'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'locale-completeness-v128.js'), 'utf8');
const bootstrap = fs.readFileSync(path.join(root, 'runtime-bootstrap.js'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'ops/release/static-files.txt'), 'utf8');

const document = {
  querySelector(){ return null; },
  getElementById(){ return null; },
  createTreeWalker(){ return { currentNode:null, nextNode(){ return false; } }; }
};
class MutationObserver { constructor(fn){ this.fn=fn; } observe(){} disconnect(){} }
const window = {
  DE_I18N: {
    isEnglish: true,
    translate(value) {
      const map = {
        '治疗药水':'Healing Potion', '回城卷轴':'Return Scroll', '传送卷轴':'Teleport Scroll',
        '锈蚀钥匙':'Rusty Key', '石砌地窟':'Stone Crypt', '洞穴蝙蝠':'Cave Bat',
        '恐狼':'Dire Rat', '铁剑':'Iron Sword', '游侠':'Ranger', '木桶':'Cask', '金币':'Gold'
      };
      let out = String(value);
      for (const [zh,en] of Object.entries(map)) out = out.split(zh).join(en);
      return out;
    }
  }
};
const context = {
  window, document, location:{href:'https://play.91hwl.cn/dungeon-echo/?lang=en'},
  URL, Node:{TEXT_NODE:3,ELEMENT_NODE:1}, NodeFilter:{SHOW_TEXT:4}, MutationObserver,
  console
};
vm.createContext(context);
vm.runInContext(src, context, {filename:'locale-completeness-v128.js'});
const api = window.__DE_LOCALE_COMPLETENESS_V128;
assert(api, 'locale completeness owner must install');
assert.equal(api.english, true);

const cases = [
  ['你踩上了陷阱，受到 2 点伤害！','You stepped on a trap and took 2 damage!'],
  ['木桶裂开，滚出 10 枚金币。','The cask split open and spilled 10 Gold.'],
  ['Cask裂开，滚出 10 Gold.','The cask split open and spilled 10 Gold.'],
  ['你捡起了一瓶治疗药水。','Picked up a Healing Potion.'],
  ['Picked up 一瓶Healing Potion.','Picked up a Healing Potion.'],
  ['本层有 7 个敌人、12 处物资。','This floor has 7 enemies and 12 loot spots.'],
  ['第 1 次下潜：搜刮战利品，用回城卷轴（T）把一切平安带回小镇——死在这里就会失去背包和金币！','Descent 1: loot what you can, then use Return Scroll (T) to bring it safely back to town — dying here loses your backpack and carried Gold!'],
  ['第 1 次下潜：搜刮战利品，用Return Scroll（T）把一切平安带回小镇——死在这里就会失去背包和Gold!','Descent 1: loot what you can, then use Return Scroll (T) to bring it safely back to town — dying here loses your backpack and carried Gold!'],
  ['你沿着螺旋阶梯下到了第 2 层——石砌地窟。','You descended the spiral stairs to Floor 2 — Stone Crypt.'],
  ['你射中洞穴蝙蝠，造成 3 点伤害。','You shot Cave Bat for 3 damage.'],
  ['恐狼被消灭了！（+2 经验）','Dire Rat was slain! (+2 XP)'],
  ['你喝下药水，恢复了 12 点生命。','You drank a potion and restored 12 HP.'],
  ['你升到了 2 级！攻击+1，生命上限+6。','Level 2! ATK +1, Max HP +6.']
];
for (const [input,expected] of cases) assert.equal(api.translateDynamic(input), expected, input);

assert(src.includes("'#equipbar'"));
assert(src.includes("'#log'"));
assert(src.includes('characterData:true'));
assert(src.includes("weapon:'Weapon'"));
assert(src.includes("sub.hidden = true"));
assert(src.includes("sub.style.display = 'none'"));
assert(!/setInterval\s*\(/.test(src), 'locale completeness must not poll');
assert(bootstrap.includes("fresh('locale-runtime-v122.js')"));
assert(bootstrap.includes("fresh('locale-completeness-v128.js')"));
assert(bootstrap.indexOf("fresh('locale-runtime-v122.js')") < bootstrap.indexOf("fresh('locale-completeness-v128.js')"), 'completion layer must load after base locale owner');
assert(manifest.includes('locale-completeness-v128.js'));

console.log('RESULT  Dungeon Echo v1.2.8 locale completeness contract PASS');
