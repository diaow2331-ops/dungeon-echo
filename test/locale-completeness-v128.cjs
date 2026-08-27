'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'locale-completeness-v128.js'), 'utf8');
const bootstrap = fs.readFileSync(path.join(root, 'runtime-bootstrap.js'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'ops/release/static-files.txt'), 'utf8');

const makeTextEl = text => ({ textContent:text, style:{}, hidden:false, setAttribute(){} });
const equipEls = {
  weapon:makeTextEl('铁剑'), armor:makeTextEl('护甲'), helmet:makeTextEl('头盔'),
  boots:makeTextEl('靴子'), ring:makeTextEl('戒指'), amulet:makeTextEl('项链')
};
const classEl = makeTextEl('游侠');
const headerSub = makeTextEl('地牢回响');

const document = {
  querySelector(selector){
    const m = selector.match(/^#eq-(weapon|armor|helmet|boots|ring|amulet) \.eqname$/);
    if (m) return equipEls[m[1]];
    if (selector === 'header h1 .sub') return headerSub;
    return null;
  },
  getElementById(id){ return id === 'st-class' ? classEl : null; },
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
        '恐狼':'Dire Rat', '铁剑':'Iron Sword', '游侠':'Ranger', '疾步':'Dash',
        '木桶':'Cask', '金币':'Gold', '贪婪远征':'Greedy Expedition', '经典回响':'Classic Echo'
      };
      let out = String(value);
      for (const [zh,en] of Object.entries(map)) out = out.split(zh).join(en);
      return out;
    }
  }
};
const context = {
  window, document, location:{href:'https://play.91hwl.cn/dungeon-echo/?lang=en'},
  URL, Node:{TEXT_NODE:3,ELEMENT_NODE:1}, NodeFilter:{SHOW_TEXT:4}, MutationObserver, WeakSet,
  console
};
vm.createContext(context);
vm.runInContext(src, context, {filename:'locale-completeness-v128.js'});
const api = window.__DE_LOCALE_COMPLETENESS_V128;
assert(api, 'locale completeness owner must install');
assert.equal(api.english, true);
assert.equal(api.version, 'v2');

assert.equal(equipEls.weapon.textContent, 'Iron Sword', 'equipped weapon name must remain visible and localized');
assert.equal(equipEls.armor.textContent, 'Armor');
assert.equal(equipEls.helmet.textContent, 'Helmet');
assert.equal(equipEls.boots.textContent, 'Boots');
assert.equal(equipEls.ring.textContent, 'Ring');
assert.equal(equipEls.amulet.textContent, 'Amulet');
assert.equal(classEl.textContent, 'Ranger');
assert.equal(headerSub.textContent, '');
assert.equal(headerSub.hidden, true);
assert.equal(headerSub.style.display, 'none');

const cases = [
  ['你选择了游侠。技能「疾步」按 C 释放。撞向敌人即攻击。面朝敌人所在直线（射程 4 格内、无遮挡）移动即可射箭。','You chose Ranger. Press J to attack in your facing direction. Press K to use Dash. Ranged attacks can reach up to 4 tiles in your facing line.'],
  ['> Enter 下潜 · J 快速下潜（120 G 直坠 5 层）','> Enter Descend · J Attack · K Skill'],
  ['> 站在楼梯上按 Enter 下潜 · 点击已探索地块移动 · C 技能','> Stand on stairs and press Enter to descend · click explored tiles to move · J Attack · K Skill'],
  ['蓝量不足：20/32 · 原地等待可更快恢复','Not enough mana: 20/32 · wait/focus to recover faster'],
  ['第 7 层 · 游侠 · 进度已写入本地。','Floor 7 · Ranger · Progress saved locally.'],
  ['存档（贪婪远征）：游侠 · 第 7 层 · 等级 4','Save (Greedy Expedition): Ranger · Floor 7 · Level 4'],
  ['尚无中途存档（经典回响）。下楼、暂停或离开页面时会自动写入。','No mid-run save yet (Classic Echo). Progress saves automatically when descending, pausing or leaving the page.'],
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
  ['毒素发作，失去 3 点生命。','Poison deals 3 damage.'],
  ['你喝下药水，恢复了 12 点生命。','You drank a potion and restored 12 HP.'],
  ['你升到了 2 级！攻击+1，生命上限+6。','Level 2! ATK +1, Max HP +6.']
];
for (const [input,expected] of cases) {
  assert.equal(api.translateDynamic(input), expected, input);
  assert(!/[\u3400-\u9fff]/.test(expected), `expected English output contains CJK: ${input}`);
}

for (const selector of ['#stats','#equipbar','#stage','#touch','#log','#bag','#hint','#help','#title-screen','#class-screen','#pause-screen','#town-screen']) {
  assert(src.includes(`'${selector}'`), `missing dynamic locale root: ${selector}`);
}
assert(src.includes('characterData:true'));
assert(src.includes("weapon:'Weapon'"));
assert(src.includes("weapon:'武器'"));
assert(src.includes('new WeakSet()'));
assert(!src.includes('DE_TEST'), 'production locale owner must not depend on test bridge');
assert(src.includes("sub.hidden = true"));
assert(src.includes("sub.style.display = 'none'"));
assert(!/setInterval\s*\(/.test(src), 'locale completeness must not poll');
assert(bootstrap.includes("fresh('locale-runtime-v122.js')"));
assert(bootstrap.includes("fresh('locale-completeness-v128.js')"));
assert(bootstrap.indexOf("fresh('locale-runtime-v122.js')") < bootstrap.indexOf("fresh('locale-completeness-v128.js')"), 'completion layer must load after base locale owner');
assert(manifest.includes('locale-completeness-v128.js'));

console.log('RESULT  Dungeon Echo v1.2.8 locale completeness contract PASS');
