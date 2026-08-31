'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'games.json'),'utf8'));
assert(catalog.schema>=2,'games.json schema must be >= 2');
assert.strictEqual(catalog.repository,'91hwl-games');
assert(Array.isArray(catalog.games)&&catalog.games.length>=3,'expected at least three games');
const ids=new Set(),routes=new Set();
for(const game of catalog.games){
  for(const key of ['id','title','sourceRoot','route','versionFile','builder'])assert(game[key],`${game.id||'game'} missing ${key}`);
  assert(!ids.has(game.id),`duplicate game id: ${game.id}`); ids.add(game.id);
  assert(!routes.has(game.route),`duplicate route: ${game.route}`); routes.add(game.route);
  assert(/^\/[a-z0-9-]+\/$/.test(game.route),`invalid public route: ${game.route}`);
  const source=path.join(root,game.sourceRoot),version=path.join(root,game.versionFile),builder=path.join(root,game.builder);
  assert(fs.statSync(source).isDirectory(),`missing sourceRoot: ${game.sourceRoot}`);
  assert(fs.statSync(version).isFile(),`missing versionFile: ${game.versionFile}`);
  assert(/^\d+\.\d+\.\d+$/.test(fs.readFileSync(version,'utf8').trim()),`invalid semver: ${game.versionFile}`);
  assert(fs.statSync(builder).isFile(),`missing builder: ${game.builder}`);
  assert((fs.statSync(builder).mode&0o111)!==0,`builder must be executable: ${game.builder}`);
}
assert(ids.has('dungeon-echo')&&ids.has('moyu')&&ids.has('board-games'),'current game catalog incomplete');
console.log(`games_catalog=PASS games=${catalog.games.length}`);
