'use strict';
const fs = require('fs');
const assert = require('assert');

const version = fs.readFileSync('VERSION','utf8').trim();
const html = fs.readFileSync('index.html','utf8');
const readme = fs.readFileSync('README.md','utf8');
const shipped = fs.readFileSync('README.txt','utf8');
const notesPath = `RELEASE_NOTES_v${version}.md`;
const siteReadme = fs.readFileSync('ops/site-bundle/README.txt','utf8');
const homeReadme = fs.readFileSync('ops/home-mount/README.txt','utf8');
const maintenance = fs.readFileSync('MAINTENANCE.md','utf8');
const roadmap = fs.readFileSync('PRODUCTION_ROADMAP.md','utf8');

assert(/^1\.2\.\d+$/.test(version), 'release must stay on the v1.2 patch line');
assert(html.includes(`正式版 <b>v${version}</b>`), 'production page version must match VERSION');
assert(!html.includes('正式版 <b>v1.1.0</b>'), 'production page must not expose the old v1.1 badge');
assert(readme.includes(`v${version}`), 'repository status must mention the current candidate version');
assert(shipped.startsWith(`地牢回响 Dungeon Echo v${version}`), 'shipped README version mismatch');
assert(fs.existsSync(notesPath), `release notes missing: ${notesPath}`);
const notes = fs.readFileSync(notesPath,'utf8');
assert(notes.includes(`# Dungeon Echo v${version}`), 'current release-note heading mismatch');
assert(/GitHub Actions|Actions/.test(notes), 'release notes must preserve validation provenance');
assert(siteReadme.includes(`91hwl-play-dungeon-echo-v${version}.zip`), 'site deployment README version mismatch');
assert(homeReadme.includes(`91hwl-home-dungeon-echo-v${version}.zip`), 'home deployment README version mismatch');
assert(maintenance.includes('Active skill: **K**'), 'maintenance must not restore the old C-skill contract');
assert(roadmap.includes('91hwl.cn 站点治理'), 'post-v1.2 roadmap must pivot to website governance');
assert(roadmap.includes('X 宣传准备'), 'post-v1.2 roadmap must include X launch preparation');

console.log('release_freeze_v1_2=PASS');
