  const clearance=o.y-(player.y+player.h),nearMiss=!o.air&&o.label!=='会议'&&o.label!=='临时需求'&&clearance>=-2&&clearance<=16;
  const mechanicBonus=o.label==='会议'?10:(o.label==='临时需求'?8:(o.label==='BUG'&&o.mutationState==='done'?10:0));
  const bonus=baseBonus+(nearMiss?12:0)+mechanicBonus;distance+=bonus;
  let text=currentLang==='en'?`Combo ${combo}  +${bonus}m`:`连摸 ${combo}  +${bonus}m`;
  if(o.label==='会议')text=currentLang==='en'?`Through the meeting gap! Combo ${combo}  +${bonus}m`:`穿过会议缝！连摸 ${combo}  +${bonus}m`;
  else if(o.label==='临时需求')text=currentLang==='en'?`Dodged the drop! Combo ${combo}  +${bonus}m`:`躲过空投！连摸 ${combo}  +${bonus}m`;
  else if(o.label==='BUG'&&o.mutationState==='done')text=currentLang==='en'?`Dodged mutated BUG! +${bonus}m`:`躲过变异 BUG！ +${bonus}m`;
  else if(o.label==='咖啡渍')text=currentLang==='en'?`Cleared coffee spill! Combo ${combo}  +${bonus}m`:`跨过咖啡渍！连摸 ${combo}  +${bonus}m`;
  else if(o.label==='哑铃')text=currentLang==='en'?`Cleared dumbbell! Combo ${combo}  +${bonus}m`:`跨过哑铃！连摸 ${combo}  +${bonus}m`;
  else if(nearMiss)text=currentLang==='en'?`Near miss! Combo ${combo}  +${bonus}m`:`擦边！连摸 ${combo}  +${bonus}m`;
  addFloater(player.x+65,player.y-12,text,(nearMiss||mechanicBonus)?'#9c3f2f':(combo>=8?'#9c3f2f':'#171717'));
  if(nearMiss||mechanicBonus){screenShake=Math.max(screenShake,2.5);beep(920,.045,'triangle',.025)}
  if(nearMiss)unlockDiscovery('nearMiss');if(combo>=10)unlockDiscovery('combo10');
  if(combo>bestCombo){bestCombo=combo;bestComboEl.textContent=bestCombo}
  beep(Math.min(980,430+combo*24),.035,'square',.022);
}
function collectCoffee(p){p.got=true;distance+=35;addFloater(p.x,p.y-10,currentLang==='en'?'Coffee +35m':'咖啡 +35m','#5e4a3d');beep(840,.07,'triangle',.03);screenShake=2;for(let i=0;i<14;i++)particles.push({x:p.x+16,y:p.y+18,vx:(Math.random()-.5)*210,vy:(Math.random()-.5)*180,a:1,r:2+Math.random()*3,c:'#5e4a3d'})}

