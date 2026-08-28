'use strict';
const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

const controls = fs.readFileSync('combat-controls.js','utf8');
const game = fs.readFileSync('game.js','utf8');
const hint = fs.readFileSync('game/ui/combat-hint-polish.js','utf8');
const audio = fs.readFileSync('game/ui/audio-director.js','utf8');
const mobile = fs.readFileSync('game/ui/mobile-ux.js','utf8');
const shop = fs.readFileSync('equipment-shop-ui.js','utf8');
const bootstrap = fs.readFileSync('runtime-bootstrap.js','utf8');
const desktop = fs.readFileSync('desktop-controls.js','utf8');
const html = fs.readFileSync('index.html','utf8');
const manifest = fs.readFileSync('ops/release/static-files.txt','utf8');

assert(controls.includes("lower === 'j'"), 'J attack hotkey missing');
assert(controls.includes("lower === 'k'"), 'K skill hotkey missing');
assert(controls.includes("lower === 'c'"), 'legacy C suppression missing');
assert(controls.includes('attackFacing()'), 'facing attack path missing');
assert(controls.includes('data-act="attack"'), 'touch attack control missing');
assert(controls.includes('api.useSkill = function'), 'skill resource wrapper missing');
assert(controls.includes('manaMax') && controls.includes('manaCost'), 'mana resource missing');
assert(controls.includes('dataset.deLocale') && controls.includes("version:'v2'"), 'combat controls fixed-route v2 locale owner missing');
assert(!controls.includes('DE_I18N'), 'combat controls must not depend on runtime translator');
assert(controls.includes("'Face an enemy and press J to attack'") && controls.includes("'The skill hotkey is now K'"), 'English combat feedback must be source-owned');
for (const cls of ['warrior','ranger','mage','assassin']) assert(new RegExp(`${cls}:\\s*\\{\\s*max:`).test(controls), `${cls} mana profile missing`);
assert(/warrior:\s*\{ max:60, cost:30, regen:2, attackGain:2, focusGain:3 \}/.test(controls), 'warrior mana contract changed');
assert(/ranger:\s*\{ max:70, cost:32, regen:2, attackGain:3, focusGain:4 \}/.test(controls), 'ranger mana contract changed');
assert(/mage:\s*\{ max:100,cost:42, regen:3, attackGain:1, focusGain:10 \}/.test(controls), 'mage mana contract changed');
assert(/assassin:\s*\{ max:65, cost:34, regen:2, attackGain:3, focusGain:4 \}/.test(controls), 'assassin mana contract changed');

assert(controls.includes("const persistResourceState = () =>"), 'mana persistence helper missing');
assert(controls.includes("typeof api.persistRun === 'function'"), 'mana persistence must reuse core run save API');
assert(/function ensureMana[\s\S]*?persistResourceState\(\);[\s\S]*?return p;/.test(controls), 'mana initialization/clamp must persist its normalized value');
assert(/function gainMana[\s\S]*?if \(gain > 0\)[\s\S]*?persistResourceState\(\);[\s\S]*?return gain;/.test(controls), 'mana regeneration/attack gain must persist after mutation');
assert(/p\.mana = clamp\(p\.mana - cost, 0, p\.manaMax\);\s*persistResourceState\(\);/.test(controls), 'skill mana cost must persist after deduction');
assert(game.includes('player: JSON.parse(JSON.stringify(player))'), 'run save must serialize the complete player resource state');
assert(game.includes('player = raw.player;'), 'run restore must recover persisted player mana state');
assert(/persistRun,\s*peekRun,\s*restoreRun/.test(game), 'core run-save API must remain exposed to resource owners');

assert(controls.includes("/loot-atlas(?:-v12)?\\.(?:png|svg)"), 'production loot-atlas v12 interception missing');
assert(controls.includes('function groundItemAtDraw(args, canvas)'), 'ground item coordinate recovery missing');
assert(controls.includes("it.type === 'equip'"), 'ground replacement must be equip-only');
assert(controls.includes("tierArt.sourceForItem(ground.item)"), 'tier-specific ground equipment source missing');
assert(controls.includes('equipment-weapons-v13.png') && controls.includes('equipment-wearables-v13.png'), 'v13 ground replacement missing');

