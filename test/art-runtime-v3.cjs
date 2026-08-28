'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const runtime = read('game/ui/art-runtime-v3.js');
const bootstrap = read('game/core/production-bootstrap.js');
const releaseFiles = new Set(read('ops/release/static-files.txt').trim().split(/\r?\n/));

assert(releaseFiles.has('game/ui/art-runtime-v3.js'), 'v3 art runtime missing from release boundary');
for (const rel of [
  'art/runtime/monster-deep-atlas-v2.svg',
  'art/runtime/dungeon-props-atlas-v1.svg',
  'art/guardian-atlas-v11.png',
  'art/final-boss-v11.png',
]) assert(releaseFiles.has(rel), `v3 dependency missing from release boundary: ${rel}`);

for (const sprite of [
  'frostmage', 'golem', 'spider', 'cultist', 'lich', 'skeleton',
  'ghost', 'vampire', 'demon', 'dragonkin', 'wraith',
]) assert(runtime.includes(`${sprite}:{ cell:`), `extended monster art missing: ${sprite}`);

for (const depth of [10,20,30,40,50,60,70,80,90])
  assert(runtime.includes(`${depth}:`), `guardian art depth missing: ${depth}`);

assert(runtime.includes("finalBoss: artAsset('final-boss-v11.png')"), 'final boss art dependency missing');
assert(runtime.includes('function drawAmbientProps(d)'), 'ambient dungeon dressing missing');
assert(runtime.includes('function drawExtendedMonsters(d)'), 'extended monster presentation missing');
assert(runtime.includes('function drawBosses(d, now)'), 'boss presentation missing');
assert(runtime.includes('bossAura(q, depth, true, now, 49)'), 'final boss aura staging missing');
assert(runtime.includes('ambientDressing:true'), 'v3 runtime metadata must expose ambient dressing');
assert(runtime.includes("owner:'presentation'"), 'v3 must remain presentation-owned');
assert(runtime.includes('gameplayMutation:false'), 'v3 must explicitly deny gameplay ownership');

assert(bootstrap.includes("../ui/art-runtime-v3.js?v=158"), 'production bootstrap must load v3 art runtime');
assert(bootstrap.includes("'__DE_ART_RUNTIME_V3'"), 'production bootstrap must guard duplicate v3 loading');

for (const forbidden of [
  'localStorage.setItem(',
  'Math.random(',
  'player.hp =',
  'player.atkBase =',
  'player.def =',
  'monsters.push(',
  'items.push(',
  'api.depth =',
]) assert(!runtime.includes(forbidden), `v3 presentation runtime owns gameplay mutation: ${forbidden}`);

console.log('art-runtime-v3=PASS');
