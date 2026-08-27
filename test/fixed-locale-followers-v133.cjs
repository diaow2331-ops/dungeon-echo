'use strict';
const fs=require('fs'),path=require('path');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const audio=read('audio-director.js');
const hint=read('combat-hint-polish.js');
const help=read('help-copy-v126.js');
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
for(const [name,src] of [['audio',audio],['hint',hint],['help',help]]){
  try{new Function(src);ok(true,`${name} parses`)}catch(e){ok(false,`${name} parses: ${e.message}`)}
  ok(src.includes('dataset.deLocale'),`${name} reads fixed route locale identity`);
  ok(!src.includes('window.DE_I18N'),`${name} has no runtime translator dependency`);
  ok(!/MutationObserver/.test(src),`${name} owns no DOM observer`);
}
ok(/version:'v3'/.test(audio)&&/owner:'audio-director'/.test(audio),'audio v3 exposes explicit owner');
ok(audio.includes("copy('声音设置', 'Sound Settings')")&&audio.includes("copy('总开关：关', 'Master: Off')"),'audio UI renders bilingual copy at source');
ok(audio.includes('function startPump()')&&audio.includes('function stopPump()')&&audio.includes('document.hidden'),'WebAudio scheduler has explicit active-page lifecycle');
ok(audio.includes('nextBeat = Math.max(Number(nextBeat) || 0, ctx.currentTime + .08)'),'foreground resume rebases lookahead and cannot replay a hidden-page beat backlog');
ok(/version:'v4'/.test(hint)&&/owner:'combat-hint-polish'/.test(hint),'onboarding v4 exposes fixed-locale owner');
ok(hint.includes("copy('跳过教学','Skip Tutorial')")&&hint.includes('Armor Break · telegraphed guardian specials'),'onboarding labels and guardian guidance are source-localized');
ok(/version:'1\.3\.0'/.test(help)&&/owner:'help-copy-v126'/.test(help),'help copy exposes fixed-locale owner');
ok(!help.includes('de:languagechange'),'fixed-page help no longer listens for in-page language mutation');
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
