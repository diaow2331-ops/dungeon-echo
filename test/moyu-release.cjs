'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const version = read('moyu/VERSION').trim();
const sourcePath = path.join(root, 'moyu/index.html');
const expectedLine = read('moyu/SOURCE_SHA256').trim();
const [expectedSha] = expectedLine.split(/\s+/);

assert.equal(version, '1.11.0');
assert.ok(fs.existsSync(sourcePath), 'moyu/index.html is required');
const source = fs.readFileSync(sourcePath);
const html = source.toString('utf8');
const actualSha = crypto.createHash('sha256').update(source).digest('hex');
assert.equal(actualSha, expectedSha, 'moyu source checksum changed');

assert.match(html, /<meta name="version" content="1\.11\.0"/);
assert.match(html, /Clock Out Alive/);
assert.match(html, /https:\/\/play\.91hwl\.cn\/moyu\//);
assert.match(html, /91hwl_lang/);
assert.match(html, /pointerdown/);
assert.match(html, /safe-area-inset-bottom/);
assert.match(html, /DAY_END_DISTANCE\s*=\s*2200/);
assert.match(html, /data\.gameVersion='1\.11\.0'|dataset\.gameVersion='1\.11\.0'/);
assert.match(html, /14:00/);
assert.match(html, /18:00/);
assert.match(html, /工位/);
assert.match(html, /会议室/);
assert.match(html, /茶水间/);
assert.match(html, /健身房/);

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(Boolean);
assert.ok(scripts.length > 0, 'inline game script missing');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'moyu-release-'));
for (let i = 0; i < scripts.length; i++) {
  const file = path.join(temp, `inline-${i}.js`);
  fs.writeFileSync(file, scripts[i]);
  const check = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  assert.equal(check.status, 0, check.stderr);
}

const archive = path.join(temp, 'moyu.zip');
const build = spawnSync('bash', [path.join(root, 'ops/release/build-moyu-bundle.sh'), archive], { cwd: root, encoding: 'utf8' });
assert.equal(build.status, 0, build.stderr);
assert.match(build.stdout, /version=1\.11\.0/);
const listing = spawnSync('unzip', ['-Z1', archive], { encoding: 'utf8' });
assert.equal(listing.status, 0, listing.stderr);
const files = listing.stdout.trim().split(/\r?\n/);
for (const required of ['README.txt','REVISION','VERSION','SHA256SUMS','ops/deploy.sh','ops/healthcheck.sh','public/moyu/index.html','public/moyu/VERSION']) {
  assert(files.includes(required), `Moyu bundle missing ${required}`);
}

fs.rmSync(temp, { recursive: true, force: true });
console.log('RESULT  Clock Out Alive v1.11.0 release contract PASS');