function setEventHud(name='正常'){const active=name&&name!=='正常';eventHud.textContent=active?tr(name):tr('正常');eventChip.classList.toggle('hidden',!active)}
function triggerOfficeEvent(id){
  const def=officeEventDefs.find(e=>e.id===id);if(!def||endingPhase!=='none'||secretMoment!=='none')return false;
  officeEvent=id;officeEventTimer=def.dur;officeEventCooldown=18+Math.random()*10;setEventHud(def.name);unlockDiscovery(id);tickerEl.textContent=tr(def.msg);tickerTimer=Math.max(tickerTimer,5.5);
  addFloater(player.x+95,138,tr(def.name),id==='salary'?'#8a6a16':'#506b2c');beep(id==='salary'?988:720,.07,'triangle',.03);
  if(id==='bossAway')bossAwayTimer=def.dur;
  else if(id==='coffeeRush'){coffeeRushRemaining=3;pickupTimer=Math.min(pickupTimer,.42)}
  else if(id==='bugPatch'){bugPatchTimer=def.dur;for(const o of obstacles)if(o.label==='BUG'&&o.mutationState==='idle')o.mutation='none'}
  else if(id==='salary'){distance+=88;salaryFlash=1.2;for(let i=0;i<28;i++)particles.push({x:player.x+30+Math.random()*180,y:130+Math.random()*170,vx:(Math.random()-.5)*170,vy:20+Math.random()*150,a:1.2,r:2+Math.random()*3,c:i%2?'#f0d487':'#d8ef9f'})}
  return true
}
function maybeTriggerOfficeEvent(dt){
  officeEventCooldown=Math.max(0,officeEventCooldown-dt);eventRollTimer-=dt;
  bossAwayTimer=Math.max(0,bossAwayTimer-dt);bugPatchTimer=Math.max(0,bugPatchTimer-dt);salaryFlash=Math.max(0,salaryFlash-dt);
  if(officeEventTimer>0){officeEventTimer=Math.max(0,officeEventTimer-dt);if(officeEventTimer===0){officeEvent='none';setEventHud('正常')}}
  if(eventRollTimer>0||officeEvent!=='none'||rareMoment!=='none'||secretMoment!=='none'||officeEventCooldown>0||runDistance<320||stageIndex>=5||endingPhase!=='none')return;
  eventRollTimer=10+Math.random()*8;if(Math.random()>.44)return;
  let pool=officeEventDefs.filter(e=>e.minStage<=stageIndex);
  if(directorQueue.some(x=>x.label==='老板')||obstacles.some(o=>o.label==='老板'&&!o.passed))pool=pool.filter(e=>e.id!=='bossAway');
  if(!pool.length)return;let sum=pool.reduce((s,e)=>s+e.weight,0),r=Math.random()*sum,pick=pool[0];
  for(const e of pool){r-=e.weight;if(r<=0){pick=e;break}}triggerOfficeEvent(pick.id)
}

function triggerRareMoment(id){
  const def=rareMomentDefs.find(x=>x.id===id);if(!def||def.scene!==sceneIndex||endingPhase!=='none'||rareMoment!=='none'||officeEvent!=='none'||secretMoment!=='none')return false;
  rareMoment=id;rareMomentTimer=def.dur;rareVisualPulse=0;setEventHud(def.name);unlockDiscovery(def.discovery);tickerEl.textContent=tr(def.msg);tickerTimer=Math.max(tickerTimer,5.8);addFloater(player.x+100,142,tr(def.name),'#506b2c');screenShake=Math.max(screenShake,2.2);
  if(id==='allHands'){bossAwayTimer=Math.max(bossAwayTimer,def.dur);obstacles=obstacles.filter(o=>o.label!=='老板');directorCooldown=Math.max(directorCooldown,def.dur*.8);beep(660,.07,'triangle',.028)}
  else if(id==='projector'){meetingSuppressTimer=def.dur;directorCooldown=Math.max(directorCooldown,2.0);beep(220,.05,'square',.026);beep(165,.09,'square',.022)}
  else if(id==='coffeeMachine'){coffeeRushRemaining=Math.max(coffeeRushRemaining,4);pickupTimer=Math.min(pickupTimer,.18);beep(988,.06,'triangle',.028)}
  else if(id==='treadmill'){gymRushTimer=def.dur;spawnTimer=Math.max(spawnTimer,.95);directorCooldown=Math.max(directorCooldown,2.0);beep(784,.055,'square',.026)}
  return true
}
function updateRareMoment(dt){
  meetingSuppressTimer=Math.max(0,meetingSuppressTimer-dt);gymRushTimer=Math.max(0,gymRushTimer-dt);rareVisualPulse+=dt;
  if(rareMomentTimer>0){rareMomentTimer=Math.max(0,rareMomentTimer-dt);if(rareMomentTimer===0){rareMoment='none';if(officeEvent==='none')setEventHud('正常')}}
  if(endingPhase!=='none'||stageIndex>=5||rareMoment!=='none'||officeEvent!=='none'||secretMoment!=='none')return;
  const idx=Math.max(0,sceneIndex),s=scenes[idx],span=s.to-s.from,progress=(runDistance-s.from)/span;
  if(!rareSceneRolled[idx]&&progress>.38){rareSceneRolled[idx]=true;if(progress<.78&&Math.random()<.36)triggerRareMoment(rareMomentDefs[idx].id)}
}
function triggerSecretMoment(id){
  const def=secretMomentDefs.find(x=>x.id===id);if(!def||def.scene!==sceneIndex||endingPhase!=='none'||secretMoment!=='none'||rareMoment!=='none'||officeEvent!=='none')return false;
  secretMoment=id;secretMomentTimer=def.dur;secretVisualPulse=0;return true
}
function updateSecretMoment(dt){
  secretVisualPulse+=dt;if(secretMomentTimer>0){secretMomentTimer=Math.max(0,secretMomentTimer-dt);if(secretMomentTimer===0)secretMoment='none'}
  if(endingPhase!=='none'||stageIndex>=5||secretMoment!=='none'||rareMoment!=='none'||officeEvent!=='none')return;
  const idx=Math.max(0,sceneIndex),p=sceneProgress(idx);if(!secretSceneRolled[idx]&&p>=secretSceneThresholds[idx]){secretSceneRolled[idx]=true;if(Math.random()<.065)triggerSecretMoment(secretMomentDefs[idx].id)}
}

