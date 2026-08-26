/* Dungeon Echo i18n runtime follower v2.
 * Keeps dynamic DOM, help copy and accessibility attributes aligned with DE_I18N without
 * moving gameplay/state ownership out of game.js or input/audio modules.
 */
(() => {
  'use strict';
  if (typeof window==='undefined'||typeof document==='undefined'||window.__DE_I18N_RUNTIME_V1)return;
  const api=window.DE_TEST, L=window.DE_I18N;
  if(!api||!L)return;
  let applying=false;
  const setText=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value};
  const setHtml=(el,value)=>{if(el&&el.innerHTML!==value)el.innerHTML=value};
  const setAttr=(el,name,value)=>{if(el&&el.getAttribute(name)!==value)el.setAttribute(name,value)};

  function classStats(c){
    if(!c)return '';
    return L.isEnglish
      ? `HP ${c.hpBase} · ATK ${c.atkBase} · Potions ${c.potions} · Scrolls ${c.scrolls}<br>Skill: ${c.skill.name} (CD ${c.skill.cd})<br>${c.skill.desc}`
      : `生命 ${c.hpBase} · 攻击 ${c.atkBase} · 药水 ${c.potions} · 卷轴 ${c.scrolls}<br>技能：${c.skill.name}（冷却 ${c.skill.cd}）<br>${c.skill.desc}`;
  }

  function syncClassCards(){
    const root=document.getElementById('class-grid');if(!root)return 0;
    let changed=0;
    for(const card of root.querySelectorAll('[data-class]')){
      const c=api.CLASSES&&api.CLASSES[card.dataset.class];if(!c)continue;
      const h=card.querySelector('h3'),p=card.querySelector('p'),s=card.querySelector('.stats');
      if(h&&h.textContent!==c.name){h.textContent=c.name;changed++}
      if(p&&p.textContent!==c.blurb){p.textContent=c.blurb;changed++}
      const html=classStats(c);if(s&&s.innerHTML!==html){s.innerHTML=html;changed++}
    }
    return changed;
  }

  function syncCurrentClass(){
    const el=document.getElementById('st-class');
    const id=api.classId||(api.meta&&api.meta.classId);
    const c=id&&api.CLASSES&&api.CLASSES[id];
    if(el&&c&&el.textContent!==c.name)el.textContent=c.name;
  }

  function setAction(act,key,hotkey){
    const el=document.querySelector(`#actions [data-act="${act}"]`);if(!el)return;
    const mobile=document.documentElement.classList.contains('de-mobile-ui');
    const label=L.t(key);
    if(mobile){setText(el,label);return;}
    let hk=el.querySelector('span');
    if(!hk){hk=document.createElement('span');el.appendChild(hk)}
    if(hk.textContent!==hotkey)hk.textContent=hotkey;
    let first=Array.from(el.childNodes).find(n=>n.nodeType===3);
    if(!first){first=document.createTextNode('');el.insertBefore(first,el.firstChild)}
    const wanted=label+' ';if(first.nodeValue!==wanted)first.nodeValue=wanted;
  }

  function syncHelp(){
    const root=document.getElementById('help-screen');if(!root)return;
    const kick=root.querySelector('.title-card>.kicker'),title=root.querySelector('.title-card>h2');
    const heads=root.querySelectorAll('.help-cols h3'),paras=root.querySelectorAll('.help-cols p');
    const close=document.getElementById('btn-help-close');
    if(L.isEnglish){
      setText(kick,'Quick Start · 100-Floor Expedition');setText(title,'How to Play');
      setText(heads[0],'Controls');
      setHtml(paras[0],'Move: <b>WASD / arrow keys / click explored tiles</b><br>Attack: <b>J</b> (current facing) · Wait: <b>Space</b><br>Skill: <b>K</b> (costs mana) · Potion: <b>Q</b> · Scroll: <b>E</b><br>Return: <b>T</b> (Greedy Expedition) · Descend: <b>Enter</b> (on stairs)<br>Pause: <b>Esc</b> · Sound: <b>M</b> · Fullscreen: <b>F</b>');
      setText(heads[1],'100-Floor Journey');
      setText(paras[1],'Every class starts on Floor 1. Each tenth floor is a guardian milestone, and Floor 100 is the production finale. Short profiles exist only for internal testing.');
      setText(heads[2],'Greedy Expedition');
      setHtml(paras[2],'<b>Depart → loot → return safely → prepare → descend again.</b><br>Death loses backpack loot and carried Gold; stash and vault are safe. Deeper gear is stronger, but deciding when to push and when to leave is the core risk.');
      setText(heads[3],'Combat');
      setText(paras[3],'The four classes have different survival and damage rhythms. Gear is not a single-score puzzle: ATK, DEF, HP, Crit, Leech, Thorns, Kill Heal and Gold Find matter differently to each build.');
      setText(close,'Got it');
    }else{
      setText(kick,'新手入门 · 百层远征');setText(title,'怎么玩');
      setText(heads[0],'操作');
      setHtml(paras[0],'移动：<b>方向键 / WASD / 点击已探索地块</b><br>攻击：<b>J</b>（按当前面向） · 等待：<b>空格</b><br>技能：<b>K</b>（消耗蓝量） · 药水：<b>Q</b> · 卷轴：<b>E</b><br>回城：<b>T</b>（贪婪远征）· 下潜：<b>Enter</b>（楼梯上）<br>暂停：<b>Esc</b> · 声音：<b>M</b> · 全屏：<b>F</b>');
      setText(heads[1],'百层旅程');
      setText(paras[1],'所有角色都从第 1 层出发。每 10 层是一个关键守卫节点，第 100 层是正式终局；短档位只存在于内部测试，不属于游客玩法。');
      setText(heads[2],'贪婪远征');
      setHtml(paras[2],'<b>出发 → 搜刮 → 回城落袋为安 → 整备 → 再深入。</b><br>死亡会失去背包物品和随身金币；仓库与金库安全。装备越深越强，但什么时候继续贪、什么时候撤退，是最重要的决定。');
      setText(heads[3],'战斗');
      setText(paras[3],'四职业拥有不同的生存与输出节奏。装备不只看总分：攻击、防御、生命、暴击、吸血、反伤、击杀回复和金币收益对不同职业价值不同。');
      setText(close,'明白了');
    }
  }

  function syncFooter(){
    const footer=document.getElementById('help'),seed=document.getElementById('seed-label');
    if(!footer||!seed)return;
    const before=Array.from(footer.childNodes).find(n=>n.nodeType===3);
    const after=seed.nextSibling&&seed.nextSibling.nodeType===3?seed.nextSibling:null;
    const beforeText=L.isEnglish
      ? 'Move: arrows / WASD / map click · J Attack · K Skill · Space Wait · Q Potion · E Scroll · T Return · Enter Descend · Esc Pause · backpack click to equip · M Sound · F Fullscreen · R Restart after death · Run seed '
      : '移动：方向键 / WASD / 点击地图 · J 攻击 · K 职业技能 · 空格等待 · Q 药水 · E 卷轴 · T 回城 · Enter 下楼 · Esc 暂停 · 点击背包装备 · M 声音开关 · F 全屏 · 死亡后 R 重开 · 运行种子 ';
    const afterText=L.isEnglish?' (use ?seed=… to reproduce) · Release ':'（可用 ?seed=… 复现） · 正式版 ';
    if(before&&before.nodeValue!==beforeText)before.nodeValue=beforeText;
    if(after&&after.nodeValue!==afterText)after.nodeValue=afterText;
  }

  function syncAccessibility(){
    const en=L.isEnglish;
    setAttr(document.getElementById('st-escape-wrap'),'title',en?'Return Scroll: press T during Greedy Expedition to secure carried loot in town':'回城卷轴：贪婪远征中按 T 带着战利品平安回镇');
    setAttr(document.getElementById('fullscreen-toggle'),'title',en?'Enter or leave immersive fullscreen (F)':'进入或退出沉浸式全屏（F）');
    setAttr(document.getElementById('game'),'aria-label',en?'Dungeon map: WASD / arrows move and face, J attacks, K uses skills; explored tiles can also be clicked to move':'地牢地图：WASD / 方向键移动与转向，J 攻击，K 技能；也可点击已探索地块移动');
    setAttr(document.getElementById('touch'),'aria-label',en?'Touch controls':'触控操作');
    const labels={up:['Move up','向上移动'],left:['Move left','向左移动'],wait:['Wait one turn','等待一回合'],right:['Move right','向右移动'],down:['Move down','向下移动']};
    for(const [act,pair] of Object.entries(labels))setAttr(document.querySelector(`#dpad [data-act="${act}"]`),'aria-label',en?pair[0]:pair[1]);
    setAttr(document.getElementById('btn-greedy'),'title',en?'Greedy Expedition: death loses backpack loot and carried Gold; a Return Scroll secures loot in town, where stash and market are safe':'贪婪远征：死亡失去背包与随身金币；回城卷轴可带着战利品平安回镇，城镇有仓库与商店');
    setAttr(document.getElementById('btn-town-exit'),'title',en?'Return to the title screen without losing progress':'回到标题，进度不会丢失');
    setAttr(document.getElementById('de-audio-settings-pop'),'aria-label',en?'Sound settings':'声音设置');
    setAttr(document.getElementById('de-audio-settings-btn'),'aria-label',en?'Open sound settings':'打开声音设置');
  }

  function syncLateControls(){
    setAction('attack','action.attack','J');setAction('skill','action.skill','K');setAction('potion','action.potion','Q');
    setAction('scroll','action.scroll','E');setAction('escape','action.escape','T');setAction('descend','action.descend','Enter');
    setAction('pause','action.pause','Esc');setAction('mute','action.sound','M');

    const greedy=document.getElementById('btn-greedy');
    if(greedy)setText(greedy,L.t(greedy.getAttribute('aria-pressed')==='true'?'title.greedy.on':'title.greedy.off'));

    const pop=document.getElementById('de-audio-settings-pop');
    if(pop){
      setText(pop.querySelector('.de-audio-head b'),L.t('audio.title'));
      const labels=pop.querySelectorAll('label span');setText(labels[0],L.t('audio.music'));setText(labels[1],L.t('audio.sfx'));
      setText(document.getElementById('de-audio-preset'),L.t('audio.preset'));
      setText(pop.querySelector('small'),L.t('audio.note'));
      setText(document.getElementById('de-audio-master'),window.__DE_AUDIO_DIRECTOR&&window.__DE_AUDIO_DIRECTOR.muted?L.t('audio.off'):L.t('audio.on'));
    }

    setText(document.getElementById('de-tutorial-reset'),L.t('tutorial.reset'));
    setText(document.querySelector('#de-onboarding b'),L.t('tutorial.label'));
    setText(document.querySelector('#de-onboarding [data-tutorial-skip]'),L.t('tutorial.skip'));
    syncHelp();syncFooter();syncAccessibility();
  }

  function syncCoreStatus(){
    const skill=document.getElementById('st-skill');
    const shop=document.getElementById('shop-gold');
    const warning=document.getElementById('guardian-break-warning');
    const feedback=document.getElementById('de-combat-feedback');
    if(L.isEnglish){
      if(skill){const raw=String(skill.textContent||'').trim();if(raw==='就绪')skill.textContent='Ready';else if(/^冷却\s*\d+/.test(raw))skill.textContent=raw.replace(/^冷却\s*/,'CD ')}
      if(shop&&/^金币\s*\d+/.test(shop.textContent||''))shop.textContent=shop.textContent.replace(/^金币/,'Gold');
      if(warning&&warning.textContent==='破甲大招 · 命中无视护甲')warning.textContent='Armor-break special · Hit ignores armor';
      if(feedback){const raw=String(feedback.textContent||'');if(/^蓝量不足：/.test(raw))feedback.textContent=raw.replace(/^蓝量不足：/,'Not enough mana: ').replace(' · 原地等待可更快恢复',' · Wait/focus to recover faster');else if(/^凝神 \+/.test(raw))feedback.textContent=raw.replace(/^凝神/,'Focus').replace(' 蓝量',' mana');else if(/ −\d+ 蓝量$/.test(raw))feedback.textContent=raw.replace(/ 蓝量$/,' mana')}
    }else{
      if(skill&&skill.textContent==='Ready')skill.textContent='就绪';
      if(shop&&/^Gold\s*\d+/.test(shop.textContent||''))shop.textContent=shop.textContent.replace(/^Gold/,'金币');
      if(warning&&warning.textContent==='Armor-break special · Hit ignores armor')warning.textContent='破甲大招 · 命中无视护甲';
    }
  }

  function sync(){
    if(applying)return;applying=true;
    try{syncClassCards();syncCurrentClass();syncLateControls();syncCoreStatus()}finally{applying=false}
  }

  const observer=typeof MutationObserver!=='undefined'?new MutationObserver(sync):null;
  if(observer&&document.body)observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  window.addEventListener('de:languagechange',()=>requestAnimationFrame(sync));
  setInterval(sync,250);
  sync();
  window.__DE_I18N_RUNTIME_V1={version:'v2',sync,syncClassCards,syncCurrentClass,syncLateControls,syncHelp,syncFooter,syncAccessibility};
})();
