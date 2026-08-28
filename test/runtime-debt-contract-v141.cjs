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
assert(/desktop gamepad adapter v4/.test(gamepad),'gamepad adapter must use connected-pad lifecycle and semantic Return ownership');
assert(/function\s+startLoop\s*\(/.test(gamepad)&&/function\s+stopLoop\s*\(/.test(gamepad),'gamepad adapter must expose start/stop RAF lifecycle');
assert(/const pad = pickPad\(\);\n\s*if \(!pad\) return false;/.test(gamepad),'gamepad RAF must not start without a connected pad');
assert(/gamepaddisconnected[\s\S]*stopLoop\(\)/.test(gamepad),'gamepad disconnection must stop sampling');
assert(/function\s+triggerReturn\s*\(\)/.test(gamepad)&&/commerce\.extractionReady\(\) \? commerce\.completeExtraction\(\) : commerce\.beginExtraction\(\)/.test(gamepad),'gamepad Return delegates to the commerce extraction state machine');

const shopArt=read('equipment-shop-ui.js');
assert(/version:'v3'/.test(shopArt),'shop art preview uses scoped event-driven v3');
assert(!/MutationObserver|requestAnimationFrame|setInterval/.test(shopArt),'shop art preview owns no observer, frame follower or polling loop');
assert(/function\s+scheduleFromKey\s*\(/.test(shopArt)&&/MOVEMENT_KEYS/.test(shopArt),'shop art key work is limited to shop or merchant-entering movement');
assert(/queueMicrotask/.test(shopArt)&&/defer\(sync\)/.test(shopArt),'shop art sync runs after the core transition without allocating a frame callback');

const forgeFeedback=read('forge-feedback-v122.js');
assert(/version:'v4'/.test(forgeFeedback),'forge feedback uses scoped event-driven v4');
assert(!/requestAnimationFrame|MutationObserver|setInterval/.test(forgeFeedback),'forge feedback owns no frame follower, observer or polling loop');
assert(/window\.addEventListener\('keydown',scheduleFromKey,true\)/.test(forgeFeedback)&&/TOWN_TRANSITION_KEYS/.test(forgeFeedback),'forge feedback sees town transitions without running for unrelated keys');
assert(/queueMicrotask/.test(forgeFeedback)&&/defer\(decorateRows\)/.test(forgeFeedback),'forge decoration is post-event microtask driven');

const onboarding=read('combat-hint-polish.js');
assert(/version:'v5'/.test(onboarding),'onboarding uses completion-aware v5');
assert(/const complete=\(\)=>ALL\.every\(done\)/.test(onboarding),'onboarding exposes an explicit completion state');
assert(/function\s+scheduleInspect\s*\(\)[\s\S]*complete\(\)\|\|inspectQueued/.test(onboarding),'completed tutorial must not schedule post-input inspections');
assert(/#de-audio-settings-btn/.test(onboarding)&&/defer\(attachReset\)/.test(onboarding),'tutorial reset stays discoverable after inspections stop');

const npcStability=read('npc-stability-system.js');
assert(/version:'p0-v5'/.test(npcStability),'NPC stability uses targeted-action v5');
assert(/function\s+relocationNeeded\s*\(force=false\)/.test(npcStability),'NPC relocation has an explicit floor/NPC-set invalidation gate');
assert(/list !== lastNpcList/.test(npcStability)&&/Number\(api\.depth\) !== lastDepth/.test(npcStability)&&/count !== lastCount/.test(npcStability),'NPC relocation invalidates only for floor/NPC-set changes');
assert(/relocationNeeded\(force\) \? relocateChokepoints\(\) : 0/.test(npcStability),'map-wide relocation is skipped on steady-state inputs');
assert(/const ACTION_KEYS = new Set/.test(npcStability)&&/const ACTION_TARGETS = \[/.test(npcStability),'NPC cleanup scheduling has explicit action allowlists');
assert(/function\s+scheduleFromKey\s*\(/.test(npcStability)&&/ACTION_KEYS\.has/.test(npcStability),'NPC key scheduling ignores unrelated keys');
assert(/function\s+scheduleFromClick\s*\(/.test(npcStability)&&/closest\(ACTION_TARGETS\)/.test(npcStability),'NPC click scheduling ignores unrelated controls');

const audio=read('audio-director.js');
assert(/setInterval\(pump,\s*70\)/.test(audio)&&/clearInterval\(timer\)/.test(audio),'audio keeps only its lifecycle-scoped WebAudio look-ahead timer');
assert(/document\.hidden/.test(audio)&&/pagehide/.test(audio),'audio timer stops with page lifecycle');
const mobile=read('mobile-ux.js');
assert(/setInterval\(\(\)=>btn\.click\(\),110\)/.test(mobile)&&/clearInterval\(interval\)/.test(mobile),'mobile repeat timer exists only for pointer-hold movement and is cleared');

const runtime=read('runtime-bootstrap.js');
const manifest=read('ops/release/static-files.txt');
for(const retired of ['locale-event-owner-v130.js','locale-runtime-v122.js','locale-completeness-v128.js']){
  assert(!runtime.includes(retired),`${retired} must stay out of the production runtime graph`);
  assert(!manifest.split(/\r?\n/).includes(retired),`${retired} must stay out of the release manifest`);
}
assert(/const chain = Object\.freeze\(\[\.\.\.baseChain, \.\.\.followerChain\]\)/.test(runtime),'both locales share one bridge-free runtime chain');
assert(/assetVersion = '153'/.test(runtime)&&/version:'v13'/.test(runtime),'final runtime graph is cache generation 153 / bootstrap v13');

const screenOwner=read('core-screen-owner-v153.js');
assert(/version:'v153'/.test(screenOwner)&&/owner:'core-screen-owner-v153'/.test(screenOwner),'final core screen owner is explicit');
assert(!/MutationObserver|translateTree|setInterval|requestAnimationFrame/.test(screenOwner),'core screen owner uses exact event-driven sinks without translation scans or permanent loops');
assert(/renderTitle/.test(screenOwner)&&/renderClassSelect/.test(screenOwner)&&/renderPause/.test(screenOwner)&&/renderOverlay/.test(screenOwner)&&/renderDungeonShop/.test(screenOwner)&&/renderTown/.test(screenOwner),'all six former legacy locale roots have exact render owners');
assert(/ACTION_KEYS/.test(screenOwner)&&/ACTION_TARGETS/.test(screenOwner),'core screen synchronization is narrowed to explicit actions');
assert(/api\.useEscape = wrapped/.test(screenOwner),'semantic gamepad Return gets the same post-transition fixed-route repaint');

const canvasOwner=read('town-canvas-locale-v153.js');
assert(/owner:'town-canvas-locale-v153'/.test(canvasOwner),'town canvas has an explicit fixed-route sink owner');
assert(!/MutationObserver|setInterval|requestAnimationFrame/.test(canvasOwner),'town canvas sink adds no observer, polling or animation follower');
assert(/ctx\.canvas && ctx\.canvas\.id/.test(canvasOwner)&&/id==='town-scene'/.test(canvasOwner)&&/id==='wheel-canvas'/.test(canvasOwner),'canvas localization is scoped to the two town canvases only');
assert(/data\.itemName/.test(canvasOwner)&&/shortLegacy/.test(canvasOwner),'wheel equipment labels localize from data without mutating saved names');

const record=read('expedition-record-v126.js');
assert(/Fixed-route locale owns every visible label/.test(record)&&/\['btn-achv','btn-achv-town'\]/.test(record),'expedition record owns its fixed-route rerender');

console.log(`runtime_debt_contract_v141=PASS (${retiredPollOwners.length} retired poll owners guarded + connected-pad RAF gating + semantic gamepad Return + scoped shop/forge feedback + completion-aware onboarding + targeted NPC cleanup + bridge-free fixed core screen/canvas ownership)`);
