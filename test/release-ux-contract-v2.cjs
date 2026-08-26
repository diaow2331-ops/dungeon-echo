'use strict';
const fs = require('fs');
const assert = require('assert');

const index = fs.readFileSync('index.html','utf8');
const readme = fs.readFileSync('README.txt','utf8');
const runtime = fs.readFileSync('i18n-runtime.js','utf8');
const desktop = fs.readFileSync('desktop-controls.js','utf8');
const manifest = fs.readFileSync('ops/release/static-files.txt','utf8').split(/\r?\n/);

// Static entry must tell the same control story as the runtime before any late JS loads.
assert(index.includes('data-act="skill">技能 <span>K</span>'), 'static touch skill must be K');
assert(index.includes('J 攻击 · K 职业技能'), 'footer J/K contract missing');
assert(index.includes('攻击：<b>J</b>') && index.includes('技能：<b>K</b>（消耗蓝量）'), 'help J/K + mana contract missing');
assert(index.includes('data-act="mute">声音 <span>M</span>'), 'M must be described as overall sound, not SFX only');
assert(!index.includes('冲撞攻击'), 'legacy bump-attack copy returned');
assert(!index.includes('技能 <span>C</span>'), 'legacy touch C skill returned');
assert(!index.includes('技能：<b>C</b>'), 'legacy help C skill returned');

// Shipped plain-text README is also user-facing when the bundle is unpacked locally.
assert(readme.includes('攻击       J（按当前面向）'), 'README J attack missing');
assert(readme.includes('职业技能   K（消耗蓝量）'), 'README K/mana contract missing');
assert(readme.includes('/?lang=en'), 'README English direct route missing');
assert(readme.includes('背景音乐与游戏音效可分别按 0–100% 调节'), 'README independent mixer description missing');
assert(!readme.includes('仍只使用 C 键') && !readme.includes('职业技能   C'), 'README legacy C contract returned');

// Language follower must own visible help/footer plus tooltip/accessibility attributes.
assert(runtime.includes('function syncHelp()'), 'bilingual help follower missing');
assert(runtime.includes('function syncFooter()'), 'bilingual footer follower missing');
assert(runtime.includes('function syncAccessibility()'), 'bilingual accessibility follower missing');
assert(runtime.includes("'aria-label',en?'Dungeon map:"), 'English game-map aria label missing');
assert(runtime.includes("'title',en?'Return Scroll:"), 'English return tooltip missing');
assert(runtime.includes("'title',en?'Enter or leave immersive fullscreen (F)'"), 'English fullscreen tooltip missing');
assert(runtime.includes("'aria-label',en?'Touch controls'"), 'English touch-controls label missing');
assert(runtime.includes('version:\'v2\''), 'i18n runtime version marker not advanced');

// Character art remains single-owner: no old geometric gear overlay may return.
assert(!desktop.includes('de-gear-overlay'), 'legacy character gear overlay returned');

for (const f of ['i18n.js','i18n-runtime.js','i18n-content.js','combat-controls.js','mobile-ux.js']) {
  assert(manifest.includes(f), `release manifest missing ${f}`);
}

console.log('release_ux_contract_v2=PASS');
