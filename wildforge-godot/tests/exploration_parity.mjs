import fs from 'node:fs';
const canvas = fs.readFileSync('../wildforge/src/game.js','utf8');
const cache = fs.readFileSync('scripts/world/relic_cache.gd','utf8');
const checks = [
  ['canvas ancient core cache reward', /spawnDrop\('ancient_core',1,x,y\)/],
  ['canvas shallow copper cache range', /spawnDrop\('copper_ore',3\+Math\.floor\(game\.rng\(\)\*3\),x,y\)/],
  ['canvas cache coal floor', /spawnDrop\('coal',2\+Math\.floor\(game\.rng\(\)\*3\),x,y\)/],
  ['godot one core reward', /const CORE_REWARD := 1/],
  ['godot shallow coal reward stays within canvas range', /const COAL_REWARD := 2/],
  ['godot shallow copper reward stays within canvas range', /const COPPER_REWARD := 3/],
];
for (const [name,re] of checks) {
  if (!re.test(name.startsWith('canvas') ? canvas : cache)) throw new Error(`exploration parity drift: ${name}`);
  console.log('PASS:', name);
}
console.log('wildforge_godot_exploration_parity=PASS');
