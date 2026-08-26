'use strict';
const fs = require('fs');
const assert = require('assert');

const runtime = fs.readFileSync('i18n-runtime.js','utf8');
const audio = fs.readFileSync('audio-director.js','utf8');

assert(audio.includes("btn.textContent = muted ? '⚙ 静音'"), 'source audio status contract unexpectedly changed');
assert(runtime.includes("const director=window.__DE_AUDIO_DIRECTOR,audioBtn=document.getElementById('de-audio-settings-btn')"), 'i18n follower must own visible audio status');
assert(runtime.includes("L.isEnglish?'⚙ Muted':'⚙ 静音'"), 'bilingual muted label missing');
assert(runtime.includes('`⚙ ${director.musicVolume}/${director.sfxVolume}`'), 'audio volume status must remain visible when unmuted');
assert(runtime.includes("new MutationObserver(sync)"), 'dynamic audio status must refresh from DOM mutations');
assert(runtime.includes("de:languagechange"), 'audio status must refresh on language switching');

console.log('audio_i18n_status_v1=PASS');
