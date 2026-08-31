'use strict';
const fs = require('fs');
const assert = require('assert');

const catalog = JSON.parse(fs.readFileSync('games.json', 'utf8'));
const releaseDoc = fs.readFileSync('docs/CURRENT_RELEASES.md', 'utf8').split(/\r?\n/);

function versionOf(path) {
  return fs.readFileSync(path, 'utf8').trim();
}

function assertPointer(versionFile) {
  const version = versionOf(versionFile);
  const marker = `\`${versionFile}\``;
  const rows = releaseDoc.filter(line => line.includes(marker));
  assert.strictEqual(rows.length, 1, `${versionFile} must have exactly one CURRENT_RELEASES row`);
  assert(rows[0].includes(`| v${version} |`), `${versionFile} pointer must match canonical version ${version}`);
}

for (const game of catalog.games) assertPointer(game.versionFile);
assertPointer('ops/home-mount/SITE_VERSION');

console.log('current_release_pointers=PASS');
