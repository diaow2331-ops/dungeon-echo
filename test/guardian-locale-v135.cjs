'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'content-system.js'),'utf8');
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
try{new vm.Script(src,{filename:'content-system.js'});ok(true,'content system parses')}catch(e){ok(false,`content system parses: ${e.message}`)}
ok(src.includes("window.__DE_CONTENT_SYSTEM = 'v6'"),'guardian content reports v6');
ok(src.includes('dataset.deLocale')&&!src.includes('DE_I18N'),'guardian presentation reads fixed route and no runtime translator');
ok(src.includes("copy('霜环蓄积','Frost Ring')")&&src.includes("copy('爆裂标记','Ember Mark')"),'floor 20/30 telegraphs own English copy at source');
ok(src.includes("'Echo Trial II · Break the Line'")&&src.includes("'Final Phase III · Abyss Heart Nova'"),'echo/finale telegraphs own English copy at source');
ok(src.includes("copy('噤声王庭','Silent Court')")&&src.includes("copy('回响王座','Echo Throne')"),'content-owned late themes localize at creation');
ok(src.includes("version: 'v2'")&&src.includes("owner: 'content-system'")&&src.includes("locale: english ? 'en' : 'zh-CN'"),'guardian encounter API exposes fixed-locale owner');
ok(!/MutationObserver|setInterval\s*\(/.test(src),'guardian content adds no observer or polling interval');
ok(/requestAnimationFrame\(frame\)/.test(src),'telegraph animation retains its legitimate frame renderer');
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);process.exit(fail?1:0);