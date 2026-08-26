'use strict';
const fs = require('fs');
const assert = require('assert');

const hint = fs.readFileSync('combat-hint-polish.js','utf8');
const mobile = fs.readFileSync('mobile-ux.js','utf8');

assert(mobile.includes('position:sticky;bottom:0'), 'mobile touch deck must remain bottom-sticky in portrait');
assert(hint.includes('@media(max-width:700px) and (orientation:portrait)'), 'portrait onboarding layout missing');
assert(hint.includes('bottom:calc(env(safe-area-inset-bottom) + 190px)'), 'portrait onboarding must clear the bottom touch deck');
assert(hint.includes('@media(max-width:700px) and (orientation:landscape)'), 'landscape onboarding layout missing');
assert(hint.includes('right:316px'), 'landscape onboarding must clear the right-side touch deck');
assert(!hint.includes('@media(max-width:700px){#de-onboarding{position:fixed;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom) + 8px)'), 'legacy tutorial-over-controls rule returned');
assert(hint.includes("const KEY = 'de-onboarding-v2'"), 'persistent onboarding contract changed');

console.log('mobile_onboarding_clearance_v1=PASS');
