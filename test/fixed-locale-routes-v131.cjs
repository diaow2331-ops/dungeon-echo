'use strict';
const fs=require('fs'),path=require('path');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const zh=fs.readFileSync(path.join(root,'index.html'),'utf8');
const en=fs.readFileSync(path.join(root,'en','index.html'),'utf8');
const owner=fs.readFileSync(path.join(root,'game','locale','fixed-locale-entry-v130.js'),'utf8');
const localeData=fs.readFileSync(path.join(root,'game','locale','locale-data-v134.js'),'utf8');
const coreLocale=fs.readFileSync(path.join(root,'game','locale','core-locale-data-v139.js'),'utf8');
const runtime=fs.readFileSync(path.join(root,'game','core','runtime-bootstrap.js'),'utf8');
const manifest=fs.readFileSync(path.join(root,'ops','release','static-files.txt'),'utf8').split(/\r?\n/).filter(Boolean);
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
const scripts=html=>[...html.matchAll(/<script\s+src="([^"]+)"[^>]*><\/script>/g)].map(m=>m[1].split('?')[0]);
const expectedScripts=[
  'game/core/production-bootstrap.js','profiles/classic-100.profile.js','game/locale/locale-data-v134.js',
  'game/domain/content/content-rules-v130.js','game/domain/inventory/equipment-rules-v130.js',
  'game/domain/economy/economy-rules-v130.js','game/domain/progression/progression-rules-v130.js',
  'game/domain/combat/combat-rules-v130.js','game/core/game.js','game/locale/core-locale-data-v139.js',
  'game/input/desktop-controls.js','game/core/runtime-bootstrap.js',
];
ok(/<html\s+lang="zh-CN"\s+data-de-locale="zh-CN">/.test(zh),'root entry owns Chinese locale identity');
ok(/<html\s+lang="en"\s+data-de-locale="en">/.test(en),'English entry owns English locale identity');
ok(/<base\s+href="\.\.\/">/.test(en),'English entry resolves shared assets from the dungeon root');
ok(!/[\u3400-\u9fff]/.test(en),'English static entry contains no CJK presentation text');
ok(JSON.stringify(scripts(zh))===JSON.stringify(expectedScripts),'Chinese route boots canonical v173 synchronous graph');
ok(JSON.stringify(scripts(en))===JSON.stringify(expectedScripts),'English route boots the identical canonical v173 synchronous graph');
for(const file of ['index.html','en/index.html','game/locale/locale-data-v134.js','game/locale/core-locale-data-v139.js','game/locale/fixed-locale-entry-v130.js','game/core/runtime-bootstrap.js','game/ui/responsive-final-v154.js','game/ui/help-copy-v126.js','game/ui/theme-atmosphere-v131.js','game/ui/adaptive-bgm-v132.js','game/ui/forge-feedback-v132.js'])
  ok(manifest.includes(file),`${file} ships in release allowlist`);
for(const retired of ['stable-item-id-migration-v150.js','core-screen-owner-v153.js','town-canvas-locale-v153.js','locale-event-owner-v130.js','locale-runtime-v122.js','locale-completeness-v128.js']){
  ok(!runtime.includes(retired),`${retired} is absent from production bootstrap`);
  ok(!manifest.some(file=>file===retired||file.endsWith('/'+retired)),`${retired} is absent from release manifest`);
}
const expectedFollowers=[
  "fresh('game/core/release-stamp-v134.js')",
  "fresh('game/locale/fixed-locale-entry-v130.js')",
  "fresh('game/ui/responsive-final-v154.js')",
  "fresh('game/ui/help-copy-v126.js')",
  "fresh('game/ui/theme-atmosphere-v131.js')",
  "fresh('game/ui/adaptive-bgm-v132.js')",
  "fresh('game/ui/forge-feedback-v132.js')",
];
for(const token of expectedFollowers) ok(runtime.includes(token),`runtime follower present: ${token}`);
ok(/const english = routeLang === 'en'/.test(runtime),'runtime locale identity is fixed-route derived');
ok(/const assetVersion = '173'/.test(runtime)&&/version:'v25'/.test(runtime),'runtime bootstrap aligns with generation 173 / v25');
ok(/const chain = Object\.freeze\(\[/.test(runtime)&&/followers:'presentation-only'/.test(runtime),'runtime owns one bounded presentation follower chain');
ok(!/MutationObserver|translateTree|setInterval/.test(localeData),'locale data remains source-level and observer-free');
ok(!/MutationObserver|setInterval|requestAnimationFrame/.test(coreLocale),'core locale data remains one-shot and observer-free');
ok(/const storageKey = 'de-language-v1'/.test(owner),'fixed route owner writes only legacy language preference');
ok(!/de-run-v6|de-greedy-meta-v1|de-town-wheel-state-v1|de-progression-guard-v1/.test(owner),'fixed locale routing does not mutate gameplay saves');
ok(/searchParams\.delete\('lang'\)/.test(owner)&&/new URL\('en\/', root\)/.test(owner),'legacy query locale converges onto fixed paths');
ok(/#de-title-language button\[data-lang\]/.test(owner)&&/stopImmediatePropagation/.test(owner),'language selector routes between fixed pages');
for(const [name,src] of [['fixed locale owner',owner],['locale data',localeData],['core locale data',coreLocale],['runtime bootstrap',runtime]]){
  try{new Function(src);ok(true,`${name} parses`)}catch(e){ok(false,`${name} parses: ${e.message}`)}
}
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
