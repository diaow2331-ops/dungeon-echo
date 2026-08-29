'use strict';
const fs=require('fs'),assert=require('assert');
const version=fs.readFileSync('VERSION','utf8').trim();
const index=fs.readFileSync('index.html','utf8');
const english=fs.readFileSync('en/index.html','utf8');
const runtime=fs.readFileSync('game/core/runtime-bootstrap.js','utf8');
const production=fs.readFileSync('game/core/production-bootstrap.js','utf8');
const manifest=fs.readFileSync('ops/release/static-files.txt','utf8').split(/\r?\n/).filter(Boolean);
assert.strictEqual(version,'1.3.4');
for(const entry of [index,english]){
  assert(entry.includes('game/core/game.js?v=173'));
  assert(!/game\/systems\/|game\/input\/combat-controls\.js/.test(entry));
}
assert(index.includes('data-de-locale="zh-CN"'));
assert(english.includes('data-de-locale="en"')&&english.includes('<base href="../">'));
assert(runtime.includes("followers:'presentation-only'"));
assert(runtime.includes("version:'v25'")&&runtime.includes("const assetVersion = '173'"));
assert(runtime.includes("gameplayStateOwner:'game/core/game.js'"));
assert(production.includes("gameplayInputOwner:'game/core/game.js'"));
assert(production.includes("gameplayPersistenceOwner:'game/core/game.js'"));
for(const file of ['index.html','en/index.html','style.css','game/core/game.js','art/hero-action-atlas-v2.svg','game/core/release-stamp-v134.js']) assert(manifest.includes(file));
console.log('current_repository_governance_v133=PASS');
