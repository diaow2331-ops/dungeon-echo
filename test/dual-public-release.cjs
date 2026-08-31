'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const run=(cmd,args)=>spawnSync(cmd,args,{cwd:root,encoding:'utf8'});
const de=read('VERSION').trim(),moyu=read('moyu/VERSION').trim(),site=read('ops/home-mount/SITE_VERSION').trim();
for(const [name,v] of [['Dungeon Echo',de],['Moyu',moyu],['site',site]])assert.match(v,/^\d+\.\d+\.\d+$/,`${name} version must be semver`);

const current=read('docs/CURRENT_RELEASES.md');
assert.match(current,new RegExp(`Dungeon Echo \\| v${de.replaceAll('.','\\.')}`));
assert.match(current,new RegExp(`Clock Out Alive / 摸鱼到下班 \\| v${moyu.replaceAll('.','\\.')}`));
assert.match(current,new RegExp(`91hwl public site \\| v${site.replaceAll('.','\\.')}`));
assert.match(current,/aggregate entry points/);
assert.match(current,/historical inputs, not current release authority/i);

const runner=read('ops/release/deploy-dual-public.sh');
assert.match(runner,/usage: deploy-dual-public\.sh \/tmp\/<prebuilt-release>\.zip/);
assert.match(runner,/unzip -Z1/);
assert.match(runner,/sha256sum -c SHA256SUMS/);
assert.match(runner,/test -r "\$work\/ops\/deploy\.sh"/);
assert.match(runner,/bash "\$work\/ops\/deploy\.sh"/);
assert.match(runner,/public_artifact_runner=PASS/);for(const forbidden of [/git fetch/,/git pull/,/git checkout/,/git merge/,/build-site-bundle\.sh/,/build-moyu-bundle\.sh/,/build-home-mount-bundle\.sh/,/\bnode\b/,/\bpatch\b/,/\bnpm\b/])assert.doesNotMatch(runner,forbidden,`production artifact runner must not contain ${forbidden}`);

for(const file of ['ops/release/deploy-dual-public.sh','ops/release/build-site-bundle.sh','ops/release/build-moyu-bundle.sh','ops/release/build-home-mount-bundle.sh','ops/release/build-public-release-zip.sh','ops/release/build-web-toys-release.sh']){
 const r=run('bash',['-n',path.join(root,file)]);assert.equal(r.status,0,r.stderr);
}
for(const file of ['ops/release/build-public-release-zip.sh','ops/release/build-web-toys-release.sh']){
 const text=read(file);assert.match(text,/moyu\/VERSION/);assert.match(text,/home-mount\/SITE_VERSION/);assert.match(text,/\^\[0-9\]\+\\\.\[0-9\]\+\\\.\[0-9\]\+\$/);
 assert.doesNotMatch(text,/unexpected Moyu version:/);assert.doesNotMatch(text,/unexpected site version:/);
}

const skill=read('.agents/skills/91hwl-static-release/SKILL.md');
assert.match(skill,/Build elsewhere\. Deploy artifacts only\./);
assert.match(skill,/production server is an activation target, not a build machine/i);
assert.match(skill,/user uploads ZIP to \/tmp/i);
assert.match(skill,/one offline deployment command/i);
console.log('RESULT  91HWL current-release authority + offline artifact boundary PASS');