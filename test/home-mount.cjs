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
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'web-toys-home-'));
const archive = path.join(temp, 'mount.zip');

assert.equal(gameVersion, '1.2.6');
assert.equal(siteVersion, '1.3.0');

assert.match(home, /data-site-version="1\.3\.0"/);
assert.match(home, /02 WEB TOYS/);
assert.match(home, /Dungeon Echo/);
assert.match(home, /Clock Out Alive/);
assert.match(home, /v1\.2\.6/);
assert.match(home, /v1\.11\.0/);
assert.match(home, /href="\/toys\/dungeon-echo\//);
assert.match(home, /href="\/toys\/moyu\//);
assert.match(home, /href="https:\/\/play\.91hwl\.cn\/dungeon-echo\//);
assert.match(home, /href="https:\/\/play\.91hwl\.cn\/moyu\//);
assert.match(home, /data-lang-choice="zh"/);
assert.match(home, /data-lang-choice="en"/);
assert.match(home, /91hwl_site_lang/);
assert.match(home, /PC \+ MOBILE/);
assert.match(home, /twitter:card/);
assert.match(home, /"@type":"WebSite"/);

assert.match(de, /data-site-version="1\.3\.0"/);
assert.match(de, /softwareVersion":"1\.2\.6"/);
assert.match(de, /Dungeon Echo v1\.2\.6/);
assert.match(de, /Expedition Record/);
assert.match(de, /four-way touch controls|4-way D-pad/i);
assert.match(de, /art\/class-roster\.webp/);
assert.match(de, /art\/town-backdrop-v11\.webp/);
assert.match(de, /art\/final-boss-v11\.png/);
assert.match(de, /github\.com\/diaow2331-ops\/dungeon-echo/);
assert.match(de, /data-lang-choice="en"/);

assert.match(moyu, /data-site-version="1\.3\.0"/);
assert.match(moyu, /softwareVersion":"1\.11\.0"/);
assert.match(moyu, /Clock Out Alive/);
assert.match(moyu, /14:00 → 18:00/);
assert.match(moyu, /PC \+ Mobile/);
assert.match(moyu, /Pointer Down/);
assert.match(moyu, /Four scenes|4 SCENES/i);
assert.match(moyu, /Two endings|2 ENDINGS/i);
assert.match(moyu, /href="https:\/\/play\.91hwl\.cn\/moyu\//);
assert.match(moyu, /data-lang-choice="en"/);

assert.match(deploy, /SITE_ROOT=\/var\/www\/91hwl/);
assert.match(deploy, /EXPECTED_INDEX_SHA256/);
assert.match(deploy, /DE_REL=toys\/dungeon-echo/);
assert.match(deploy, /MOYU_REL=toys\/moyu/);
assert.match(deploy, /web_toys_home_mount=ROLLED_BACK/);
assert.match(deploy, /web_toys_home_mount=PASS/);
assert.doesNotMatch(deploy, /sites-available|sites-enabled|\/srv\/91hwl-play/);
assert.match(health, /MOYU_DETAIL_URL=https:\/\/91hwl\.cn\/toys\/moyu\//);
assert.match(health, /DE_PLAY_URL=https:\/\/play\.91hwl\.cn\/dungeon-echo\//);
assert.match(health, /MOYU_PLAY_URL=https:\/\/play\.91hwl\.cn\/moyu\//);

let result = spawnSync('bash', [builder, archive], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.match(result.stdout, /site_version=1\.3\.0/);
result = spawnSync('unzip', ['-Z1', archive], { encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
const files = result.stdout.trim().split(/\r?\n/);
for (const required of [
  'EXPECTED_INDEX_SHA256','README.txt','REVISION','VERSION','SHA256SUMS',
  'ops/deploy.sh','ops/healthcheck.sh','public/index.html',
  'public/toys/dungeon-echo/index.html','public/toys/moyu/index.html'
]) assert(files.includes(required), `mount bundle missing ${required}`);

fs.rmSync(temp, { recursive: true, force: true });
console.log('RESULT  unified Web Toys home contract PASS');
