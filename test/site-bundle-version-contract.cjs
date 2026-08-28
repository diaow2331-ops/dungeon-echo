'use strict';
const assert = require('assert');
const fs = require('fs');

const version = fs.readFileSync('VERSION','utf8').trim();
const runtime = fs.readFileSync('game/core/runtime-bootstrap.js','utf8');
const deploy = fs.readFileSync('ops/site-bundle/deploy.sh','utf8');
const assetVersion = (runtime.match(/const assetVersion = '(\d+)'/) || [,''])[1];
const stampPath = `game/core/release-stamp-v${version.replace(/\./g,'')}.js`;

assert(/^1\.2\.\d+$/.test(version), 'Dungeon VERSION must stay on the v1.2 patch line');
assert(/^\d+$/.test(assetVersion), 'runtime cache generation must be numeric');
assert(deploy.includes(`EXPECTED_VERSION=${version}`), 'site deployer semantic version drifted from VERSION');
assert(deploy.includes(`EXPECTED_GENERATION=${assetVersion}`), 'site deployer cache generation drifted from runtime bootstrap');
assert(deploy.includes(`$GAME_SOURCE/${stampPath}`), 'site deployer required-file gate drifted from current release stamp');
assert(deploy.includes(`grep -Fq 'release-stamp-v${version.replace(/\./g,'')}.js'`), 'site deployer runtime stamp check drifted from current release');

console.log('site_bundle_version_contract=PASS');
