'use strict';
const fs = require('fs');
const assert = require('assert');

const index = fs.readFileSync('index.html','utf8');
const english = fs.readFileSync('en/index.html','utf8');
const readme = fs.readFileSync('docs/archive/README-legacy.txt','utf8');
const projectPage = fs.readFileSync('ops/home-mount/public/toys/dungeon-echo/index.html','utf8');
const fixedPath = 'game/locale/fixed-locale-entry-v130.js';
const screenPath = 'game/locale/core-screen-owner-v153.js';
const canvasPath = 'game/locale/town-canvas-locale-v153.js';
const idsPath = 'game/locale/stable-item-id-migration-v150.js';
const cleanupPath = 'game/ui/character-art-cleanup-v122.js';
const lootPath = 'game/ui/world-loot-polish-v122.js';
const forgePath = 'game/ui/forge-feedback-v122.js';
const mobilePath = 'game/ui/mobile-ux.js';
const fixed = fs.readFileSync(fixedPath,'utf8');
const screen = fs.readFileSync(screenPath,'utf8');
const canvas = fs.readFileSync(canvasPath,'utf8');
const bootstrap = fs.readFileSync('runtime-bootstrap.js','utf8');
const cleanup = fs.readFileSync(cleanupPath,'utf8');
const loot = fs.readFileSync(lootPath,'utf8');
const forge = fs.readFileSync(forgePath,'utf8');
const shop = fs.readFileSync('equipment-shop-ui.js','utf8');
const desktop = fs.readFileSync('desktop-controls.js','utf8');
const manifest = fs.readFileSync('ops/release/static-files.txt','utf8').split(/\r?\n/).filter(Boolean);

// Static entries tell the same control story before late JS loads.
assert(index.includes('data-act="skill">技能 <span>K</span>'), 'static touch skill must be K');
assert(index.includes('J 攻击 · K 职业技能'), 'footer J/K contract missing');
assert(index.includes('攻击：<b>J</b>') && index.includes('技能：<b>K</b>（消耗蓝量）'), 'help J/K + mana contract missing');
assert(index.includes('data-act="mute">声音 <span>M</span>'), 'M must be overall sound');
assert(/<script src="combat-controls\.js\?v=153"><\/script>/.test(index), 'generation-153 J/K + mana controls missing');
assert(/<script src="runtime-bootstrap\.js\?v=153"><\/script>/.test(index), 'generation-153 runtime bootstrap missing');
assert(!index.includes('冲撞攻击') && !index.includes('技能 <span>C</span>') && !index.includes('技能：<b>C</b>'), 'legacy C/bump copy returned');
assert(!/[\u3400-\u9fff]/.test(english), 'English static entry regained CJK presentation copy');

// Historical unpacked-bundle copy remains readable as provenance.
assert(readme.includes('攻击       J（按当前面向）'), 'legacy bundle README J attack missing');
assert(readme.includes('职业技能   K（消耗蓝量）'), 'legacy bundle README K/mana contract missing');
assert(readme.includes('/?lang=en'), 'legacy bundle README compatibility English route missing');
assert(!readme.includes('职业技能   C'), 'legacy README old C contract returned');

// Project page is part of the promotion funnel.
assert(projectPage.includes('<h3>J / K + Mana</h3>') && projectPage.includes('明确攻击与职业技能输入'), 'project page J/K + mana contract missing');
assert(projectPage.includes('<span class="en">Play now</span>'), 'project page English CTA missing');
assert(projectPage.includes('https://github.com/diaow2331-ops/dungeon-echo'), 'project page GitHub CTA missing');
assert(!projectPage.includes('主要面向电脑端浏览器'), 'obsolete desktop-only claim returned');

// Fixed route locale: no runtime translation bridge or global translation follower.
assert(/box\.id\s*=\s*'de-title-language'/.test(fixed), 'fixed-route language chooser missing');
assert(fixed.includes('location.replace(target.href)'), 'language choice must route to the other fixed page');
assert(/searchParams\.delete\('lang'\)/.test(fixed), 'legacy query locale must converge to fixed paths');
for (const retired of ['locale-event-owner-v130.js','locale-runtime-v122.js','locale-completeness-v128.js','i18n.js','i18n-runtime.js','i18n-content.js','ux-hotfix-v121.js']) {
  assert(!bootstrap.includes(`'${retired}'`), `retired locale layer returned to bootstrap: ${retired}`);
  assert(!manifest.some(file=>file===retired||file.endsWith('/'+retired)), `retired locale layer returned to release: ${retired}`);
}
assert(screen.includes("owner:'core-screen-owner-v153'") && !/MutationObserver|translateTree|setInterval|requestAnimationFrame/.test(screen), 'core fixed-route screen owner contract missing');
assert(canvas.includes("owner:'town-canvas-locale-v153'") && !/MutationObserver|setInterval|requestAnimationFrame/.test(canvas), 'town canvas fixed-route sink contract missing');

// Late UX bootstrap may own presentation only, never core input/balance.
assert(bootstrap.includes('window.__DE_PRODUCTION_UX_BOOTSTRAP'), 'runtime bootstrap owner missing');
assert(bootstrap.includes("assetVersion = '153'") && bootstrap.includes("version:'v13'"), 'final cache/runtime generation mismatch');
assert(!bootstrap.includes("'combat-controls.js'") && !bootstrap.includes("'challenge-pressure.js'"), 'bootstrap regained core input/balance ownership');
for (const f of [screenPath,canvasPath,cleanupPath,lootPath,forgePath,'game/ui/audio-director.js',mobilePath]) assert(bootstrap.includes(`'${f}'`), `late follower missing: ${f}`);
assert(!shop.includes('loadProductionUx') && !shop.includes("loadScript('i18n.js'"), 'shop art regained UX boot ownership');

// Final art/forge polish stays presentation-only.
assert(cleanup.includes('isLegacyRarityRing') && cleanup.includes('legacyGearDepth'), 'hero equipment residual cleanup missing');
assert(!/localStorage\.setItem|persistRun|endTurn|\.stats\s*=|\.forge\s*=/.test(cleanup), 'character cleanup mutates gameplay');
assert(loot.includes('function los(') && loot.includes('api.items'), 'visible-loot polish contract missing');
assert(!/items\.push|items\.splice|\.rarity\s*=|\.stats\s*=/.test(loot), 'loot polish mutates gameplay');
assert(forge.includes('statDelta') && forge.includes('de-forge-stage'), 'forge process feedback missing');
assert(!/item\.forge\s*=|item\.stats\s*=|meta\.gold\s*=/.test(forge), 'forge feedback mutates canonical forge data');

// Character art remains single-owner: no old DOM gear overlay may return.
assert(!desktop.includes('de-gear-overlay'), 'legacy character gear overlay returned');

for (const f of ['runtime-bootstrap.js',screenPath,canvasPath,idsPath,cleanupPath,lootPath,forgePath,'combat-controls.js',mobilePath]) {
  assert(manifest.includes(f), `release manifest missing ${f}`);
}

console.log('release_ux_contract_v153=PASS');
