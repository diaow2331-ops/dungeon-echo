'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'profiles/classic-100.profile.js'), 'utf8');
const sandbox = { window: { DE_PROFILES: {} } };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'classic-100.profile.js' });
const profile = sandbox.window.DE_PROFILES['classic-100'];
const fr = profile && profile.floorRules;
let pass = 0, fail = 0;
const ok = (cond, name) => {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
};
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

ok(!!profile && profile.profileId === 'classic-100', 'classic-100 profile loads');
ok(fr.minPotions === 1, 'each floor guarantees one baseline healing potion');
ok(fr.lootCounts.potionLo === 1 && fr.lootCounts.potionHi === 1,
  'baseline floor potion roll is fixed at one');
ok(near(fr.killLoot.potion - fr.killLoot.gold, 0.07),
  'ordinary kill potion band is seven percent');
ok(fr.killLoot.gold < fr.killLoot.potion && fr.killLoot.potion < fr.killLoot.equip,
  'kill-loot thresholds remain ordered');

function expectedFloorPotionSupply(depth) {
  const want = Math.min(
    Math.max(fr.baseMonsterCount + depth * fr.monsterPerDepth, fr.minMonsters),
    fr.maxMonsters
  );
  const killPotionChance = fr.killLoot.potion - fr.killLoot.gold;
  return fr.minPotions + want * (1 - fr.eliteChance) * killPotionChance;
}
const early = expectedFloorPotionSupply(1);
const late = expectedFloorPotionSupply(20);
ok(early > 1 && early < 1.5, 'early expected potion supply stays scarce but reliable');
ok(late > 2 && late < 2.5, 'late expected potion supply grows through combat rather than floor guarantees');
ok(fr.eliteChance === 0.16 && fr.eliteHpMult === 2.20 && fr.eliteAtkMult === 1.45 && fr.depthScaleMax === 0.50,
  'resource pressure coexists with the separately governed guardian-pressure baseline');
ok(!/commerce-system|combat-pressure/.test(source),
  'resource pressure is owned directly by the canonical profile, not a retired runtime mutator');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
