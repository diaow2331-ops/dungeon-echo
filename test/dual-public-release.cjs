'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const run=(cmd,args)=>spawnSync(cmd,args,{cwd:root,encoding:'utf8'});

assert.equal(read('VERSION').trim(),'1.2.10');
assert.equal(read('moyu/VERSION').trim(),'1.11.5');
assert.equal(read('ops/home-mount/SITE_VERSION').trim(),'1.3.4');

const orchestrator=read('ops/release/deploy-dual-public.sh');
assert.match(orchestrator,/dungeon_version.*VERSION/s);
assert.match(orchestrator,/moyu_version.*moyu\/VERSION/s);
assert.match(orchestrator,/site_version.*SITE_VERSION/s);
assert.match(orchestrator,/build-site-bundle\.sh/);
assert.match(orchestrator,/build-moyu-bundle\.sh/);
assert.match(orchestrator,/build-home-mount-bundle\.sh/);
const pDungeon=orchestrator.indexOf('bash "$work/dungeon/ops/deploy.sh"');
const pMoyu=orchestrator.indexOf('bash "$work/moyu/ops/deploy.sh"');
const pHome=orchestrator.indexOf('bash "$work/home/ops/deploy.sh"');
assert(pDungeon>0&&pMoyu>pDungeon&&pHome>pMoyu,'deployment order must be Dungeon → Moyu → home');
assert.match(orchestrator,/dual_public_release=PASS/);
assert.match(orchestrator,/GitHub \/ Source/);

for(const file of ['ops/release/deploy-dual-public.sh','ops/release/build-site-bundle.sh','ops/release/build-moyu-bundle.sh','ops/release/build-home-mount-bundle.sh']){
  const r=run('bash',['-n',path.join(root,file)]);
  assert.equal(r.status,0,r.stderr);
}

assert.match(read('docs/releases/RELEASE_NOTES_v1.2.10.md'),/v1\.2\.10/);
assert.match(read('docs/releases/RELEASE_NOTES_launch-2026-08-28.md'),/Clock Out Alive v1\.11\.5/);
assert.match(read('docs/releases/RELEASE_NOTES_launch-2026-08-28.md'),/site v1\.3\.4/);
console.log('RESULT  91HWL dual public release boundary PASS');
