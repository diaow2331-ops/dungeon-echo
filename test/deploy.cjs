'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const version = read('VERSION').trim();
const deploy = read('ops/site-bundle/deploy.sh');
const health = read('ops/site-bundle/healthcheck.sh');
const builder = path.join(root, 'ops/release/build-site-bundle.sh');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'de-site-bundle-'));
const archive = path.join(temp, 'bundle.zip');

assert.match(deploy, /SITE_ROOT=\/srv\/91hwl-play/);
assert.match(deploy, /cp -aL "\$previous_release\/\." "\$tmp_dir\//);
assert.match(deploy, /test -r "\$tmp_dir\/moyu\/index\.html"/);
assert.match(deploy, /cp -a "\$GAME_SOURCE\/\." "\$tmp_dir\/dungeon-echo\//);
assert.match(deploy, /mv -Tf "\$next_link" "\$CURRENT_LINK"/);
assert.match(deploy, /dungeon_echo_site_deploy=ROLLED_BACK/);
assert.match(deploy, /dungeon_echo_site_deploy=PASS/);
assert.doesNotMatch(deploy, /\/etc\/nginx|\/srv\/dungeon-echo/);

assert.match(health, /--resolve "\$ORIGIN_RESOLVE"/);
assert.match(health, /https:\/\/\$HOST\/moyu\//);
assert.match(health, /https:\/\/\$HOST\/healthz/);
assert.match(health, /\?release=\$revision/);
assert.match(health, /dungeon_echo_healthcheck=PASS/);

let result = spawnSync('bash', [builder, archive], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
result = spawnSync('unzip', ['-Z1', archive], { encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
const files = result.stdout.trim().split(/\r?\n/);
for (const required of [
  'README.txt',
  'REVISION',
  'VERSION',
  'SHA256SUMS',
  'ops/deploy.sh',
  'ops/healthcheck.sh',
  'public/dungeon-echo/index.html',
  'public/dungeon-echo/game.js',
  'public/dungeon-echo/art/title-backdrop.webp'
]) assert(files.includes(required), `bundle missing ${required}`);

result = spawnSync('unzip', ['-p', archive, 'README.txt'], { encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert(result.stdout.includes(`91hwl-play-dungeon-echo-v${version}.zip`),
  'bundled deployment README must use the current game VERSION');

fs.rmSync(temp, { recursive: true, force: true });
console.log('RESULT  site bundle deploy contract PASS');
