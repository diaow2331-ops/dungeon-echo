  '老板没有消失，他只是终于滚进了碰撞箱。',
  '摸鱼失败。建议明天换一个更大的显示器。',
  '你试图假装在调试，但控制台甚至没打开。'
];
const causeTips={
  '会议':'你没挤进会议缝。好消息是，下一场会依然会照常召开。',
  '老板':'突击检查成功。老板确认你确实有屏幕。',
  'BUG':'BUG 完成了变异，你没有。',
  '临时需求':'临时需求精准落在了你的下班计划上。',
  '邮件':'催命邮件成功命中，未读数量仍然是 99+。',
  '咖啡渍':'你踩进了茶水间最危险的东西：没人愿意擦的咖啡。',
  '哑铃':'健身房提醒你：摸鱼也需要核心力量。'
};
const coachTips={
  '会议':'操作建议：看到绿色安全区后用一次普通跳跃控制高度；会议不是越跳越高越安全。',
  '老板':'操作建议：出现“突击检查”提示就提前起跳，别等老板完成加速以后再反应。',
  'BUG':'操作建议：红色感叹号出现后先看它要长高还是拉长，再决定二段跳和落点。',
  '临时需求':'操作建议：先看地面的红色虚线落点。需求下落前没有碰撞，不需要提前慌跳。',
  '邮件':'操作建议：先判断邮件高度。能从下面跑就别跳；需要跳时也尽量保留第二段。',
  '咖啡渍':'操作建议：咖啡渍很低但很长，提前单跳即可，不要太早落地。',
  '哑铃':'操作建议：哑铃不高，普通跳足够；把二段留给紧接着的空中邮件。'
};
const discoveryDefs=[
  {id:'bossAway',name:'老板离席'},
  {id:'coffeeRush',name:'咖啡补货'},
  {id:'bugPatch',name:'补丁上线'},
  {id:'salary',name:'工资到账'},
  {id:'nearMiss',name:'擦边而过'},
  {id:'combo10',name:'十连摸'},
  {id:'ontime',name:'准点下班'},
  {id:'overtime',name:'“自愿”加班'},
  {id:'allDeaths',name:'全勤受害者'},
  {id:'rareAllHands',name:'全员开会'},
  {id:'rareProjector',name:'投影仪蓝屏'},
  {id:'rareCoffee',name:'咖啡机暴走'},
  {id:'rareTreadmill',name:'跑步机失控'}
];
const rareMomentDefs=[
  {id:'allHands',discovery:'rareAllHands',scene:0,name:'全员开会',dur:5.2,msg:'稀有场景：全员都被叫去开会了。工位区突然安静得可怕。'},
  {id:'projector',discovery:'rareProjector',scene:1,name:'投影仪蓝屏',dur:5.4,msg:'稀有场景：投影仪蓝屏。主持人正在研究 HDMI，会议短暂失去战斗力。'},
  {id:'coffeeMachine',discovery:'rareCoffee',scene:2,name:'咖啡机暴走',dur:5.6,msg:'稀有场景：咖啡机开始疯狂出杯。今天至少机器站在你这边。'},
  {id:'treadmill',discovery:'rareTreadmill',scene:3,name:'跑步机失控',dur:4.8,msg:'稀有场景：跑步机突然加速。办公室健身房决定替老板催你下班。'}
];
// 真正隐藏的背景演出：极低概率、纯视觉，不改变碰撞/得分，也不占用事件 HUD。
const secretMomentDefs=[
  {id:'deskCat',scene:0,dur:5.2},
  {id:'meetingMute',scene:1,dur:5.0},
  {id:'fridgeNote',scene:2,dur:5.5},
  {id:'bossCardio',scene:3,dur:5.4}
];
// 轻量“导演”组合：把已经学会的机制按可解节奏串起来，不制造随机无解局面。
const directorPatterns=[
  // gapPx 表示当前障碍与下一障碍之间希望保留的“净空像素”，不再依赖当时帧率/速度。
  {minStage:1,name:'会议余波',seq:[{label:'会议',gapPx:650},{label:'BUG',gapPx:null}]},
  {minStage:2,name:'邮件巡逻',seq:[{label:'邮件',gapPx:500},{label:'老板',gapPx:null}]},
  {minStage:2,name:'茶水间惊魂',seq:[{label:'咖啡渍',gapPx:590},{label:'老板',gapPx:null}]},
  {minStage:3,name:'健身训练',seq:[{label:'哑铃',gapPx:500},{label:'邮件',gapPx:null}]},
  {minStage:3,name:'需求追击',seq:[{label:'临时需求',gapPx:620},{label:'BUG',gapPx:null}]},
  {minStage:4,name:'下班连环',seq:[{label:'BUG',gapPx:450},{label:'邮件',gapPx:500},{label:'老板',gapPx:null}]}
];

const climaxPatterns={
  '17点加速':{name:'17点加速',seq:[{label:'临时需求',gapPx:760},{label:'邮件',gapPx:620},{label:'BUG',gapPx:null}]},
  '最后十分钟':{name:'最后十分钟',seq:[{label:'BUG',gapPx:560},{label:'邮件',gapPx:610},{label:'老板',gapPx:null}]}
};
const officeEventDefs=[
  {id:'bossAway',name:'老板离席',minStage:1,weight:3.2,dur:7,msg:'突发事件：老板被临时叫去开会。短暂安全窗口！'},
  {id:'coffeeRush',name:'咖啡补货',minStage:0,weight:2.5,dur:7,msg:'行政：咖啡机刚补货。接下来几杯来得更勤。'},
  {id:'bugPatch',name:'补丁上线',minStage:2,weight:2.2,dur:6,msg:'开发群：紧急补丁已上线。BUG 暂时不会变异。'},
  {id:'salary',name:'工资到账',minStage:1,weight:.42,dur:2.8,msg:'叮——工资到账。摸鱼意志 +88m。'}
];