assert(controls.includes('heroJustDrawn'), 'hero draw-window marker missing');
assert(controls.includes('suppressLegacyGear'), 'legacy core gear geometry suppression missing');
assert(controls.includes('ctx.stroke = function') && controls.includes('ctx.fillRect = function') && controls.includes('ctx.fill = function'), 'legacy hero geometry paint guards missing');
assert(controls.includes('suppressCharacterEquipmentImages'), 'v13 character gear suppression missing');
assert(!desktop.includes('de-gear-overlay'), 'legacy desktop character gear overlay returned');
assert(desktop.includes("edgeButton(pad, 2, 'k')"), 'gamepad skill must follow K contract');
assert(desktop.includes("edgeButton(pad, 7, 'j')"), 'gamepad RT attack must follow J contract');
assert(desktop.includes('dataset.deLocale') && !desktop.includes('URLSearchParams') && !desktop.includes("localStorage.getItem('de-language-v1')"),
  'gamepad locale must come from the fixed route instead of query/storage inference');
assert(desktop.includes('Gamepad connected') && desktop.includes('RT Attack') && desktop.includes('Return command'),
  'gamepad status and return feedback must honor English sessions');
assert(!desktop.includes("edgeButton(pad, 2, 'c')"), 'legacy C gamepad skill returned');

assert(hint.includes("const KEY = 'de-onboarding-v2'"), 'progressive tutorial persistence key missing');
for (const step of ['move','attack','skill','bag','potion','stairs','escape','guardian']) assert(hint.includes(`'${step}'`), `tutorial step missing: ${step}`);
assert(hint.includes('跳过教学'), 'tutorial skip control missing');
assert(hint.includes('重置教学'), 'tutorial reset control missing');
assert(hint.includes('function inferProgress(cur)'), 'outcome-driven tutorial progression missing');
assert(hint.includes('cur.hp<snap.hp'), 'attack tutorial must observe real monster damage');
assert(hint.includes('cur.mana<snap.mana') && hint.includes('cur.cd>snap.cd'), 'skill tutorial must observe real resource/cooldown changes');
assert(hint.includes('cur.depth>snap.depth'), 'stairs tutorial must observe real depth change');
assert(hint.includes('pointer:coarse'), 'mobile-aware tutorial wording missing');

for (const scene of ['title','town','dungeon','deep','guardian','boss']) assert(new RegExp(`${scene}:\\s*\\{`).test(audio), `audio scene missing: ${scene}`);
assert(audio.includes("RECOMMENDED = Object.freeze({ music:30, sfx:85 })"), 'recommended 30/85 mix changed');
assert(audio.includes('type="range" min="0" max="100" step="1"'), 'free 0-100 volume sliders missing');
assert(audio.includes('de-audio-music-vol-v2') && audio.includes('de-audio-sfx-vol-v2'), 'separate volume persistence missing');
assert(audio.includes('__DE_AUDIO_MIXER_V2'), 'global SFX/music mixer bridge missing');
assert(audio.includes("this.__deAudioBus === 'music' ? entry.music : entry.sfx"), 'independent WebAudio bus routing missing');
assert(audio.includes("key === 'm'"), 'M master mute missing');
assert(audio.includes('mobs.some(m => m && Number(m.hp) > 0 && m.boss)'), 'boss music routing missing');
assert(audio.includes('mobs.some(m => m && Number(m.hp) > 0 && m.midBoss)'), 'guardian music routing missing');

assert(mobile.includes("grid-template-columns:174px minmax(0,1fr)"), 'portrait thumb-zone layout missing');
assert(mobile.includes('(orientation:landscape)'), 'landscape mobile layout missing');
assert(mobile.includes('timeout=setTimeout(()=>{btn.click();interval=setInterval(()=>btn.click(),110)},190)'), 'hold-to-walk cadence missing');
assert(mobile.includes("addEventListener('pointerup',clear") && mobile.includes("addEventListener('pointercancel',clear") &&
  mobile.includes("addEventListener('lostpointercapture',clear"), 'hold-to-walk release/cancel cleanup missing');
