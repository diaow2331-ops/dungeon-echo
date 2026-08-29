function currentStage(){let s=stages[0];for(const st of stages)if(runDistance>=st.from)s=st;return s}
function updateStage(force=false){
  let idx=0;for(let i=0;i<stages.length;i++)if(runDistance>=stages[i].from)idx=i;
  if(force||idx!==stageIndex){
    const changed=idx!==stageIndex;stageIndex=idx;const s=stages[idx];stageEl.textContent=tr(s.name);tickerEl.textContent=tr(s.msg);updateRouteStrip();tickerTimer=5;addFloater(player.x+110,115,tr(s.name),idx===5?'#b84832':'#171717');updateMusicHud();
    if(changed&&!force){
      beep(760,.08,'triangle');screenShake=4;musicSting(idx);lastMusicStage=idx;
      if(idx===3&&!climax17Done){climax17Done=true;pendingClimaxPattern='17点加速';spawnTimer=Math.max(spawnTimer,1.05);tickerEl.textContent=currentLang==='en'?'17:00. Requests, emails and BUGs start hunting together.':'17:00。临时需求、邮件和 BUG 开始一起找你。';tickerTimer=5.5}
      if(idx===4&&!climax1750Done){climax1750Done=true;pendingClimaxPattern='最后十分钟';spawnTimer=Math.max(spawnTimer,1.20);tickerEl.textContent=currentLang==='en'?'17:50. Last ten minutes—do not collapse at the exit.':'17:50。最后十分钟——别在门口倒下。';tickerTimer=5.5}
    }
  }
}
function chooseObstacle(){
  // 复制权重后再做“反重复”衰减，避免 BUG/老板连续排成机械节拍。
  const weights={...currentStage().weights};
  // 同一场景前后半的生态不同：后半段不是简单加速，而是换一种压力来源。
  if(sceneHalf){
    if(sceneIndex===0){weights['老板']*=1.38;weights['临时需求']*=1.45;weights['邮件']=(weights['邮件']||0)+.55;weights['BUG']*=.94}
    else if(sceneIndex===1){weights['会议']*=.90;weights['邮件']*=1.65;weights['老板']*=1.18;weights['临时需求']*=1.30}
    else if(sceneIndex===2){weights['老板']*=1.48;weights['咖啡渍']*=1.32;weights['临时需求']*=1.28;weights['BUG']*=.88}
    else if(sceneIndex===3){weights['BUG']*=1.22;weights['临时需求']*=1.28;weights['邮件']*=1.25;weights['哑铃']*=1.12}
  }
  if(bossAwayTimer>0&&weights['老板']>0)weights['老板']*=.05;if(meetingSuppressTimer>0&&weights['会议']>0)weights['会议']*=.04;
  if(lastObstacleLabel&&weights[lastObstacleLabel]>0){weights[lastObstacleLabel]*=sameObstacleStreak>=2?.16:.46}
  let sum=0;for(const k in weights)sum+=weights[k];let r=Math.random()*sum,label='BUG';
  for(const k in weights){r-=weights[k];if(r<=0){label=k;break}}
  if(runDistance<170&&(label==='会议'||label==='临时需求'||label==='邮件'))label=Math.random()<.58?'BUG':'老板';
  return label;
}
function rand(a,b){return a+Math.random()*(b-a)}
function sampleNormalGapPx(spawned){
  // 三档“呼吸节奏”：短压迫 / 正常 / 长空档。随进度推进，短间距概率上升，但长空档永远保留。
  let bands;
  if(runDistance<360){bands=[{w:.24,a:420,b:540},{w:.47,a:590,b:760},{w:.29,a:840,b:1110}]}
  else if(runDistance<1050){bands=[{w:.31,a:380,b:500},{w:.48,a:540,b:710},{w:.21,a:760,b:980}]}
  else if(runDistance<1800){bands=[{w:.36,a:350,b:470},{w:.46,a:500,b:660},{w:.18,a:710,b:900}]}
  else{bands=[{w:.42,a:330,b:445},{w:.43,a:475,b:625},{w:.15,a:680,b:840}]}
  // 连续两次短间距以后强制给一次喘息，随机但不恶意。
  if(tightGapStreak>=2)bands=[{w:0,a:0,b:0},{w:.18,a:600,b:720},{w:.82,a:790,b:1040}];
  let pick=Math.random(),band=bands[bands.length-1],acc=0;
  for(const x of bands){acc+=x.w;if(pick<=acc){band=x;break}}
  let gap=rand(band.a,band.b);
  // 危险/大体积机制自动多留空间。
  if(spawned.label==='会议')gap+=150;
  else if(spawned.label==='临时需求')gap+=120;
  else if(spawned.label==='老板'&&spawned.rush)gap+=55;
  else if(spawned.label==='邮件')gap+=25;
  else if(spawned.label==='咖啡渍')gap+=70;
  else if(spawned.label==='哑铃')gap+=35;
  // 避免连续两次“几乎同一个数字”，这是之前看起来像固定间距的主要视觉原因之一。
  if(lastSpawnGapPx&&Math.abs(gap-lastSpawnGapPx)<85){gap+=Math.random()<.5?-rand(90,155):rand(90,175)}
  // 前半略多呼吸，后半略收紧，但保留原有随机带宽与呼吸保护。
  gap+=sceneHalf?-18:32;
  if(gymRushTimer>0)gap+=125;gap=Math.max(315,gap);
  const tightThreshold=runDistance<900?520:470;tightGapStreak=gap<tightThreshold?tightGapStreak+1:0;
  lastSpawnGapPx=gap;spacingHistory.push(Math.round(gap));if(spacingHistory.length>14)spacingHistory.shift();
  return gap;
}
function minimumPairGapPx(prev,next){
  if(!prev)return 315;
  const vertical=new Set(['会议','邮件','临时需求']);
  let min=315;
  if(prev==='会议'||next==='会议')min=Math.max(min,610);
  if(prev==='临时需求'||next==='临时需求')min=Math.max(min,575);
  if(prev==='邮件'&&next==='老板')min=Math.max(min,500);
  if(prev==='老板'&&next==='邮件')min=Math.max(min,510);
  if(prev==='咖啡渍'&&vertical.has(next))min=Math.max(min,540);
  if(prev==='哑铃'&&next==='邮件')min=Math.max(min,505);
  if(vertical.has(prev)&&vertical.has(next))min=Math.max(min,585);
  if(prev==='BUG'&&next==='邮件')min=Math.max(min,455);
  return min
}
function enforcePairGapPx(gapPx,prev,next){return Math.max(gapPx,minimumPairGapPx(prev,next))}
function delayForClearGap(gapPx,spawned){
  // 下一障碍从同一出生线进入，因此 delay * speed - 当前宽度 ≈ 实际净空。
  // 速度变化很缓慢，这个换算比“固定秒数”稳定得多。
  return Math.max(.62,(gapPx+Math.max(36,spawned.w))/Math.max(300,speed));
}
function maybeQueueDirectorPattern(){
  if(directorQueue.length)return false;
  if(pendingClimaxPattern){
    const picked=climaxPatterns[pendingClimaxPattern];
    // 老板离席事件期间，不让高潮导演偷偷把老板叫回来；事件结束后再执行该组合。
    if(picked&&bossAwayTimer>0&&picked.seq.some(x=>x.label==='老板'))return false;
    pendingClimaxPattern='';
    if(picked){directorQueue=picked.seq.map(x=>({label:x.label,gapPx:x.gapPx,pattern:picked.name}));directorCooldown=10;return true}
  }
  if(directorCooldown>0||stageIndex<1||runDistance<700)return false;
  let chance=stageIndex>=4?.22:(stageIndex>=3?.18:.13);if(stageIndex<4)chance*=sceneHalf?1.22:.72;if(Math.random()>chance)return false;
  let available=directorPatterns.filter(p=>p.minStage<=stageIndex);
  if(bossAwayTimer>0)available=available.filter(p=>!p.seq.some(x=>x.label==='老板'));
  if(!available.length)return false;
  const picked=available[(Math.random()*available.length)|0];directorQueue=picked.seq.map(x=>({label:x.label,gapPx:x.gapPx,pattern:picked.name}));directorCooldown=8.5;return true;
}
function spawnObstacle(forcedLabel=null){
  const label=forcedLabel||chooseObstacle(),k=obstacleKinds[label];
  let x=W+35,y=k.air?(k.minY+Math.random()*(k.maxY-k.minY)):(GROUND-k.h);
  if(k.drop){x=760+Math.random()*320;y=-90}
  if(k.gate){y=286}
  const obstacle={x,y,w:k.w,h:k.h,label,passed:false,air:!!k.air,gate:!!k.gate,drop:!!k.drop,variant:(Math.random()*3)|0};
  if(obstacle.air){obstacle.baseY=y;obstacle.wave=Math.random()*6.28;obstacle.waveAmp=8+Math.random()*14;obstacle.waveSpeed=2.1+Math.random()*1.6}
  if(label==='老板'){obstacle.rush=Math.random()<0.45;obstacle.rushTriggered=false;obstacle.rushWarnTimer=0;obstacle.rushTimer=0;obstacle.extraSpeed=210+Math.random()*90}
  if(label==='BUG'){obstacle.mutation=bugPatchTimer>0?'none':(Math.random()<.78?(Math.random()<.5?'tall':'long'):'none');obstacle.mutationState='idle';obstacle.mutationTimer=0;obstacle.baseW=k.w;obstacle.baseH=k.h;obstacle.targetW=k.w;obstacle.targetH=k.h}
  if(label==='临时需求'){obstacle.dropState='warning';obstacle.warning=.62;obstacle.vy=0;obstacle.targetY=GROUND-k.h;obstacle.warningPulse=Math.random()*6.28}
  if(label==='会议'){
    meetingSpawnCount++;const first=meetingSpawnCount===1;
    const gapSize=first?210:(stageIndex===1?(sceneHalf?194:204):(stageIndex<=3?194:(stageIndex===4?190:186)));
    const gapCenter=394;obstacle.y=220;obstacle.gapTop=gapCenter-gapSize/2;obstacle.gapBottom=gapCenter+gapSize/2;obstacle.panelH=obstacle.gapTop-obstacle.y;obstacle.tableH=GROUND-obstacle.gapBottom;obstacle.gatePulse=Math.random()*6.28;obstacle.firstGate=first;obstacle.tutorialShown=false
  }
  if(label===lastObstacleLabel)sameObstacleStreak++;else{lastObstacleLabel=label;sameObstacleStreak=1}
  obstacles.push(obstacle);return obstacle
}
function spawnPickup(){pickups.push({x:W+35,y:GROUND-115-Math.random()*110,w:32,h:40,spin:Math.random()*6.28,got:false})}
function hit(a,b,p=0){return a.x+p<b.x+b.w-p&&a.x+a.w-p>b.x+p&&a.y+p<b.y+b.h-p&&a.y+a.h-p>b.y+p}
function collisionRects(o){
  if(o.label==='临时需求'&&o.dropState==='warning')return [];
  if(o.label==='会议'){
    const padX=12,padY=7;
    return [
      {x:o.x+padX,y:o.y+padY,w:o.w-padX*2,h:Math.max(8,o.gapTop-o.y-padY-5)},
      {x:o.x+padX,y:o.gapBottom+5,w:o.w-padX*2,h:Math.max(8,GROUND-o.gapBottom-5)}
    ];
  }
  const px=o.label==='邮件'?7:6,py=o.label==='咖啡渍'?4:5;
  return [{x:o.x+px,y:o.y+py,w:Math.max(6,o.w-px*2),h:Math.max(6,o.h-py-4)}]
}
function playerHitbox(){return {x:player.x+PLAYER_HIT.left,y:player.y+PLAYER_HIT.top,w:player.w-PLAYER_HIT.left-PLAYER_HIT.right,h:player.h-PLAYER_HIT.top-PLAYER_HIT.bottom}}

function addFloater(x,y,text,color='#171717'){floaters.push({x,y,text,a:1,vy:-34,color})}
function passObstacle(o){
  o.passed=true;combo++;comboAge=0;comboEl.textContent=combo;
  const baseBonus=Math.min(45,8+combo*2);
