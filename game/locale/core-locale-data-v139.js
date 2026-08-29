/* Dungeon Echo fixed-route core data owner v1.3.9.
 * Localizes canonical core data objects once, before they are rendered by later player actions.
 * No DOM translation, observer, polling, save-key changes or language switching occurs here.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_CORE_LOCALE_DATA_V139) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100') return;
  const english = String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase() === 'en';

  const CLASS_EN = Object.freeze({
    warrior:{name:'Warrior',blurb:'Durable melee fighter. Armor scales with level; Cleave controls adjacent packs.',skill:{name:'Cleave',desc:'Deal 150% ATK to adjacent enemies.'}},
    ranger:{name:'Ranger',blurb:'Line-of-sight archer with ranged attacks and agile close-range defense.',skill:{name:'Dash',desc:'Dash 2 tiles and damage enemies crossed.'}},
    mage:{name:'Arcanist',blurb:'Fragile ranged caster. Arcane Bolt pressures armored targets and controls space.',skill:{name:'Arcane Bolt',desc:'Strike the nearest visible enemy, partially ignore DEF and knock it back.'}},
    assassin:{name:'Assassin',blurb:'Fragile burst melee class with innate critical chance and positional pressure.',skill:{name:'Shadowstrike',desc:'Blink beside the nearest visible enemy and land a guaranteed critical strike.'}},
  });

  const TALENT_EN = Object.freeze({
    iron:['Ironbone','Max HP +12 and immediately restore 12 HP.'],
    edge:['Keen Edge','Base ATK +2.'],
    luck:['Fortune','Crit +8%.'],
    blood:['Blood Pact','Leech +5%.'],
    haste:['Haste','Permanent skill cooldown -1, to a minimum of 2 turns.'],
    pack:['Field Pack','Immediately gain 1 Healing Potion and 1 Teleport Scroll.'],
    gold:['Midas Touch','Gold Find +20%.'],
    ward:['Ward','Damage taken -1.'],
    bramble:['Brambleheart','Thorns +4.'],
    scavenge:['Scavenger','Kill Heal +3.'],
    elixir:['Potent Elixir','Potion healing +40%.'],
    frenzy:['Deadly Rhythm','Critical damage +25% (1.8x to about 2.05x).'],
    tenacity:['Tenacity','Grievous Wounds duration -1 turn, to a minimum of 1.'],
    plunder:['Plunderer','Gold dropped by kills +25%.'],
    stone:['Stoneskin','Damage taken -2.'],
    echoborn:['Echoborn','Natural regeneration accelerates to +1 HP every 4 turns.'],
  });

  const ACHV_EN = Object.freeze({
    first_run:['First Expedition','Start one Greedy Expedition'],
    depth_10:['Into the Depths','Reach Floor 10'],
    depth_30:['Deepwalker','Reach Floor 30'],
    depth_60:['Abyss Traveler','Reach Floor 60'],
    depth_100:['Hundred-Floor Hero','Reach Floor 100'],
    kills_100:['Slayer','Defeat 100 enemies in total'],
    kills_500:['Five Hundred Blades','Defeat 500 enemies in total'],
    rich:['Vault Keeper','Hold 1000 Gold in the vault at once'],
    wheel_10:['Echo Gambler','Spin the fortune wheel 10 times in total'],
    deaths_5:['Death Regular','Die 5 times during expeditions'],
    legend:['Legend Collector','Equip a Legendary item'],
    win:['Heartbound Return','Leave with the Dungeon Heart'],
  });

  function localizeClasses() {
    if (!english || !api.CLASSES) return 0;
    let changed=0;
    for (const [id,copy] of Object.entries(CLASS_EN)) {
      const row=api.CLASSES[id];
      if (!row) continue;
      row.name=copy.name; row.blurb=copy.blurb;
      if (row.skill) { row.skill.name=copy.skill.name; row.skill.desc=copy.skill.desc; }
      changed++;
    }
    return changed;
  }

  function localizeTalents() {
    if (!english || !Array.isArray(api.TALENTS)) return 0;
    let changed=0;
    for (const row of api.TALENTS) {
      const copy=row && TALENT_EN[row.id];
      if (!copy) continue;
      row.name=copy[0]; row.desc=copy[1]; changed++;
    }
    return changed;
  }

  function localizeAchievements() {
    if (!english || !Array.isArray(api.ACHV)) return 0;
    let changed=0;
    for (const row of api.ACHV) {
      const copy=row && ACHV_EN[row.id];
      if (!copy) continue;
      row.name=copy[0]; row.desc=copy[1]; changed++;
    }
    return changed;
  }

  const classes=localizeClasses();
  const talents=localizeTalents();
  const achievements=localizeAchievements();
  window.__DE_CORE_LOCALE_DATA_V139={
    version:'v139',owner:'core-locale-data-v139',locale:english?'en':'zh-CN',classes,talents,achievements,
    localizeClasses,localizeTalents,localizeAchievements,
  };
})();