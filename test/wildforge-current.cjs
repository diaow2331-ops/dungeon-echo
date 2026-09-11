const cp=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
for(const file of ['wildforge-v0430.cjs','wildforge-fusion-v0410.cjs','wildforge-phase0-determinism.cjs','wildforge-phase1-onboarding.cjs','wildforge-phase2-feel.cjs','wildforge-single-html.cjs']){
  console.log(`== ${file} ==`);
  cp.execFileSync(process.execPath,[path.join(__dirname,file)],{cwd:root,stdio:'inherit'});
}
console.log('wildforge_current=PASS v0.43.0 Phase 2 mobile/logistics feel baseline');
