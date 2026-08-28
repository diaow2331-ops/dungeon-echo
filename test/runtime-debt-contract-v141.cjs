'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

const retiredPollOwners=[
  'combat-controls.js','equipment-system.js','progression-system.js','forge-system.js',
  'gameplay-tuning.js','town-system.js','world-loot-polish-v122.js','visual-polish.js','content-system.js',
];
for(const file of retiredPollOwners){
  const src=read(file);
  assert(!/\bsetInterval\s*\(/.test(src),`${file} must not regain a state-polling interval`);
}

const combat=read('combat-controls.js');
assert(/action-driven; no permanent DOM requestAnimationFrame follower/.test(combat),'combat HUD/resource sync stays action-driven');
assert(/document\.addEventListener\('keydown', scheduleSync, true\)/.test(combat),'combat sync follows real actions');
assert(!/function\s+loop\s*\([^)]*\)\s*\{[\s\S]*requestAnimationFrame\(loop\)/.test(combat),'combat controls must not regain the old permanent RAF follower');

const loot=read('world-loot-polish-v122.js');
assert(/api\.state!==['"]playing['"]/.test(loot)&&/function\s+start\s*\(/.test(loot)&&/function\s+stop\s*\(/.test(loot),'world-loot animation is active-state gated');
const visual=read('visual-polish.js');
assert(/function\s+start\s*\(/.test(visual)&&/function\s+stop\s*\(/.test(visual)&&/get running\(\)/.test(visual),'visual-polish exposes lifecycle-owned animation state');
const guardian=read('content-system.js');
assert(/startWarningLoop/.test(guardian)&&/stopWarningLoop/.test(guardian)&&/warningVisible/.test(guardian),'guardian telegraph animation is warning-lifecycle owned');
assert(!/\n\s*requestAnimationFrame\(frame\);\s*\n\}\)\(\);\s*$/.test(guardian),'guardian system must not boot an unconditional permanent RAF');

const gamepad=read('desktop-controls.js');
assert(/desktop gamepad adapter v3/.test(gamepad),'gamepad adapter must use connected-pad lifecycle ownership');
assert(/function\s+startLoop\s*\(/.test(gamepad)&&/function\s+stopLoop\s*\(/.test(gamepad),'gamepad adapter must expose start/stop RAF lifecycle');
assert(/const pad = pickPad\(\);\n\s*if \(!pad\) return false;/.test(gamepad),'gamepad RAF must not start without a connected pad');
assert(/gamepaddisconnected[\s\S]*stopLoop\(\)/.test(gamepad),'gamepad disconnection must stop sampling');

const audio=read('audio-director.js');
assert(/setInterval\(pump,\s*70\)/.test(audio)&&/clearInterval\(timer\)/.test(audio),'audio keeps only its lifecycle-scoped WebAudio look-ahead timer');
assert(/document\.hidden/.test(audio)&&/pagehide/.test(audio),'audio timer stops with page lifecycle');
const mobile=read('mobile-ux.js');
assert(/setInterval\(\(\)=>btn\.click\(\),110\)/.test(mobile)&&/clearInterval\(interval\)/.test(mobile),'mobile repeat timer exists only for pointer-hold movement and is cleared');

const runtime=read('runtime-bootstrap.js');
assert(/const englishBridge = english \? \[/.test(runtime),'legacy locale bridge remains explicitly English-only while core source migration is unfinished');
assert(/locale-runtime-v122\.js/.test(runtime)&&/locale-completeness-v128\.js/.test(runtime),'transitional English locale debt remains visible instead of being hidden by another patch layer');
const localeOwner=read('locale-event-owner-v130.js');
assert(/version:'v143'/.test(localeOwner),'transitional locale owner is the narrowed v143 contract');
assert(!/translateTree\(document\.body\)/.test(localeOwner),'English locale sync must not traverse the whole document body');
assert(/const legacyRoots = Object\.freeze\(\[/.test(localeOwner),'remaining Chinese-first screens are an explicit shrinking allowlist');
for(const migrated of ['#stats','#equipbar','#stage','#touch','#log','#bag','#bagdetail','#tooltip','#hint','#help','#talent-screen','#shrine-screen','#echo-screen'])
  assert(!localeOwner.includes(`'${migrated}'`),`${migrated} must not re-enter the transitional bridge`);

console.log(`runtime_debt_contract_v141=PASS (${retiredPollOwners.length} retired poll owners guarded + connected-pad RAF gating + narrowed locale bridge)`);