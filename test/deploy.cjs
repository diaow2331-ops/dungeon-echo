'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const patcher = path.join(root, 'ops/nginx/patch-play-site.py');
const installer = fs.readFileSync(path.join(root, 'ops/release/install-on-server.sh'), 'utf8');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'de-nginx-'));
const site = path.join(temp, 'play.conf');

fs.writeFileSync(site, `server {
  listen 80;
  server_name play.91hwl.cn;
}
server {
  listen 443 ssl http2;
  server_name play.91hwl.cn;
  location /moyu/ { root /srv/moyu; }
}
server {
  listen 443 ssl;
  server_name 91hwl.cn;
}
`);

function run(...args) {
  return spawnSync('python3', [patcher, '--site', site, ...args], { encoding: 'utf8' });
}

let result = run('--write');
assert.equal(result.status, 0, result.stderr);
let text = fs.readFileSync(site, 'utf8');
assert.equal((text.match(/include \/etc\/nginx\/snippets\/dungeon-echo-static\.conf;/g) || []).length, 1);
assert.match(text, /server_name play\.91hwl\.cn;[\s\S]*location \/moyu\/[\s\S]*dungeon-echo-static\.conf;/);

result = run('--write');
assert.equal(result.status, 0, result.stderr);
text = fs.readFileSync(site, 'utf8');
assert.equal((text.match(/dungeon-echo-static\.conf/g) || []).length, 1, 'patch must be idempotent');

assert.match(installer, /REPO_ROOT=\/opt\/dungeon-echo/);
assert.match(installer, /RELEASE_ROOT=\/srv\/dungeon-echo/);
assert.match(installer, /PUBLIC_URL=https:\/\/play\.91hwl\.cn\/dungeon-echo\//);
assert.match(installer, /test "\$#" -eq 0/);
assert.match(installer, /merge --ff-only origin\/main/);
assert.match(installer, /nginx -t/);
assert.match(installer, /systemctl reload nginx/);
assert.match(installer, /dungeon_echo_install=ROLLED_BACK/);
assert.match(installer, /dungeon_echo_install=PASS/);
assert.doesNotMatch(installer, /eval\b|bash -c|sh -c/);

fs.rmSync(temp, { recursive: true, force: true });
console.log('RESULT  deploy contract PASS');
