'use strict';
const fs = require('fs');
const path = require('path');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const runtime = read('game/core/runtime-bootstrap.js');
const manifest = read('ops/release/static-files.txt').split(/\r?\n/);
const suite = read('test/current-suite.cjs');
let pass = 0, fail = 0;
const ok = (cond, name) => {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
};

const productionFollowers = [
  'game/core/release-stamp-v170.js',
  'game/locale/fixed-locale-entry-v130.js',
  'game/ui/responsive-final-v154.js',
  'game/ui/help-copy-v126.js',
  'game/ui/theme-atmosphere-v131.js',
  'game/ui/adaptive-bgm-v132.js',
  'game/ui/forge-feedback-v132.js',
];
for (const file of productionFollowers) {
  ok(fs.existsSync(path.join(root, file)), `runtime target exists: ${file}`);
  ok(runtime.includes(file), `runtime loads: ${file}`);
  ok(manifest.includes(file), `release ships: ${file}`);
}

const retired = [
  'game/input/combat-controls.js',
  'game/core/save-integrity-system.js',
  'game/systems/progression-guard-system.js',
  'game/systems/commerce-system.js',
  'game/systems/npc-stability-system.js',
  'game/systems/risk-reward-system.js',
  'game/systems/combat-pressure.js',
  'game/systems/defense-system.js',
  'game/ui/audio-director.js',
  'game/ui/mobile-ux.js',
  'game/ui/combat-hint-polish.js',
  'game/locale/core-screen-owner-v153.js',
  'game/locale/town-canvas-locale-v153.js',
];
for (const file of retired) {
  ok(!fs.existsSync(path.join(root,file)), `retired wrapper is not a production file: ${file}`);
  ok(!runtime.includes(file), `retired runtime stays disconnected: ${file}`);
  ok(!manifest.includes(file), `retired runtime stays out of release: ${file}`);
}

ok(/assetVersion = '181'/.test(runtime) && /version:'v33'/.test(runtime), 'runtime stays on cache generation 181 with bootstrap v33');
ok(/renderOwner:'game\/core\/game\.js'/.test(runtime) && /inputOwner:'game\/core\/game\.js'/.test(runtime), 'core remains render/input authority');
ok(/persistenceWriter:'game\/core\/game\.js'/.test(runtime), 'core remains persistence authority');
ok(/followers:'presentation-only'/.test(runtime), 'runtime follower boundary remains presentation-only');
ok(/audioFollower:'game\/ui\/adaptive-bgm-v132\.js'/.test(runtime), 'adaptive BGM boundary remains explicit');
ok(/forgeFeedback:'game\/ui\/forge-feedback-v132\.js'/.test(runtime), 'forge feedback boundary is explicit');

const staleSuiteEntries = [
  'production.cjs',
  'runtime-debt-contract-v141.cjs',
  'progression-commitment.cjs',
  'extraction-channel.cjs',
  'dungeon-service-safety.cjs',
  'disposable-interactions.cjs',
  'interaction-pathing.cjs',
  'risk-reward-interactions.cjs',
  'save-integrity-v128.cjs',
  'final-fixed-locale-v153.cjs',
];
for (const name of staleSuiteEntries) ok(!suite.includes(`'${name}'`), `historical test is not a current gate: ${name}`);
ok(suite.includes("'current-production-entry-v132.cjs'"), 'current suite uses the canonical production entry gate');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
