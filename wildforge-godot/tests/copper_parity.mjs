import fs from 'node:fs';
const canvas = fs.readFileSync('../wildforge/src/data.js','utf8');
const crafting = fs.readFileSync('scripts/crafting/slice_crafting.gd','utf8');
const player = fs.readFileSync('scripts/player/player.gd','utf8');
const checks = [
  ['canvas copper pick power', canvas, /copper_pick:\{[^\n]*power:2\.3/],
  ['canvas copper bar recipe', canvas, /id:'copper_bar'.*need:\{copper_ore:2,coal:1\}.*station:'campfire'/],
  ['canvas copper pick recipe', canvas, /id:'copper_pick'.*need:\{copper_bar:5,wood:2\}.*station:'workbench'/],
  ['godot copper pick power', player, /const COPPER_PICK_POWER := 2\.30/],
  ['godot copper bar recipe', crafting, /"copper_bar": \{"out_id": "copper_bar", "out_n": 1, "need": \{"copper_ore": 2, "coal": 1\}, "station": "campfire"\}/],
  ['godot copper pick recipe', crafting, /"copper_pick": \{"out_id": "copper_pick", "out_n": 1, "need": \{"copper_bar": 5, "wood": 2\}, "station": "workbench", "unique": true\}/],
];
for (const [name,text,re] of checks) {
  if (!re.test(text)) throw new Error(`copper parity drift: ${name}`);
  console.log('PASS:', name);
}
console.log('wildforge_godot_copper_parity=PASS');
