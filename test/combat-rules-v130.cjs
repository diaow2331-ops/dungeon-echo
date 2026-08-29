'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
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
  assert.equal((html.match(/game\/domain\/combat\/combat-rules-v130\.js\?v=169/g) || []).length, 1, `${entry}: combat rules must load exactly once`);
  assert(html.indexOf('game/domain/combat/combat-rules-v130.js?v=169') < html.indexOf('game/core/game.js?v=169'), `${entry}: combat authority must load before core`);
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

console.log('combat_rules_v130=PASS');
