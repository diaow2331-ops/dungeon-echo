'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const version = read('VERSION').trim();
const home = read('ops/home-mount/public/index.html');
const detail = read('ops/home-mount/public/toys/dungeon-echo/index.html');
const deploy = read('ops/home-mount/deploy.sh');
const health = read('ops/home-mount/healthcheck.sh');
const builder = path.join(root, 'ops/release/build-home-mount-bundle.sh');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'de-home-mount-'));
const archive = path.join(temp, 'mount.zip');

// Homepage conversion contract: product-first, bilingual, real Dungeon Echo art.
assert.match(home, /02 WEB TOYS/);
assert.match(home, /data-lang-choice="zh"/);
assert.match(home, /data-lang-choice="en"/);
assert.match(home, /91hwl_lang/);
assert.match(home, /Open the browser\.<br>Just play\./);
assert.match(home, /https:\/\/play\.91hwl\.cn\/dungeon-echo\/art\/title-backdrop\.webp/);
assert.match(home, /https:\/\/play\.91hwl\.cn\/dungeon-echo\/art\/class-roster\.webp/);
assert.match(home, /href="https:\/\/play\.91hwl\.cn\/dungeon-echo\//);
assert.match(home, /href="\/toys\/dungeon-echo\//);
assert.match(home, /https:\/\/github\.com\/diaow2331-ops\/dungeon-echo/);
assert.match(home, /v1\.2\.2/);
assert.match(home, /twitter:card/);
assert.match(home, /hreflang="en"/);
assert.match(home, /"@type": "WebSite"/);
assert.match(home, /摸鱼到下班/);

// Dungeon Echo project page must carry the current product/release story itself.
assert.match(detail, /<title>Dungeon Echo · 地牢回响 \| 91hwl<\/title>/);
assert.match(detail, new RegExp(`data-site-version="${version.replace(/\./g, '\\.')}"`));
assert.match(detail, new RegExp(`Dungeon Echo v${version.replace(/\./g, '\\.')}`));
assert.match(detail, /data-lang-choice="zh"/);
assert.match(detail, /data-lang-choice="en"/);
assert.match(detail, /href="https:\/\/play\.91hwl\.cn\/dungeon-echo\/\?lang=en"/);
assert.match(detail, /https:\/\/github\.com\/diaow2331-ops\/dungeon-echo/);
assert.match(detail, /J attacks, K skills and Mana/);
assert.match(detail, /https:\/\/play\.91hwl\.cn\/dungeon-echo\/art\/class-roster\.webp/);
assert.match(detail, /https:\/\/play\.91hwl\.cn\/dungeon-echo\/art\/town-backdrop-v11\.webp/);
assert.match(detail, /https:\/\/play\.91hwl\.cn\/dungeon-echo\/art\/final-boss-v11\.png/);
assert.match(detail, /"@type":"VideoGame"/);
assert.match(detail, /"softwareVersion":"1\.2\.2"/);
assert.match(detail, /LOCALSTORAGE/);
assert.match(detail, /MIT/);

// Deployment remains bounded to the existing 91hwl tree and rollback contract.
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
