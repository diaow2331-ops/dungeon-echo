import fs from 'node:fs';
const canvas = fs.readFileSync('../wildforge/src/data.js','utf8');
const crafting = fs.readFileSync('scripts/crafting/slice_crafting.gd','utf8');
const player = fs.readFileSync('scripts/player/player.gd','utf8');
const checks = [
  ['canvas delver pick power', canvas, /delver_pick:\{[^\n]*power:2\.7/],
  ['canvas delver pick recipe', canvas, /id:'delver_pick'.*need:\{ancient_core:1,copper_bar:3,wood:2\}.*station:'workbench'/],
  ['godot delver pick power', player, /const DELVER_PICK_POWER := 2\.70/],
  ['godot delver pick recipe', crafting, /"delver_pick": \{"out_id": "delver_pick", "out_n": 1, "need": \{"ancient_core": 1, "copper_bar": 3, "wood": 2\}, "station": "workbench", "unique": true\}/],
];
for (const [name,text,re] of checks) {
  if (!re.test(text)) throw new Error(`deepgate parity drift: ${name}`);
  console.log('PASS:', name);
}
console.log('wildforge_godot_deepgate_parity=PASS');
