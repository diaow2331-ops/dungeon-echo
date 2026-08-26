'use strict';
const fs = require('fs');
const assert = require('assert');

const version = fs.readFileSync('VERSION','utf8').trim();
const html = fs.readFileSync('index.html','utf8');
const stamp = fs.readFileSync('release-stamp-v122.js','utf8');
const readme = fs.readFileSync('README.md','utf8');
const shipped = fs.readFileSync('README.txt','utf8');
const notesPath = `RELEASE_NOTES_v${version}.md`;
const siteReadme = fs.readFileSync('ops/site-bundle/README.txt','utf8');
const homeReadme = fs.readFileSync('ops/home-mount/README.txt','utf8');
const health = fs.readFileSync('ops/site-bundle/healthcheck.sh','utf8');
const maintenance = fs.readFileSync('MAINTENANCE.md','utf8');
const roadmap = fs.readFileSync('PRODUCTION_ROADMAP.md','utf8');
const manifest = fs.readFileSync('ops/release/static-files.txt','utf8').split(/\r?\n/).filter(Boolean);

assert(/^1\.2\.\d+$/.test(version), 'release must stay on the v1.2 patch line');
assert(html.includes('Dungeon Echo'), 'production page identity missing');
assert(stamp.includes(`const version = '${version}'`), 'visible runtime release stamp must match VERSION');
assert(manifest.includes('VERSION') && manifest.includes('release-stamp-v122.js'), 'release must ship VERSION + visible stamp');
assert(health.includes('/dungeon-echo/VERSION'), 'health check must verify deployed VERSION endpoint');
assert(health.includes('test "$actual" = "$expected"'), 'VERSION health check must be exact');
assert(readme.includes('v1.2'), 'repository README must describe the v1.2 release line');
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
