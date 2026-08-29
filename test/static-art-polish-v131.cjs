'use strict';
const fs = require('fs');
const path = require('path');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
let pass = 0, fail = 0;
const ok = (cond, name) => {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
};

const equip = read('game/ui/equipment-art-v13.css');
const polish = read('game/ui/static-art-polish-v131.css');
const release = read('ops/release/static-files.txt');

ok(/@import url\("\.\/static-art-polish-v131\.css"\)/.test(equip), 'equipment presentation imports static art polish');
ok(/canvas#game/.test(polish) && /#town-scene/.test(polish) && /#town-screen \.town-service/.test(polish), 'reviewed dungeon/town static polish is present');
ok(/prefers-reduced-motion/.test(polish), 'motion-sensitive hover treatment has a reduced-motion path');
ok(!/createElement|requestAnimationFrame|setInterval|localStorage|addEventListener/.test(polish), 'static polish owns no runtime/gameplay authority');
ok(/game\/ui\/static-art-polish-v131\.css/.test(release), 'release allowlist admits static polish');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
