'use strict';

const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');
const {spawnSync}=require('child_process');

const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const run=(cmd,args,opts={})=>spawnSync(cmd,args,{cwd:root,encoding:'utf8',...opts});
const siteVersion=read('ops/home-mount/SITE_VERSION').trim();
const sourceHome=read('ops/home-mount/public/index.html');
const sourceDe=read('ops/home-mount/public/toys/dungeon-echo/index.html');
const sourceMoyu=read('ops/home-mount/public/toys/moyu/index.html');
const sourceAbout=read('ops/home-mount/public/about/index.html');
const sourcePrivacy=read('ops/home-mount/public/privacy/index.html');
const sourceContact=read('ops/home-mount/public/contact/index.html');
const sourceAds=read('ops/home-mount/public/ads.txt').trim();
const sourceDeploy=read('ops/home-mount/deploy.sh');
const sourceHealth=read('ops/home-mount/healthcheck.sh');
const sourceSocial=read('ops/home-mount/build-social-v134.cjs');
const sourceTrust=read('ops/home-mount/build-trust-v135.cjs');

assert.equal(read('VERSION').trim(),'1.2.11');
assert.equal(read('moyu/VERSION').trim(),'1.11.5');
assert.equal(siteVersion,'1.3.5');
assert.equal(sourceAds,'google.com, pub-2648680835467283, DIRECT, f08c47fec0942fa0');

// v1.3.3 pages remain the immutable source baseline. Staged builders advance
// them through v1.3.4 launch/social treatment and then the v1.3.5 trust hub.
for(const page of [sourceHome,sourceDe,sourceMoyu]){
  assert.match(page,/data-site-version="1\.3\.3"/);
  assert.match(page,/class="notranslate" translate="no"/);
  assert.match(page,/name="google" content="notranslate"/);
  assert.match(page,/window\.__91HWL_PREFS/);
  assert(page.indexOf('window.__91HWL_PREFS')<page.indexOf('<style>'),'prepaint preference bootstrap must run before CSS paint');
}
for(const [name,page,marker] of [['About',sourceAbout,/About 91hwl/],['Privacy',sourcePrivacy,/Google AdSense and consent/],['Contact',sourceContact,/mailto:diaow2331@gmail\.com/]]){
  assert.match(page,marker,`${name} content marker missing`);
  assert.match(page,/ca-pub-2648680835467283/,`${name} AdSense client missing`);
  assert.match(page,/href="\/about\/"/);
  assert.match(page,/href="\/privacy\/"/);
  assert.match(page,/href="\/contact\/"/);
}
assert.match(sourceContact,/Bugs and technical feedback/);

for(const script of ['ops/home-mount/deploy.sh','ops/home-mount/healthcheck.sh','ops/release/build-home-mount-bundle.sh']){
  const r=run('bash',['-n',path.join(root,script)]);
  assert.equal(r.status,0,r.stderr);
}
for(const script of ['ops/home-mount/build-v134.cjs','ops/home-mount/build-social-v134.cjs','ops/home-mount/build-trust-v135.cjs']){
  const r=run('node',['--check',path.join(root,script)]);
  assert.equal(r.status,0,r.stderr);
}
assert.match(sourceSocial,/twitter:title/);
assert.match(sourceSocial,/twitter:image:alt/);
assert.match(sourceSocial,/MIT · OPEN SOURCE/);
assert.match(sourceSocial,/ca-pub-2648680835467283/);
assert.match(sourceSocial,/href="\/privacy\/"/);
assert.match(sourceTrust,/site-trust-hub-v135/);
assert.match(sourceTrust,/关于、隐私与联系，不应该藏在角落。/);
assert.match(sourceTrust,/mailto:diaow2331@gmail\.com/);
assert.match(sourceTrust,/data-site-version="1\.3\.5"/);
assert.match(sourceDeploy,/test "\$version" = '1\.3\.5'/);
assert.match(sourceDeploy,/Dungeon Echo v1\.2\.11 detail marker missing/);
assert.match(sourceDeploy,/Clock Out Alive v1\.11\.5 detail marker missing/);
assert.match(sourceDeploy,/site-trust-hub-v135/);
assert.match(sourceDeploy,/mailto:diaow2331@gmail\.com/);
assert.match(sourceDeploy,/pub-2648680835467283/);
assert.match(sourceDeploy,/web-toys-v135/);
assert.match(sourceDeploy,/web_toys_home_mount=ROLLED_BACK/);
assert.match(sourceDeploy,/previous_home_sha256=/);
assert.match(sourceDeploy,/LIVE_INDEX_SHA256/);
assert.doesNotMatch(sourceDeploy,/EXPECTED_INDEX_SHA256/,'immutable site artifact must not depend on a historical live homepage hash');
assert.doesNotMatch(sourceDeploy,/live homepage changed unexpectedly/,'legitimate live drift must be backed up, not block a validated artifact');
assert.match(sourceHealth,/public site v1\.3\.5 check failed/);
assert.match(sourceHealth,/site-trust-hub-v135/);
assert.match(sourceHealth,/de_origin.*1\.2\.11/s);
assert.match(sourceHealth,/moyu_origin.*1\.11\.5/s);
assert.match(sourceHealth,/Google AdSense and consent/);
assert.match(sourceHealth,/mailto:diaow2331@gmail\.com/);
assert.match(sourceHealth,/pub-2648680835467283/);
assert.match(sourceHealth,/HEALTH_CONTRACT_MISS:/);
assert.match(sourceHealth,/MAIN_RESOLVE=91hwl\.cn:443:127\.0\.0\.1/);
assert.match(sourceHealth,/PLAY_RESOLVE=play\.91hwl\.cn:443:127\.0\.0\.1/);

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'web-toys-home-v135-'));
const archive=path.join(tmp,'mount.zip');
let r=run('bash',[path.join(root,'ops/release/build-home-mount-bundle.sh'),archive]);
assert.equal(r.status,0,r.stderr);
assert.match(r.stdout,/site_version=1\.3\.5/);
assert.match(r.stdout,/game_version=1\.2\.11/);
assert.match(r.stdout,/moyu_version=1\.11\.5/);
assert.doesNotMatch(r.stdout,/previous_home_sha256=/);
assert.match(r.stdout,/site_bundle_build=PASS/);

