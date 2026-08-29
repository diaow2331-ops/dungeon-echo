'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const profileSource = fs.readFileSync(path.join(root, 'profiles/classic-100.profile.js'), 'utf8');
const core = fs.readFileSync(path.join(root, 'game/core/game.js'), 'utf8');
const sandbox = { window: { DE_PROFILES: {} } };
vm.createContext(sandbox);
vm.runInContext(profileSource, sandbox, { filename:'classic-100.profile.js' });
const profile = sandbox.window.DE_PROFILES['classic-100'];
const fr = profile.floorRules;
const guardians = [...profile.midBosses, { ...profile.boss, depth:100 }];
const expected = [
  [10,140,18,6], [20,220,25,9], [30,320,32,11], [40,440,40,14], [50,580,49,17],
  [60,740,58,20], [70,920,68,23], [80,1140,79,26], [90,1400,91,30], [100,2200,104,34],
];
let pass=0, fail=0;
const ok=(cond,name)=>{ if(cond){pass++;console.log('  PASS '+name)} else {fail++;console.log('  FAIL '+name)} };

ok(fr.depthScaleMax===0.50 && fr.eliteChance===0.16 && fr.eliteHpMult===2.20 && fr.eliteAtkMult===1.45,
  'human-tested depth and elite pressure is canonical');
ok(guardians.length===10, 'nine guardians plus floor-100 finale are present');
for (let i=0;i<expected.length;i++) {
  const [depth,hp,atk,def]=expected[i], g=guardians[i];
  ok(g.depth===depth && g.hp===hp && g.atk===atk && g.def===def,
    `depth ${depth} target is ${hp}/${atk}/${def}`);
}
ok(guardians.every((g,i)=>i===0 || (g.hp>guardians[i-1].hp && g.atk>guardians[i-1].atk && g.def>guardians[i-1].def)),
  'guardian pressure rises monotonically through floor 100');
ok(profile.midBoss.hp===140 && profile.midBoss.atk===18 && profile.midBoss.def===6,
  'legacy single midBoss alias matches floor-10 target');
ok(fr.minPotions===1 && fr.lootCounts.potionLo===1 && fr.lootCounts.potionHi===1 && Math.abs((fr.killLoot.potion-fr.killLoot.gold)-0.07)<1e-9,
  'resource-pressure recovery remains intact');
ok(guardians.every(g=>!Object.prototype.hasOwnProperty.call(g,'armorBreak')),
  'profile restores stats without reintroducing generic guardian armor-break ownership');
ok(/function beginArmorBreak\(m, mode\)/.test(core) && /function normalizeGuardianIdentity\(m\)/.test(core),
  'guardian telegraph/mechanic ownership remains in canonical core');
ok(/function pierceChanceOf\(\) \{ return 0; \}/.test(core), 'hidden random armor penetration remains disabled');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
