'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'locale-event-owner-v130.js'),'utf8');

const required=['#title-screen','#class-screen','#pause-screen','#overlay','#shop-screen','#town-screen','#achv-screen'];
const retired=['#stats','#equipbar','#stage','#touch','#log','#bag','#bagdetail','#tooltip','#hint','#help','#talent-screen','#shrine-screen','#echo-screen'];
for(const selector of required) assert(src.includes(`'${selector}'`),`residual bridge must retain ${selector} until its core renderer is source-localized`);
for(const selector of retired) assert(!src.includes(`'${selector}'`),`source-localized ${selector} must stay outside the legacy bridge`);
assert(!src.includes('translateTree(document.body)'),'legacy bridge must never return to body-wide translation');
assert(/function\s+primeStaticOwners\s*\(/.test(src),'broad static owner compatibility is isolated to one-time priming');
assert(/function\s+sync\s*\(\)\s*\{[\s\S]*for \(const selector of legacyRoots\)/.test(src),'event sync iterates only the residual root allowlist');
assert(/version:'v143'/.test(src),'bridge version documents narrowed scope');
new Function(src);
console.log(`legacy_locale_scope_v143=PASS (${required.length} residual roots, ${retired.length} retired roots)`);
