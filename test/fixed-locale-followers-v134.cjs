'use strict';
const fs=require('fs'),path=require('path');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const moved={
  'audio-director.js':'game/ui/audio-director.js',
  'combat-hint-polish.js':'game/ui/combat-hint-polish.js',
  'help-copy-v126.js':'game/ui/help-copy-v126.js',
  'mobile-ux.js':'game/ui/mobile-ux.js',
  'expedition-record-v126.js':'game/ui/expedition-record-v126.js',
  'forge-feedback-v122.js':'game/ui/forge-feedback-v122.js',
};
const read=f=>fs.readFileSync(path.join(root,moved[f]||f),'utf8');
const sources={
  data:read('locale-data-v134.js'),
  audio:read('audio-director.js'),
  hint:read('combat-hint-polish.js'),
  help:read('help-copy-v126.js'),
  mobile:read('mobile-ux.js'),
  record:read('expedition-record-v126.js'),
  forge:read('forge-system.js'),
  feedback:read('forge-feedback-v122.js'),
  gamepad:read('desktop-controls.js'),
  risk:read('risk-reward-system.js'),
};
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
for(const [name,src] of Object.entries(sources)){
  try{new Function(src);ok(true,`${name} parses`)}catch(e){ok(false,`${name} parses: ${e.message}`)}
}
for(const name of ['audio','hint','help','mobile','record','forge','feedback','gamepad','risk']){
  const src=sources[name];
  ok(src.includes('dataset.deLocale'),`${name} reads fixed route locale identity`);
}
for(const name of ['audio','hint','help','mobile','record','forge','feedback','gamepad','risk']){
  ok(!sources[name].includes('window.DE_I18N')&&!sources[name].includes('DE_I18N.'),`${name} has no runtime translator dependency`);
}
ok(sources.data.includes("version:'v134'")&&sources.data.includes('function itemName(item)'),'locale data v134 owns data-level item naming');
ok(!/MutationObserver|setInterval\s*\(/.test(sources.data),'locale data catalog has no observer or polling behavior');
ok(/version:'v3'/.test(sources.audio)&&/owner:'audio-director'/.test(sources.audio),'audio v3 exposes explicit owner');
ok(sources.audio.includes("copy('声音设置', 'Sound Settings')")&&sources.audio.includes("copy('总开关：关', 'Master: Off')"),'audio UI renders bilingual copy at source');
ok(/version:'v4'/.test(sources.hint)&&/owner:'combat-hint-polish'/.test(sources.hint),'onboarding v4 exposes fixed-locale owner');
ok(/version:'1\.3\.0'/.test(sources.help)&&/owner:'help-copy-v126'/.test(sources.help),'help copy exposes fixed-locale owner');
ok(/version: 'v3'/.test(sources.forge)||/version:'v3'/.test(sources.forge)||sources.forge.includes("window.__DE_FORGE_SYSTEM = 'v3'"),'forge refinement is on v3 fixed-locale contract');
ok(sources.forge.includes('DE_LOCALE_DATA')&&sources.feedback.includes('DE_LOCALE_DATA'),'forge UI and feedback share data-level localized item names');
ok(sources.gamepad.includes("version:'v2'")&&sources.gamepad.includes("owner:'desktop-controls'"),'gamepad v2 exposes fixed-locale owner');
ok(!sources.gamepad.includes('URLSearchParams')&&!sources.gamepad.includes("localStorage.getItem('de-language-v1')"),'gamepad no longer infers locale from query/storage');
ok(sources.risk.includes("version:'p0-v3'")&&sources.risk.includes('localeData.itemName'),'risk/reward v3 localizes wager output at source');
ok(sources.risk.includes('Accept Wager')&&sources.risk.includes('The cask bottom bursts open'),'English shrine/cask copy is explicit at source');
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);