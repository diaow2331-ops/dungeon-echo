'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const rel = 'game/domain/inventory/equipment-rules-v130.js';
const source = fs.readFileSync(path.join(root, rel), 'utf8');
const rules = require(path.join(root, rel));

assert.equal(rules.authority, 'none');
assert.equal(rules.version, 'v1.3.0-staged');
assert.equal(rules.source, 'archive/quarantine-v130/gameplay/equipment/equipment-system.js');
assert(!/DE_TEST|addEventListener|getContext\s*\(|localStorage|sessionStorage|fetch\s*\(/.test(source), 'staged inventory rules must stay pure and disconnected');

const sample = { atk:10, def:5, hp:20, crit:4, leech:3, gold:10, thorns:2, regen:1 };
assert.equal(rules.classFitScore(sample, 'warrior'), 73);
assert.equal(rules.classFitScore(sample, 'ranger'), 69);
assert.equal(rules.classFitScore(sample, 'mage'), 71);
assert.equal(rules.classFitScore(sample, 'assassin'), 71);
assert.equal(rules.classFitScore(sample, 'unknown'), 73, 'unknown class must fall back to warrior weights');

assert.deepEqual(rules.depthBonus('helmet', 13), null);
assert.deepEqual(rules.depthBonus('helmet', 14), { hp:6 });
assert.deepEqual(rules.depthBonus('boots', 44), { def:1, hp:32 });
assert.deepEqual(rules.depthBonus('amulet', 92), { hp:72, crit:10 });
assert.deepEqual(rules.depthBonus('weapon', 100), null);

assert.equal(rules.rarityWeight(50, 0, 1), 50);
assert.equal(rules.rarityWeight(50, 0, 100), 26);
assert.equal(rules.rarityWeight(27, 1, 100), 30);
assert(Math.abs(rules.rarityWeight(50, 0, 50) - 38.1212121212) < 1e-9);

assert.deepEqual(
  rules.scaleAffixRange({ lo:1, hiGrow:4, growDiv:6 }, 1.18, 'atk'),
  { lo:1, hiGrow:5, growDiv:6 }
);
assert.deepEqual(
  rules.affinityRange({ lo:1, hiGrow:4, growDiv:10 }, 'warrior', 'def'),
  { lo:1, hiGrow:3, growDiv:15 }
);

assert(Object.isFrozen(rules.AFFINITY));
assert(Object.isFrozen(rules.FIT_WEIGHT));
assert(Object.isFrozen(rules.RARITY_TARGETS));
assert(Object.isFrozen(rules.DEEP_THRESHOLDS));

console.log('inventory_rules_v130=PASS');
