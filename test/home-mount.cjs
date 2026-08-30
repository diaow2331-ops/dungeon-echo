'use strict';
const assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path');
const {spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const run=(cmd,args,opts={})=>spawnSync(cmd,args,{cwd:root,encoding:'utf8',...opts});
const version=read('ops/home-mount/SITE_VERSION').trim();
const assetRoot='ops/home-mount/public/assets/site-v170';
assert.equal(read('VERSION').trim(),'1.4.2');
assert.equal(read('moyu/VERSION').trim(),'1.23.0');
assert.equal(version,'1.7.0');
assert.equal(read('ops/home-mount/public/ads.txt').trim(),'google.com, pub-2648680835467283, DIRECT, f08c47fec0942fa0');
for(const f of [assetRoot+'/style.css',assetRoot+'/site.js',assetRoot+'/wang-jian-landscape-1668.jpg'])assert(fs.statSync(path.join(root,f)).size>100,'missing asset '+f);
assert.match(read(assetRoot+'/style.css'),/\.draw-section/);
assert.match(read(assetRoot+'/style.css'),/\.page-record/);
assert.match(read(assetRoot+'/site.js'),/data-game-choice/);
assert.match(read(assetRoot+'/site.js'),/data-reset-prefs/);
assert.match(read(assetRoot+'/site.js'),/data-copy-email/);
for(const f of ['ops/home-mount/deploy.sh','ops/home-mount/healthcheck.sh','ops/release/build-home-mount-bundle.sh']){
 const x=run('bash',['-n',path.join(root,f)]);assert.equal(x.status,0,x.stderr);
}
for(const f of ['ops/home-mount/build-v134.cjs','ops/home-mount/build-social-v134.cjs','ops/home-mount/build-trust-v135.cjs','ops/home-mount/build-home-v140.cjs','ops/home-mount/build-home-v150.cjs','ops/home-mount/build-home-v160.cjs','ops/home-mount/build-site-v170.cjs',assetRoot+'/site.js']){
 const x=run('node',['--check',path.join(root,f)]);assert.equal(x.status,0,x.stderr);
}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'web-toys-home-v170-'));
const stage=path.join(tmp,'stage');
for(const d of ['toys/dungeon-echo','toys/moyu','about','privacy','contact'])fs.mkdirSync(path.join(stage,d),{recursive:true});
for(const f of ['index.html','toys/dungeon-echo/index.html','toys/moyu/index.html','about/index.html','privacy/index.html','contact/index.html']){
 fs.copyFileSync(path.join(root,'ops/home-mount/public',f),path.join(stage,f));
}
const three=[path.join(stage,'index.html'),path.join(stage,'toys/dungeon-echo/index.html'),path.join(stage,'toys/moyu/index.html')];
for(const b of ['build-v134.cjs','build-social-v134.cjs','build-trust-v135.cjs','build-home-v140.cjs','build-home-v150.cjs','build-home-v160.cjs']){
 const x=run('node',[path.join(root,'ops/home-mount',b),...three]);assert.equal(x.status,0,x.stderr);
}
const six=[...three,path.join(stage,'about/index.html'),path.join(stage,'privacy/index.html'),path.join(stage,'contact/index.html')];
let x=run('node',[path.join(root,'ops/home-mount/build-site-v170.cjs'),...six]);
assert.equal(x.status,0,x.stderr);assert.match(x.stdout,/site_v170_build=PASS/);
const built=six.map(f=>fs.readFileSync(f,'utf8'));
for(const html of built){
 assert.match(html,/data-site-version="1\.7\.0"/);
 assert.match(html,/site-v170\/style\.css/);
 assert.match(html,/site-v170\/site\.js/);
 assert.match(html,/class="scroll-progress"/);
}
const [home,de,moyu,about,privacy,contact]=built;
assert.match(home,/游艺择签/);assert.match(home,/敬请期待/);assert.match(home,/wang-jian-landscape-1668\.jpg/);
assert.match(home,/data-game-choice="random"/);assert.match(home,/site v1\.7\.0/);
assert.match(de,/softwareVersion":"1\.4\.2"/);assert.match(de,/1120×460 可步行广场/);
assert.match(moyu,/softwareVersion":"1\.23\.0"/);assert.match(moyu,/四幕皆有新声/);
assert.match(about,/一方小站，二种玩法。/);assert.match(about,/造物四则/);
assert.match(privacy,/隐私案卷/);assert.match(privacy,/重置主站偏好/);assert.match(privacy,/不会声称或尝试删除/);
assert.match(contact,/把问题说清，把回音留下。/);assert.match(contact,/data-copy-email/);
assert.doesNotMatch(privacy,/border-radius:16px/);
const archive=path.join(tmp,'mount.zip');
x=run('bash',[path.join(root,'ops/release/build-home-mount-bundle.sh'),archive]);
assert.equal(x.status,0,x.stderr);assert.match(x.stdout,/site_version=1\.7\.0/);assert.match(x.stdout,/site_bundle_build=PASS/);
x=run('unzip',['-Z1',archive]);assert.equal(x.status,0,x.stderr);
const files=x.stdout.trim().split(/\r?\n/);
for(const f of ['README.txt','REVISION','VERSION','SHA256SUMS','ops/deploy.sh','ops/healthcheck.sh','public/index.html','public/toys/dungeon-echo/index.html','public/toys/moyu/index.html','public/about/index.html','public/privacy/index.html','public/contact/index.html','public/ads.txt','public/assets/site-v170/style.css','public/assets/site-v170/site.js','public/assets/site-v170/wang-jian-landscape-1668.jpg'])assert(files.includes(f),'bundle missing '+f);
const unzip=f=>{const z=run('unzip',['-p',archive,f],{encoding:null});assert.equal(z.status,0,String(z.stderr));return z.stdout};
const txt=f=>unzip(f).toString('utf8');
assert.equal(txt('VERSION').trim(),'1.7.0');
assert.match(txt('public/index.html'),/游艺择签/);
assert.match(txt('public/privacy/index.html'),/隐私案卷/);
assert.match(txt('public/contact/index.html'),/data-copy-email/);
assert.match(txt('public/assets/site-v170/style.css'),/\.folio-art/);
assert.match(txt('public/assets/site-v170/site.js'),/data-reset-prefs/);
assert(unzip('public/assets/site-v170/wang-jian-landscape-1668.jpg').length>200000);
for(const f of ['ops/deploy.sh','ops/healthcheck.sh']){
 const q=path.join(tmp,path.basename(f));fs.writeFileSync(q,txt(f));const z=run('bash',['-n',q]);assert.equal(z.status,0,z.stderr);
}
assert.match(txt('ops/deploy.sh'),/web-toys-v170/);
assert.match(txt('ops/deploy.sh'),/ASSET_REL=assets\/site-v170/);
assert.match(txt('ops/healthcheck.sh'),/public site v1\.7\.0 check failed/);
assert.match(txt('ops/healthcheck.sh'),/ART_URL=https:\/\/91hwl\.cn\/assets\/site-v170/);
fs.rmSync(tmp,{recursive:true,force:true});
console.log('RESULT  91hwl site v1.7.0 unified Chinese folio + interactive trust pages contract PASS');
