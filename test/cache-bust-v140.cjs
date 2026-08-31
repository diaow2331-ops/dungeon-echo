/* Current Dungeon Echo production asset-generation contract. */
'use strict';
const fs=require('fs'),path=require('path');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const zh=read('index.html'),en=read('en/index.html'),runtime=read('game/core/runtime-bootstrap.js');
const deployReadme=read('ops/site-bundle/README.txt');
const authority=JSON.parse(read('docs/authority-map-v130.json'));
const version=read('VERSION').trim(), generation=String(authority.cacheGeneration);
const stamp=`game/core/release-stamp-v${version.replace(/\./g,'')}.js`;
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
const scriptSrcs=html=>[...html.matchAll(/<script\s+src="([^"]+)"[^>]*><\/script>/g)].map(m=>m[1]);
for(const [name,html] of [['zh',zh],['en',en]]){
  const versions=[...html.matchAll(/\?v=(\d+)/g)].map(m=>m[1]),scripts=scriptSrcs(html);
  ok(versions.length>0&&versions.every(v=>v===generation),`${name} authored entry uses only cache generation ${generation}`);
  ok(html.includes(`style.css?v=${generation}`),`${name} stylesheet uses generation ${generation}`);
  ok(scripts.length===14&&scripts.every(src=>src.endsWith(`?v=${generation}`)),`${name} boots 14 current-generation synchronous scripts`);
  for(const rel of ['game/locale/locale-data-v134.js','game/domain/combat/combat-rules-v130.js','game/domain/town/town-rules-v130.js','game/domain/expedition/expedition-rules-v170.js'])
    ok(html.indexOf(`${rel}?v=${generation}`)<html.indexOf(`game/core/game.js?v=${generation}`),`${name} ${rel} boots before core`);
  ok(scripts[scripts.length-1]===`game/core/runtime-bootstrap.js?v=${generation}`,`${name} runtime bootstrap is final synchronous script`);
}
ok(authority.version===version&&version==='1.7.0'&&authority.cacheGeneration===181,'authority map locks v1.7.0 cache generation 181');
ok(runtime.includes(`const assetVersion = '${generation}'`),'runtime followers use current cache key');
ok(deployReadme.includes(`v${version} publishes cache generation ${generation}`),'deployment README declares current generation');
ok(runtime.includes(`fresh('${stamp}')`),'runtime cache-busts current release stamp');
ok(/version:'v33'/.test(runtime),'runtime current follower graph is bootstrap v33');
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
