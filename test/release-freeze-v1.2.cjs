'use strict';
const fs = require('fs');
const assert = require('assert');

const version = fs.readFileSync('VERSION','utf8').trim();
const homeSiteVersion = fs.readFileSync('ops/home-mount/SITE_VERSION','utf8').trim();
const html = fs.readFileSync('index.html','utf8');
const enHtml = fs.readFileSync('en/index.html','utf8');
const runtime = fs.readFileSync('game/core/runtime-bootstrap.js','utf8');
const stampPath = `game/core/release-stamp-v${version.replace(/\./g,'')}.js`;
const stamp = fs.readFileSync(stampPath,'utf8');
const readme = fs.readFileSync('README.md','utf8');
const notesPath = `docs/releases/RELEASE_NOTES_v${version}.md`;
const siteReadme = fs.readFileSync('ops/site-bundle/README.txt','utf8');
const homeReadme = fs.readFileSync('ops/home-mount/README.txt','utf8');
const health = fs.readFileSync('ops/site-bundle/healthcheck.sh','utf8');
const maintenance = fs.readFileSync('docs/MAINTENANCE.md','utf8');
const roadmap = fs.readFileSync('docs/PRODUCTION_ROADMAP.md','utf8');
const manifest = fs.readFileSync('ops/release/static-files.txt','utf8').split(/\r?\n/).filter(Boolean);
const assetVersion = (runtime.match(/const assetVersion = '(\d+)'/) || [,''])[1];

assert(/^1\.2\.\d+$/.test(version), 'release must stay on the v1.2 patch line');
assert(/^\d+\.\d+\.\d+$/.test(homeSiteVersion), 'home mount SITE_VERSION must be SemVer');
assert(/^\d+$/.test(assetVersion), 'runtime cache generation must be numeric');
assert(html.includes('Dungeon Echo'), 'production page identity missing');
assert(html.includes(`正式版 <b>v${version}</b>`), 'Chinese source footer must match VERSION before packaging');
assert(enHtml.includes(`Release <b>v${version}</b>`), 'English source footer must match VERSION before packaging');
assert(stamp.includes(`const version = '${version}'`), 'visible runtime release stamp must match VERSION');
assert(manifest.includes('VERSION') && manifest.includes(stampPath), 'release must ship VERSION + current visible stamp');
assert(health.includes('/dungeon-echo/VERSION'), 'health check must verify deployed VERSION endpoint');
assert(health.includes('test "$actual" = "$expected"'), 'VERSION health check must be exact');
assert(readme.includes('> **Live:**'), 'repository README must keep an explicit live release line');
assert(readme.includes(`Dungeon Echo **v${version}**`), 'repository README live version must match VERSION');
assert(readme.includes(`public runtime cache generation **${assetVersion}**`) || readme.includes(`public runtime cache generation **${assetVersion}**;`) || readme.includes(`public runtime cache generation **${assetVersion}**.`), 'README cache generation must match runtime bootstrap');
assert(fs.existsSync(notesPath), `release notes missing: ${notesPath}`);
const notes = fs.readFileSync(notesPath,'utf8');
assert(notes.includes(`# Dungeon Echo v${version}`), 'current release-note heading mismatch');
assert(notes.includes(`cache generation **${assetVersion}**`) || notes.includes(`cache generation ${assetVersion}`), 'release notes must identify the current public cache generation');
assert(/GitHub Actions|Actions|targeted|deterministic/i.test(notes), 'release notes must preserve validation provenance');
assert(siteReadme.includes(`91hwl-play-dungeon-echo-v${version}.zip`), 'game deployment README version mismatch');
assert(homeReadme.includes(`site v${homeSiteVersion}`), 'home deployment README must identify the explicit SITE_VERSION');
assert(maintenance.includes('Active skill: **K**'), 'maintenance must not restore the old C-skill contract');
assert(roadmap.includes('build-site-bundle.sh'), 'current game-only hotfix builder must be explicit');
assert(roadmap.includes('build-web-toys-release.sh') && roadmap.includes('v1.2.7'),
  'the prior unified release boundary must remain explicit and immutable');

console.log('release_freeze_v1_2=PASS');
