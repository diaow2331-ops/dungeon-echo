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
  'game/core/release-stamp-v131.js',
  'game/locale/fixed-locale-entry-v130.js',
  'game/ui/responsive-final-v154.js',
  'game/ui/help-copy-v126.js',
  'game/ui/theme-atmosphere-v131.js',
  'game/ui/adaptive-bgm-v132.js',
];
for (const file of productionFollowers) {
  ok(fs.existsSync(path.join(root, file)), `runtime target exists: ${file}`);
  ok(runtime.includes(file), `runtime loads: ${file}`);
  ok(manifest.includes(file), `release ships: ${file}`);
}
for (const retired of [
  'game/input/combat-controls.js', 'game/systems/combat-pressure.js', 'game/systems/defense-system.js',
  'game/ui/audio-director.js', 'game/ui/mobile-ux.js', 'game/ui/combat-hint-polish.js',
]) {
  ok(!runtime.includes(retired), `retired runtime stays disconnected: ${retired}`);
}
ok(/assetVersion = '170'/.test(runtime) && /version:'v21'/.test(runtime), 'runtime stays on cache generation 170 with bootstrap v21');
ok(/renderOwner:'game\/core\/game\.js'/.test(runtime) && /inputOwner:'game\/core\/game\.js'/.test(runtime), 'core remains render/input authority');
ok(/persistenceWriter:'game\/core\/game\.js'/.test(runtime), 'core remains persistence authority');
ok(!suite.includes('runtime-debt-contract-v141.cjs'), 'current suite no longer claims stale v1.2 runtime debt coverage');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
