'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const catalog=JSON.parse(read('games.json'));
const manifest=read('ops/release/static-files.txt').split(/\r?\n/).filter(Boolean);
const textExt=new Set(['.js','.cjs','.mjs','.html','.css']);
const walk=dir=>{
  const out=[];
  for(const ent of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
    const rel=path.posix.join(dir,ent.name);
    if(ent.isDirectory()) out.push(...walk(rel));
    else if(textExt.has(path.extname(ent.name))) out.push(rel);
  }
  return out;
};
const scan=(files,patterns,label)=>{
  for(const rel of files){
    const src=read(rel);
    for(const [name,re] of patterns) assert(!re.test(src),`${label}: ${rel} crosses into ${name}`);
  }
};
assert.equal(catalog.schema,2);
assert.equal(new Set(catalog.games.map(g=>g.id)).size,catalog.games.length,'game ids must be unique');
assert.equal(new Set(catalog.games.map(g=>g.route)).size,catalog.games.length,'public routes must be unique');
assert.equal(new Set(catalog.games.map(g=>g.versionFile)).size,catalog.games.length,'version authorities must be unique');
assert.equal(new Set(catalog.games.map(g=>g.builder)).size,catalog.games.length,'release builders must be unique');
for(const g of catalog.games){
  assert(fs.existsSync(path.join(root,g.versionFile)),`${g.id}: version authority missing`);
  assert(fs.existsSync(path.join(root,g.builder)),`${g.id}: builder missing`);
}
assert(!manifest.some(rel=>rel.startsWith('moyu/')||rel.startsWith('board-games/')),'Dungeon release allowlist must not package another game source root');
const dungeonFiles=manifest.filter(rel=>textExt.has(path.extname(rel)));
scan(dungeonFiles,[['Moyu source',/(?:\.\.\/|\/|\b)moyu\/(?:game|style|responsive|visual|index|VERSION)/],['Board source',/(?:\.\.\/|\/|\b)board-games\/(?:game|rules|ai|style|index|VERSION)/]],'Dungeon Echo');
scan(walk('moyu'),[['Board source',/(?:\.\.\/|\/|\b)board-games\//],['Dungeon runtime',/(?:\.\.\/|\/|\b)game\/(?:core|domain|input|locale|ui)\//],['Dungeon profile',/(?:\.\.\/|\/|\b)profiles\//]],'Moyu');
scan(walk('board-games'),[['Moyu source',/(?:\.\.\/|\/|\b)moyu\//],['Dungeon runtime',/(?:\.\.\/|\/|\b)game\/(?:core|domain|input|locale|ui)\//],['Dungeon profile',/(?:\.\.\/|\/|\b)profiles\//]],'Board Trio');
console.log('games_boundaries=PASS');
