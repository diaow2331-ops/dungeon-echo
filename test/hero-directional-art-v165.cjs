'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const runtime = read('game/ui/hero-directional-art-v165.js');
const bootstrap = read('game/core/production-bootstrap.js');
const releaseFiles = new Set(read('ops/release/static-files.txt').trim().split(/\r?\n/));

assert(fs.existsSync(path.join(root, 'art/runtime/hero-directional-atlas-v1.png')), 'directional hero atlas missing');
assert(releaseFiles.has('game/ui/hero-directional-art-v165.js'), 'directional hero runtime missing from release boundary');
assert(releaseFiles.has('art/runtime/hero-directional-atlas-v1.png'), 'directional hero atlas missing from release boundary');
assert(!releaseFiles.has('game/ui/hero-gear-art-v162.js'), 'retired hero gear overlay still ships');

for (const cls of ["warrior:0","ranger:1","mage:2","assassin:3"])
  assert(runtime.includes(cls), `class row missing: ${cls}`);
for (const dir of ["down:0","up:1","left:2","right:3"])
  assert(runtime.includes(dir), `direction column missing: ${dir}`);

assert(runtime.includes('player.facing') || runtime.includes('p && p.facing'), 'runtime must read player facing');
assert(runtime.includes("owner:'presentation'"), 'directional hero art must remain presentation-owned');
assert(runtime.includes('gameplayMutation:false'), 'directional hero art must explicitly deny gameplay mutation');
assert(runtime.includes('equipmentOverlay:false'), 'dynamic equipment-on-body overlay must stay disabled');
assert(runtime.includes('z-index:4'), 'directional hero must render above unified entity art');

assert(bootstrap.includes("../ui/hero-directional-art-v165.js?v=165"), 'production must load directional hero runtime');
assert(bootstrap.includes("'__DE_HERO_DIRECTIONAL_ART_V165'"), 'production must guard directional hero runtime');
assert(!bootstrap.includes('hero-gear-art-v162.js'), 'production must not load retired equipment overlay');
assert(bootstrap.includes('class-combat-fx-v163.js'), 'existing class combat FX must remain loaded');

for (const forbidden of [
  'Math.random(', 'localStorage.setItem(', 'api.tryMove(', 'api.useSkill(',
  'api.player.equip =', 'api.meta =', 'api.depth =',
]) assert(!runtime.includes(forbidden), `directional art owns gameplay behavior: ${forbidden}`);

console.log('hero-directional-art-v165=PASS');
