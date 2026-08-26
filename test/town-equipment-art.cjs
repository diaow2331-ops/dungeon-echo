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

const marker = src.match(/window\.__DE_TOWN_EQUIPMENT_ART\s*=\s*\{([\s\S]*?)\};/);
ok(marker && /version:\s*'v1'/.test(marker[1]), 'town equipment art declares the exact v1 marker');
ok(/\.town-equip-art/.test(src) && /\.town-item-art-label/.test(src),
  'town rows have a compact equipment-icon presentation contract');
ok(/api\.state\s*!==\s*'town'/.test(src), 'town art only synchronizes while the town state is active');
ok(/#town-bag/.test(src) && /\[data-deposit\]/.test(src) && /data-deposit/.test(src),
  'town bag rows are matched through their real deposit indexes');
ok(/#town-stash/.test(src) && /\[data-withdraw\]/.test(src) && /data-withdraw/.test(src),
  'town stash rows are matched through their real withdraw indexes');
ok(/meta\.bag\s*\|\|\s*\[\]/.test(src) && /meta\.stash\s*\|\|\s*\[\]/.test(src),
  'town row art resolves against the matching persistent item arrays');
ok(/sourceForItem\(item\)/.test(src) && /applyDomItemArt/.test(src),
  'town and dungeon UI reuse the same tier-art resolver');
ok(/#eq-\$\{slot\} \.loot-icon/.test(src), 'town sync also keeps the top equipment bar on tier-specific art');
ok(/if\(api\.state==='town'\) syncTownEquipmentUi\(\)/.test(src),
  'the shared visual frame refreshes town art after town rerenders');
const townBody = (src.match(/function syncTownEquipmentUi[\s\S]*?\n\s*\}/) || [''])[0];
const rowBody = (src.match(/function syncTownRows[\s\S]*?\n\s*\}/) || [''])[0];
ok(!/endTurn|persistRun|saveMeta|localStorage\.setItem|splice\(|push\(|pop\(|shift\(|unshift\(/.test(townBody + rowBody),
  'town art cannot alter inventory, commerce or save state');
ok(!/equipment-town-ui\.js/.test(src), 'town parity stays inside the single visual owner');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
