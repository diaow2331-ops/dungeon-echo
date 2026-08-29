'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const runtime = read('game/ui/class-combat-fx-v163.js');
const bootstrap = read('game/core/production-bootstrap.js');
const releaseFiles = new Set(read('ops/release/static-files.txt').trim().split(/\r?\n/));

assert(releaseFiles.has('game/ui/class-combat-fx-v163.js'), 'class combat FX runtime missing from release boundary');
for (const cls of ['warrior','ranger','mage','assassin'])
  assert(runtime.includes(`${cls}:`), `class FX palette missing: ${cls}`);

for (const feature of [
  'function warriorFx',
  'function rangerFx',
  'function mageFx',
  'function assassinFx',
  'function facing',
  'skillStartedAt',
]) assert(runtime.includes(feature), `directional combat feature missing: ${feature}`);

assert(runtime.includes('p.facing'), 'combat FX must read player facing');
assert(runtime.includes('p.lungeT'), 'combat FX must read attack animation state');
assert(runtime.includes('p.skillCd'), 'combat FX must detect skill animation state');
assert(runtime.includes("owner:'presentation'"), 'class combat FX must remain presentation-owned');
assert(runtime.includes('gameplayMutation:false'), 'class combat FX must explicitly deny gameplay mutation');
assert(runtime.includes('directional:true'), 'directional metadata missing');
assert(runtime.includes('skillCooldownReadOnly:true'), 'skill cooldown read-only metadata missing');

assert(bootstrap.includes("../ui/class-combat-fx-v163.js?v=163"), 'production bootstrap must load class combat FX');
assert(bootstrap.includes("'__DE_CLASS_COMBAT_FX_V163'"), 'production bootstrap must guard class combat FX');

for (const forbidden of [
  'Math.random(',
  'localStorage.setItem(',
  'useSkill(',
  'tryMove(',
  'p.skillCd =',
  'p.lungeT =',
  'p.x =',
  'p.y =',
  'api.depth =',
]) assert(!runtime.includes(forbidden), `class combat FX owns gameplay mutation: ${forbidden}`);

console.log('class-combat-fx-v163=PASS');
