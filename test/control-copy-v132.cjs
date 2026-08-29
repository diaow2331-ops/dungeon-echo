'use strict';
const fs = require('fs');
const path = require('path');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const core = fs.readFileSync(path.join(root,'game/core/game.js'),'utf8');
const help = fs.readFileSync(path.join(root,'game/ui/help-copy-v126.js'),'utf8');
const version = fs.readFileSync(path.join(root,'VERSION'),'utf8').trim();
const zh = fs.readFileSync(path.join(root,'index.html'),'utf8');
const en = fs.readFileSync(path.join(root,'en/index.html'),'utf8');
let pass=0, fail=0;
const ok=(cond,name)=>{if(cond){pass++;console.log('  PASS '+name)}else{fail++;console.log('  FAIL '+name)}};

ok(core.includes('J Basic Attack · K Skill') && core.includes('Shift+Enter Quick Dive'), 'canonical core publishes the v1.4 J/K/Shift+Enter control truth');
ok(help.includes("const STALE_HUD_CONTROLS = 'C Skill · J Quick Dive'"), 'presentation owner recognizes exactly the v1.3 stale literal');
ok(help.includes("const CURRENT_HUD_CONTROLS = 'J Basic Attack · K Skill'"), 'presentation owner publishes the current v1.4 attack/skill contract');
ok(/function syncHudHint\(\)/.test(help) && /hint\.textContent\.includes\(STALE_HUD_CONTROLS\)/.test(help), 'HUD repair is exact-match scoped');
ok(/replace\(STALE_HUD_CONTROLS, CURRENT_HUD_CONTROLS\)/.test(help), 'legacy presentation fallback remains exact-match and harmless when core is already truthful');
ok(/document\.addEventListener\('keydown', schedule, false\)/.test(help) && /document\.addEventListener\('click', schedule, false\)/.test(help), 'copy resync follows real actions without capture');
ok(!/preventDefault|stopPropagation|stopImmediatePropagation/.test(help), 'copy repair never owns gameplay input');
ok(!/localStorage|getContext\(|DE_TEST\.[A-Za-z_$][\w$]*\s*=/.test(help), 'copy repair owns no gameplay state, storage or Canvas');
ok(help.includes('Walk into the merchant to trade') === false, 'copy repair does not duplicate or overwrite dynamic encounter hints');
ok(help.includes(`version:'${version}'`), 'help-copy version follows the repository release instead of a stale literal');
ok(zh.includes('点击背包查看 · 再选择装备/丢弃') && !zh.includes('点击背包装备'), 'Chinese footer describes select-then-decide backpack semantics');
ok(en.includes('click backpack to inspect · then Equip / Drop') && !en.includes('click backpack to equip'), 'English footer describes select-then-decide backpack semantics');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
