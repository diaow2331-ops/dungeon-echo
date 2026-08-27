/* Focused source/parse contract for event-driven fixed-route gameplay tuning. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'gameplay-tuning.js'), 'utf8');
let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; console.log('  PASS ' + name); } else { fail++; console.log('  FAIL ' + name); } };

try { new vm.Script(src, { filename: 'gameplay-tuning.js' }); ok(true, 'gameplay tuning parses'); }
catch (e) { console.error(e); ok(false, 'gameplay tuning parses'); }
ok(!/setInterval\s*\(/.test(src), 'gameplay tuning installs no permanent polling interval');
ok(!src.includes('__DE_PROGRESSION_COMMITMENT'), 'retired duplicate progression owner is removed from gameplay tuning');
ok(src.includes('function scheduleMigration()') && src.includes("addEventListener('pageshow', scheduleMigration)"), 'legacy class-base migration is event-driven');
ok(src.includes('function scheduleSync()') && src.includes("addEventListener('pageshow',scheduleSync)"), 'mechanics integrity synchronization is event-driven');
ok(src.includes("addEventListener('visibilitychange'") && src.includes("addEventListener('focus'"), 'resume/focus transitions resynchronize state without polling');
ok(src.includes('dataset.deLocale')&&!src.includes('DE_I18N')&&!src.includes('URLSearchParams'), 'gameplay visible copy uses fixed route instead of runtime/query locale inference');
ok(src.includes("window.__DE_GAMEPLAY_TUNING = 'prod-v10'")&&src.includes("version:'p0-v2'"), 'gameplay tuning and mechanics integrity expose current fixed-route contracts');
ok(src.includes('guardian still blocks the exit') && src.includes('unconquered floors cannot be skipped'), 'mechanics-owned guardian/route hints render English directly');
ok(src.includes('Draw Momentum')&&src.includes('Death Mark'),'skill follow-up labels render English directly');
ok(src.includes("owner:'gameplay-tuning'")&&src.includes("locale:english?'en':'zh-CN'"), 'mechanics integrity exposes explicit fixed-locale ownership');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);