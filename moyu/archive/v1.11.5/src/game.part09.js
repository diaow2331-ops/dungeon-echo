    overlayTitle.textContent=currentLang==='en'?'Ending 1: Clocked out on time.':'结局一：准点下班。';overlayText.textContent=currentLang==='en'?`18:00. You pretended not to hear “hold on everyone” and slipped out before the door closed. Escape distance: ${rounded}m. Tomorrow’s requests belong to tomorrow.`:`18:00，你假装没听见“大家等一下”，在门关上前冲了出去。今日摸鱼 ${rounded} 米。明天的需求，明天再说。`;
    for(let i=0;i<30;i++)particles.push({x:player.x+35+Math.random()*150,y:GROUND-60-Math.random()*110,vx:100+Math.random()*220,vy:-70-Math.random()*180,a:1.4,r:2+Math.random()*4,c:['#d8ef9f','#f2c4ad','#d7ecfb','#f0d487'][i%4]});
  }else{
    overtimeEndings++;storageSet('91hwl_moyu_overtime_endings',String(overtimeEndings));unlockDiscovery('overtime',true);endingJingle('overtime');overtimeFlash=3.5;
    overlayTitle.textContent=currentLang==='en'?'Ending 2: “Voluntary” overtime.':'结局二：“自愿”加班。';overlayText.textContent=currentLang==='en'?`18:00:04. The boss asks, “No objections, right?” You stay silent for four seconds. The system records consent. Escape distance: ${rounded}m. Overtime willingness: 100% (system decision).`:`18:00:04，老板问“大家没意见吧？”。你沉默了四秒，系统自动识别为同意。今日摸鱼 ${rounded} 米，加班意愿：100%（系统判定）。`;
  }
  syncStats();renderDiscoveries();last=performance.now()
}
function updateEndingCinematic(dt){
  endingCinematicTimer=Math.max(0,endingCinematicTimer-dt);worldTime+=dt;screenShake=Math.max(0,screenShake-dt*20);
  if(endingCinematicType==='ontime'){
    const target=Math.max(260,exitDoorX-player.x+95);endingPlayerOffset+=(target-endingPlayerOffset)*Math.min(1,dt*4.8);exitDoorX-=42*dt;
    if(Math.random()<dt*18)particles.push({x:player.x+endingPlayerOffset+20,y:GROUND-60-Math.random()*90,vx:-30+Math.random()*90,vy:-60-Math.random()*130,a:1.1,r:2+Math.random()*3,c:['#d8ef9f','#d7ecfb','#f0d487'][Math.floor(Math.random()*3)]});
  }else{
    endingBossX=Math.max(player.x+105,endingBossX-315*dt);overtimeFlash=Math.max(overtimeFlash,endingCinematicTimer*.55);
  }
  for(const d of particles){d.x+=d.vx*dt;d.y+=d.vy*dt;d.vy+=240*dt;d.a-=dt*1.5}particles=particles.filter(d=>d.a>0);
  for(const f of floaters){f.y+=f.vy*dt;f.a-=dt*.9}floaters=floaters.filter(f=>f.a>0);
  if(endingCinematicTimer<=0)finishEndingCard()
}

