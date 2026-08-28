'use strict';
const fs = require('fs');
const assert = require('assert');

const audio = fs.readFileSync('game/ui/audio-director.js','utf8');
const bootstrap = fs.readFileSync('runtime-bootstrap.js','utf8');

assert(audio.includes("version:'v3'"), 'audio director v3 ownership missing');
assert(audio.includes('dataset.deLocale'), 'audio director must read fixed route locale identity');
assert(audio.includes("copy('声音设置', 'Sound Settings')"), 'sound settings must be rendered directly in both locales');
assert(audio.includes("copy('背景音乐', 'Music')"), 'Music fixed-locale copy missing');
assert(audio.includes("copy('游戏音效', 'SFX')"), 'SFX fixed-locale copy missing');
assert(audio.includes("copy('总开关：关', 'Master: Off')"), 'master-off fixed-locale copy missing');
assert(audio.includes("copy('总开关：开', 'Master: On')"), 'master-on fixed-locale copy missing');
assert(audio.includes("copy('⚙ 静音', '⚙ Muted')"), 'muted status fixed-locale copy missing');
assert(audio.includes('function startPump()') && audio.includes('function stopPump()'), 'audio scheduler lifecycle ownership missing');
assert(audio.includes('if (!ctx || timer || document.hidden) return false;'), 'audio scheduler must not run while hidden');
assert(audio.includes("window.addEventListener('pagehide', stopPump)"), 'audio scheduler must stop on pagehide');
assert(bootstrap.includes("'game/ui/audio-director.js'"), 'audio director missing from late UX chain');

console.log('audio_i18n_status_v3=PASS');
