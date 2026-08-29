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
const manifest = new Set(read('ops/release/static-files.txt').trim().split(/\r?\n/));
const assetVersion = (runtime.match(/const assetVersion = '(\d+)'/) || [,''])[1];

assert.equal(version, '1.2.12');
assert.equal(assetVersion, '166');
assert(runtime.includes("release-stamp-v1212.js"));
assert(production.includes("art-runtime-v4.js?v=166"));
assert(production.includes("town-art-v160.js?v=166"));
assert(production.includes("class-combat-fx-v163.js?v=166"));
assert(production.includes("hero-directional-art-v165.js?v=166"));
assert(!production.includes('hero-gear-art-v162.js'));

const required = [
  'game/ui/art-runtime-v2.js',
  'game/ui/art-runtime-v4.js',
  'game/ui/town-art-v160.js',
  'game/ui/class-combat-fx-v163.js',
  'game/ui/hero-directional-art-v165.js',
  'art/loot-atlas-v12.svg',
  'art/equipment-weapons-v13.png',
  'art/equipment-wearables-v13.png',
  'art/runtime/loot-atlas-v2.svg',
  'art/runtime/monster-deep-atlas-v2.svg',
  'art/runtime/hero-action-atlas-v2.svg',
  'art/runtime/dungeon-props-atlas-v1.svg',
  'art/runtime/boss-guardian-atlas-v3.png',
  'art/runtime/final-boss-v3.png',
  'art/runtime/hero-directional-atlas-v1.png',
];
for (const rel of required) {
  assert(manifest.has(rel), `release manifest missing ${rel}`);
  assert(fs.existsSync(path.join(root, rel)), `release file missing ${rel}`);
}
assert(!manifest.has('game/ui/hero-gear-art-v162.js'), 'retired equipment-on-body overlay must not ship');

for (const test of [
  'test/art-runtime-v3-bosses.cjs',
  'test/art-runtime-v4.cjs',
  'test/town-art-v160.cjs',
  'test/class-combat-fx-v163.cjs',
  'test/hero-directional-art-v165.cjs',
]) {
  const r = run('node',[test]);
  assert.equal(r.status,0,`${test}\n${r.stdout}\n${r.stderr}`);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(),'de-v1212-art-'));
const archive = path.join(tmp,'dungeon-v1.2.12.zip');
let r = run('bash',['ops/release/build-site-bundle.sh',archive]);
assert.equal(r.status,0,`${r.stdout}\n${r.stderr}`);
assert.match(r.stdout,/dungeon_echo_bundle_build=PASS/);
assert.match(r.stdout,/asset_generation=166/);

r = run('unzip',['-Z1',archive]);
assert.equal(r.status,0,r.stderr);
const files = new Set(r.stdout.trim().split(/\r?\n/));
for (const rel of required) assert(files.has(`public/dungeon-echo/${rel}`), `artifact missing ${rel}`);
assert(!files.has('public/dungeon-echo/game/ui/hero-gear-art-v162.js'));

for (const entry of ['public/dungeon-echo/index.html','public/dungeon-echo/en/index.html']) {
  r = run('unzip',['-p',archive,entry]);
  assert.equal(r.status,0,r.stderr);
  assert(r.stdout.includes('?v=166'), `${entry} missing release cache generation`);
  assert(!r.stdout.includes('?v=153'), `${entry} retains source cache generation`);
  assert(!r.stdout.includes('?v=157'), `${entry} retains legacy art cache generation`);
  assert(r.stdout.includes('v1.2.12'), `${entry} semantic version missing`);
}

r = run('unzip',['-p',archive,'VERSION']);
assert.equal(r.status,0,r.stderr);
assert.equal(r.stdout.trim(),'1.2.12');
r = run('unzip',['-p',archive,'SHA256SUMS']);
assert.equal(r.status,0,r.stderr);
assert(r.stdout.includes('public/dungeon-echo/art/runtime/hero-directional-atlas-v1.png'));
assert(r.stdout.includes('public/dungeon-echo/art/runtime/boss-guardian-atlas-v3.png'));

fs.rmSync(tmp,{recursive:true,force:true});
console.log('RESULT  Dungeon Echo v1.2.12 complete art release artifact PASS');
