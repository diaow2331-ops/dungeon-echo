'use strict';
const fs = require('fs');
const assert = require('assert');

const locale = fs.readFileSync('locale-runtime-v122.js','utf8');
const audio = fs.readFileSync('audio-director.js','utf8');
const bootstrap = fs.readFileSync('runtime-bootstrap.js','utf8');

assert(audio.includes("btn.textContent = muted ? '⚙ 静音'"), 'source audio status contract unexpectedly changed');
assert(locale.includes("'声音设置':'Sound Settings'"), 'sound settings localization missing');
assert(locale.includes("'背景音乐':'Music'"), 'Music localization missing');
assert(locale.includes("'游戏音效':'SFX'"), 'SFX localization missing');
assert(locale.includes("'总开关：开':'Master: On'"), 'master-on localization missing');
assert(locale.includes("'总开关：关':'Master: Off'"), 'master-off localization missing');
assert(!locale.includes('setInterval('), 'audio localization must not depend on locale polling');
assert(bootstrap.includes("'audio-director.js'"), 'audio director missing from late UX chain');
assert(bootstrap.indexOf("'locale-runtime-v122.js'") < bootstrap.indexOf("'audio-director.js'"), 'locale must exist before audio UI is created');

console.log('audio_i18n_status_v122=PASS');
