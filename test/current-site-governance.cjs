'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const siteVersion=read('ops/home-mount/SITE_VERSION').trim();
const de=read('VERSION').trim(),moyu=read('moyu/VERSION').trim(),board=read('board-games/VERSION').trim();
assert.equal(siteVersion,'1.11.7');
for(const v of [de,moyu,board])assert.match(v,/^\d+\.\d+\.\d+$/);
const siteJs=read('ops/home-mount/public/assets/site-v1110/site.js');
assert(!siteJs.includes('data-copy-email')&&!siteJs.includes('copyEmail'),'current site JS must not retain personal-mail copy/fallback behavior');
const builder=read('ops/release/build-home-mount-bundle.sh');
const finalStage=read('ops/home-mount/build-site-v1117.cjs');
const deploy=read('ops/home-mount/deploy.sh'),health=read('ops/home-mount/healthcheck.sh');
assert(builder.includes('build-site-v1117.cjs'),'current site build must end at v1117');
for(const token of ['DUNGEON_VERSION','MOYU_VERSION','BOARD_VERSION'])assert(builder.includes(token)&&deploy.includes(token)&&health.includes(token),token+' authority handoff missing');
assert(finalStage.includes("readVersion('VERSION')")&&finalStage.includes("readVersion('moyu/VERSION')")&&finalStage.includes("readVersion('board-games/VERSION')"),'final site stage must read component version authorities');
assert(finalStage.includes('personal mail route remains')&&finalStage.includes('personal social route remains'),'final site stage must reject personal contact routes');
for(const rel of ['ops/home-mount/public/index.html','ops/home-mount/public/contact/index.html','ops/home-mount/build-trust-v135.cjs','ops/home-mount/build-home-v150.cjs','ops/home-mount/build-site-v170.cjs','ops/home-mount/build-site-v180.cjs','ops/home-mount/build-site-v190.cjs']){
  const body=read(rel);
  assert(!/mailto:[^"'\s>]*@/i.test(body),rel+' contains a personal mail route');
  assert(!/https:\/\/x\.com\//i.test(body),rel+' contains a personal social route');
}
for(const rel of ['ops/home-mount/deploy.sh','ops/home-mount/healthcheck.sh','ops/release/build-home-mount-bundle.sh']){
  const q=cp.spawnSync('bash',['-n',path.join(root,rel)],{encoding:'utf8'});
  assert.equal(q.status,0,q.stderr);
}
console.log('current_site_governance=PASS site='+siteVersion+' dungeon='+de+' moyu='+moyu+' board='+board);
