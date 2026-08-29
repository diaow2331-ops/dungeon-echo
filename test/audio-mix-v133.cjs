'use strict';
const fs = require('fs');
const path = require('path');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const core = read('game/core/game.js');
const bgm = read('game/ui/adaptive-bgm-v132.js');
const bootstrap = read('game/core/production-bootstrap.js');
const zh = read('index.html');
const en = read('en/index.html');
const style = read('style.css');
let pass=0, fail=0;
const ok=(cond,name)=>{if(cond){pass++;console.log('  PASS '+name)}else{fail++;console.log('  FAIL '+name)}};

ok(/AUDIO_DEFAULTS = Object\.freeze\(\{ music:0\.60, sfx:0\.78, muted:false \}\)/.test(core), 'recommended mix starts at Music 60 / SFX 78');
ok(/const AUDIO_PREF_KEY = 'de-audio-v1'/.test(core), 'audio preference has an independent stable key');
ok(/window\.DE_AUDIO_PREFS_V133 = Object\.freeze/.test(core), 'core exposes a read-only preference snapshot for the music follower');
ok(/new CustomEvent\('de-audio-settings'/.test(core), 'core broadcasts bounded audio-preference changes');
ok(/createDynamicsCompressor\(\)/.test(core) && /sfxMaster\.connect\(sfxCompressor\)/.test(core), 'SFX use a private compressed master bus');
ok(/function toneLayer\(/.test(core) && /function noiseLayer\(/.test(core), 'SFX use layered tonal and transient voices');
ok(!/function beep\(/.test(core), 'legacy one-oscillator beep engine is removed');
for (const recipe of ['hit','crit','hurt','pickup','potion','levelup','stairs','die','win','equip','skill','shop','chest'])
  ok(new RegExp(`\\b${recipe}\\(\\) \\{`).test(core), `layered SFX recipe exists: ${recipe}`);
ok(/toggleAudioMuted\(true\)/.test(core), 'M/touch mute use the canonical master preference');
ok(/audio-settings-screen/.test(core) && /audio-music/.test(core) && /audio-sfx/.test(core), 'core owns settings UI behavior');
ok(/PERSISTENT_PREF_KEYS = new Set\(\['de-guide-v1', 'de-audio-v1', 'de-expedition-record-v1'\]\)/.test(bootstrap), 'fresh adventure preserves onboarding, audio and the cross-run record');
ok(/#audio-settings-screen/.test(style) && /\.audio-mix-row/.test(style), 'audio settings use the canonical modal/layout surface');
for (const [name,html] of [['zh',zh],['en',en]]) {
  ok(html.includes('id="audio-settings-screen"'), `${name} route ships audio settings screen`);
  ok(html.includes('id="audio-music"') && html.includes('id="audio-sfx"'), `${name} route ships independent Music/SFX sliders`);
  ok(html.includes('data-open-audio'), `${name} route exposes audio settings outside gameplay`);
}
ok(/const DEFAULT_VOLUME = 0\.60/.test(bgm), 'BGM fallback default is audibly raised to 60%');
ok(/DE_AUDIO_PREFS_V133/.test(bgm), 'BGM initializes from canonical audio preferences');
ok(/addEventListener\('de-audio-settings'/.test(bgm), 'BGM follows audio preference events');
ok(!/toLowerCase\(\) === 'm'/.test(bgm), 'BGM no longer double-toggles the M key');
ok(!/localStorage/.test(bgm), 'BGM still owns no preference persistence');
ok(!/AudioNode\.prototype|prototype\.connect|__DE_AUDIO_MIXER/.test(bgm), 'retired destination interception remains absent');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
