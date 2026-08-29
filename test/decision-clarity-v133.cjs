'use strict';
const fs = require('fs');
const path = require('path');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const core = read('game/core/game.js');
const rulesSrc = read('game/domain/inventory/equipment-rules-v130.js');
const authority = JSON.parse(read('docs/authority-map-v130.json'));
let pass=0, fail=0;
const ok=(cond,name)=>{if(cond){pass++;console.log('  PASS '+name)}else{fail++;console.log('  FAIL '+name)}};

ok(/const classFitOf = \(item, targetClass=classId\)/.test(core) && /INVENTORY_RULES\.itemClassFitScore/.test(core), 'core uses the canonical item-aware class-fit helper');
ok(/const fit = classFitOf\(it\)/.test(core) && /fit - classFitOf\(cur\)/.test(core), 'dungeon and backpack comparison use class fit');
ok(/const fit = classFitOf\(it, meta\.classId\)/.test(core) && /classFitOf\(equipped, meta\.classId\)/.test(core), 'town comparison uses the same class fit');
ok(core.includes('职业适配 ${fit} · 内在价值 ${value}') && core.includes('Class Fit ${fit} · Item Value ${value}'), 'fit and economic value are labeled separately');
ok(/const sellPrice = it => ECONOMY_RULES\.sellPrice\(itemValueScore\(it\)/.test(core), 'sell price remains intrinsic-value based, not class-fit based');
ok(authority.authorities.equipmentClassFitScoring === 'game/domain/inventory/equipment-rules-v130.js', 'authority map records class-fit scoring owner');
ok(/Class fit is presentation\/decision/.test(rulesSrc) && /must not price, generate, equip or mutate items/.test(rulesSrc), 'inventory rules lock class fit to decision information');

ok(core.includes("const GUIDE_KEY = 'de-guide-v1'") && core.includes("['move', 'combat', 'gear', 'stairs', 'return']"), 'first-run guide has a bounded preference contract');
ok(/function guideOnce\(id, zh, en, cls='good'\)/.test(core) && /guideSeen\.has\(id\)/.test(core), 'guide prompts are event-driven and once-only');
ok(/guideFirstRunStart\(\);/.test(core) && /guideCombatOnce\(\);/.test(core) && /guideGearOnce\(\);/.test(core), 'movement combat and gear guidance attach to canonical events');
ok(/guideOnce\('stairs'/.test(core) && /guideOnce\('return'/.test(core), 'stairs and return guidance attach to their real events');
ok(/const experienced =/.test(core) && /GUIDE_IDS\.forEach\(id => seen\.add\(id\)\)/.test(core), 'existing players are not forced through the new first-run guide');
ok(/J Basic Attack · K Skill/.test(core) && /Shift\+Enter Quick Dive/.test(core), 'canonical English HUD advertises v1.4 attack/skill/quick-dive controls');
ok(!/GUIDE_KEY[\s\S]{0,500}player\.|GUIDE_KEY[\s\S]{0,500}meta\./.test(core), 'guide preference does not mutate gameplay state');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
