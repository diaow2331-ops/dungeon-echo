function sceneProgress(idx=sceneIndex){const s=scenes[Math.max(0,idx)];return Math.max(0,Math.min(1,(runDistance-s.from)/(s.to-s.from)))}
function updateScene(force=false){
  const idx=currentSceneIndex();if(!force&&idx===sceneIndex)return;
  previousSceneIndex=sceneIndex<0?idx:sceneIndex;sceneIndex=idx;sceneHalf=sceneProgress(idx)>=.5?1:0;sceneBlend=force?0:1;
  rareMoment='none';rareMomentTimer=0;meetingSuppressTimer=0;gymRushTimer=0;rareVisualPulse=0;secretMoment='none';secretMomentTimer=0;secretVisualPulse=0;
  const s=scenes[idx];sceneHud.textContent=tr(s.name)+(sceneHalf?(currentLang==='en'?' · LATE':' · 后半'):'');sceneToast.innerHTML=`${s.time} · ${tr(s.name)}<small>${tr(s.tag)}</small>`;updateRouteStrip();if(state==='playing'){sceneToast.classList.remove('hidden');sceneToastTimer=3.6}else{sceneToast.classList.add('hidden');sceneToastTimer=0;}
  if(!force){screenShake=Math.max(screenShake,2.5);tickerEl.textContent=currentLang==='en'?`Entering ${tr(s.name)}: ${tr(s.tag)}`:`进入 ${s.name}：${s.tag}`;tickerTimer=4.5;spawnTimer=Math.max(spawnTimer,.72);directorCooldown=Math.max(directorCooldown,1.4);alignMusicPhrase(.12)}
  updateMusicHud();updateRouteStrip();syncPresentationState();
}
function updateSceneHalf(force=false){
  const half=sceneProgress()>=.5?1:0;if(!force&&half===sceneHalf)return;sceneHalf=half;const s=scenes[Math.max(0,sceneIndex)];sceneHud.textContent=tr(s.name)+(half?(currentLang==='en'?' · LATE':' · 后半'):'');updateMusicHud();
  if(half&&!sceneHalfAnnounced[sceneIndex]){
    sceneHalfAnnounced[sceneIndex]=true;sceneToast.innerHTML=currentLang==='en'?`${s.halfTime} · ${tr(s.name)} · LATE<small>${tr(s.lateTag)}</small>`:`${s.halfTime} · ${s.name}后半<small>${s.lateTag}</small>`;sceneToast.classList.remove('hidden');sceneToastTimer=3.1;tickerEl.textContent=`${s.halfTime}: ${tr(s.lateTag)}`;tickerTimer=4.8;spawnTimer=Math.max(spawnTimer,.62);musicSting(Math.min(stageIndex,4));alignMusicPhrase(.10);
  }
}
function updateSceneToast(dt){if(sceneToastTimer>0){sceneToastTimer-=dt;if(sceneToastTimer<=0)sceneToast.classList.add('hidden')}sceneBlend=Math.max(0,sceneBlend-dt/1.05)}
function resetMessageComposer(){
  messageBtn.classList.add('hidden');messageComposer.classList.add('hidden');messageText.value='';messageName.value='';messageCount.textContent='0';messageSubmit.disabled=false;messageStatus.textContent=currentLang==='en'?'Notes are moderated before appearing publicly.':'留言提交后需审核，未审核内容不会公开。'
}
async function submitMessage(){
  if(state!=='ended'||!MESSAGE_ENABLED)return;
  const body=messageText.value.trim().slice(0,80),name=messageName.value.trim().slice(0,18);
  if(!body){messageStatus.textContent=currentLang==='en'?'Write something first.':'先写一句话再提交。';messageText.focus();return}
  messageSubmit.disabled=true;messageStatus.textContent=currentLang==='en'?'Submitting…':'正在提交…';
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{
    const headers={'Content-Type':'application/json',...(runtimeConfig.messageHeaders&&typeof runtimeConfig.messageHeaders==='object'?runtimeConfig.messageHeaders:{})};
    const res=await fetch(MESSAGE_ENDPOINT,{method:'POST',credentials:'same-origin',headers,signal:controller.signal,body:JSON.stringify({name:name||'匿名摸鱼人',body,ending:endingPhase,score:Math.floor(distance)})});
    if(!res.ok)throw new Error('submit_failed');
    messageText.value='';messageCount.textContent='0';messageStatus.textContent=currentLang==='en'?'Submitted. It may appear on the wall after moderation.':'已提交。审核通过后，才可能出现在下班留言墙。';beep(880,.05,'square',.035)
  }catch(err){messageStatus.textContent=err&&err.name==='AbortError'?(currentLang==='en'?'Submission timed out. Try again later.':'提交超时，请稍后重试。'):(currentLang==='en'?'Submission failed. Try again later.':'暂时提交失败，请稍后重试。')}
  finally{clearTimeout(timer);messageSubmit.disabled=false}
}
function reset(){
  resetMessageComposer();
  distance=0;runDistance=0;speed=350;sceneIndex=-1;previousSceneIndex=0;sceneToastTimer=0;sceneBlend=0;sceneHalf=0;sceneHalfAnnounced=[false,false,false,false];rareMoment='none';rareMomentTimer=0;rareSceneRolled=[false,false,false,false];meetingSuppressTimer=0;gymRushTimer=0;rareVisualPulse=0;secretMoment='none';secretMomentTimer=0;secretVisualPulse=0;secretSceneRolled=[false,false,false,false];secretSceneThresholds=Array.from({length:4},()=>.24+Math.random()*.52);spawnTimer=.72+Math.random()*.72;pickupTimer=2.8;worldTime=0;tickerTimer=7;combo=0;comboAge=0;stageIndex=-1;screenShake=0;milestone18=false;meetingSpawnCount=0;overtimeFlash=0;musicStep=0;lastMusicStage=-1;directorQueue=[];directorCooldown=0;lastObstacleLabel='';sameObstacleStreak=0;lastSpawnGapPx=0;tightGapStreak=0;spacingHistory=[];endingPhase='none';endingTimer=0;exitDoorX=W+80;endingResolved=false;endingCinematicTimer=0;endingCinematicType='none';endingPlayerOffset=0;endingBossX=W+100;jumpBufferTimer=0;lastGrounded=true;officeEvent='none';officeEventTimer=0;officeEventCooldown=12;eventRollTimer=8+Math.random()*5;coffeeRushRemaining=0;bossAwayTimer=0;bugPatchTimer=0;salaryFlash=0;pendingClimaxPattern='';climax17Done=false;climax1750Done=false;setEventHud('正常');tutorialActive=false;tutorialStep=0;tutorialTimer=0;tutorialToast.classList.add('hidden');
  obstacles=[];pickups=[];particles=[];floaters=[];speedLines=[];
  player.y=GROUND-player.h;player.vy=0;player.jumps=0;player.squash=0;
  scoreEl.textContent='0';speedEl.textContent='1.0';comboEl.textContent='0';clockEl.textContent='14:00';stageEl.textContent=tr('工位摸鱼');sceneHud.textContent=tr('工位区');dayProgress.style.width='0%';updateRouteStrip();
  updateStage(true);updateScene(true);updateMusicHud();
}
function start(){
  const now=performance.now();if(now-startLock<220)return;startLock=now;
  reset();runs++;storageSet('91hwl_moyu_runs',String(runs));syncStats();state='playing';overlay.classList.add('hidden');beginTutorial();last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);beep(520,.06);startMusic(true);
}
function gameOver(cause='工作'){ 
  state='gameover';duckMusic(.45,.10);stopMusic(.18);screenShake=12;const rounded=Math.floor(distance);
  if(rounded>best){best=rounded;storageSet('91hwl_moyu_best',String(best))}
  if(combo>bestCombo){bestCombo=combo;storageSet('91hwl_moyu_best_combo',String(bestCombo))}
  deathCounts[cause]=(deathCounts[cause]||0)+1;storageSet('91hwl_moyu_death_counts',JSON.stringify(deathCounts));
  if(['会议','老板','BUG','临时需求','邮件'].every(k=>(deathCounts[k]||0)>0))unlockDiscovery('allDeaths',true);
  syncStats();renderDiscoveries();if(navigator.vibrate)navigator.vibrate(45);beep(130,.16,'sawtooth',.05);
  overlayTitle.textContent=currentLang==='en'?`Made it ${rounded}m. ${tr(cause)} got you.`:`摸到 ${rounded} 米，被「${cause}」截胡。`;
  const funny=tr(causeTips[cause]||deathTips[(Math.random()*deathTips.length)|0]),coach=currentLang==='en'?(TRANSLATIONS[coachTips[cause]]||'Tip: read the next hazard before spending your second jump.'):(coachTips[cause]||'操作建议：先看清下一组障碍，再决定是否保留二段跳。'),count=deathCounts[cause]||1;
  overlayText.textContent=currentLang==='en'?`${funny}\n\n${coach}\nBest combo this run: ${combo} · Caught by ${tr(cause)} ${count} time${count===1?'':'s'}.`:`${funny}\n\n${coach}\n本局最高连摸 ${combo} 次 · 已被「${cause}」截胡 ${count} 次。`;
  startBtn.textContent=currentLang==='en'?'Try again':'再摸一次';setTimeout(()=>overlay.classList.remove('hidden'),150);
}
function togglePause(){
  if(state==='playing'){pausedFrom='playing';state='paused';stopMusic(.12);overlayTitle.textContent=currentLang==='en'?'Boss nearby. Look busy.':'老板路过，先装忙。';overlayText.textContent=currentLang==='en'?'Paused. Your escape progress is safe for now.':'游戏已暂停。你的摸鱼进度暂时安全。';startBtn.textContent=currentLang==='en'?'Resume':'继续摸鱼';overlay.classList.remove('hidden')}
  else if(state==='paused'&&pausedFrom==='playing'){state='playing';overlay.classList.add('hidden');last=performance.now();raf=requestAnimationFrame(loop);startMusic()}
}
function performJump(){
  if(player.jumps>=2)return false;
  const before=player.jumps;player.vy=before===0?-760:-650;player.jumps++;player.squash=.12;jumpBufferTimer=0;beep(player.jumps===1?520:680,.045);
  if(tutorialActive&&tutorialStep===1&&before===0)setTutorial(2);
  else if(tutorialActive&&tutorialStep===2&&before===1){setTutorial(3);tutorialTimer=3.2;storageSet('91hwl_moyu_tutorial_done','1');tutorialDone=true}
  for(let i=0;i<7;i++)particles.push({x:player.x+10+Math.random()*24,y:GROUND-6,vx:-20-Math.random()*100,vy:-10-Math.random()*70,a:1,r:2+Math.random()*3,c:'#8e877d'});
  return true
}
function jump(){
  if(state==='menu'||state==='gameover'||state==='ended'){start();return}if(state==='ending')return;if(state!=='playing')return;
  if(endingPhase==='decision'){resolveEnding('ontime');return}
  if(performJump())return;
  // 如果玩家在即将落地前已经按下跳跃，短暂记住这次输入；落地瞬间自动执行下一跳。
  const feet=player.y+player.h,nearGround=player.vy>0&&(GROUND-feet)<58;if(nearGround)jumpBufferTimer=JUMP_BUFFER_WINDOW
}

