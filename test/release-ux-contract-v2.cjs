'use strict';
const fs = require('fs');
const assert = require('assert');

const index = fs.readFileSync('index.html','utf8');
const readme = fs.readFileSync('README.txt','utf8');
const projectPage = fs.readFileSync('ops/home-mount/public/toys/dungeon-echo/index.html','utf8');
const locale = fs.readFileSync('locale-runtime-v122.js','utf8');
const bootstrap = fs.readFileSync('runtime-bootstrap.js','utf8');
const cleanup = fs.readFileSync('character-art-cleanup-v122.js','utf8');
const loot = fs.readFileSync('world-loot-polish-v122.js','utf8');
const forge = fs.readFileSync('forge-feedback-v122.js','utf8');
const shop = fs.readFileSync('equipment-shop-ui.js','utf8');
const desktop = fs.readFileSync('desktop-controls.js','utf8');
const manifest = fs.readFileSync('ops/release/static-files.txt','utf8').split(/\r?\n/).filter(Boolean);

// Static entry must tell the same control story before late JS loads.
assert(index.includes('data-act="skill">技能 <span>K</span>'), 'static touch skill must be K');
assert(index.includes('J 攻击 · K 职业技能'), 'footer J/K contract missing');
assert(index.includes('攻击：<b>J</b>') && index.includes('技能：<b>K</b>（消耗蓝量）'), 'help J/K + mana contract missing');
assert(index.includes('data-act="mute">声音 <span>M</span>'), 'M must be overall sound');
assert(index.includes('<script src="combat-controls.js"></script>'), 'synchronous J/K + mana controls missing');
assert(index.includes('<script src="runtime-bootstrap.js"></script>'), 'runtime bootstrap missing');
assert(!index.includes('冲撞攻击') && !index.includes('技能 <span>C</span>') && !index.includes('技能：<b>C</b>'), 'legacy C/bump copy returned');

// Unpacked bundle remains understandable without repository context.
assert(readme.includes('攻击       J（按当前面向）'), 'README J attack missing');
assert(readme.includes('职业技能   K（消耗蓝量）'), 'README K/mana contract missing');
assert(readme.includes('/?lang=en'), 'README English route missing');
assert(!readme.includes('职业技能   C'), 'README legacy C contract returned');

// Project page is part of the future promotion funnel.
assert(projectPage.includes('J 普攻、K 技能'), 'project page J/K contract missing');
assert(projectPage.includes('Play in English'), 'project page English CTA missing');
assert(projectPage.includes('https://github.com/diaow2331-ops/dungeon-echo'), 'project page GitHub CTA missing');
assert(!projectPage.includes('主要面向电脑端浏览器'), 'obsolete desktop-only claim returned');

// Stable locale: title-only reload and no global polling chain.
assert(locale.includes("box.id = 'de-title-language'"), 'title language chooser missing');
assert(locale.includes("location.replace(target.href)"), 'language choice must reload');
assert(locale.includes("window.DE_I18N ="), 'stable locale API missing');
assert(locale.includes("'Dungeon Echo'"), 'English shell content missing');
assert(locale.includes("'aria-label',en?'Dungeon map:"), 'English map accessibility missing');
assert(!locale.includes('setInterval('), 'locale polling returned');
for (const retired of ['i18n.js','i18n-runtime.js','i18n-content.js','ux-hotfix-v121.js']) {
  assert(!bootstrap.includes(`'${retired}'`), `retired locale layer returned to bootstrap: ${retired}`);
  assert(!manifest.includes(retired), `retired locale layer returned to release: ${retired}`);
}

// Late UX bootstrap may own presentation only, never core input/balance.
assert(bootstrap.includes('window.__DE_PRODUCTION_UX_BOOTSTRAP'), 'runtime bootstrap owner missing');
assert(!bootstrap.includes("'combat-controls.js'") && !bootstrap.includes("'challenge-pressure.js'"), 'bootstrap regained core input/balance ownership');
for (const f of ['locale-runtime-v122.js','character-art-cleanup-v122.js','world-loot-polish-v122.js','forge-feedback-v122.js','audio-director.js','mobile-ux.js']) assert(bootstrap.includes(`'${f}'`), `late follower missing: ${f}`);
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

for (const f of ['runtime-bootstrap.js','locale-runtime-v122.js','character-art-cleanup-v122.js','world-loot-polish-v122.js','forge-feedback-v122.js','combat-controls.js','mobile-ux.js']) {
  assert(manifest.includes(f), `release manifest missing ${f}`);
}

console.log('release_ux_contract_v122=PASS');
