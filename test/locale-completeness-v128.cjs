'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'locale-completeness-v128.js'), 'utf8');
const bootstrap = fs.readFileSync(path.join(root, 'runtime-bootstrap.js'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'ops/release/static-files.txt'), 'utf8');

// The old completeness layer remains in source control only as compatibility archaeology.
// Keep its pure translation behavior testable while locking it out of production.
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
assert(api, 'archived locale completeness owner must remain parseable');
assert.equal(api.english, true);
assert.equal(api.version, 'v2');
assert.equal(equipEls.weapon.textContent, 'Iron Sword');
assert.equal(equipEls.armor.textContent, 'Armor');
assert.equal(classEl.textContent, 'Ranger');
assert.equal(headerSub.hidden, true);

const cases = [
  ['第 7 层 · 游侠 · 进度已写入本地。','Floor 7 · Ranger · Progress saved locally.'],
  ['存档（贪婪远征）：游侠 · 第 7 层 · 等级 4','Save (Greedy Expedition): Ranger · Floor 7 · Level 4'],
  ['你踩上了陷阱，受到 2 点伤害！','You stepped on a trap and took 2 damage!'],
  ['你捡起了一瓶治疗药水。','Picked up a Healing Potion.'],
  ['你沿着螺旋阶梯下到了第 2 层——石砌地窟。','You descended the spiral stairs to Floor 2 — Stone Crypt.'],
  ['恐狼被消灭了！（+2 经验）','Dire Rat was slain! (+2 XP)'],
];
for (const [input,expected] of cases) assert.equal(api.translateDynamic(input), expected, input);
assert(!/setInterval\s*\(/.test(src), 'archived completeness layer must still contain no polling loop');
assert(!bootstrap.includes("fresh('locale-completeness-v128.js')"), 'archived completeness layer must not load in production');
assert(!bootstrap.includes("fresh('locale-runtime-v122.js')"), 'archived base runtime translator must not load in production');
assert(!manifest.split(/\r?\n/).includes('locale-completeness-v128.js'), 'archived completeness layer must not ship');
assert(!manifest.split(/\r?\n/).includes('locale-runtime-v122.js'), 'archived runtime translator must not ship');
assert(bootstrap.includes("fresh('core-screen-owner-v153.js')") && bootstrap.includes("fresh('town-canvas-locale-v153.js')"), 'fixed-route exact sinks replace the archived translation stack');

console.log('RESULT  archived locale completeness compatibility + retirement contract PASS');
