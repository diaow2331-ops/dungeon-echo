'use strict';
const fs = require('fs');
const path = require('path');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const game = read('game/core/game.js');
const desktop = read('game/input/desktop-controls.js');
const html = read('index.html');
let pass = 0, fail = 0;
const ok = (cond, name) => {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
};

ok(/case 'c': case 'C': useSkill\(\)/.test(game), 'current core owns C as class skill');
ok(/case 'j': case 'J': e\.preventDefault\(\); quickDive\(\)/.test(game), 'current core owns J as quick dive');
ok(/edgeButton\(pad, 2, 'c'\)/.test(desktop), 'gamepad X follows current core skill key');
ok(/edgeButton\(pad, 7, 'j'\)/.test(desktop), 'gamepad RT follows current core quick-dive key');
ok(desktop.includes('RT Quick Dive') && desktop.includes('RT快速下潜'), 'gamepad status describes RT truthfully');
ok(!desktop.includes('RT Attack') && !desktop.includes('RT攻击'), 'stale RT Attack claim is gone');
ok(!fs.existsSync(path.join(root, 'game/input/combat-controls.js')), 'retired v1.2 combat wrapper is not production input authority');
ok(!html.includes('game/input/combat-controls.js'), 'production HTML does not load the retired combat wrapper');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
