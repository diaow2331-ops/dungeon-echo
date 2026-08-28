'use strict';
const fs = require('fs');
const assert = require('assert');

const audio = fs.readFileSync('game/ui/audio-director.js','utf8');

assert(audio.includes('function resumeContext()'), 'audio resume helper missing');
assert(audio.includes("ctx.state === 'running' || ctx.state === 'closed'"), 'resume helper must ignore only healthy/closed contexts');
assert(audio.includes("typeof ctx.resume !== 'function'"), 'resume helper must tolerate browser context variants');
assert(audio.includes("document.addEventListener('pointerdown', unlock, true)"), 'pointer gesture audio resume missing');
assert(audio.includes("document.addEventListener('touchstart', unlock, true)"), 'touch gesture audio resume missing');
assert(!audio.includes("removeEventListener('pointerdown', unlock"), 'pointer resume listener must remain available after first unlock');
assert(!audio.includes("removeEventListener('touchstart', unlock"), 'touch resume listener must remain available after first unlock');
assert(audio.includes("document.addEventListener('visibilitychange'"), 'foreground audio resume hook missing');
assert(audio.includes("target.closest('[data-act=\"mute\"]')"), 'mobile mute button must route through audio director');
assert(/target\.closest\('\[data-act="mute"\]'\)[\s\S]*?stopImmediatePropagation\(\)[\s\S]*?setMuted\(!muted\)/.test(audio), 'mobile mute must suppress the legacy core handler and use master mute');
assert(/key === 'm'[\s\S]*?stopImmediatePropagation\(\)[\s\S]*?setMuted\(!muted\)/.test(audio), 'keyboard M must continue using the same master mute');

console.log('audio_resume_mobile_v1=PASS');