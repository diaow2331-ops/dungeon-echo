'use strict';
const fs=require('fs'),path=require('path');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const zh=fs.readFileSync(path.join(root,'index.html'),'utf8');
const en=fs.readFileSync(path.join(root,'en','index.html'),'utf8');
const owner=fs.readFileSync(path.join(root,'fixed-locale-entry-v130.js'),'utf8');
const runtime=fs.readFileSync(path.join(root,'runtime-bootstrap.js'),'utf8');
const screen=fs.readFileSync(path.join(root,'core-screen-owner-v153.js'),'utf8');
const canvas=fs.readFileSync(path.join(root,'town-canvas-locale-v153.js'),'utf8');
const manifest=fs.readFileSync(path.join(root,'ops','release','static-files.txt'),'utf8').split(/\r?\n/).filter(Boolean);
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
const scripts=html=>[...html.matchAll(/<script\s+src="([^"]+)"[^>]*><\/script>/g)].map(m=>m[1].split('?')[0]);
ok(/<html\s+lang="zh-CN"\s+data-de-locale="zh-CN">/.test(zh),'root entry owns Chinese locale identity');
ok(/<html\s+lang="en"\s+data-de-locale="en">/.test(en),'English entry owns English locale identity');
ok(/<base\s+href="\.\.\/">/.test(en),'English entry resolves all shared assets from the same dungeon root');
ok(!/[\u3400-\u9fff]/.test(en),'English static entry contains no CJK presentation text');
ok(JSON.stringify(scripts(zh))===JSON.stringify(scripts(en)),'Chinese and English entries boot the exact same synchronous gameplay script graph');
ok(manifest.includes('index.html')&&manifest.includes('en/index.html')&&manifest.includes('fixed-locale-entry-v130.js')&&manifest.includes('core-locale-data-v139.js')&&manifest.includes('stable-item-id-migration-v150.js')&&manifest.includes('core-screen-owner-v153.js')&&manifest.includes('town-canvas-locale-v153.js'),'release manifest ships both fixed routes, stable IDs and exact core screen/canvas owners');
for(const retired of ['locale-event-owner-v130.js','locale-runtime-v122.js','locale-completeness-v128.js']){
  ok(!runtime.includes(retired),`${retired} is absent from production bootstrap`);
  ok(!manifest.includes(retired),`${retired} is absent from the release manifest`);
}
const fixedPos=runtime.indexOf("'fixed-locale-entry-v130.js'");
const idPos=runtime.indexOf("'stable-item-id-migration-v150.js'");
const screenPos=runtime.indexOf("'core-screen-owner-v153.js'");
const canvasPos=runtime.indexOf("'town-canvas-locale-v153.js'");
ok(fixedPos>=0&&idPos>fixedPos&&screenPos>idPos&&canvasPos>screenPos,'fixed route, stable IDs and exact presentation owners boot in deterministic order');
ok(/const english = routeLang === 'en'/.test(runtime),'runtime locale identity is route-derived rather than query-derived');
ok(/assetVersion = '153'/.test(runtime)&&/version:'v13'/.test(runtime),'runtime bootstrap and cache generation are aligned at 153/v13');
ok(/const chain = Object\.freeze\(\[\.\.\.baseChain, \.\.\.followerChain\]\)/.test(runtime),'both fixed routes now boot one shared bridge-free runtime graph');
ok(!/MutationObserver|translateTree|setInterval/.test(screen),'core screen owner uses exact sinks without generic translation observers or polling');
ok(!/MutationObserver|setInterval|requestAnimationFrame/.test(canvas),'town canvas locale owner adds no observer, polling or animation follower');
ok(/const storageKey = 'de-language-v1'/.test(owner),'fixed route owner writes only the legacy language preference key');
ok(!/de-run-v6|de-greedy-meta-v1|de-town-wheel-state-v1|de-progression-guard-v1/.test(owner),'fixed locale routing does not fork or mutate gameplay save namespaces');
ok(/searchParams\.delete\('lang'\)/.test(owner)&&/new URL\('en\/', root\)/.test(owner),'legacy query locale converges onto fixed paths');
ok(/#de-title-language button\[data-lang\]/.test(owner)&&/stopImmediatePropagation/.test(owner),'language selector routes between fixed pages instead of query mode');
ok(/owner:'fixed-locale-entry-v130'/.test(owner)&&/installLanguageEntry/.test(owner),'fixed route owner owns the language entry instead of relying on a translator');
for(const [name,src] of [['fixed locale owner',owner],['runtime bootstrap',runtime],['core screen owner',screen],['town canvas owner',canvas]]){
  try{new Function(src);ok(true,`${name} parses`)}catch(e){ok(false,`${name} parses: ${e.message}`)}
}
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