assert(mobile.includes('navigator.vibrate'), 'touch haptic feedback missing');
assert(mobile.includes("const order=['attack','skill','potion','descend','escape','scroll','pause','mute']"), 'mobile action priority missing');
assert(mobile.includes('de-mobile-optional'), 'mobile HUD compression missing');
assert(mobile.includes('左侧四向方向盘'), 'mobile help copy missing');
assert(mobile.includes("window.addEventListener('resize'") && mobile.includes("window.addEventListener('orientationchange'") &&
  mobile.includes("document.addEventListener('fullscreenchange',queueApply)"), 'viewport-driven touch-control resync missing');

const productionScripts = [...html.matchAll(/<script\s+src="([^"]+)"[^>]*><\/script>/g)]
  .map(match => match[1].split('?')[0]);
const desktopPos = productionScripts.indexOf('desktop-controls.js');
const controlsPos = productionScripts.indexOf('combat-controls.js');
const challengePos = productionScripts.indexOf('challenge-pressure.js');
assert(desktopPos >= 0 && controlsPos > desktopPos && challengePos > controlsPos, 'combat controls must be synchronous before final challenge pressure');
assert(!bootstrap.includes("'combat-controls.js'"), 'late UX bootstrap must not own core combat controls');
assert(bootstrap.includes("'game/ui/combat-hint-polish.js'") && bootstrap.includes("'game/ui/audio-director.js'") && bootstrap.includes("'game/ui/mobile-ux.js'"), 'late UX follower chain incomplete');
assert(!shop.includes('loadProductionUx') && !shop.includes("loadScript('combat-controls.js'"), 'shop preview regained production UX ownership');
const files = manifest.split(/\r?\n/);
for (const file of ['combat-controls.js','game/ui/combat-hint-polish.js','game/ui/audio-director.js','game/ui/mobile-ux.js']) assert(files.includes(file), `release manifest missing ${file}`);

{
  const emitted = [];
  const appended = [];
  let frame = null;
  const buttons = Array.from({length:10}, () => ({pressed:false,value:0}));
  const pad = {index:0,connected:true,id:'Boundary Pad',buttons,axes:[0,0]};
  const classList = () => ({add(){},remove(){},contains(){return false;}});
  const makeEl = () => ({
    id:'',style:{},dataset:{},hidden:false,textContent:'',innerHTML:'',classList:classList(),
    setAttribute(){},appendChild(){},focus(){},click(){},querySelectorAll(){return[];},
  });
  const sandbox = {
    console,
    navigator:{language:'en-US',getGamepads:()=>[pad]},
    KeyboardEvent:class { constructor(type,init){this.type=type;Object.assign(this,init)} },
    requestAnimationFrame(fn){frame=fn;return 1},
    cancelAnimationFrame(){},
    window:{addEventListener(){}},
    document:{
      documentElement:{dataset:{deLocale:'en'}},
      hidden:false,activeElement:null,head:{appendChild(){}},body:{appendChild(el){appended.push(el)}},
      getElementById(){return null},createElement(){return makeEl()},addEventListener(){},
      dispatchEvent(event){emitted.push(event.key);return true},
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(desktop, sandbox, {filename:'desktop-controls.js'});
  assert.equal(typeof frame, 'function', 'gamepad frame loop must boot');
  buttons[7].pressed=true;buttons[7].value=1;frame(20);frame(40);
  assert.deepEqual(emitted, ['j'], 'held RT must emit exactly one J attack edge');
  assert(appended.some(el => el.id === 'gamepad-badge' && el.innerHTML.includes('Gamepad connected') && el.innerHTML.includes('RT Attack')),
    'already-connected gamepad must render English controls from fixed route identity');
  buttons[7].pressed=false;buttons[7].value=0;frame(60);
  buttons[7].pressed=true;buttons[7].value=1;frame(80);
  assert.deepEqual(emitted, ['j','j'], 'RT release/re-press must emit the next attack');
}

console.log('combat_controls_v2=PASS');