function updateClock(){
  const p=Math.min(1,runDistance/DAY_END_DISTANCE),mins=Math.floor(14*60+p*240),hh=Math.floor(mins/60),mm=mins%60;clockEl.textContent=String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');dayProgress.style.width=(p*100).toFixed(1)+'%';
  if(runDistance>=DAY_END_DISTANCE&&!milestone18)triggerEndingWindow();
}
function update(dt){
  if(state==='ending'){updateEndingCinematic(dt);return}
  worldTime+=dt;updateTutorial(dt);updateSceneToast(dt);
  if(endingPhase==='decision'){
    speed=390;const step=speed*dt*.012;runDistance+=step;distance+=step;endingTimer-=dt;exitDoorX-=speed*dt*.78;
    scoreEl.textContent=Math.floor(distance);speedEl.textContent=(speed/350).toFixed(1);clockEl.textContent='18:00';stageEl.textContent=currentLang==='en'?`CLOCK-OUT · ${Math.max(0,endingTimer).toFixed(1)}s`:`下班窗口 · ${Math.max(0,endingTimer).toFixed(1)}s`;
    player.y=GROUND-player.h;player.vy=0;player.jumps=0;player.squash=Math.max(0,player.squash-dt);screenShake=Math.max(0,screenShake-dt*24);
    for(const d of particles){d.x+=d.vx*dt;d.y+=d.vy*dt;d.vy+=240*dt;d.a-=dt*1.9}particles=particles.filter(d=>d.a>0);
    for(const f of floaters){f.y+=f.vy*dt;f.a-=dt*.9}floaters=floaters.filter(f=>f.a>0);
    if(endingTimer<=0||exitDoorX<player.x+20)resolveEnding('overtime');return;
  }
  speed=Math.min(820,350+runDistance*.11+(gymRushTimer>0?62:0));const step=speed*dt*.012;runDistance+=step;distance+=step;
  scoreEl.textContent=Math.floor(distance);speedEl.textContent=(speed/350).toFixed(1);updateClock();if(endingPhase==='decision')return;updateStage();updateScene();updateSceneHalf();
  comboAge+=dt;if(combo>0&&comboAge>6.5){combo=0;comboEl.textContent='0';comboAge=0;addFloater(player.x+60,player.y-10,tr('连摸断了'),'#6f6a61')}
  jumpBufferTimer=Math.max(0,jumpBufferTimer-dt);lastGrounded=player.y>=GROUND-player.h-1;
  player.vy+=2150*dt;player.y+=player.vy*dt;
  if(player.y>=GROUND-player.h){const landed=!lastGrounded;player.y=GROUND-player.h;player.vy=0;player.jumps=0;if(landed)player.squash=Math.max(player.squash,.075);if(jumpBufferTimer>0)performJump()}
  player.squash=Math.max(0,player.squash-dt);
  updateRareMoment(dt);updateSecretMoment(dt);maybeTriggerOfficeEvent(dt);
  directorCooldown=Math.max(0,directorCooldown-dt);
  spawnTimer-=dt;if(spawnTimer<=0){
    if(!directorQueue.length)maybeQueueDirectorPattern();
    const plan=directorQueue.length?directorQueue.shift():null;
    const previousLabel=lastObstacleLabel;
    const spawned=spawnObstacle(plan?plan.label:null);
    let gapPx=(plan&&plan.gapPx!==null)?plan.gapPx:sampleNormalGapPx(spawned);
    gapPx=enforcePairGapPx(gapPx,previousLabel,spawned.label);
    spawnTimer=delayForClearGap(gapPx,spawned);
    if(plan&&plan.gapPx!==null){lastSpawnGapPx=gapPx;spacingHistory.push(Math.round(gapPx));if(spacingHistory.length>14)spacingHistory.shift();tightGapStreak=gapPx<(runDistance<900?520:470)?tightGapStreak+1:0}
    if(plan&&!directorQueue.length)directorCooldown=Math.max(directorCooldown,7.5)
  }
  pickupTimer-=dt;if(pickupTimer<=0){
    const entryBusy=obstacles.some(o=>o.x>W-210);
    if(coffeeRushRemaining>0){
      if(!entryBusy){spawnPickup();coffeeRushRemaining--;pickupTimer=.85+Math.random()*.55}else pickupTimer=.28;
    }else{const teaRoom=sceneIndex===2;const teaEarly=teaRoom&&sceneHalf===0;const chance=teaEarly?.94:(teaRoom?.82:.72);if(!entryBusy&&Math.random()<chance)spawnPickup();pickupTimer=(teaEarly?1.72:(teaRoom?2.35:2.8))+Math.random()*(teaEarly?1.95:(teaRoom?2.55:3.6))}
  }
  tickerTimer-=dt;if(tickerTimer<=0){
    const lateMessages=['同事小窗：还有多久下班？','群里突然安静了，所有人都在看右下角时间。','产品经理：下班前最后确认一个小问题。','邮箱：未读 99+，但你已经不想知道是什么了。'];
    const sceneMessages=[['IDE：还有 3 个 warning 被你当作不存在。','同事小窗：你刚刚是不是在看网页？'],['会议主持人：这个问题我们再展开聊五分钟。','摄像头提示：检测到你正在走神。'],['咖啡机：今日第 47 杯，建议适量。','行政：是谁把咖啡洒地上了？'],['跑步机：速度已自动提高。','同事：下班前再练最后一组？']];
    const pool=stageIndex>=4?lateMessages:[...tickerMessages,...sceneMessages[Math.max(0,sceneIndex)]];tickerEl.textContent=tr(pool[(Math.random()*pool.length)|0]);tickerTimer=7+Math.random()*7
  }
  for(const o of obstacles){
    let vx=speed;
    if(o.label==='老板'&&o.rush&&!o.rushTriggered&&o.x<760){o.rushTriggered=true;o.rushWarnTimer=.24;o.rushTimer=0;addFloater(o.x-30,o.y-18,currentLang==='en'?'BOSS SPOT CHECK!':'老板突击检查！','#9c3f2f');screenShake=Math.max(screenShake,3);duckMusic(.72,.16);beep(250,.05,'sawtooth',.03)}
    if(o.label==='老板'&&o.rushTriggered&&o.rushWarnTimer>0){o.rushWarnTimer-=dt;if(o.rushWarnTimer<=0)o.rushTimer=.46}
    if(o.label==='老板'&&o.rushTimer>0){o.rushTimer-=dt;vx+=o.extraSpeed}

    if(o.label==='BUG'&&o.mutation!=='none'&&o.mutationState==='idle'&&o.x<720){
      o.mutationState='warn';o.mutationTimer=.46;addFloater(o.x-12,o.y-14,currentLang==='en'?(o.mutation==='tall'?'BUG growing TALL!':'BUG growing LONG!'):(o.mutation==='tall'?'BUG 要长高了！':'BUG 要拉长了！'),'#9c3f2f');beep(330,.045,'square',.025)
    }
    if(o.label==='BUG'&&o.mutationState==='warn'){
      o.mutationTimer-=dt;
      if(o.mutationTimer<=0){o.mutationState='grow';o.mutationTimer=.24;o.targetH=o.mutation==='tall'?88:o.baseH;o.targetW=o.mutation==='long'?116:o.baseW;screenShake=Math.max(screenShake,3)}
    }else if(o.label==='BUG'&&o.mutationState==='grow'){
      const oldW=o.w;o.mutationTimer=Math.max(0,o.mutationTimer-dt);const k=1-Math.pow(o.mutationTimer/.24,2);o.w=o.baseW+(o.targetW-o.baseW)*k;o.h=o.baseH+(o.targetH-o.baseH)*k;o.y=GROUND-o.h;o.x-=(o.w-oldW)*.45;if(o.mutationTimer<=0)o.mutationState='done'
    }

    if(o.label==='临时需求'){
      o.warningPulse+=dt*8;
      if(o.dropState==='warning'){
        o.warning-=dt;
        if(o.warning<=0){o.dropState='fall';o.vy=80;addFloater(o.x-8,110,tr('临时需求空投！'),'#9c3f2f');beep(410,.05,'sawtooth',.03)}
      }else if(o.dropState==='fall'){
        o.vy+=1900*dt;o.y+=o.vy*dt;
        if(o.y>=o.targetY){o.y=o.targetY;o.dropState='slide';screenShake=Math.max(screenShake,4);beep(180,.06,'square',.04)}
      }else{o.x-=vx*dt}
    }else{
      o.x-=vx*dt;
    }
    if(o.air){o.wave+=dt*o.waveSpeed;o.y=o.baseY+Math.sin(o.wave)*o.waveAmp}
    if(o.label==='会议'){
      o.gatePulse+=dt*3.6;
      if(o.firstGate&&!o.tutorialShown&&o.x<820){o.tutorialShown=true;tickerEl.textContent=tr('提示：第一次会议缝已加宽，普通单跳即可稳定通过。');tickerTimer=4.5;addFloater(o.x-35,o.gapTop-12,tr('第一次会议：单跳即可'),'#506b2c')}
    }
    if(!o.passed&&o.x+o.w<player.x+3)passObstacle(o)
  }
  for(const p of pickups){p.x-=speed*dt;p.spin+=dt*5}
  obstacles=obstacles.filter(o=>o.x>-140);pickups=pickups.filter(p=>p.x>-90&&!p.got);
