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

const js = read('game/ui/theme-atmosphere-v131.js');
const css = read('game/ui/theme-atmosphere-v131.css');
const polish = read('game/ui/static-art-polish-v131.css');
const hero = read('game/ui/hero-action-recovery-v131.css');
const runtime = read('game/core/runtime-bootstrap.js');
const release = read('ops/release/static-files.txt');

const bands = [...css.matchAll(/data-de-theme-band="(\d+)"/g)].map(m => Number(m[1]));
ok(bands.length === 21 && bands.every((v, i) => v === i), 'all 21 classic theme bands are represented exactly once');
ok(/Math\.min\(20, Math\.floor\(\(depth - 1\) \/ 4\)\)/.test(js), 'HUD depth maps deterministically into the historical 4-floor theme bands');
ok(/MutationObserver/.test(js) && /st-depth/.test(js) && /stage\.dataset\.deThemeBand/.test(js), 'DOM-only observer exposes the presentation band');
ok(!/DE_TEST|getContext|requestAnimationFrame|setInterval|localStorage|keydown|keyup/.test(js), 'theme follower owns no gameplay Canvas polling storage or input authority');
ok(/--de-canvas-sat/.test(polish) && /--de-canvas-contrast/.test(polish) && /--de-canvas-bright/.test(polish), 'canonical canvas surface consumes theme presentation variables');
ok(/theme-atmosphere-v131\.css/.test(hero), 'existing production CSS chain imports atmosphere styling');
ok(/theme-atmosphere-v131\.js/.test(runtime), 'DOM-only production runtime loads the theme observer');
ok(/game\/ui\/theme-atmosphere-v131\.css/.test(release) && /game\/ui\/theme-atmosphere-v131\.js/.test(release), 'release allowlist admits atmosphere CSS and observer');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
