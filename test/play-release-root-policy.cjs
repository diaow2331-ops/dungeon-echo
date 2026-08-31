'use strict';
const assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process');
const root=path.resolve(__dirname,'..');
const policy=path.join(root,'ops/release/play-release-root-policy.sh');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'play-root-policy-'));
const prev=path.join(tmp,'prev'),next=path.join(tmp,'next');
fs.mkdirSync(prev); fs.mkdirSync(next);
for(const name of ['dungeon-echo','moyu','board-games']) fs.mkdirSync(path.join(prev,name));
for(const name of ['favicon.svg','robots.txt','sitemap.xml','0123456789abcdef0123456789abcdef.txt'])
  fs.writeFileSync(path.join(prev,name),'ok');
fs.writeFileSync(path.join(prev,'auth-session-export.zip'),'must-not-copy');
fs.mkdirSync(path.join(prev,'.board-games-v010-rollback'));
const sh=cp.spawnSync('bash',['-c','source "$1"; play_copy_release_root "$2" "$3"; play_assert_release_root "$3"','bash',policy,prev,next],{encoding:'utf8'});
assert.equal(sh.status,0,sh.stderr);
for(const name of ['dungeon-echo','moyu','board-games','favicon.svg','robots.txt','sitemap.xml','0123456789abcdef0123456789abcdef.txt'])
  assert(fs.existsSync(path.join(next,name)),'allowed entry not preserved: '+name);
for(const name of ['auth-session-export.zip','.board-games-v010-rollback'])
  assert(!fs.existsSync(path.join(next,name)),'unapproved entry copied: '+name);
for(const rel of ['ops/site-bundle/deploy.sh','ops/moyu-bundle/deploy.sh','ops/board-games-bundle/deploy.sh']){
  const body=fs.readFileSync(path.join(root,rel),'utf8');
  assert(body.includes('play_copy_release_root'),rel+' must use canonical copy policy');
  assert(body.includes('play_assert_release_root'),rel+' must assert canonical root');
  assert(!body.includes('cp -aL "$previous_release/."')&&!body.includes('cp -aL "$previous/."'),rel+' must not clone arbitrary previous-root content');
}
for(const rel of ['ops/release/build-site-bundle.sh','ops/release/build-moyu-bundle.sh','ops/release/build-board-games-bundle.sh'])
  assert(fs.readFileSync(path.join(root,rel),'utf8').includes('play-release-root-policy.sh'),rel+' must package root policy');
fs.rmSync(tmp,{recursive:true,force:true});
console.log('play_release_root_policy=PASS');
