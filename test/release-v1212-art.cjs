'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const run = (cmd,args) => spawnSync(cmd,args,{cwd:root,encoding:'utf8'});
const version = read('VERSION').trim();
const runtime = read('game/core/runtime-bootstrap.js');
const production = read('game/core/production-bootstrap.js');
const reset = read('game/ui/new-run-reset-v167.js');
const manifest = new Set(read('ops/release/static-files.txt').trim().split(/\r?\n/));
const assetVersion = (runtime.match(/const assetVersion = '(\d+)'/) || [,''])[1];

assert.equal(version, '1.2.12');
assert.equal(assetVersion, '167');
assert(runtime.includes('release-stamp-v1212.js'));
assert(runtime.includes('new-run-reset-v167.js'));
assert(production.includes('art-runtime-v4.js?v=167'));
assert(production.includes('town-art-v160.js?v=167'));
assert(!production.includes('class-combat-fx-v163.js'));
assert(!production.includes('hero-directional-art-v165.js'));
assert(!production.includes('hero-gear-art-v162.js'));
assert(reset.includes('localStorage.removeItem(SAVE_KEY)'));
assert(reset.includes('clearsMeta:false'));
assert(reset.includes('preservesExplicitSeed:true'));

const required = [
  'game/ui/art-runtime-v2.js',
  'game/ui/art-runtime-v4.js',
  'game/ui/town-art-v160.js',
  'game/ui/new-run-reset-v167.js',
  'art/loot-atlas-v12.svg',
  'art/equipment-weapons-v13.png',
  'art/equipment-wearables-v13.png',
  'art/runtime/loot-atlas-v2.svg',
  'art/runtime/monster-deep-atlas-v2.svg',
  'art/runtime/hero-action-atlas-v2.svg',
  'art/runtime/dungeon-props-atlas-v1.svg',
  'art/runtime/boss-guardian-atlas-v3.png',
  'art/runtime/final-boss-v3.png',
];
const retired = [
  'game/ui/hero-gear-art-v162.js',
  'game/ui/hero-directional-art-v165.js',
  'game/ui/class-combat-fx-v163.js',
  'art/runtime/hero-directional-atlas-v1.png',
];
for (const rel of required) {
  assert(manifest.has(rel), `release manifest missing ${rel}`);
  assert(fs.existsSync(path.join(root, rel)), `release file missing ${rel}`);
}
for (const rel of retired) assert(!manifest.has(rel), `retired presentation still release-manifested: ${rel}`);

for (const test of [
  'test/art-runtime-v3-bosses.cjs',
  'test/art-runtime-v4.cjs',
  'test/town-art-v160.cjs',
]) {
  const r = run('node',[test]);
  assert.equal(r.status,0,`${test}\n${r.stdout}\n${r.stderr}`);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(),'de-v1212-art-hotfix-'));
const archive = path.join(tmp,'dungeon-v1.2.12.zip');
let r = run('bash',['ops/release/build-site-bundle.sh',archive]);
assert.equal(r.status,0,`${r.stdout}\n${r.stderr}`);
assert.match(r.stdout,/dungeon_echo_bundle_build=PASS/);
assert.match(r.stdout,/asset_generation=167/);

r = run('unzip',['-Z1',archive]);
assert.equal(r.status,0,r.stderr);
const files = new Set(r.stdout.trim().split(/\r?\n/));
for (const rel of required) assert(files.has(`public/dungeon-echo/${rel}`), `artifact missing ${rel}`);
for (const rel of retired) assert(!files.has(`public/dungeon-echo/${rel}`), `artifact still ships retired ${rel}`);

for (const entry of ['public/dungeon-echo/index.html','public/dungeon-echo/en/index.html']) {
  r = run('unzip',['-p',archive,entry]);
  assert.equal(r.status,0,r.stderr);
  assert(r.stdout.includes('?v=167'), `${entry} missing hotfix cache generation`);
  assert(!r.stdout.includes('?v=153'), `${entry} retains source cache generation`);
  assert(!r.stdout.includes('?v=157'), `${entry} retains legacy art cache generation`);
  assert(r.stdout.includes('v1.2.12'), `${entry} semantic version missing`);
}

r = run('unzip',['-p',archive,'SHA256SUMS']);
assert.equal(r.status,0,r.stderr);
assert(r.stdout.includes('public/dungeon-echo/art/runtime/hero-action-atlas-v2.svg'));
assert(r.stdout.includes('public/dungeon-echo/art/runtime/boss-guardian-atlas-v3.png'));
assert(r.stdout.includes('public/dungeon-echo/game/ui/new-run-reset-v167.js'));
assert(!r.stdout.includes('hero-directional-atlas-v1.png'));

fs.rmSync(tmp,{recursive:true,force:true});
console.log('RESULT  Dungeon Echo v1.2.12 corrected art + New Run hotfix artifact PASS');
