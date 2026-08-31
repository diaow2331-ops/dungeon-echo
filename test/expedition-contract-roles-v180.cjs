'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const expedition=require(path.join(root,'game/domain/expedition/expedition-rules-v170.js'));
const sets=require(path.join(root,'game/domain/inventory/set-rules-v180.js'));
const core=fs.readFileSync(path.join(root,'game/core/game.js'),'utf8');
const authority=JSON.parse(fs.readFileSync(path.join(root,'docs/authority-map-v130.json'),'utf8'));

const baseElite=.16, baseChest=.62;
assert.equal(expedition.eliteChance(baseElite,'hunt'),.24,'Elite Hunt owns the elite-density premium');
assert.equal(expedition.eliteBounty(80,'hunt'),88,'Elite Hunt owns an explicit Gold bounty');
assert.equal(expedition.namedRelicChanceBonus('hunt'),0,'Elite Hunt must not also own named-relic discovery');
assert.equal(expedition.chestChance(baseChest,'hunt'),baseChest,'Elite Hunt must not also own chest density');
assert.equal(expedition.monsterXpMultiplier('hunt'),1,'Elite Hunt must not also own the XP multiplier');

assert.equal(expedition.namedRelicChanceBonus('relic'),.16,'Relic Sweep owns the named-relic discovery premium');
assert.equal(Number((expedition.chestChance(baseChest,'relic')-baseChest).toFixed(2)),.18,'Relic Sweep owns extra chest density');
assert.equal(expedition.eventChance('relic'),.34,'Relic Sweep owns extra echo-event density');
assert.equal(expedition.trapBonus('relic'),1,'Relic Sweep pays for its collection advantage with one extra trap');
assert.equal(expedition.eliteChance(baseElite,'relic'),baseElite,'Relic Sweep must not also own elite density');
assert.equal(expedition.monsterXpMultiplier('relic'),1,'Relic Sweep must not also own the XP multiplier');
assert.equal(expedition.eliteBounty(80,'relic'),0,'Relic Sweep must not also own Elite Hunt Gold');

assert.equal(expedition.monsterAtkMultiplier('oath'),1.12,'Veteran Oath owns the combat-risk multiplier');
assert.equal(expedition.monsterXpMultiplier('oath'),1.18,'Veteran Oath owns the XP premium');
assert.equal(expedition.namedRelicChanceBonus('oath'),0,'Veteran Oath must not also own named-relic discovery');
assert.equal(expedition.eliteChance(baseElite,'oath'),baseElite,'Veteran Oath must not also own elite density');
assert.equal(expedition.chestChance(baseChest,'oath'),baseChest,'Veteran Oath must not also own chest density');

assert.equal(Number(sets.namedChance(3,.06,expedition.namedRelicChanceBonus('relic')).toFixed(2)),.44,
  'Relic Hall and Relic Sweep must compose into a strong but bounded Epic named chance');
assert.equal(Number(sets.namedChance(4,.06,expedition.namedRelicChanceBonus('relic')).toFixed(2)),.80,
  'Relic Hall and Relic Sweep must compose into a strong but non-guaranteed Legendary named chance');
assert.equal(Number(sets.namedChance(4,.09,expedition.namedRelicChanceBonus('relic')).toFixed(2)),.83,
  'maximum current collection investment must retain at least a 17% Legendary miss chance');

assert(core.includes('EXPEDITION_RULES.namedRelicChanceBonus(currentExpeditionContractId())'),
  'core must explicitly compose expedition role policy into named-set generation');
assert(core.includes('EXPEDITION_RULES.eliteBounty(depth, currentExpeditionContractId())'),
  'core must consume Elite Hunt Gold through expedition authority');
assert(core.includes('EXPEDITION_RULES.monsterXpMultiplier(contractId)'),
  'core must consume Veteran Oath XP through expedition authority');
assert.equal(authority.authorities.expeditionContractRolePolicy,'game/domain/expedition/expedition-rules-v170.js',
  'authority map must keep contract role modifiers under the expedition policy owner');

console.log('expedition_contract_roles_v180=PASS');
