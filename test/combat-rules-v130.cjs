'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const generation = String(JSON.parse(fs.readFileSync(path.join(root, 'docs/authority-map-v130.json'), 'utf8')).cacheGeneration);
const rel = 'game/domain/combat/combat-rules-v130.js';
const source = fs.readFileSync(path.join(root, rel), 'utf8');
const executableSource = source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '');
const rules = require(path.join(root, rel));

assert.equal(rules.authority, 'critical-damage-multiplier');
assert.equal(rules.version, 'v1.3.0-production');
assert(!/DE_TEST|addEventListener|getContext\s*\(|localStorage|sessionStorage|document\b|fetch\s*\(|Math\.random/.test(executableSource), 'production combat rules must stay pure and deterministic');

const manifest = fs.readFileSync(path.join(root, 'ops/release/static-files.txt'), 'utf8')
  .split(/\r?\n/).filter(Boolean);
assert(manifest.includes(rel), 'production combat rules must ship exactly once');
assert.equal(manifest.filter(x => x === rel).length, 1, 'combat rules duplicated in release allowlist');
for (const entry of ['index.html', 'en/index.html']) {
  const html = fs.readFileSync(path.join(root, entry), 'utf8');
  const exact = `${rel}?v=${generation}`;
  assert.equal(html.split(exact).length - 1, 1, `${entry}: combat rules must load exactly once`);
  assert(html.indexOf(exact) < html.indexOf(`game/core/game.js?v=${generation}`), `${entry}: combat authority must load before core`);
}

assert.equal(rules.warriorDamageReduction('warrior', 1), 1);
assert.equal(rules.warriorDamageReduction('warrior', 6), 2);
assert.equal(rules.warriorDamageReduction('ranger', 20), 0);
assert.equal(rules.totalDefense(8, 2, 'warrior', 6), 12);
assert.equal(rules.criticalMultiplier(0), 1.8);
assert.equal(rules.criticalMultiplier(25), 2.05);
assert.equal(rules.grievousHealMultiplier(0), 1);
assert.equal(rules.grievousHealMultiplier(2), 0.5);

assert.equal(rules.outgoingHitDamage({ attack:10, variance:1, targetDefense:3 }), 8);
assert.equal(rules.outgoingHitDamage({ attack:10, variance:0, targetDefense:3, multiplier:1.5 }), 11);
assert.equal(rules.outgoingHitDamage({ attack:10, targetDefense:3, critical:true, critMultiplier:2 }), 14);
assert.equal(rules.incomingMeleeDamage({ enemyAttack:10, variance:-1, defense:4 }), 5);
assert.equal(rules.incomingMeleeDamage({ enemyAttack:10, variance:-1, defense:99, armorBreak:true }), 9);
assert.equal(rules.incomingRangedDamage({ enemyAttack:10, variance:1, defense:6 }), 6);
assert.equal(rules.incomingRangedDamage({ enemyAttack:10, variance:1, defense:99, armorBreak:true }), 9);
assert.equal(rules.thornsDamage(4, 3), 7);
assert.equal(rules.killHeal(3, 3, 0), 6);
assert.equal(rules.killHeal(3, 3, 2), 3);

// v1.9.2 atomic transfer: ordinary-monster pressure tuning is owned here.
assert.equal(rules.monsterThreatScale(1, false, false), 1.10);
assert.equal(Number(rules.monsterThreatScale(100, false, false).toFixed(2)), 1.36);
assert.equal(Number(rules.monsterThreatScale(100, true, false).toFixed(2)), 1.42);
assert.equal(rules.monsterThreatScale(100, true, true), 1, 'boss-like actors keep authored stats');
assert.equal(rules.monsterHpPressure(1), 1.75);
assert.equal(Number(rules.monsterHpPressure(100).toFixed(4)), 2.1658);
assert.equal(rules.monsterHpPressure(50, true), 1, 'guardian HP pressure stays neutral');
assert.equal(rules.monsterDefDepthBonus(11), 0);
assert.equal(rules.monsterDefDepthBonus(12), 1);
assert.equal(rules.monsterDefDepthBonus(96), 8);

const coreSrc = fs.readFileSync(path.join(root, 'game/core/game.js'), 'utf8');
assert(coreSrc.includes('COMBAT_RULES.monsterThreatScale(d, elite, bossLike)'), 'core delegates threat tuning to the combat rules authority');
assert(coreSrc.includes('COMBAT_RULES.monsterHpPressure(depth, bossLike)'), 'core delegates HP pressure to the combat rules authority');
assert(coreSrc.includes('COMBAT_RULES.monsterDefDepthBonus(depth)'), 'core delegates the DEF depth bonus to the combat rules authority');
assert(!/0\.10 \+ Math\.min\(0\.26/.test(coreSrc) && !/Math\.floor\(depth \/ 12\)/.test(coreSrc),
  'core no longer duplicates the pressure formulas after the atomic transfer');

console.log('combat_rules_v130=PASS');
