'use strict';
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
const read=r=>fs.readFileSync(path.join(root,r),'utf8');const zh=read('index.html'),en=read('en/index.html'),core=read('game/core/game.js'),rules=read('game/domain/inventory/equipment-rules-v130.js'),boot=read('game/core/production-bootstrap.js'),pad=read('game/input/desktop-controls.js'),runtime=read('game/core/runtime-bootstrap.js');
ok(!zh.includes('archive/quarantine')&&!en.includes('archive/quarantine')&&!runtime.includes('combat-controls.js'),'production graph never reconnects quarantined combat controls');
ok(!core.includes('__DE_COMBAT_CONTROLS_V1')&&!core.includes('api.useSkill ='),'canonical core does not depend on or recreate retired combat wrapper API patching');
ok(/function directionalAttack\(\)/.test(core)&&/function endTurn\(manaBonus=0, announceFocus=false\)/.test(core)&&/function ensurePlayerMana/.test(core),'combat, turns and Mana remain canonical game.js responsibilities');
ok(/weaponClassForItem/.test(rules)&&/canEquipItem/.test(rules)&&!/localStorage|addEventListener|querySelector|document\./.test(rules),'equipment authority adds proficiency as pure rules without live state/input/storage ownership');
ok(/de-greedy-on-v1/.test(boot)&&!/manaMax|directionalAttack|playerRangedAttack/.test(boot),'production bootstrap preserves New Run intent without taking combat/Mana ownership');
ok(/emitKey/.test(pad)&&!/DE_TEST|directionalAttack|useSkill\(|manaMax|localStorage/.test(pad),'gamepad remains transport-only and does not own gameplay state or actions');
for(const rel of ['game/ui/help-copy-v126.js','game/ui/adaptive-bgm-v132.js','game/ui/forge-feedback-v132.js']){const s=read(rel);ok(!/preventDefault\(|stopImmediatePropagation\(|capture:\s*true|localStorage\.setItem\(\s*['"]de-run/.test(s),`${rel} remains presentation-only`)}
console.log(`\nRESULT ${pass} passed / ${fail} failed`);process.exit(fail?1:0);
