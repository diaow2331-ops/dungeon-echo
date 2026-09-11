'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const strip=code=>code.replace(/^\s*export\s+/gm,'');
const transportCode=strip(read('wildforge/src/transport-contracts.js'));
const {makeTransportOffer}=new Function(`${transportCode}\nreturn {makeTransportOffer};`)();
const settlements=[
  {id:'verdant',biome:'verdant',x:500},
  {id:'ember',biome:'ember',x:800},
  {id:'frost',biome:'frost',x:1400}
];
const cargoByHome={verdant:'greenheart_bale',ember:'emberfuel_crate',frost:'frostglass_case'};
const demandBySettlement={
  ember:{greenheart_bale:0.25},
  frost:{greenheart_bale:0.95}
};
const common={day:0,originX:500,originBiome:'verdant',settlements,cargoByHome,reliabilityBySettlement:{ember:0,frost:0},demandBySettlement};
const first=makeTransportOffer({...common,completedContracts:0});
assert(first,'first transport offer must exist');
assert.equal(first.destinationId,'ember','first route should choose the nearest destination with a real shortage');
assert(first.quantity>=3&&first.quantity<=4,'first route must stay within a 3–4 cargo onboarding load');
assert(first.reward>0,'first route reward must remain meaningful');
const repeat=makeTransportOffer({...common,completedContracts:0});
assert.deepEqual(repeat,first,'first offer must remain deterministic');
const experienced=makeTransportOffer({...common,completedContracts:2});
assert.equal(experienced.destinationId,'frost','later contracts should restore full live-shortage priority');
assert(experienced.quantity>=3&&experienced.quantity<=8,'later contract pressure must retain the normal 3–8 range');
const noDemand=makeTransportOffer({...common,demandBySettlement:null,completedContracts:0});
assert.equal(noDemand.destinationId,'ember','first route should still prefer the nearest valid foreign settlement when no shortage map exists');

const game=read('wildforge/src/game.js'),css=read('wildforge/style.css'),inventoryCss=read('wildforge/inventory-ui.css'),html=read('wildforge/index.html');
assert.equal(read('wildforge/VERSION').trim(),'0.43.1');
assert(html.includes('content="0.43.1"')&&html.includes('style.css?v=0431')&&html.includes('src/game.js?v=0431'),'v0.43 cache/version contract missing');
assert(game.includes("const SAVE_KEY = 'wildforge.save.v0430'")&&game.includes("const LEGACY_SAVE_KEY_0420 = 'wildforge.save.v0420'")&&game.includes("raw.v==='0.42.0'"),'v0.42→v0.43 save migration missing');
assert(game.includes('function saveExists() { try { return !!readSave(); } catch { return false; } }'),'continue button must see migratable legacy saves');
assert(game.includes('completedContracts:game.trade.contractsCompleted||0'),'transport offer must read existing completed-contract state rather than adding another progression authority');
assert(game.includes('where=site?onboardingDirection(site)')&&game.includes('contractDaysLeft(contract,game.trade.day)'),'active contract objective must show direction and deadline');
assert(game.includes("cargoBtn.classList.toggle('relevant'"),'mobile cargo action should emphasize itself only when cargo recovery/set-down is relevant');
assert(css.includes('.mobile-stick{width:82px;height:82px}')&&css.includes('#hotbar{bottom:calc(var(--safe-bottom) + 7px)')&&inventoryCss.includes('width:32px!important;height:32px!important')&&!inventoryCss.includes('145px'),'landscape touch layout must preserve playfield space with compact controls and an edge hotbar');
assert(css.includes('#objective.contract-active')&&css.includes('@keyframes objective-pulse'),'objective progression feedback missing');
assert(!game.includes('phase2State:')&&!game.includes('onboardingV2:'),'Phase 2 must not add a second progression state machine');
console.log(`wildforge_phase2_feel=PASS starter=${first.destinationId}/${first.quantity}/${first.distance}m experienced=${experienced.destinationId}/${experienced.quantity}/${experienced.distance}m mobile-layout save-migration`);
