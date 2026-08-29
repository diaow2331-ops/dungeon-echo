'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const rel = 'game/domain/progression/progression-rules-v130.js';
const source = fs.readFileSync(path.join(root, rel), 'utf8');
const executableSource = source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '');
const rules = require(path.join(root, rel));

assert.equal(rules.authority, 'none');
assert.equal(rules.version, 'v1.3.0-staged');
assert(!/DE_TEST|addEventListener|getContext\s*\(|localStorage|sessionStorage|document\b|fetch\s*\(/.test(executableSource), 'staged progression rules must stay pure and disconnected');

const manifest = fs.readFileSync(path.join(root, 'ops/release/static-files.txt'), 'utf8')
  .split(/\r?\n/).filter(Boolean);
assert(!manifest.includes(rel), 'staged progression rules must not enter release before atomic authority transfer');
for (const entry of ['index.html', 'en/index.html']) {
  const html = fs.readFileSync(path.join(root, entry), 'utf8');
  assert(!html.includes(rel), `${entry}: staged progression rules must not be loaded in production`);
}

assert.equal(rules.xpThreshold(1), 15);
assert.equal(rules.xpThreshold(10), 150);
assert.deepEqual(rules.levelUpDelta(), { hpBase:6, atkBase:1, immediateHeal:8 });
assert.equal(rules.talentDue(1), false);
assert.equal(rules.talentDue(3), true);
assert.equal(rules.talentDue(6), true);
assert.equal(rules.nextTalentLevel(1), 3);
assert.equal(rules.nextTalentLevel(3), 6);

const warrior = { hpBase:38, atkBase:4 };
assert.deepEqual(rules.progressionCaps(warrior, 50), { level:50, hp:492, atk:77 });
assert.deepEqual(
  rules.progressionCaps(warrior, 50, { legacyLvl:60, legacyHp:520, legacyAtk:90 }),
  { level:60, hp:520, atk:90 }
);
assert.deepEqual(
  rules.clampGrowthSnapshot({ lvl:55, hpBase:600, atkBase:100, xp:9999 }, warrior),
  { level:50, hpBase:492, atkBase:77, xp:749, changed:true, caps:{ level:50, hp:492, atk:77 } }
);

assert.deepEqual(rules.reachedEvolutionMilestones(19), []);
assert.deepEqual(rules.reachedEvolutionMilestones(40), [20, 40]);
assert.equal(rules.nextEvolutionMilestone(1), 20);
assert.equal(rules.nextEvolutionMilestone(40), 60);
assert.equal(rules.nextEvolutionMilestone(80), null);
assert(Object.isFrozen(rules.SKILL_EVOLUTION_MILESTONES));

console.log('progression_rules_v130=PASS');
