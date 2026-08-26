'use strict';
const fs = require('fs');
const path = require('path');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'visual-polish.js'), 'utf8');
let pass = 0, fail = 0;
const ok = (cond, name) => {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
};

const marker = src.match(/window\.__DE_EQUIPMENT_TIER_ART\s*=\s*\{([\s\S]*?)\};/);
ok(marker && /version:\s*'v1'/.test(marker[1]), 'tier art declares the exact v1 marker');
ok(/WEAPON_THRESHOLDS\s*=\s*Object\.freeze\(\[1,3,5,7,10,14,17,22,32,44,58,74,92\]\)/.test(src),
  'weapon art follows all 13 production progression thresholds');
ok(/ARMOR_THRESHOLDS\s*=\s*Object\.freeze\(\[1,3,5,7,14,22,32,44,58,74,92\]\)/.test(src),
  'armor art follows all 11 production progression thresholds');
ok(/RING_THRESHOLDS\s*=\s*Object\.freeze\(\[1,3,6,13,21,32,44,58,74,92\]\)/.test(src),
  'ring art follows all 10 production progression thresholds');
for (const cls of ['warrior','ranger','mage','assassin'])
  ok(new RegExp(`${cls}:\\[\\[`).test(src), `${cls} owns a tier-art progression row`);
ok(/function sourceForItem\(item\)/.test(src) && /base\.min/.test(src) && /base\.cls/.test(src),
  'tier routing derives presentation from preserved base metadata');
ok(/item\.slot === 'weapon'/.test(src) && /item\.slot === 'armor'/.test(src) && /item\.slot === 'ring'/.test(src),
  'weapon, armor and ring tier identities are routed separately');
ok(/#eq-\$\{slot\} \.loot-icon/.test(src) && /#bag \.bagcell/.test(src),
  'tier identity is synchronized to equipbar and dungeon bag');
ok(/sourceForItem\(item\)/.test(src) && /drawItem/.test(src),
  'character gear and DOM UI share the same tier source resolver');
ok(/equipment-weapons-v13\.png/.test(src) && /equipment-wearables-v13\.png/.test(src),
  'tier routing only uses the shipped v13 source sheets');
const sourceBody = (src.match(/function sourceForItem[\s\S]*?\n\s*\}/) || [''])[0];
const syncBody = (src.match(/function syncEquipmentUi[\s\S]*?\n\s*\}/) || [''])[0];
ok(!/endTurn|persistRun|localStorage\.setItem|\.stats\s*=|\.atk\s*=|\.def\s*=|\.hp\s*=/.test(sourceBody + syncBody),
  'tier identity remains presentation-only and does not mutate game state');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
