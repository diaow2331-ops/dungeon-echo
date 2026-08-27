'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'..','core-locale-data-v139.js'),'utf8');
assert(!/MutationObserver|setInterval|requestAnimationFrame/.test(source),'core locale data owner must be one-shot and observer-free');
assert(!/DE_I18N/.test(source),'core locale data owner must not depend on the legacy translator');

function boot(locale){
  const classes={
    warrior:{name:'战士',blurb:'x',skill:{name:'横扫',desc:'x'}},
    ranger:{name:'游侠',blurb:'x',skill:{name:'疾步',desc:'x'}},
    mage:{name:'秘术师',blurb:'x',skill:{name:'奥术弹',desc:'x'}},
    assassin:{name:'刺客',blurb:'x',skill:{name:'影袭',desc:'x'}},
  };
  const achv=[
    {id:'first_run',name:'初次远征',desc:'x'},{id:'depth_100',name:'百层勇者',desc:'x'},
    {id:'win',name:'心之归途',desc:'x'},
  ];
  const context={document:{documentElement:{dataset:{deLocale:locale}}},window:{DE_TEST:{profileId:'classic-100',CLASSES:classes,ACHV:achv}}};
  context.window.window=context.window;context.window.document=context.document;
  vm.runInNewContext(source,context,{filename:'core-locale-data-v139.js'});
  return {owner:context.window.__DE_CORE_LOCALE_DATA_V139,classes,achv};
}
const en=boot('en');
assert(en.owner&&en.owner.version==='v139');
assert.equal(en.classes.warrior.name,'Warrior');
assert.equal(en.classes.mage.skill.name,'Arcane Bolt');
assert.equal(en.achv.find(a=>a.id==='depth_100').name,'Hundred-Floor Hero');
assert(!/[\u3400-\u9fff]/.test(JSON.stringify(en.classes)),'English class data must contain no CJK');
assert(!/[\u3400-\u9fff]/.test(JSON.stringify(en.achv)),'English localized achievement rows must contain no CJK');
const zh=boot('zh-CN');
assert.equal(zh.classes.warrior.name,'战士','Chinese route keeps canonical Chinese class data');
assert.equal(zh.achv[0].name,'初次远征','Chinese route keeps canonical Chinese achievements');
console.log('core_locale_data_v139=PASS');
