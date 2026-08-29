'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const run = (cmd,args) => spawnSync(cmd,args,{cwd:root,encoding:'utf8'});

assert.equal(read('VERSION').trim(), '1.3.0', 'v1.3.0 must be the clean authority epoch');

const zh = read('index.html');
const en = read('en/index.html');
const production = read('game/core/production-bootstrap.js');
const runtime = read('game/core/runtime-bootstrap.js');
const game = read('game/core/game.js');
const manifest = new Set(read('ops/release/static-files.txt').trim().split(/\r?\n/));

const retired = [
  'game/core/save-integrity-system.js',
  'game/core/release-stamp-v1212.js',
  'game/locale/stable-item-id-migration-v150.js',
  'game/ui/visual-polish.js',
  'game/ui/art-runtime-v2.js',
  'game/ui/art-runtime-v4.js',
  'game/ui/town-art-v160.js',
  'game/ui/character-art-cleanup-v122.js',
  'game/ui/world-loot-polish-v122.js',
  'game/ui/hero-directional-art-v165.js',
  'game/ui/class-combat-fx-v163.js',
  'game/ui/new-run-reset-v167.js',
];
const retiredText = [
  'save-integrity-system', 'stable-item-id-migration', 'visual-polish',
  'art-runtime-v2', 'art-runtime-v4', 'town-art-v160', 'character-art-cleanup',
  'world-loot-polish', 'hero-directional-art', 'class-combat-fx', 'new-run-reset',
  'art/runtime/',
];

for (const rel of retired) {
  assert(!exists(rel), `retired active runtime still exists: ${rel}`);
  assert(!manifest.has(rel), `retired active runtime still ships: ${rel}`);
}
for (const html of [zh,en]) {
  assert(html.includes('v1.3.0'), 'entry must expose v1.3.0');
  assert(html.includes('?v=168'), 'entry must use cache generation 168');
  assert(!html.includes('?v=153') && !html.includes('?v=157'), 'entry retains historical cache generation');
  for (const token of retiredText) assert(!html.includes(token), `entry references retired owner: ${token}`);
}

assert(production.includes("const STORAGE_EPOCH = 'v130'"), 'storage epoch v130 missing');
assert(production.includes("renderOwner:'game/core/game.js'"), 'production does not declare core Canvas authority');
assert(production.includes("newAdventure:'full-reset'"), 'New Adventure must be a full reset');
assert(production.includes('historicalSaveMigration:false'), 'historical save migration must be disabled');
assert(production.includes("key.startsWith(LEGACY_PREFIX)"), 'v1.3.0 must purge old Dungeon Echo localStorage keys');
assert(!production.includes('appendArtRuntime'), 'production bootstrap must not dynamically add art renderers');

assert(runtime.includes("const assetVersion = '168'"), 'runtime cache generation must be 168');
assert(runtime.includes("release-stamp-v130.js"), 'v1.3.0 visible stamp missing');
assert(runtime.includes("renderOwner:'game/core/game.js'"), 'runtime does not declare core Canvas authority');
assert(runtime.includes('saveMigration:false'), 'runtime must deny save migration');
for (const token of retiredText) assert(!runtime.includes(token), `runtime chain references retired owner: ${token}`);

for (const token of [
  "heroAtlasV11.src = 'art/hero-atlas-v11.png'",
  "monsterAtlasV11.src = 'art/monster-atlas-v11.png'",
  "guardianAtlasV11.src = 'art/guardian-atlas-v11.png'",
  "finalBossV11.src = 'art/final-boss-v11.png'",
  "townBackdropV11.src = 'art/town-backdrop-v11.webp'",
  'function drawEquippedHero(now)',
  'function drawMonsterV11(m, now)',
]) assert(game.includes(token), `canonical core renderer contract missing: ${token}`);

for (const rel of [
  'game/core/game.js','game/core/release-stamp-v130.js',
  'art/hero-atlas-v11.png','art/monster-atlas-v11.png','art/guardian-atlas-v11.png',
  'art/final-boss-v11.png','art/town-backdrop-v11.webp',
]) {
  assert(exists(rel), `canonical source missing: ${rel}`);
  assert(manifest.has(rel), `canonical source missing from release boundary: ${rel}`);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(),'de-v130-authority-'));
const archive = path.join(tmp,'dungeon-v1.3.0.zip');
let r = run('bash',['ops/release/build-site-bundle.sh',archive]);
assert.equal(r.status,0,`${r.stdout}\n${r.stderr}`);
assert.match(r.stdout,/dungeon_echo_bundle_build=PASS/);
assert.match(r.stdout,/version=1\.3\.0/);
assert.match(r.stdout,/asset_generation=168/);

r = run('unzip',['-Z1',archive]);
assert.equal(r.status,0,r.stderr);
const files = new Set(r.stdout.trim().split(/\r?\n/));
for (const rel of retired) assert(!files.has(`public/dungeon-echo/${rel}`), `artifact ships retired runtime: ${rel}`);
assert(![...files].some(x => x.startsWith('public/dungeon-echo/art/runtime/')), 'artifact ships retired runtime art directory');
for (const rel of ['game/core/game.js','art/hero-atlas-v11.png','art/monster-atlas-v11.png','art/guardian-atlas-v11.png','art/final-boss-v11.png'])
  assert(files.has(`public/dungeon-echo/${rel}`), `artifact missing canonical renderer asset: ${rel}`);

for (const entry of ['public/dungeon-echo/index.html','public/dungeon-echo/en/index.html']) {
  r = run('unzip',['-p',archive,entry]);
  assert.equal(r.status,0,r.stderr);
  assert(r.stdout.includes('v1.3.0'));
  assert(r.stdout.includes('?v=168'));
  for (const token of retiredText) assert(!r.stdout.includes(token), `${entry} references retired owner: ${token}`);
}

fs.rmSync(tmp,{recursive:true,force:true});
console.log('single_authority_v130=PASS');
