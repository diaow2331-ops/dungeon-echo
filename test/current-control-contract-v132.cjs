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

ok(/case 'k': case 'K': case 'c': case 'C': useSkill\(\)/.test(game), 'current core owns K skill with C compatibility alias');
ok(/case 'j': case 'J': e\.preventDefault\(\); directionalAttack\(\)/.test(game), 'current core owns J as explicit basic attack');
ok(/e\.key === 'Enter' && e\.shiftKey\) quickDive\(\)/.test(game), 'current core owns Shift+Enter as quick dive');
ok(/edgeButton\(pad, 2, 'k'\)/.test(desktop), 'gamepad X transports canonical skill key');
ok(/edgeButton\(pad, 6, .*shiftKey:true/.test(desktop), 'gamepad LT transports canonical quick-dive chord');
ok(/edgeButton\(pad, 7, 'j'\)/.test(desktop), 'gamepad RT transports canonical attack key');
ok(desktop.includes('LT Quick Dive') && desktop.includes('RT Attack') && desktop.includes('LT快速下潜') && desktop.includes('RT攻击'), 'gamepad status describes v1.4 actions truthfully');
ok(!fs.existsSync(path.join(root, 'game/input/combat-controls.js')), 'retired v1.2 combat wrapper is not production input authority');
ok(!html.includes('game/input/combat-controls.js'), 'production HTML does not load the retired combat wrapper');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
