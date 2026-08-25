'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const home = read('ops/home-mount/public/index.html');
const detail = read('ops/home-mount/public/toys/dungeon-echo/index.html');
const deploy = read('ops/home-mount/deploy.sh');
const health = read('ops/home-mount/healthcheck.sh');
const builder = path.join(root, 'ops/release/build-home-mount-bundle.sh');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'de-home-mount-'));
const archive = path.join(temp, 'mount.zip');

assert.match(home, /<b>02<\/b><span>Web Toys<\/span>/);
assert.match(home, /<h3>摸鱼到下班<\/h3>/);
assert.match(home, /<h3>地牢回响<\/h3>/);
assert.match(home, /href="https:\/\/play\.91hwl\.cn\/dungeon-echo\//);
assert.match(home, /href="\/toys\/dungeon-echo\//);
assert.match(detail, /<title>地牢回响 \| 91hwl<\/title>/);
assert.match(detail, new RegExp(`当前版本 v${read('VERSION').trim().replace(/\./g, '\\.')}`));

assert.match(deploy, /SITE_ROOT=\/var\/www\/91hwl/);
assert.match(deploy, /EXPECTED_INDEX_SHA256/);
assert.match(deploy, /chown --reference="\$SITE_ROOT\/index\.html"/);
assert.match(deploy, /dungeon_echo_home_mount=ROLLED_BACK/);
assert.match(deploy, /dungeon_echo_home_mount=PASS/);
assert.doesNotMatch(deploy, /sites-available|sites-enabled|\/srv\/91hwl-play/);
assert.match(health, /toys\/moyu\//);
assert.match(health, /play\.91hwl\.cn\/dungeon-echo\//);

let result = spawnSync('bash', [builder, archive], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
result = spawnSync('unzip', ['-Z1', archive], { encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
const files = result.stdout.trim().split(/\r?\n/);
for (const required of [
  'EXPECTED_INDEX_SHA256',
  'README.txt',
  'REVISION',
  'VERSION',
  'SHA256SUMS',
  'ops/deploy.sh',
  'ops/healthcheck.sh',
  'public/index.html',
  'public/toys/dungeon-echo/index.html'
]) assert(files.includes(required), `mount bundle missing ${required}`);

fs.rmSync(temp, { recursive: true, force: true });
console.log('RESULT  homepage mount contract PASS');
