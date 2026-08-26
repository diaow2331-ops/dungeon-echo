'use strict';
const fs = require('fs');
const assert = require('assert');

const controls = fs.readFileSync('combat-controls.js','utf8');
const shop = fs.readFileSync('equipment-shop-ui.js','utf8');
const desktop = fs.readFileSync('desktop-controls.js','utf8');
const manifest = fs.readFileSync('ops/release/static-files.txt','utf8');

assert(controls.includes("lower === 'j'"), 'J attack hotkey missing');
assert(controls.includes("lower === 'k'"), 'K skill hotkey missing');
assert(controls.includes("lower === 'c'"), 'legacy C suppression missing');
assert(controls.includes("attackFacing()"), 'facing attack path missing');
assert(controls.includes("data-act=\"attack\""), 'touch attack control missing');
assert(controls.includes("api.useSkill = function"), 'skill resource wrapper missing');
assert(controls.includes('manaMax') && controls.includes('manaCost'), 'mana resource missing');

for (const cls of ['warrior','ranger','mage','assassin']) {
  assert(new RegExp(`${cls}:\\s*\\{\\s*max:`).test(controls), `${cls} mana profile missing`);
}
assert(/warrior:\s*\{ max:60, cost:30, regen:2, attackGain:2, focusGain:3 \}/.test(controls), 'warrior mana contract changed');
assert(/ranger:\s*\{ max:70, cost:32, regen:2, attackGain:3, focusGain:4 \}/.test(controls), 'ranger mana contract changed');
assert(/mage:\s*\{ max:100,cost:42, regen:3, attackGain:1, focusGain:10 \}/.test(controls), 'mage mana contract changed');
assert(/assassin:\s*\{ max:65, cost:34, regen:2, attackGain:3, focusGain:4 \}/.test(controls), 'assassin mana contract changed');

assert(controls.includes("src.includes('art/loot-atlas.png')"), 'ground loot atlas interception missing');
assert(controls.includes("equipment-weapons-v13.png") && controls.includes("equipment-wearables-v13.png"), 'v13 ground replacement missing');
assert(controls.includes('suppressCharacterEquipmentImages'), 'character gear suppression missing');
assert(controls.includes("src.includes('equipment-weapons-v13.png') || src.includes('equipment-wearables-v13.png')"), 'character equipment image suppression contract missing');

assert(!desktop.includes('de-gear-overlay'), 'legacy character gear overlay returned');
assert(desktop.includes("edgeButton(pad, 2, 'k')"), 'gamepad skill must follow K contract');
assert(!desktop.includes("edgeButton(pad, 2, 'c')"), 'legacy C gamepad skill returned');

assert(shop.includes("script.src = 'combat-controls.js'"), 'production loader missing');
assert(manifest.split(/\r?\n/).includes('combat-controls.js'), 'release manifest missing combat-controls.js');

console.log('combat_controls_v1=PASS');
