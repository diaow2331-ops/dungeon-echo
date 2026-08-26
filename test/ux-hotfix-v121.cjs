'use strict';
const fs = require('fs');
const assert = require('assert');

const locale = fs.readFileSync('locale-runtime-v122.js','utf8');
const runtime = fs.readFileSync('runtime-bootstrap.js','utf8');
const manifest = fs.readFileSync('ops/release/static-files.txt','utf8').split(/\r?\n/).filter(Boolean);

// v1.2.1's layered hotfix is intentionally retired from production in v1.2.2.
assert(!runtime.includes("'ux-hotfix-v121.js'"), 'retired v1.2.1 hotfix must not load');
assert(!runtime.includes("'i18n-runtime.js'"), 'retired polling runtime must not load');
assert(!runtime.includes("'i18n-content.js'"), 'retired live content translator must not load');
assert(!manifest.includes('ux-hotfix-v121.js'), 'retired hotfix must not ship');
assert(!manifest.includes('i18n-runtime.js'), 'retired polling runtime must not ship');
assert(!manifest.includes('i18n-content.js'), 'retired content translator must not ship');

assert(locale.includes("box.id = 'de-title-language'"), 'title-screen language picker missing');
assert(locale.includes("location.replace(target.href)"), 'language choice must reload the page');
assert(locale.includes("window.DE_I18N ="), 'stable locale API missing');
assert(!locale.includes('setInterval('), 'stable locale must not poll');
assert(locale.includes('You hit $1 for $2 damage.'), 'mixed outgoing combat repair missing');
assert(locale.includes('$1 hits you for $2 damage.'), 'mixed incoming combat repair missing');
assert(locale.includes('Picked up $1 Gold'), 'mixed Gold pickup repair missing');
assert(manifest.includes('locale-runtime-v122.js'), 'stable locale runtime missing from release');

console.log('ux_hotfix_retired_v122=PASS');
