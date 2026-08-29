'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const runtime = read('game/ui/hero-gear-art-v162.js');
const bootstrap = read('game/core/production-bootstrap.js');
const releaseFiles = new Set(read('ops/release/static-files.txt').trim().split(/\r?\n/));

assert(releaseFiles.has('game/ui/hero-gear-art-v162.js'), 'hero gear art runtime missing from release boundary');
assert(releaseFiles.has('art/runtime/loot-atlas-v2.svg'), 'hero gear weapon atlas missing from release boundary');

for (const slot of ['weapon','armor','helmet','boots','ring','amulet'])
  assert(runtime.includes(`'${slot}'`), `hero gear slot missing: ${slot}`);

for (const feature of [
  'function drawGroundAura',
  'function drawDefense',
  'function drawWeapon',
  'function drawAccessories',
  'function drawForge',
  'function drawMechanicRune',
]) assert(runtime.includes(feature), `hero gear visual feature missing: ${feature}`);

assert(runtime.includes("runtimeAsset('loot-atlas-v2.svg')"), 'hero gear must reuse admitted loot atlas');
assert(runtime.includes("owner:'presentation'"), 'hero gear art must remain presentation-owned');
assert(runtime.includes('gameplayMutation:false'), 'hero gear art must explicitly deny gameplay mutation');
assert(runtime.includes('rarityDriven:true'), 'rarity visual feedback missing');
assert(runtime.includes('forgeDriven:true'), 'forge visual feedback missing');
assert(runtime.includes('mechanicDriven:true'), 'mechanic visual feedback missing');
assert(runtime.includes('p.equip'), 'hero gear runtime must read equipped items');
assert(runtime.includes('p.facing'), 'hero weapon feedback must follow facing');

assert(bootstrap.includes("../ui/hero-gear-art-v162.js?v=162"), 'production bootstrap must load hero gear art');
assert(bootstrap.includes("'__DE_HERO_GEAR_ART_V162'"), 'production bootstrap must guard hero gear art');

for (const forbidden of [
  'Math.random(',
  'localStorage.setItem(',
  'p.equip =',
  'p.hp =',
  'p.atkBase =',
  'p.def =',
  'api.depth =',
  'monsters.push(',
  'items.push(',
]) assert(!runtime.includes(forbidden), `hero gear presentation owns gameplay mutation: ${forbidden}`);

console.log('hero-gear-art-v162=PASS');
