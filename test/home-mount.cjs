'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const gameVersion = read('VERSION').trim();
const siteVersion = read('ops/home-mount/SITE_VERSION').trim();
const home = read('ops/home-mount/public/index.html');
const de = read('ops/home-mount/public/toys/dungeon-echo/index.html');
const moyu = read('ops/home-mount/public/toys/moyu/index.html');
const deploy = read('ops/home-mount/deploy.sh');
const health = read('ops/home-mount/healthcheck.sh');
const builder = path.join(root, 'ops/release/build-home-mount-bundle.sh');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'web-toys-home-v131-'));
const archive = path.join(temp, 'mount.zip');

assert.equal(gameVersion, '1.2.6');
assert.equal(siteVersion, '1.3.1');

assert.match(home, /data-site-version="1\.3\.1"/);
assert.match(home, /Dungeon Echo/);
assert.match(home, /Clock Out Alive/);
assert.match(home, /v1\.2\.6/);
assert.match(home, /v1\.11\.1/);
assert.match(home, /href="\/toys\/dungeon-echo\//);
assert.match(home, /href="\/toys\/moyu\//);
assert.match(home, /href="https:\/\/play\.91hwl\.cn\/dungeon-echo\//);
assert.match(home, /href="https:\/\/play\.91hwl\.cn\/moyu\//);
assert.match(home, /data-lang-choice="zh"/);
assert.match(home, /data-lang-choice="en"/);
assert.match(home, /91hwl_site_lang/);
assert.match(home, /PC \+ MOBILE/);
assert.match(home, /Open\.|打开。/);
assert.match(home, /Less website|少一点网站/);
assert.doesNotMatch(home, /这次统一治理了什么|公开开发记录/);
assert.match(home, /"@type":"WebSite"/);

assert.match(de, /data-site-version="1\.3\.1"/);
assert.match(de, /softwareVersion":"1\.2\.6"/);
assert.match(de, /Dungeon Echo/);
assert.match(de, /Expedition Record/);
assert.match(de, /class-roster\.webp/);
assert.match(de, /town-backdrop-v11\.webp/);
assert.match(de, /final-boss-v11\.png/);
assert.match(de, /data-lang-choice="en"/);

assert.match(moyu, /data-site-version="1\.3\.1"/);
assert.match(moyu, /softwareVersion":"1\.11\.1"/);
assert.match(moyu, /Clock Out Alive/);
assert.match(moyu, /14:00/);
assert.match(moyu, /18:00/);
assert.match(moyu, /No player halo/);
assert.match(moyu, /Air jumps stay airborne/);
assert.match(moyu, /No drifting coworkers/);
assert.match(moyu, /Consistent result typography/);
assert.match(moyu, /href="https:\/\/play\.91hwl\.cn\/moyu\//);
assert.match(moyu, /data-lang-choice="en"/);

assert.match(deploy, /SITE_ROOT=\/var\/www\/91hwl/);
assert.match(deploy, /EXPECTED_INDEX_SHA256/);
assert.match(deploy, /DE_REL=toys\/dungeon-echo/);
assert.match(deploy, /MOYU_REL=toys\/moyu/);
assert.match(deploy, /web_toys_home_mount=ROLLED_BACK/);
assert.match(deploy, /web_toys_home_mount=PASS/);
assert.doesNotMatch(deploy, /sites-available|sites-enabled|\/srv\/91hwl-play/);

assert.match(health, /MAIN_RESOLVE=91hwl\.cn:443:127\.0\.0\.1/);
assert.match(health, /PLAY_RESOLVE=play\.91hwl\.cn:443:127\.0\.0\.1/);
assert.match(health, /origin homepage check failed/);
assert.match(health, /public site v1\.3\.1 check failed/);
assert.match(health, /MOYU_VERSION_URL=https:\/\/play\.91hwl\.cn\/moyu\/VERSION/);

for (const script of [
  'ops/release/build-home-mount-bundle.sh',
  'ops/home-mount/deploy.sh',
  'ops/home-mount/healthcheck.sh'
]) {
  const syntax = spawnSync('bash', ['-n', path.join(root, script)], { encoding: 'utf8' });
  assert.equal(syntax.status, 0, syntax.stderr);
}

let result = spawnSync('bash', [builder, archive], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.match(result.stdout, /site_version=1\.3\.1/);
assert.match(result.stdout, /previous_home_sha256=/);
result = spawnSync('unzip', ['-Z1', archive], { encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
const files = result.stdout.trim().split(/\r?\n/);
for (const required of [
  'EXPECTED_INDEX_SHA256','README.txt','REVISION','VERSION','SHA256SUMS',
  'ops/deploy.sh','ops/healthcheck.sh','public/index.html',
  'public/toys/dungeon-echo/index.html','public/toys/moyu/index.html'
]) assert(files.includes(required), `mount bundle missing ${required}`);

fs.rmSync(temp, { recursive: true, force: true });
console.log('RESULT  91hwl site v1.3.1 product/release contract PASS');
