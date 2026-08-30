'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const run=(cmd,args)=>spawnSync(cmd,args,{cwd:root,encoding:'utf8'});

assert.equal(read('VERSION').trim(),'1.4.2');
assert.equal(read('moyu/VERSION').trim(),'1.17.0');
assert.equal(read('ops/home-mount/SITE_VERSION').trim(),'1.4.0');

const runner=read('ops/release/deploy-dual-public.sh');
assert.match(runner,/usage: deploy-dual-public\.sh \/tmp\/<prebuilt-release>\.zip/);
assert.match(runner,/unzip -Z1/);
assert.match(runner,/sha256sum -c SHA256SUMS/);
assert.match(runner,/test -r "\$work\/ops\/deploy\.sh"/);
assert.match(runner,/bash "\$work\/ops\/deploy\.sh"/);
assert.match(runner,/public_artifact_runner=PASS/);
for(const forbidden of [/git fetch/,/git pull/,/git checkout/,/git merge/,/build-site-bundle\.sh/,/build-moyu-bundle\.sh/,/build-home-mount-bundle\.sh/,/\bnode\b/,/\bpatch\b/,/\bnpm\b/]){
  assert.doesNotMatch(runner,forbidden,`production artifact runner must not contain ${forbidden}`);
}

for(const file of ['ops/release/deploy-dual-public.sh','ops/release/build-site-bundle.sh','ops/release/build-moyu-bundle.sh','ops/release/build-home-mount-bundle.sh','ops/release/build-public-release-zip.sh']){
  const r=run('bash',['-n',path.join(root,file)]);
  assert.equal(r.status,0,r.stderr);
}

const skill=read('.agents/skills/91hwl-static-release/SKILL.md');
assert.match(skill,/Build elsewhere\. Deploy artifacts only\./);
assert.match(skill,/production server is an activation target, not a build machine/i);
assert.match(skill,/user uploads ZIP to \/tmp/i);
assert.match(skill,/one offline deployment command/i);

assert.match(read('docs/releases/RELEASE_NOTES_v1.4.2.md'),/v1\.4\.2/);
assert.match(read('docs/releases/RELEASE_NOTES_moyu_v1.17.0.md'),/v1\.17\.0/);
const siteNotes=read('docs/releases/RELEASE_NOTES_site_v1.4.0.md');
assert.match(siteNotes,/site v1\.4\.0/i);
assert.match(siteNotes,/Dungeon Echo: v1\.4\.2/);
assert.match(siteNotes,/Clock Out Alive: v1\.17\.0/);
console.log('RESULT  91HWL offline artifact release boundary PASS');