function endingJingle(type){
  if(!soundOn||!ensureAudio())return;stopMusic(.05);const now=audioCtx.currentTime+.035;
  if(type==='ontime'){
    const notes=[0,4,7,12,16];notes.forEach((n,i)=>pulse(220*Math.pow(2,n/12),now+i*.085,.13,.050,0,'sfx'));
    notes.slice(0,4).forEach((n,i)=>tri(110*Math.pow(2,n/12),now+i*.085,.18,.047,'sfx'));
  }else if(type==='overtime'){
    const notes=[12,8,5,1,-3];notes.forEach((n,i)=>pulse(196*Math.pow(2,n/12),now+i*.11,.16,.044,-3,'sfx'));
    tri(73.42,now,.62,.045,'sfx');
  }else{
    pulse(440,now,.07,.033,0,'sfx');pulse(554.37,now+.08,.07,.031,0,'sfx');pulse(659.25,now+.16,.12,.033,0,'sfx')
  }
}
function triggerEndingWindow(){
  if(endingPhase!=='none'||endingResolved)return;
  milestone18=true;endingPhase='decision';endingTimer=4.0;exitDoorX=W+70;obstacles=[];pickups=[];directorQueue=[];directorCooldown=99;spawnTimer=99;pickupTimer=99;officeEvent='none';officeEventTimer=0;rareMoment='none';rareMomentTimer=0;meetingSuppressTimer=0;gymRushTimer=0;bossAwayTimer=0;bugPatchTimer=0;setEventHud('下班！');
  clockEl.textContent='18:00';stageEl.textContent=currentLang==='en'?'18:00 · CLOCK-OUT WINDOW':'18:00 · 下班窗口';dayProgress.style.width='100%';updateRouteStrip();syncPresentationState();tickerEl.textContent=currentLang==='en'?'18:00! The door is open—Space / ↑ / click, GO!':'18:00！门开了——按 空格 / ↑ / 点击，马上冲出去！';tickerTimer=99;
  stopMusic(.08);endingJingle('decision');screenShake=5;addFloater(W/2-235,155,currentLang==='en'?'18:00! Leave now or lose the window.':'18:00！现在不走，等会儿就走不了了。','#506b2c');
}
function finishEndingCard(){
  state='ended';startBtn.textContent=currentLang==='en'?'Another day':'再摸一天';messageBtn.classList.toggle('hidden',!MESSAGE_ENABLED);messageComposer.classList.add('hidden');syncStats();renderDiscoveries();overlay.classList.remove('hidden')
}
function resolveEnding(type){
  if(endingResolved)return;endingResolved=true;endingPhase=type;endingCinematicType=type;state='ending';stopMusic(.06);const rounded=Math.floor(distance);
  if(rounded>best){best=rounded;storageSet('91hwl_moyu_best',String(best))}
  if(bestCombo<combo){bestCombo=combo}storageSet('91hwl_moyu_best_combo',String(bestCombo));
  endingPlayerOffset=0;endingBossX=W+100;endingCinematicTimer=type==='ontime'?1.55:1.75;
  if(type==='ontime'){
    onTimeEndings++;storageSet('91hwl_moyu_ontime_endings',String(onTimeEndings));unlockDiscovery('ontime',true);endingJingle('ontime');
