const cp=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
for(const file of ['wildforge-v0410.cjs','wildforge-fusion-v0410.cjs','wildforge-phase0-determinism.cjs','wildforge-single-html.cjs']){
  console.log(`== ${file} ==`);
  cp.execFileSync(process.execPath,[path.join(__dirname,file)],{cwd:root,stdio:'inherit'});
}
console.log('wildforge_current=PASS v0.41.0 authoritative integration + Phase 0 determinism baseline');
