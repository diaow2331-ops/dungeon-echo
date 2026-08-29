'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const rel = 'game/domain/town/town-rules-v130.js';
const source = fs.readFileSync(path.join(root, rel), 'utf8');
const executableSource = source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '');
const rules = require(path.join(root, rel));

assert.equal(rules.authority, 'none');
assert.equal(rules.version, 'v1.3.0-staged');
assert(!/DE_TEST|addEventListener|getContext\s*\(|localStorage|sessionStorage|document\b|fetch\s*\(|Math\.random/.test(executableSource), 'staged town rules must stay pure and disconnected');

const manifest = fs.readFileSync(path.join(root, 'ops/release/static-files.txt'), 'utf8')
  .split(/\r?\n/).filter(Boolean);
assert(!manifest.includes(rel), 'staged town rules must not enter release before atomic authority transfer');
for (const entry of ['index.html', 'en/index.html']) {
  const html = fs.readFileSync(path.join(root, entry), 'utf8');
  assert(!html.includes(rel), `${entry}: staged town rules must not be loaded in production`);
}

assert.deepEqual(rules.unlockedCheckpoints(0), [1]);
assert.deepEqual(rules.unlockedCheckpoints(11), [1, 11]);
assert.deepEqual(rules.unlockedCheckpoints(55), [1, 11, 21, 31, 41, 51]);
assert.equal(rules.deepestUnlockedCheckpoint(55), 51);
assert.equal(rules.isCheckpointUnlocked(41, 55), true);
assert.equal(rules.isCheckpointUnlocked(61, 55), false);
assert.equal(rules.normalizeCheckpointSelection(61, 55), 51);
assert.equal(rules.normalizeCheckpointSelection(41, 55), 41);
assert.equal(rules.checkpointUnlockedByGuardian(10), 11);
assert.equal(rules.checkpointUnlockedByGuardian(90), 91);
assert.equal(rules.checkpointUnlockedByGuardian(100), null);
assert.equal(rules.checkpointUnlockedByGuardian(33), null);

assert.deepEqual(rules.expeditionReadiness({ potions:2, escapes:1, keys:0 }), {
  ready:true, potions:2, escapes:1, keys:0, missing:[],
});
assert.deepEqual(rules.expeditionReadiness({ potions:1, escapes:0, keys:3 }), {
  ready:false, potions:1, escapes:0, keys:3, missing:['potions', 'escape'],
});
assert(Object.isFrozen(rules.CHECKPOINTS));

console.log('town_rules_v130=PASS');
