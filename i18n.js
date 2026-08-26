/* Dungeon Echo i18n v1.
 * One language owner for player-facing UX. Static shell/class identity live here;
 * i18n-runtime.js follows dynamic DOM produced by legacy/late modules.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.DE_I18N) return;

  const STORAGE_KEY = 'de-language-v1';
  const LANGS = new Set(['zh-CN','en']);
  const D = Object.freeze({
    'zh-CN': {
      'game.name':'地牢回响','game.name.sub':'Dungeon Echo',
      'meta.description':'地牢回响 Dungeon Echo——从第 1 层一路深入第 100 层的离线单机网页 Roguelike。四职业、装备构筑、贪婪远征与无尽回响。',
      'stat.floor':'楼层','stat.level':'等级','stat.attack':'攻击','stat.defense':'防御','stat.crit':'暴击','stat.gold':'金币','stat.potion':'药水','stat.scroll':'卷轴','stat.key':'钥匙','stat.escape':'回城','stat.enemy':'敌人','stat.skill':'技能',
      'slot.weapon':'武器','slot.armor':'护甲','slot.helmet':'头盔','slot.boots':'靴子','slot.ring':'戒指','slot.amulet':'项链','slot.class':'职业',
      'action.fullscreen':'全屏','action.attack':'攻击','action.skill':'技能','action.potion':'药水','action.scroll':'卷轴','action.escape':'回城','action.descend':'下楼','action.pause':'暂停','action.sound':'声音',
      'bag.title':'背包','bag.inspect':'轻触物品查看属性，再选择装备或丢弃。','bag.equip':'装备','bag.drop':'丢弃','log.title':'冒险日志',
      'title.kicker':'百层远征','title.lede':'从第 1 层开始，穿过十个阶段与九位深层守卫，直到第 100 层终局。装备、回城与贪念决定你能走多深。','title.route':'正式旅程固定为 1 → 100 层。不存在开局选择深度，也不能付费跳过未征服区域。','title.continue':'继续冒险','title.new':'新的冒险','title.greedy.on':'贪婪远征：开','title.greedy.off':'贪婪远征：关','title.help':'玩法说明','title.achv':'远征录',
      'class.kicker':'选择回响','class.title':'你是谁','class.lede':'选择你的战斗节奏。每个职业都能抵达第 100 层，但会用完全不同的方式承担风险。','common.back':'返回','common.leave':'离开',
      'pause.title':'暂停','pause.copy':'进度已自动写入本地。','pause.resume':'继续','pause.saveQuit':'保存并回标题',
      'shop.kicker':'蒙面商人','shop.title':'地下市集','shop.leave':'离开摊位',
      'talent.kicker':'回响觉醒','talent.title':'选择一项天赋','talent.lede':'每三级，地牢会在你体内留下一道新的回响。',
      'shrine.kicker':'无名神龛','shrine.title':'神龛','shrine.lede':'触碰神龛，接受回响的赌注。','shrine.pray':'祈祷',
      'echo.kicker':'终局抉择','echo.title':'地牢之心在掌心跳动','echo.lede':'带走它，第 100 层远征完成。也可以把它按回祭坛，让回响无限叠深。','echo.leave':'带着心离开','echo.stay':'踏入无尽回响',
      'town.kicker':'贪婪远征 · 回响小镇','town.title':'营地与市集','town.head':'整备一番，再下去。',
      'audio.title':'声音设置','audio.music':'背景音乐','audio.sfx':'游戏音效','audio.preset':'恢复推荐 30 / 85','audio.on':'总开关：开','audio.off':'总开关：关','audio.note':'音乐与音效独立保存 · M 快速静音/恢复',
      'tutorial.label':'新手提示','tutorial.skip':'跳过教学','tutorial.reset':'重置教学','tutorial.move.desktop':'移动 · WASD / 方向键移动，同时改变面向','tutorial.move.mobile':'移动 · 用左侧方向盘移动；朝向也会跟着改变','tutorial.attack.desktop':'攻击 · 面向敌人后按 J','tutorial.attack.mobile':'攻击 · 面向敌人后点「攻击」','tutorial.skill.desktop':'技能 · K 释放，会消耗蓝量','tutorial.skill.mobile':'技能 · 点「技能」释放，会消耗蓝量','tutorial.bag.desktop':'装备 · 点击背包物品查看属性，再决定是否装备','tutorial.bag.mobile':'装备 · 点背包物品查看属性，再点「装备」；穿戴不会覆盖角色立绘','tutorial.potion.desktop':'受伤后按 Q 喝药；深层补给有限','tutorial.potion.mobile':'受伤后可点「药水」恢复；深层补给有限','tutorial.stairs.desktop':'下潜 · 站上楼梯后按 Enter','tutorial.stairs.mobile':'下潜 · 站上楼梯后点「下楼」进入下一层','tutorial.escape.desktop':'贪婪远征 · T 回城，把背包和金币安全带回镇上','tutorial.escape.mobile':'贪婪远征 · 点「回城」把背包和金币安全带回镇上','tutorial.guardian':'守卫破甲 · 明示的破甲大招命中会无视护甲；看到预警就走位，不要硬吃',
      'mobile.help':'电脑：WASD / 方向键移动与转向，J 攻击，K 技能。手机：左侧方向盘移动与转向，右侧攻击 / 技能为主操作；长按方向可连续行走。',
      'lang.switch':'EN','lang.title':'Switch to English',
    },
    en: {
      'game.name':'Dungeon Echo','game.name.sub':'地牢回响',
      'meta.description':'Dungeon Echo is a browser-native 100-floor turn-based roguelike about builds, risk, retreat, guardians and a three-phase final boss.',
      'stat.floor':'Floor','stat.level':'Level','stat.attack':'ATK','stat.defense':'DEF','stat.crit':'Crit','stat.gold':'Gold','stat.potion':'Potions','stat.scroll':'Scrolls','stat.key':'Keys','stat.escape':'Return','stat.enemy':'Enemies','stat.skill':'Skill',
      'slot.weapon':'Weapon','slot.armor':'Armor','slot.helmet':'Helmet','slot.boots':'Boots','slot.ring':'Ring','slot.amulet':'Amulet','slot.class':'Class',
      'action.fullscreen':'Fullscreen','action.attack':'Attack','action.skill':'Skill','action.potion':'Potion','action.scroll':'Scroll','action.escape':'Return','action.descend':'Descend','action.pause':'Pause','action.sound':'Sound',
      'bag.title':'Backpack','bag.inspect':'Tap an item to inspect it, then equip or drop it.','bag.equip':'Equip','bag.drop':'Drop','log.title':'Adventure Log',
      'title.kicker':'100-Floor Expedition','title.lede':'Start on floor 1, cross ten stages and nine deep guardians, then face the floor-100 finale. Gear, retreat timing and greed decide how deep you survive.','title.route':'The production journey is always floor 1 → 100. There is no paid skip and no starting beyond unconquered ground.','title.continue':'Continue','title.new':'New Run','title.greedy.on':'Greedy Expedition: On','title.greedy.off':'Greedy Expedition: Off','title.help':'How to Play','title.achv':'Expedition Record',
      'class.kicker':'Choose Your Echo','class.title':'Who Are You?','class.lede':'Choose your combat rhythm. Every class can reach floor 100, but each accepts risk in a different way.','common.back':'Back','common.leave':'Leave',
      'pause.title':'Paused','pause.copy':'Progress is saved locally.','pause.resume':'Resume','pause.saveQuit':'Save & Title',
      'shop.kicker':'Masked Merchant','shop.title':'Underground Market','shop.leave':'Leave Stall',
      'talent.kicker':'Echo Awakening','talent.title':'Choose a Talent','talent.lede':'Every three levels, the dungeon leaves a new echo inside you.',
      'shrine.kicker':'Nameless Shrine','shrine.title':'Shrine','shrine.lede':'Touch the shrine and accept the echo’s wager.','shrine.pray':'Pray',
      'echo.kicker':'Final Choice','echo.title':'The Dungeon Heart Beats in Your Hand','echo.lede':'Take it and complete the floor-100 expedition—or return it to the altar and let the echo descend forever.','echo.leave':'Leave with the Heart','echo.stay':'Enter Endless Echo',
      'town.kicker':'Greedy Expedition · Echo Town','town.title':'Camp & Market','town.head':'Prepare, then descend again.',
      'audio.title':'Sound Settings','audio.music':'Music','audio.sfx':'SFX','audio.preset':'Recommended 30 / 85','audio.on':'Master: On','audio.off':'Master: Off','audio.note':'Music and SFX save separately · M toggles mute',
      'tutorial.label':'Tutorial','tutorial.skip':'Skip Tutorial','tutorial.reset':'Reset Tutorial','tutorial.move.desktop':'Move · WASD / arrow keys move and change facing','tutorial.move.mobile':'Move · Use the left D-pad; movement also changes facing','tutorial.attack.desktop':'Attack · Face an enemy and press J','tutorial.attack.mobile':'Attack · Face an enemy and tap Attack','tutorial.skill.desktop':'Skill · Press K; skills consume mana','tutorial.skill.mobile':'Skill · Tap Skill; skills consume mana','tutorial.bag.desktop':'Gear · Inspect backpack items and equip only what fits your build','tutorial.bag.mobile':'Gear · Tap a backpack item to inspect and equip it; gear never covers hero art','tutorial.potion.desktop':'Heal · Press Q for a potion; deep-floor supplies are finite','tutorial.potion.mobile':'Heal · Tap Potion; deep-floor supplies are finite','tutorial.stairs.desktop':'Descend · Stand on stairs and press Enter','tutorial.stairs.mobile':'Descend · Stand on stairs and tap Descend','tutorial.escape.desktop':'Greedy Expedition · Press T to return safely with backpack loot and carried gold','tutorial.escape.mobile':'Greedy Expedition · Tap Return to secure backpack loot and carried gold','tutorial.guardian':'Armor Break · Telegraphed guardian specials ignore armor on hit. Read the warning and move.',
      'mobile.help':'PC: WASD / arrows move and face, J attacks, K uses skills. Mobile: left D-pad moves; Attack / Skill are the primary right-thumb actions; hold a direction to keep walking.',
      'lang.switch':'中','lang.title':'切换到中文',
    },
  });

  function chooseInitial() {
    try {
      const url = new URL(location.href);
      const q = String(url.searchParams.get('lang') || '').toLowerCase();
      if (q === 'en') return 'en';
      if (q === 'zh' || q === 'zh-cn') return 'zh-CN';
      const saved = localStorage.getItem(STORAGE_KEY);
      if (LANGS.has(saved)) return saved;
    } catch (e) {}
    const browser = String(navigator.language || '').toLowerCase();
    return browser.startsWith('zh') ? 'zh-CN' : 'en';
  }

  let lang = chooseInitial();
  let applying = false;
  const originalClasses = new Map();
  const CLASS_EN = Object.freeze({
    warrior:{name:'Warrior',blurb:'Durable melee fighter. Armor scales with level; Cleave controls adjacent packs.',skill:{name:'Cleave',desc:'Deal 150% ATK to adjacent enemies.'}},
    ranger:{name:'Ranger',blurb:'Line-of-sight archer with ranged attacks and agile close-range defense.',skill:{name:'Dash',desc:'Dash 2 tiles and damage enemies crossed.'}},
    mage:{name:'Arcanist',blurb:'Fragile ranged caster. Arcane Bolt pressures armored targets and controls space.',skill:{name:'Arcane Bolt',desc:'Strike the nearest visible enemy, partially ignore DEF and knock it back.'}},
    assassin:{name:'Assassin',blurb:'Fragile burst melee class with innate critical chance and positional pressure.',skill:{name:'Shadowstrike',desc:'Blink beside the nearest visible enemy and land a guaranteed critical strike.'}},
  });

  function t(key, vars) {
    const table = D[lang] || D['zh-CN'];
    let out = table[key] == null ? (D['zh-CN'][key] == null ? key : D['zh-CN'][key]) : table[key];
    if (vars) for (const [k,v] of Object.entries(vars)) out = String(out).replaceAll(`{${k}}`, String(v));
    return out;
  }

  function setText(selector, key) { const el=document.querySelector(selector); if(el)el.textContent=t(key); }
  function setKnownText(selector,key){
    const el=document.querySelector(selector);if(!el)return;
    const raw=String(el.textContent||'').trim();
    if(raw===D['zh-CN'][key]||raw===D.en[key])el.textContent=t(key);
  }
  function setPrefix(childId,key){
    const child=document.getElementById(childId),parent=child&&child.parentElement;if(!parent)return;
    let node=Array.from(parent.childNodes).find(n=>n.nodeType===3&&String(n.nodeValue||'').trim());
    if(node)node.nodeValue=t(key)+' ';else parent.insertBefore(document.createTextNode(t(key)+' '),child);
  }
  function setAction(selector,key,hotkey){
    const el=document.querySelector(selector);if(!el)return;
    let hk=el.querySelector('span');
    if(!hk){hk=document.createElement('span');el.appendChild(hk)}
    hk.textContent=hotkey;
    let textNode=Array.from(el.childNodes).find(n=>n.nodeType===3);
    if(!textNode){textNode=document.createTextNode('');el.insertBefore(textNode,el.firstChild)}
    textNode.nodeValue=t(key)+' ';
  }
  function setFullscreen(){
    const el=document.getElementById('fullscreen-toggle');if(!el)return;
    const kbd=el.querySelector('kbd');if(kbd)kbd.textContent='F';
    let textNode=Array.from(el.childNodes).find(n=>n.nodeType===3);
    if(!textNode){textNode=document.createTextNode('');el.insertBefore(textNode,kbd||null)}
    textNode.nodeValue=' '+t('action.fullscreen')+' ';
  }

  function applyClasses(){
    const api=window.DE_TEST;if(!api||!api.CLASSES)return;
    for(const [id,c] of Object.entries(api.CLASSES)){
      if(!originalClasses.has(id))originalClasses.set(id,{name:c.name,blurb:c.blurb,skill:c.skill?{name:c.skill.name,desc:c.skill.desc}:null});
      const src=lang==='en'?CLASS_EN[id]:originalClasses.get(id);if(!src)continue;
      c.name=src.name;c.blurb=src.blurb;if(c.skill&&src.skill){c.skill.name=src.skill.name;c.skill.desc=src.skill.desc}
    }
  }

  function syncLateUi(){
    setText('#de-audio-settings-pop .de-audio-head b','audio.title');
    const labels=document.querySelectorAll('#de-audio-settings-pop label');if(labels[0]&&labels[0].querySelector('span'))labels[0].querySelector('span').textContent=t('audio.music');if(labels[1]&&labels[1].querySelector('span'))labels[1].querySelector('span').textContent=t('audio.sfx');
    setText('#de-audio-preset','audio.preset');setText('#de-audio-settings-pop small','audio.note');setText('#de-tutorial-reset','tutorial.reset');
    const master=document.getElementById('de-audio-master');if(master)master.textContent=window.__DE_AUDIO_DIRECTOR&&window.__DE_AUDIO_DIRECTOR.muted?t('audio.off'):t('audio.on');
  }

  function installToggle(){
    let btn=document.getElementById('de-lang-toggle');
    if(!btn){btn=document.createElement('button');btn.id='de-lang-toggle';btn.type='button';btn.style.cssText='border:1px solid rgba(224,167,58,.28);background:#17100c;color:#e3cfaa;padding:5px 8px;cursor:pointer;white-space:nowrap';btn.addEventListener('click',()=>setLang(lang==='en'?'zh-CN':'en',{persist:true,url:true}));const full=document.getElementById('fullscreen-toggle'),stats=document.getElementById('stats');if(full&&full.parentNode)full.parentNode.insertBefore(btn,full);else if(stats)stats.appendChild(btn)}
    btn.textContent=t('lang.switch');btn.title=t('lang.title');btn.setAttribute('aria-label',t('lang.title'));
  }

  function applyShell(){
    applying=true;
    try{
      document.documentElement.lang=lang;
      document.title=lang==='en'?'Dungeon Echo · 100-Floor Browser Roguelike':'地牢回响 · Dungeon Echo';
      const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=t('meta.description');
      const h1=document.querySelector('header h1');if(h1)h1.innerHTML=`${t('game.name')} <span class="sub">${t('game.name.sub')}</span>`;
      [['st-depth','stat.floor'],['st-lvl','stat.level'],['st-atk','stat.attack'],['st-def','stat.defense'],['st-crit','stat.crit'],['st-gold','stat.gold'],['st-potion','stat.potion'],['st-scroll','stat.scroll'],['st-key','stat.key'],['st-escape','stat.escape'],['st-mobs','stat.enemy'],['st-skill','stat.skill']].forEach(([id,key])=>setPrefix(id,key));
      [['#eq-weapon .eqname','slot.weapon'],['#eq-armor .eqname','slot.armor'],['#eq-helmet .eqname','slot.helmet'],['#eq-boots .eqname','slot.boots'],['#eq-ring .eqname','slot.ring'],['#eq-amulet .eqname','slot.amulet']].forEach(([s,k])=>setText(s,k));
      applyClasses();
      const api=window.DE_TEST,id=api&&(api.classId||(api.meta&&api.meta.classId)),cls=id&&api.CLASSES&&api.CLASSES[id];const classEl=document.getElementById('st-class');if(classEl)classEl.textContent=cls?cls.name:t('slot.class');
      setFullscreen();setAction('#actions [data-act="attack"]','action.attack','J');setAction('#actions [data-act="skill"]','action.skill','K');setAction('#actions [data-act="potion"]','action.potion','Q');setAction('#actions [data-act="scroll"]','action.scroll','E');setAction('#actions [data-act="escape"]','action.escape','T');setAction('#actions [data-act="descend"]','action.descend','Enter');setAction('#actions [data-act="pause"]','action.pause','Esc');setAction('#actions [data-act="mute"]','action.sound','M');
      setPrefix('bagcount','bag.title');setKnownText('#bagdetail-copy','bag.inspect');setText('[data-bag-equip]','bag.equip');setText('[data-bag-drop]','bag.drop');setText('#logbox .boxtitle','log.title');
      setText('#title-screen h2','game.name');setText('#title-screen .title-card > .lede','title.lede');const depth=document.querySelector('#title-screen .depth-picker');if(depth){const k=depth.querySelector('.kicker'),l=depth.querySelector('.lede');if(k)k.textContent=t('title.kicker');if(l)l.textContent=t('title.route')}
      setText('#btn-continue','title.continue');setText('#btn-new','title.new');const greedy=document.getElementById('btn-greedy');if(greedy)greedy.textContent=t(greedy.getAttribute('aria-pressed')==='true'?'title.greedy.on':'title.greedy.off');setText('#btn-help','title.help');setText('#btn-achv','title.achv');
      setText('#class-screen .kicker','class.kicker');setText('#class-screen h2','class.title');setText('#class-screen .class-lede','class.lede');setText('#btn-class-back','common.back');
      setText('#pause-screen h2','pause.title');setKnownText('#pause-copy','pause.copy');setText('#btn-resume','pause.resume');setText('#btn-save-quit','pause.saveQuit');
      setText('#shop-screen .kicker','shop.kicker');setText('#shop-screen h2','shop.title');setText('#btn-shop-leave','shop.leave');
      setText('#talent-screen .kicker','talent.kicker');setText('#talent-screen h2','talent.title');setText('#talent-screen .lede','talent.lede');
      setText('#shrine-screen .kicker','shrine.kicker');setKnownText('#shrine-title','shrine.title');setKnownText('#shrine-copy','shrine.lede');setText('#btn-shrine-ok','shrine.pray');setText('#btn-shrine-leave','common.leave');
      setText('#echo-screen .kicker','echo.kicker');setText('#echo-screen h2','echo.title');setText('#echo-screen .lede','echo.lede');setText('#btn-echo-leave','echo.leave');setText('#btn-echo-stay','echo.stay');
      setText('#town-screen > .title-card > .kicker','town.kicker');setText('#town-screen > .title-card > h2','town.title');setKnownText('#town-head','town.head');
      syncLateUi();installToggle();
    }finally{applying=false}
  }

  function setLang(next,opts={}){
    next=String(next||'').toLowerCase()==='en'?'en':'zh-CN';if(!LANGS.has(next))return false;lang=next;
    if(opts.persist!==false)try{localStorage.setItem(STORAGE_KEY,lang)}catch(e){}
    if(opts.url)try{const u=new URL(location.href);u.searchParams.set('lang',lang==='en'?'en':'zh');history.replaceState(null,'',u.href)}catch(e){}
    applyShell();window.dispatchEvent(new CustomEvent('de:languagechange',{detail:{lang}}));return true;
  }

  const observer=typeof MutationObserver!=='undefined'?new MutationObserver(()=>{if(!applying){syncLateUi();installToggle()}}):null;
  window.DE_I18N={version:'v1',t,setLang,apply:applyShell,get lang(){return lang},get isEnglish(){return lang==='en'}};
  applyShell();if(observer&&document.body)observer.observe(document.body,{childList:true,subtree:true});
})();
