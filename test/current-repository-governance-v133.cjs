'use strict';
const fs=require('fs'),assert=require('assert');
const version=fs.readFileSync('VERSION','utf8').trim();
const authority=JSON.parse(fs.readFileSync('docs/authority-map-v130.json','utf8'));
const cache=String(authority.cacheGeneration);
const index=fs.readFileSync('index.html','utf8');
const english=fs.readFileSync('en/index.html','utf8');
const runtime=fs.readFileSync('game/core/runtime-bootstrap.js','utf8');
const production=fs.readFileSync('game/core/production-bootstrap.js','utf8');
const manifest=fs.readFileSync('ops/release/static-files.txt','utf8').split(/\r?\n/).filter(Boolean);
const maintenance=fs.readFileSync('docs/MAINTENANCE.md','utf8');
const testPolicy=fs.readFileSync('test/README.md','utf8');
const repoPolicy=fs.readFileSync('ops/repo/README.md','utf8');
const repositoryGovernance=fs.readFileSync('docs/REPOSITORY_GOVERNANCE.md','utf8');
const gameBoundaries=fs.readFileSync('ops/repo/check-game-boundaries.sh','utf8');

assert.strictEqual(version,authority.version,'VERSION must equal the authority map release');
assert.match(version,/^1\.\d+\.\d+$/);
for(const entry of [index,english]){
  assert(entry.includes(`game/core/game.js?v=${cache}`));
  assert(!/game\/systems\/|game\/input\/combat-controls\.js/.test(entry));
}
assert(index.includes('data-de-locale="zh-CN"'));
assert(english.includes('data-de-locale="en"')&&english.includes('<base href="../">'));
assert(runtime.includes("followers:'presentation-only'"));
assert(runtime.includes(`const assetVersion = '${cache}'`));
assert(/version:'v\d+'/.test(runtime),'runtime bootstrap must declare a runtime version');
assert(runtime.includes("gameplayStateOwner:'game/core/game.js'"));
assert(production.includes("gameplayInputOwner:'game/core/game.js'"));
assert(production.includes("gameplayPersistenceOwner:'game/core/game.js'"));
const stamp=(runtime.match(/game\/core\/release-stamp-v\d+\.js/)||[])[0];
assert(stamp,'runtime must load one release stamp');
for(const file of ['index.html','en/index.html','style.css','game/core/game.js','art/hero-action-atlas-v2.svg',stamp]) assert(manifest.includes(file));

assert(maintenance.includes('single-authority, main-only production repository'));
assert(maintenance.includes('test/README.md'));
assert(!/Semantic version:\s*`?1\.\d+\.\d+/.test(maintenance),'maintenance guide must not freeze a release literal');
assert(testPolicy.includes('test/current-suite.cjs')&&testPolicy.includes('Historical tests'));
assert(repoPolicy.includes('`main` is protected at the GitHub repository level'));
assert(repoPolicy.includes('deletes merged head branches automatically'));
assert(repoPolicy.includes('check-game-boundaries.sh'));
assert(repositoryGovernance.includes('games.json')&&repositoryGovernance.includes('Source isolation'));
assert(gameBoundaries.includes('test/games-boundaries.cjs'));
console.log('current_repository_governance_v133=PASS');