r=run('unzip',['-Z1',archive]);
assert.equal(r.status,0,r.stderr);
const files=r.stdout.trim().split(/\r?\n/);
for(const required of ['README.txt','REVISION','VERSION','SHA256SUMS','ops/deploy.sh','ops/healthcheck.sh','public/index.html','public/toys/dungeon-echo/index.html','public/toys/moyu/index.html','public/about/index.html','public/privacy/index.html','public/contact/index.html','public/ads.txt']) assert(files.includes(required),`mount bundle missing ${required}`);
assert(!files.includes('EXPECTED_INDEX_SHA256'),'historical live homepage hash must not ship in the artifact');

const unzipText=file=>{const x=run('unzip',['-p',archive,file]);assert.equal(x.status,0,x.stderr);return x.stdout};
const bundledHome=unzipText('public/index.html');
const bundledDe=unzipText('public/toys/dungeon-echo/index.html');
const bundledMoyu=unzipText('public/toys/moyu/index.html');
const bundledAbout=unzipText('public/about/index.html');
const bundledPrivacy=unzipText('public/privacy/index.html');
const bundledContact=unzipText('public/contact/index.html');
const bundledAds=unzipText('public/ads.txt').trim();
const bundledDeploy=unzipText('ops/deploy.sh');
const bundledHealth=unzipText('ops/healthcheck.sh');
assert.match(bundledHome,/data-site-version="1\.3\.5"/);
assert.match(bundledHome,/v1\.2\.11/);
assert.match(bundledHome,/v1\.11\.5/);
assert.match(bundledHome,/GitHub \/ Source/);
assert.match(bundledHome,/公开仓库/);
assert.match(bundledHome,/site-trust-hub-v135/);
assert.match(bundledHome,/关于、隐私与联系，不应该藏在角落。/);
assert.match(bundledHome,/About, privacy and contact should not be hidden in a corner\./);
assert.match(bundledHome,/mailto:diaow2331@gmail\.com/);
assert.match(bundledHome,/游戏运行界面本身不作为广告展示面/);
assert.doesNotMatch(bundledHome,/<nav class="site-legal" aria-label="Site information"><a href="\/about\/">About<\/a><a href="\/privacy\/">Privacy<\/a><a href="\/contact\/">Contact<\/a><\/nav>/);
assert.match(bundledHome,/property="og:url" content="https:\/\/91hwl\.cn\/"/);
assert.match(bundledHome,/name="twitter:title" content="91hwl · Browser Games"/);
assert.match(bundledHome,/name="twitter:image" content="https:\/\/play\.91hwl\.cn\/dungeon-echo\/art\/title-backdrop\.webp"/);
assert.match(bundledHome,/ca-pub-2648680835467283/);
assert.match(bundledHome,/href="\/privacy\/"/);
assert.match(bundledDe,/data-site-version="1\.3\.5"/);
assert.match(bundledDe,/softwareVersion":"1\.2\.11"/);
assert.match(bundledDe,/901–1180px/);
assert.match(bundledDe,/property="og:url" content="https:\/\/91hwl\.cn\/toys\/dungeon-echo\/"/);
assert.match(bundledDe,/name="twitter:title" content="Dungeon Echo · 100-Floor Browser Roguelike"/);
assert.match(bundledDe,/GitHub \/ Source/);
assert.match(bundledDe,/MIT · OPEN SOURCE/);
assert.match(bundledMoyu,/data-site-version="1\.3\.5"/);
assert.match(bundledMoyu,/softwareVersion":"1\.11\.5"/);
assert.match(bundledMoyu,/双端更稳/);
assert.match(bundledMoyu,/Cleaner across screens/);
assert.match(bundledAbout,/About 91hwl/);
assert.match(bundledPrivacy,/Google AdSense and consent/);
assert.match(bundledContact,/mailto:diaow2331@gmail\.com/);
assert.match(bundledContact,/Bugs and technical feedback/);
assert.equal(bundledAds,'google.com, pub-2648680835467283, DIRECT, f08c47fec0942fa0');
assert.equal(bundledDeploy,sourceDeploy,'builder must package deploy.sh byte-for-byte');
assert.equal(bundledHealth,sourceHealth,'builder must package healthcheck.sh byte-for-byte');

for(const [name,text] of [['deploy.sh',bundledDeploy],['healthcheck.sh',bundledHealth]]){
  const p=path.join(tmp,name);fs.writeFileSync(p,text);const x=run('bash',['-n',p]);assert.equal(x.status,0,x.stderr);
}

fs.rmSync(tmp,{recursive:true,force:true});
console.log('RESULT  91hwl site v1.3.5 immutable-artifact + visible trust hub contract PASS');
