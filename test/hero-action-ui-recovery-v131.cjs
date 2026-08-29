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

const atlas = read('art/hero-action-atlas-v2.svg');
const css = read('game/ui/hero-action-recovery-v131.css');
const polish = read('game/ui/static-art-polish-v131.css');
const release = read('ops/release/static-files.txt');

ok(/width="192" height="192"/.test(atlas), 'hero action atlas keeps the reviewed 192x192 contract');
ok(/warrior[\s\S]*0%/.test(css) && /ranger[\s\S]*33\.333333%/.test(css) && /mage[\s\S]*66\.666667%/.test(css) && /assassin[\s\S]*100%/.test(css), 'all four class rows are mapped');
ok(/de-hero-action-preview/.test(css) && /33\.333333%[\s\S]*66\.666667%[\s\S]*100%/.test(css), 'idle attack hurt skill preview states are exposed');
ok(/class-chip\[data-class\]/.test(css), 'HUD class chip uses recovered hero identity art');
ok(/prefers-reduced-motion/.test(css), 'preview has a reduced-motion fallback');
ok(!/getContext|createElement|requestAnimationFrame|setInterval|localStorage|addEventListener/.test(css), 'hero recovery owns no Canvas gameplay or input authority');
ok(/hero-action-recovery-v131\.css/.test(polish), 'production CSS chain loads hero recovery');
ok(/art\/hero-action-atlas-v2\.svg/.test(release) && /game\/ui\/hero-action-recovery-v131\.css/.test(release), 'release allowlist admits hero art and CSS');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
