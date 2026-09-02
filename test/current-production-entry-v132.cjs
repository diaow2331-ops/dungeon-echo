'use strict';
const fs = require('fs');
const path = require('path');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const zh = read('index.html');
const en = read('en/index.html');
const manifest = read('ops/release/static-files.txt').split(/\r?\n/).filter(Boolean);
const runtime = read('game/core/runtime-bootstrap.js');
const productionBootstrap = read('game/core/production-bootstrap.js');
let pass=0, fail=0;
const ok=(cond,name)=>{if(cond){pass++;console.log('  PASS '+name)}else{fail++;console.log('  FAIL '+name)}};
const scripts = html => [...html.matchAll(/<script\s+src="([^"]+)"[^>]*><\/script>/g)].map(match => match[1].split('?')[0]);

const expected = [
  'game/core/production-bootstrap.js',
  'profiles/classic-100.profile.js',
  'game/locale/locale-data-v134.js',
  'game/domain/content/content-rules-v130.js',
  'game/domain/inventory/equipment-rules-v130.js',
  'game/domain/inventory/set-rules-v180.js',
  'game/domain/economy/economy-rules-v130.js',
  'game/domain/town/town-rules-v130.js',
  'game/domain/town/town-growth-rules-v180.js',
  'game/domain/expedition/expedition-rules-v170.js',
  'game/domain/progression/progression-rules-v130.js',
  'game/domain/combat/combat-rules-v130.js',
  'game/core/game.js',
  'game/locale/core-locale-data-v139.js',
  'game/input/desktop-controls.js',
  'game/core/runtime-bootstrap.js',
];

ok(JSON.stringify(scripts(zh)) === JSON.stringify(expected), 'Chinese entry boots exactly the current canonical script graph');
ok(JSON.stringify(scripts(en)) === JSON.stringify(expected), 'English entry boots the same canonical script graph');
for (const file of expected) {
  ok(fs.existsSync(path.join(root,file)), `production script exists: ${file}`);
  ok(manifest.includes(file), `production script ships: ${file}`);
}
ok([...zh.matchAll(/<script\s+src="([^"]+)"/g)].every(m => /\?v=190$/.test(m[1])), 'Chinese synchronous scripts use cache generation 190');
ok([...en.matchAll(/<script\s+src="([^"]+)"/g)].every(m => /\?v=190$/.test(m[1])), 'English synchronous scripts use cache generation 190');
ok(/classic-100/.test(productionBootstrap), 'production bootstrap forces the classic-100 public profile');
ok(/assetVersion = '190'/.test(runtime) && /version:'v35'/.test(runtime), 'late presentation graph is generation 190 / runtime v35');

const retired = [
  'game/core/save-integrity-system.js',
  'game/input/combat-controls.js',
  'game/systems/npc-stability-system.js',
  'game/systems/equipment-system.js',
  'game/systems/town-system.js',
  'game/systems/commerce-system.js',
  'game/systems/forge-system.js',
  'game/systems/progression-system.js',
  'game/systems/progression-guard-system.js',
  'game/systems/content-system.js',
  'game/systems/combat-pressure.js',
  'game/systems/gameplay-tuning.js',
  'game/systems/defense-system.js',
  'game/systems/challenge-pressure.js',
  'game/systems/risk-reward-system.js',
];
for (const file of retired) {
  ok(!scripts(zh).includes(file), `retired wrapper is not booted: ${file}`);
  ok(!fs.existsSync(path.join(root,file)), `retired wrapper is absent from production tree: ${file}`);
  ok(!manifest.includes(file), `retired wrapper is absent from release allowlist: ${file}`);
}

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
