'use strict';
const fs = require('fs');
const path = require('path');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const core = fs.readFileSync(path.join(root,'game/core/game.js'),'utf8');
const help = fs.readFileSync(path.join(root,'game/ui/help-copy-v126.js'),'utf8');
let pass=0, fail=0;
const ok=(cond,name)=>{if(cond){pass++;console.log('  PASS '+name)}else{fail++;console.log('  FAIL '+name)}};

ok(!core.includes('J Attack · K Skill') && core.includes('C Skill · J Quick Dive'), 'canonical core now publishes the current C/J English control truth');
ok(help.includes("const STALE_HUD_CONTROLS = 'J Attack · K Skill'"), 'presentation owner recognizes exactly the stale literal');
ok(help.includes("const CURRENT_HUD_CONTROLS = 'C Skill · J Quick Dive'"), 'presentation owner publishes the current C/J contract');
ok(/function syncHudHint\(\)/.test(help) && /hint\.textContent\.includes\(STALE_HUD_CONTROLS\)/.test(help), 'HUD repair is exact-match scoped');
ok(/replace\(STALE_HUD_CONTROLS, CURRENT_HUD_CONTROLS\)/.test(help), 'legacy presentation fallback remains exact-match and harmless when core is already truthful');
ok(/document\.addEventListener\('keydown', schedule, false\)/.test(help) && /document\.addEventListener\('click', schedule, false\)/.test(help), 'copy resync follows real actions without capture');
ok(!/preventDefault|stopPropagation|stopImmediatePropagation/.test(help), 'copy repair never owns gameplay input');
ok(!/localStorage|getContext\(|DE_TEST\.[A-Za-z_$][\w$]*\s*=/.test(help), 'copy repair owns no gameplay state, storage or Canvas');
ok(help.includes('Walk into the merchant to trade') === false, 'copy repair does not duplicate or overwrite dynamic encounter hints');
ok(/version:'1\.3\.2'/.test(help), 'help-copy version identifies current-control repair');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
