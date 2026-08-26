'use strict';
const fs = require('fs');
const assert = require('assert');

const version = fs.readFileSync('VERSION','utf8').trim();
const html = fs.readFileSync('index.html','utf8');
const readme = fs.readFileSync('README.md','utf8');
const shipped = fs.readFileSync('README.txt','utf8');
const notes = fs.readFileSync('RELEASE_NOTES_v1.2.0.md','utf8');
const siteReadme = fs.readFileSync('ops/site-bundle/README.txt','utf8');
const homeReadme = fs.readFileSync('ops/home-mount/README.txt','utf8');
const maintenance = fs.readFileSync('MAINTENANCE.md','utf8');
const roadmap = fs.readFileSync('PRODUCTION_ROADMAP.md','utf8');

assert.strictEqual(version, '1.2.0', 'release freeze must be exactly v1.2.0');
assert(html.includes('正式版 <b>v1.2.0</b>'), 'production page version must match v1.2.0');
assert(!html.includes('正式版 <b>v1.1.0</b>'), 'production page must not expose the old release badge');
assert(readme.includes('v1.2.0 is frozen as the current release candidate'), 'repository status must describe the frozen candidate honestly');
assert(shipped.startsWith('地牢回响 Dungeon Echo v1.2.0'), 'shipped README version mismatch');
assert(notes.includes('# Dungeon Echo v1.2.0'), 'v1.2.0 release notes missing');
assert(notes.includes('does **not** claim a fresh complete Actions suite'), 'release notes must preserve validation honesty');
assert(siteReadme.includes('91hwl-play-dungeon-echo-v1.2.0.zip'), 'site deployment README version mismatch');
assert(homeReadme.includes('91hwl-home-dungeon-echo-v1.2.0.zip'), 'home deployment README version mismatch');
assert(maintenance.includes('Frozen release candidate: **v1.2.0**'), 'maintenance release contract stale');
assert(maintenance.includes('Active skill: **K**'), 'maintenance must not restore the old C-skill contract');
assert(roadmap.includes('91hwl.cn 站点治理'), 'post-v1.2 roadmap must pivot to website governance');
assert(roadmap.includes('X 宣传准备'), 'post-v1.2 roadmap must include X launch preparation');

console.log('release_freeze_v1_2=PASS');
