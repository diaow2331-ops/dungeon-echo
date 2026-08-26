'use strict';
const fs = require('fs');
const assert = require('assert');

const controls = fs.readFileSync('combat-controls.js','utf8');
const hint = fs.readFileSync('combat-hint-polish.js','utf8');
const audio = fs.readFileSync('audio-director.js','utf8');
const mobile = fs.readFileSync('mobile-ux.js','utf8');
const shop = fs.readFileSync('equipment-shop-ui.js','utf8');
const desktop = fs.readFileSync('desktop-controls.js','utf8');
const manifest = fs.readFileSync('ops/release/static-files.txt','utf8');

assert(controls.includes("lower === 'j'"), 'J attack hotkey missing');
assert(controls.includes("lower === 'k'"), 'K skill hotkey missing');
assert(controls.includes("lower === 'c'"), 'legacy C suppression missing');
assert(controls.includes('attackFacing()'), 'facing attack path missing');
assert(controls.includes('data-act="attack"'), 'touch attack control missing');
assert(controls.includes('api.useSkill = function'), 'skill resource wrapper missing');
assert(controls.includes('manaMax') && controls.includes('manaCost'), 'mana resource missing');
for (const cls of ['warrior','ranger','mage','assassin']) assert(new RegExp(`${cls}:\\s*\\{\\s*max:`).test(controls), `${cls} mana profile missing`);
assert(/warrior:\s*\{ max:60, cost:30, regen:2, attackGain:2, focusGain:3 \}/.test(controls), 'warrior mana contract changed');
assert(/ranger:\s*\{ max:70, cost:32, regen:2, attackGain:3, focusGain:4 \}/.test(controls), 'ranger mana contract changed');
assert(/mage:\s*\{ max:100,cost:42, regen:3, attackGain:1, focusGain:10 \}/.test(controls), 'mage mana contract changed');
assert(/assassin:\s*\{ max:65, cost:34, regen:2, attackGain:3, focusGain:4 \}/.test(controls), 'assassin mana contract changed');

assert(controls.includes("src.includes('art/loot-atlas.png')"), 'ground loot atlas interception missing');
assert(controls.includes('equipment-weapons-v13.png') && controls.includes('equipment-wearables-v13.png'), 'v13 ground replacement missing');
assert(controls.includes('suppressCharacterEquipmentImages'), 'character gear suppression missing');
assert(!desktop.includes('de-gear-overlay'), 'legacy character gear overlay returned');
assert(desktop.includes("edgeButton(pad, 2, 'k')"), 'gamepad skill must follow K contract');
assert(!desktop.includes("edgeButton(pad, 2, 'c')"), 'legacy C gamepad skill returned');

// Progressive onboarding advances from actual game outcomes, not raw key events.
assert(hint.includes("const KEY = 'de-onboarding-v2'"), 'progressive tutorial persistence key missing');
for (const step of ['move','attack','skill','bag','potion','stairs','escape','guardian']) assert(hint.includes(`'${step}'`), `tutorial step missing: ${step}`);
assert(hint.includes('跳过教学'), 'tutorial skip control missing');
assert(hint.includes('重置教学'), 'tutorial reset control missing');
assert(hint.includes('function inferProgress(cur)'), 'outcome-driven tutorial progression missing');
assert(hint.includes('cur.hp<snap.hp'), 'attack tutorial must observe real monster damage');
assert(hint.includes('cur.mana<snap.mana') && hint.includes('cur.cd>snap.cd'), 'skill tutorial must observe real resource/cooldown changes');
assert(hint.includes('cur.depth>snap.depth'), 'stairs tutorial must observe real depth change');
assert(hint.includes('pointer:coarse'), 'mobile-aware tutorial wording missing');

// Free BGM/SFX mixer: 0-100 sliders, persistent 30/85 recommended mix, master mute.
for (const scene of ['title','town','dungeon','deep','guardian','boss']) assert(new RegExp(`${scene}:\\s*\\{`).test(audio), `audio scene missing: ${scene}`);
assert(audio.includes("RECOMMENDED = Object.freeze({ music:30, sfx:85 })"), 'recommended 30/85 mix changed');
assert(audio.includes('type="range" min="0" max="100" step="1"'), 'free 0-100 volume sliders missing');
assert(audio.includes('de-audio-music-vol-v2') && audio.includes('de-audio-sfx-vol-v2'), 'separate volume persistence missing');
assert(audio.includes('__DE_AUDIO_MIXER_V2'), 'global SFX/music mixer bridge missing');
assert(audio.includes("this.__deAudioBus === 'music' ? entry.music : entry.sfx"), 'independent WebAudio bus routing missing');
assert(audio.includes("key === 'm'"), 'M master mute missing');
assert(audio.includes('mobs.some(m => m && Number(m.hp) > 0 && m.boss)'), 'boss music routing missing');
assert(audio.includes('mobs.some(m => m && Number(m.hp) > 0 && m.midBoss)'), 'guardian music routing missing');

// Mobile UX must be a real control layout, not merely scaled desktop CSS.
assert(mobile.includes("grid-template-columns:174px minmax(0,1fr)"), 'portrait thumb-zone layout missing');
assert(mobile.includes('(orientation:landscape)'), 'landscape mobile layout missing');
assert(mobile.includes('setInterval(()=>btn.click(),125)'), 'hold-to-walk missing');
assert(mobile.includes('navigator.vibrate'), 'touch haptic feedback missing');
assert(mobile.includes("const order=['attack','skill','potion','descend','escape','scroll','pause','mute']"), 'mobile action priority missing');
assert(mobile.includes('de-mobile-optional'), 'mobile HUD compression missing');
assert(mobile.includes('左侧方向盘'), 'mobile help copy missing');

assert(shop.includes("loadScript('combat-controls.js'"), 'combat controls production loader missing');
assert(shop.includes("loadScript('combat-hint-polish.js'"), 'tutorial production loader missing');
assert(shop.includes("loadScript('audio-director.js'"), 'audio director production loader missing');
assert(shop.includes("loadScript('mobile-ux.js'"), 'mobile UX production loader missing');
const files = manifest.split(/\r?\n/);
for (const file of ['combat-controls.js','combat-hint-polish.js','audio-director.js','mobile-ux.js']) assert(files.includes(file), `release manifest missing ${file}`);

console.log('combat_controls_v1=PASS');