function syncStats(){bestEl.textContent=best;bestBelow.textContent=best+'m';bestComboEl.textContent=bestCombo;runsEl.textContent=runs;onTimeEndsEl.textContent=onTimeEndings;overtimeEndsEl.textContent=overtimeEndings}
function renderDiscoveries(){
  discoveryCountEl.textContent=currentLang==='en'?`Found ${discoveries.size} / ${discoveryDefs.length}`:`已发现 ${discoveries.size} / ${discoveryDefs.length}`;
  discoveryListEl.replaceChildren(...discoveryDefs.map(d=>{const el=document.createElement('span'),open=discoveries.has(d.id);el.className='discovery-chip '+(open?'unlocked':'locked');el.textContent=open?tr(d.name):'???';el.title=open?tr(d.name):(currentLang==='en'?'Keep going to discover it':'继续摸鱼可能会发现');return el}))
}
function unlockDiscovery(id,silent=false){
  if(discoveries.has(id)||!discoveryDefs.some(d=>d.id===id))return false;discoveries.add(id);storageSet('91hwl_moyu_discoveries',JSON.stringify([...discoveries]));renderDiscoveries();
  if(!silent&&state==='playing'&&endingPhase==='none'){const d=discoveryDefs.find(x=>x.id===id);tickerEl.textContent=currentLang==='en'?`Discovery +1: ${tr(d.name)}`:`发现档案 +1：${d.name}`;tickerTimer=Math.max(tickerTimer,4);addFloater(player.x+90,160,currentLang==='en'?`Found: ${tr(d.name)}`:`发现：${d.name}`,'#506b2c');beep(1046,.055,'square',.025)}return true
}
function setTutorial(step){
  tutorialStep=step;tutorialToast.classList.remove('hidden','good');
  if(step===1)tutorialToast.textContent=tr('教学 1/2 · 空格 / ↑ / 点击：跳跃');
  else if(step===2)tutorialToast.textContent=tr('教学 2/2 · 在空中再按一次：二段跳');
  else{tutorialToast.textContent=tr('教学完成 · 看预警、留第二段，活到 18:00。');tutorialToast.classList.add('good')}
}
function beginTutorial(){
  tutorialActive=!tutorialDone;tutorialTimer=0;if(!tutorialActive){tutorialToast.classList.add('hidden');sceneToast.classList.add('hidden');resetMessageComposer();return}
  setTutorial(1);spawnTimer=Math.max(spawnTimer,2.25)
}
function completeTutorial(){tutorialDone=true;tutorialActive=false;tutorialStep=0;tutorialTimer=0;storageSet('91hwl_moyu_tutorial_done','1');tutorialToast.classList.add('hidden','good')}
function updateTutorial(dt){if(!tutorialActive)return;if(tutorialStep===3){tutorialTimer-=dt;if(tutorialTimer<=0)completeTutorial()}}
syncStats();renderDiscoveries();

function resizeCanvas(){
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,DPR_LIMIT);
  const pxW=Math.max(1,Math.round(rect.width*dpr)),pxH=Math.max(1,Math.round(rect.height*dpr));
  if(canvas.width!==pxW||canvas.height!==pxH){canvas.width=pxW;canvas.height=pxH}
  ctx.setTransform(pxW/W,0,0,pxH/H,0,0);ctx.imageSmoothingEnabled=true;
}

function ensureAudio(){
  if(audioCtx)return true;
  try{
    audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    sfxGain=audioCtx.createGain();musicGain=audioCtx.createGain();musicCompressor=audioCtx.createDynamicsCompressor();
    sfxGain.gain.value=.95*(sfxVolume/100);musicGain.gain.value=.0001;
    musicCompressor.threshold.value=-18;musicCompressor.knee.value=12;musicCompressor.ratio.value=5;musicCompressor.attack.value=.003;musicCompressor.release.value=.12;
    sfxGain.connect(audioCtx.destination);musicGain.connect(musicCompressor);musicCompressor.connect(audioCtx.destination);
    const len=Math.max(1,Math.floor(audioCtx.sampleRate*.7));noiseBuffer=audioCtx.createBuffer(1,len,audioCtx.sampleRate);const data=noiseBuffer.getChannelData(0);for(let i=0;i<len;i++)data[i]=Math.random()*2-1;
    return true;
  }catch{return false}
}
function musicTargetLevel(){return Math.max(.0001,.72*(musicVolume/100))}
function sfxTargetLevel(){return Math.max(0,.95*(sfxVolume/100))}
function applyAudioLevels(persist=true){
  musicVolume=Math.max(0,Math.min(100,Number(musicVolEl.value)||0));sfxVolume=Math.max(0,Math.min(100,Number(sfxVolEl.value)||0));
  musicVolOut.textContent=musicVolume+'%';sfxVolOut.textContent=sfxVolume+'%';
  if(persist){storageSet('91hwl_moyu_music_vol',String(musicVolume));storageSet('91hwl_moyu_sfx_vol',String(sfxVolume))}
  if(audioCtx){
    const now=audioCtx.currentTime;sfxGain.gain.cancelScheduledValues(now);sfxGain.gain.setTargetAtTime(sfxTargetLevel(),now,.025);
    if(soundOn){musicGain.gain.cancelScheduledValues(now);musicGain.gain.setTargetAtTime(musicTargetLevel(),now,.035)}
  }
}
function syncAudioControls(){musicVolEl.value=String(musicVolume);sfxVolEl.value=String(sfxVolume);musicVolOut.textContent=musicVolume+'%';sfxVolOut.textContent=sfxVolume+'%'}
