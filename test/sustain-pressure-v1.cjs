'use strict';
const fs = require('fs');
const path = require('path');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'combat-pressure.js'), 'utf8');
const profile = fs.readFileSync(path.join(root, 'profiles/classic-100.profile.js'), 'utf8');
let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; console.log('  PASS ' + name); } else { fail++; console.log('  FAIL ' + name); } };

ok(/__DE_SUSTAIN_PRESSURE_V1/.test(src) && /version:\s*'v1'/.test(src), 'sustain pressure declares v1');
ok(/minPotions:\s*1/.test(src) && /killPotionThreshold:\s*0\.67/.test(src), 'supply policy keeps one guaranteed floor potion and ~7% kill-potion window');
ok(/fr\.minPotions\s*=\s*SUPPLY_POLICY\.minPotions/.test(src), 'production minimum potion floor is patched through policy');
ok(/drops\.potion\s*=\s*SUPPLY_POLICY\.killPotionThreshold/.test(src), 'kill potion threshold is explicitly reduced');
ok(/potionLo:\s*1,\s*potionHi:\s*2/.test(profile), 'base floor generation still rolls one or two potions');
ok(/killLoot:\s*\{\s*gold:\s*0\.60,\s*potion:\s*0\.74,\s*equip:\s*0\.83\s*\}/.test(profile), 'source profile remains unchanged and pressure patch owns the live adjustment');
ok(!/potionPrice\s*=|healPrice\s*=|restFloors\s*=|player\.potions\s*=|meta\.potions\s*=/.test(src), 'shops, rest cadence and owned supplies are not nerfed');
ok(/patchSupply\(fr\)/.test(src) && /patchProfile\(\)/.test(src), 'supply policy is applied during production profile patching');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
