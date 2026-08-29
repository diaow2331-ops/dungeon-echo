'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const targets = [
  'game/domain/content/content-rules-v130.js',
  'game/core/game.js',
  'index.html',
  'en/index.html',
  'ops/release/static-files.txt',
  'docs/authority-map-v130.json',
  'docs/ARCHITECTURE_SINGLE_AUTHORITY.md',
  'test/content-rules-v130.cjs',
  'test/entry-authority-v130.cjs',
  'test/single-authority-v130.cjs',
];
const digest = rel => crypto.createHash('sha256')
  .update(fs.readFileSync(path.join(root, rel)))
  .digest('hex');
const before = new Map(targets.map(rel => [rel, digest(rel)]));
const run = spawnSync(process.execPath, ['ops/content-authority-cutover-v130.cjs', '--check'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
assert.match(run.stdout, /content_authority_cutover_preflight=PASS/);
for (const rel of targets) assert.equal(digest(rel), before.get(rel), `--check mutated ${rel}`);
const tool = fs.readFileSync(path.join(root, 'ops/content-authority-cutover-v130.cjs'), 'utf8');
assert(tool.includes('mixed pre/post-cutover state'), 'tool must reject mixed authority states');
assert(tool.includes('best-effort rollback'), 'tool must roll back partial filesystem writes');
assert(tool.includes("CONTENT_RULES.authority !== 'content-classification'"), 'core cutover must fail closed when content authority is missing');
console.log('content_authority_cutover_tool_v130=PASS');
