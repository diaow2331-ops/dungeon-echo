'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const runtime = read('game/ui/art-runtime-v4.js');
const entity = read('game/ui/art-runtime-v2.js');
const bootstrap = read('game/core/production-bootstrap.js');
const releaseFiles = new Set(read('ops/release/static-files.txt').trim().split(/\r?\n/));

assert(releaseFiles.has('game/ui/art-runtime-v4.js'), 'v4 terrain coordinator missing from release boundary');
assert(!releaseFiles.has('game/ui/art-runtime-v3.js'), 'retired duplicate v3 runtime must leave release boundary');
assert(bootstrap.includes("../ui/art-runtime-v4.js?v=160"), 'production bootstrap must load v4 coordinator');
assert(!bootstrap.includes("../ui/art-runtime-v3.js"), 'production bootstrap must not load retired duplicate v3 runtime');
assert(bootstrap.includes("version:'superseded-by-v4'"), 'legacy direct-v2 sentinel missing');
assert(runtime.includes("./art-runtime-v2.js?v=${ENTITY_VERSION}"), 'v4 must force a fresh unified entity runtime load');
assert(runtime.includes("const ENTITY_VERSION = '160'"), 'entity cache generation must advance with v4');
assert(entity.includes("version:'v3-unified'"), 'unified entity runtime contract missing');

assert(runtime.includes('const THEME_VISUALS = Object.freeze(['), 'terrain theme table missing');
assert(runtime.includes("themeCount:THEME_VISUALS.length"), 'terrain runtime metadata missing theme count');
assert(runtime.includes("terrainBandSize:THEME_BAND_SIZE"), 'terrain runtime metadata missing band size');
assert(runtime.includes('function drawFloorMaterials(d, depth, style)'), 'floor material renderer missing');
assert(runtime.includes('function drawWallRelief(d, style)'), 'wall relief renderer missing');
assert(runtime.includes('function drawDepthAtmosphere(d, depth, style)'), 'depth atmosphere renderer missing');
for (const motif of ['masonry','moss','vein','ember','frost','ripple','rune','forge','web','star','bone','crack','dark'])
  assert(runtime.includes(`motif:'${motif}'`), `terrain motif missing: ${motif}`);

for (const forbidden of [
  'localStorage.setItem(',
  'Math.random(',
  'player.hp =',
  'player.atkBase =',
  'player.def =',
  'monsters.push(',
  'items.push(',
  'api.depth =',
  'api.mapGrid =',
]) assert(!runtime.includes(forbidden), `v4 terrain layer owns gameplay mutation: ${forbidden}`);

console.log('art-runtime-v4=PASS');
