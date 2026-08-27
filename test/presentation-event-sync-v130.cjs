'use strict';
const fs = require('fs');
const path = require('path');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const files = {
  help: fs.readFileSync(path.join(root, 'help-copy-v126.js'), 'utf8'),
  shop: fs.readFileSync(path.join(root, 'equipment-shop-ui.js'), 'utf8'),
  forge: fs.readFileSync(path.join(root, 'forge-feedback-v122.js'), 'utf8'),
  art: fs.readFileSync(path.join(root, 'character-art-cleanup-v122.js'), 'utf8'),
};
let pass=0, fail=0;
const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
for (const [name,src] of Object.entries(files)) {
  try { new Function(src); ok(true, `${name} parses`); }
  catch (e) { ok(false, `${name} parses: ${e.message}`); }
}
ok(Object.values(files).every(src => !/MutationObserver/.test(src)), 'presentation follower slice owns no MutationObserver');
ok(/addEventListener\('resize',\s*schedule/.test(files.help) && /addEventListener\('pageshow',\s*schedule/.test(files.help), 'help copy follows viewport/page transitions');
ok(/addEventListener\('keydown',\s*schedule,\s*true\)/.test(files.shop) && /owner:'equipment-shop-ui'/.test(files.shop), 'shop art follows real input transitions');
ok(/addEventListener\('keydown',scheduleDecorate,true\)/.test(files.forge) && /owner:'forge-feedback-v122'/.test(files.forge), 'forge badges follow town/input transitions');
ok(/requestAnimationFrame\(\(\) =>/.test(files.art) && /addEventListener\('load', patchVisualOverlay, \{ once:true \}\)/.test(files.art), 'character overlay uses bounded startup retry only');
ok(!/setInterval\(/.test(files.help+files.shop+files.forge+files.art), 'presentation follower slice owns no permanent interval');
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
