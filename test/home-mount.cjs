'use strict';

const assert=require('assert');
const crypto=require('crypto');
const fs=require('fs');
const os=require('os');
const path=require('path');
const {spawnSync}=require('child_process');

const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const run=(cmd,args,opts={})=>spawnSync(cmd,args,{cwd:root,encoding:'utf8',...opts});
const siteVersion=read('ops/home-mount/SITE_VERSION').trim();
const home=read('ops/home-mount/public/index.html');
const de=read('ops/home-mount/public/toys/dungeon-echo/index.html');
const moyu=read('ops/home-mount/public/toys/moyu/index.html');

assert.equal(read('VERSION').trim(),'1.2.6');
assert.equal(siteVersion,'1.3.3');

for(const page of [home,de,moyu]){
  assert.match(page,/data-site-version="1\.3\.3"/);
  assert.match(page,/class="notranslate" translate="no"/);
  assert.match(page,/name="google" content="notranslate"/);
  assert.match(page,/window\.__91HWL_PREFS/);
  assert(page.indexOf('window.__91HWL_PREFS')<page.indexOf('<style>'),'prepaint preference bootstrap must run before CSS paint');
  assert.match(page,/data-lang-choice="zh"/);
  assert.match(page,/data-lang-choice="en"/);
  assert.match(page,/id="themeToggle"/);
  assert.match(page,/data-carry/);
}

assert.match(home,/--fs-xs:12px/);
assert.match(home,/--fs-sm:14px/);
assert.match(home,/--fs-body:16px/);
assert.match(home,/--fs-ui:14px/);
assert.match(home,/--fs-card:30px/);
assert.match(home,/--fs-section:clamp\(30px,3\.2vw,42px\)/);
assert.match(home,/--fs-hero:clamp\(50px,6vw,76px\)/);
assert.match(home,/Dungeon Echo/);
assert.match(home,/Clock Out Alive/);
assert.match(de,/softwareVersion":"1\.2\.6"/);
assert.match(de,/href="https:\/\/play\.91hwl\.cn\/dungeon-echo\/" data-carry/);
assert.match(moyu,/softwareVersion":"1\.11\.3"/);
assert.match(moyu,/href="https:\/\/play\.91hwl\.cn\/moyu\/" data-carry/);

// Source deployers remain the field-tested v1.3.2 implementation; the builder performs deterministic marker adaptation.
for(const script of ['ops/home-mount/deploy.sh','ops/home-mount/healthcheck.sh','ops/release/build-home-mount-bundle.sh']){
  const r=run('bash',['-n',path.join(root,script)]);
  assert.equal(r.status,0,r.stderr);
}
assert.match(read('ops/home-mount/deploy.sh'),/web_toys_home_mount=ROLLED_BACK/);
assert.match(read('ops/home-mount/healthcheck.sh'),/MAIN_RESOLVE=91hwl\.cn:443:127\.0\.0\.1/);
assert.match(read('ops/home-mount/healthcheck.sh'),/PLAY_RESOLVE=play\.91hwl\.cn:443:127\.0\.0\.1/);

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'web-toys-home-v133-'));
const archive=path.join(tmp,'mount.zip');
let r=run('bash',[path.join(root,'ops/release/build-home-mount-bundle.sh'),archive]);
assert.equal(r.status,0,r.stderr);
assert.match(r.stdout,/site_version=1\.3\.3/);
assert.match(r.stdout,/previous_home_sha256=/);
assert.match(r.stdout,/site_bundle_build=PASS/);

r=run('unzip',['-Z1',archive]);
assert.equal(r.status,0,r.stderr);
const files=r.stdout.trim().split(/\r?\n/);
for(const required of ['EXPECTED_INDEX_SHA256','README.txt','REVISION','VERSION','SHA256SUMS','ops/deploy.sh','ops/healthcheck.sh','public/index.html','public/toys/dungeon-echo/index.html','public/toys/moyu/index.html']) assert(files.includes(required),`mount bundle missing ${required}`);

const unzipText=file=>{const x=run('unzip',['-p',archive,file]);assert.equal(x.status,0,x.stderr);return x.stdout};
const bundledDeploy=unzipText('ops/deploy.sh');
const bundledHealth=unzipText('ops/healthcheck.sh');
assert.match(bundledDeploy,/test "\$version" = '1\.3\.3'/);
assert.match(bundledDeploy,/web-toys-v133/);
assert.match(bundledDeploy,/web_toys_home_mount=ROLLED_BACK/);
assert.match(bundledDeploy,/web_toys_home_mount=PASS/);
assert.match(bundledHealth,/public site v1\.3\.3 check failed/);
assert.match(bundledHealth,/moyu_origin.*1\.11\.3/s);
assert.match(bundledHealth,/MAIN_RESOLVE=91hwl\.cn:443:127\.0\.0\.1/);
assert.match(bundledHealth,/PLAY_RESOLVE=play\.91hwl\.cn:443:127\.0\.0\.1/);

for(const [name,text] of [['deploy.sh',bundledDeploy],['healthcheck.sh',bundledHealth]]){
  const p=path.join(tmp,name);fs.writeFileSync(p,text);const x=run('bash',['-n',p]);assert.equal(x.status,0,x.stderr);
}

const previous=run('git',['show','e15ac9959687dbd47457cd650a0e96f008c151c5:ops/home-mount/public/index.html']);
assert.equal(previous.status,0,previous.stderr);
const expected=crypto.createHash('sha256').update(previous.stdout).digest('hex');
assert.equal(unzipText('EXPECTED_INDEX_SHA256').trim(),expected,'homepage overwrite guard must pin deployed site v1.3.2');

fs.rmSync(tmp,{recursive:true,force:true});
console.log('RESULT  91hwl site v1.3.3 prepaint/typography/release contract PASS');
