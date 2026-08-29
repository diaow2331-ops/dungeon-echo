'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const run = (command, args, options={}) => spawnSync(command, args, {
  cwd: options.cwd || root,
  encoding: 'utf8',
  env: { ...process.env, ...(options.env || {}) },
});

const version = read('VERSION').trim();
const authority = JSON.parse(read('docs/authority-map-v130.json'));
const generation = String(authority.cacheGeneration);
const stampPath = `game/core/release-stamp-v${version.replace(/\./g, '')}.js`;
const manifest = read('ops/release/static-files.txt').trim().split(/\r?\n/).filter(Boolean);
const runtime = read('game/core/runtime-bootstrap.js');
const production = read('game/core/production-bootstrap.js');
const builder = read('ops/release/build-site-bundle.sh');
const deploy = read('ops/site-bundle/deploy.sh');
const health = read('ops/site-bundle/healthcheck.sh');

assert.equal(version, '1.3.1', 'release test must lock the v1.3.1 boundary');
assert.equal(authority.version, version, 'authority map version drifted');
assert.equal(generation, '170', 'release test must lock cache generation 170');
assert.equal(new Set(manifest).size, manifest.length, 'release manifest contains duplicates');
assert(manifest.includes('VERSION') && manifest.includes(stampPath), 'semantic version and release stamp must ship');
assert(manifest.every(rel => fs.existsSync(path.join(root, rel))), 'every allowlisted file must exist');
assert(!manifest.some(rel => rel.startsWith('archive/') || rel.startsWith('test/') || rel === 'dev.html'), 'dev/quarantine content must not ship');
assert(!manifest.some(rel => rel.startsWith('game/systems/')), 'retired gameplay wrappers must not ship');

const expectedScripts = [
  'game/core/production-bootstrap.js',
  'profiles/classic-100.profile.js',
  'game/locale/locale-data-v134.js',
  'game/domain/content/content-rules-v130.js',
  'game/domain/inventory/equipment-rules-v130.js',
  'game/domain/economy/economy-rules-v130.js',
  'game/domain/progression/progression-rules-v130.js',
  'game/domain/combat/combat-rules-v130.js',
  'game/core/game.js',
  'game/locale/core-locale-data-v139.js',
  'game/input/desktop-controls.js',
  'game/core/runtime-bootstrap.js',
].map(rel => `${rel}?v=${generation}`);

for (const [label, rel] of [['zh','index.html'], ['en','en/index.html']]) {
  const html = read(rel);
  const scripts = [...html.matchAll(/<script\s+src="([^"]+)"[^>]*><\/script>/g)].map(match => match[1]);
  const generations = [...html.matchAll(/\?v=(\d+)/g)].map(match => match[1]);
  assert.deepEqual(scripts, expectedScripts, `${label} production script graph drifted`);
  assert(generations.length > 0 && generations.every(row => row === generation), `${label} cache generation drifted`);
  assert(html.includes(`v${version}`), `${label} visible version drifted`);
  assert(!/archive\/|game\/systems\//.test(html), `${label} references retired runtime`);
}
assert(!/[\u3400-\u9fff]/.test(read('en/index.html')), 'English authored route contains CJK presentation text');

assert(runtime.includes(`const assetVersion = '${generation}'`), 'runtime cache generation drifted');
assert(runtime.includes(`fresh('${stampPath}')`), 'runtime release stamp drifted');
assert(runtime.includes("followers:'dom-only'"), 'runtime follower boundary drifted');
assert(runtime.includes("gameplayStateOwner:'game/core/game.js'"), 'runtime state owner drifted');
assert(production.includes(`version:'${version}'`), 'production authority version drifted');
assert(production.includes("const STORAGE_EPOCH = 'v130'"), 'v130 storage compatibility must remain stable');

assert(builder.includes(`test "$version" = '${version}'`), 'builder semantic version gate drifted');
assert(builder.includes(`asset_generation=${generation}`), 'builder generation gate drifted');
assert(!/sed\s+-i|perl\s+-i|git\s+(?:fetch|pull|checkout|merge)/.test(builder), 'builder/deployer topology must not be rewritten at release time');
assert(deploy.includes(`EXPECTED_VERSION=${version}`), 'deployer semantic version gate drifted');
assert(deploy.includes(`EXPECTED_GENERATION=${generation}`), 'deployer generation gate drifted');
assert(deploy.includes(stampPath), 'deployer release stamp gate drifted');
assert(/sha256sum --check/.test(deploy) && /ROLLED_BACK/.test(deploy) && /mv -Tf/.test(deploy), 'deployer checksum/atomic rollback contract drifted');
assert(health.includes(`ASSET_GENERATION=${generation}`) && health.includes('/dungeon-echo/en/'), 'healthcheck route/generation contract drifted');

const revision = run('git', ['rev-parse', 'HEAD']).stdout.trim();
assert.match(revision, /^[0-9a-f]{40}$/);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'de-v131-release-'));
const archive = path.join(tmp, `91hwl-play-dungeon-echo-v${version}.zip`);
const build = run('bash', ['ops/release/build-site-bundle.sh', archive], { env:{ SOURCE_REVISION:revision } });
assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);
assert.match(build.stdout, /dungeon_echo_bundle_build=PASS/);
assert(build.stdout.includes(`asset_generation=${generation}`));

const extracted = path.join(tmp, 'extracted');
fs.mkdirSync(extracted);
const unpack = run('unzip', ['-q', archive, '-d', extracted]);
assert.equal(unpack.status, 0, unpack.stderr);
const checksum = run('sha256sum', ['--check', '--status', 'SHA256SUMS'], { cwd:extracted });
assert.equal(checksum.status, 0, checksum.stderr);
assert.equal(fs.readFileSync(path.join(extracted, 'VERSION'), 'utf8').trim(), version);
assert.equal(fs.readFileSync(path.join(extracted, 'REVISION'), 'utf8').trim(), revision);

const packagedFiles = run('unzip', ['-Z1', archive]).stdout.trim().split(/\r?\n/);
assert(packagedFiles.includes('public/dungeon-echo/game/core/game.js'));
assert(packagedFiles.includes(`public/dungeon-echo/${stampPath}`));
assert(!packagedFiles.some(rel => /(?:^|\/)(?:archive|test)(?:\/|$)|dev\.html$/.test(rel)), 'final artifact contains dev/quarantine files');
const deploySyntax = run('bash', ['-n', path.join(extracted, 'ops/deploy.sh')]);
const healthSyntax = run('bash', ['-n', path.join(extracted, 'ops/healthcheck.sh')]);
assert.equal(deploySyntax.status, 0, deploySyntax.stderr);
assert.equal(healthSyntax.status, 0, healthSyntax.stderr);

fs.rmSync(tmp, { recursive:true, force:true });
console.log('release_v1_3_1=PASS');
