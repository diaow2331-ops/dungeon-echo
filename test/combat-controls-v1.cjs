'use strict';
const fs = require('fs');
const assert = require('assert');

const controls = fs.readFileSync('combat-controls.js','utf8');
const hint = fs.readFileSync('combat-hint-polish.js','utf8');
const audio = fs.readFileSync('audio-director.js','utf8');
const shop = fs.readFileSync('equipment-shop-ui.js','utf8');
const desktop = fs.readFileSync('desktop-controls.js','utf8');
const manifest = fs.readFileSync('ops/release/static-files.txt','utf8');

assert(controls.includes("lower === 'j'"), 'J attack hotkey missing');
assert(controls.includes("lower === 'k'"), 'K skill hotkey missing');
assert(controls.includes("lower === 'c'"), 'legacy C suppression missing');
assert(controls.includes('attackFacing()'), 'facing attack path missing');
assert(controls.includes('data-act="attack"'), 'touch attack control missing');
assert(controls.includes('api.useSkill = function'), 'skill resource wrapper missing');
assert(controls.includes('manaMax') && controls.includes('manaCost'), 'mana resource missing');

for (const cls of ['warrior','ranger','mage','assassin']) {
  assert(new RegExp(`${cls}:\\s*\\{\\s*max:`).test(controls), `${cls} mana profile missing`);
}
assert(/warrior:\s*\{ max:60, cost:30, regen:2, attackGain:2, focusGain:3 \}/.test(controls), 'warrior mana contract changed');
assert(/ranger:\s*\{ max:70, cost:32, regen:2, attackGain:3, focusGain:4 \}/.test(controls), 'ranger mana contract changed');
assert(/mage:\s*\{ max:100,cost:42, regen:3, attackGain:1, focusGain:10 \}/.test(controls), 'mage mana contract changed');
assert(/assassin:\s*\{ max:65, cost:34, regen:2, attackGain:3, focusGain:4 \}/.test(controls), 'assassin mana contract changed');

assert(controls.includes("src.includes('art/loot-atlas.png')"), 'ground loot atlas interception missing');
assert(controls.includes('equipment-weapons-v13.png') && controls.includes('equipment-wearables-v13.png'), 'v13 ground replacement missing');
assert(controls.includes('suppressCharacterEquipmentImages'), 'character gear suppression missing');
assert(controls.includes("src.includes('equipment-weapons-v13.png') || src.includes('equipment-wearables-v13.png')"), 'character equipment image suppression contract missing');

assert(!desktop.includes('de-gear-overlay'), 'legacy character gear overlay returned');
assert(desktop.includes("edgeButton(pad, 2, 'k')"), 'gamepad skill must follow K contract');
assert(!desktop.includes("edgeButton(pad, 2, 'c')"), 'legacy C gamepad skill returned');

assert(hint.includes("const KEY = 'de-combat-hint-jk-v1'"), 'one-shot hint persistence key missing');
assert(hint.includes('markSeen()'), 'one-shot hint acknowledgement missing');
assert(hint.includes('bottom:12%'), 'tutorial hint should stay out of top-center play space');

for (const scene of ['title','town','dungeon','deep','guardian','boss']) {
  assert(new RegExp(`${scene}:\\s*\\{`).test(audio), `audio scene missing: ${scene}`);
}
assert(audio.includes('AudioContext') && audio.includes('webkitAudioContext'), 'WebAudio bootstrap missing');
assert(audio.includes("key === 'm'"), 'M mute sync missing');
assert(audio.includes('LEVELS = [0.18, 0.28, 0.40]'), 'BGM volume ladder changed');
assert(audio.includes('mobs.some(m => m && Number(m.hp) > 0 && m.boss)'), 'boss music routing missing');
assert(audio.includes('mobs.some(m => m && Number(m.hp) > 0 && m.midBoss)'), 'guardian music routing missing');

assert(shop.includes("loadScript('combat-controls.js'"), 'combat controls production loader missing');
assert(shop.includes("loadScript('combat-hint-polish.js'"), 'combat hint production loader missing');
assert(shop.includes("loadScript('audio-director.js'"), 'audio director production loader missing');
const files = manifest.split(/\r?\n/);
for (const file of ['combat-controls.js','combat-hint-polish.js','audio-director.js']) {
  assert(files.includes(file), `release manifest missing ${file}`);
}

console.log('combat_controls_v1=PASS');
