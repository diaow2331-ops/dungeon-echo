const langParam=new URLSearchParams(location.search).get('lang');
let currentLang=(langParam==='en'||langParam==='zh')?langParam:(storageGet(LANG_KEY)||(navigator.language||'zh').toLowerCase().startsWith('zh')?'zh':'en');
const tr=value=>currentLang==='en'?(TRANSLATIONS[String(value)]||String(value)):String(value);
const ui=key=>UI_I18N[key]?.[currentLang]||key;
const localizedName=obj=>currentLang==='en'?(TRANSLATIONS[obj?.name]||obj?.name||''):(obj?.name||'');
function applyLanguage(persist=true){
  document.documentElement.lang=currentLang==='en'?'en':'zh-CN';document.documentElement.dataset.lang=currentLang;
  document.title=currentLang==='en'?'Clock Out Alive · 91HWL Web Toy':'摸鱼到下班 · 91HWL Web Toy';
  document.querySelector('meta[name=description]')?.setAttribute('content',currentLang==='en'?'Clock Out Alive: survive the office from 14:00 to 18:00 in a browser-native office escape runner.':'摸鱼到下班：从 14:00 撑到 18:00 的办公室跑酷 Web Toy。');
  document.querySelectorAll('[data-i18n]').forEach(el=>{const v=ui(el.dataset.i18n);if(v.includes('<br>'))el.innerHTML=v;else el.textContent=v});
  langBtn.textContent=currentLang==='en'?'中文':'EN';langBtn.setAttribute('aria-label',currentLang==='en'?'切换到中文':'Switch to English');
  if(persist)storageSet(LANG_KEY,currentLang);
  messageName.previousElementSibling.textContent=currentLang==='en'?'Display name (optional)':'展示昵称（可留空）';
  messageText.previousElementSibling.textContent=currentLang==='en'?'Leave a note':'留一句话';
  messageName.placeholder=currentLang==='en'?'e.g. Definitely leaving on time':'例如：今晚不加班的人';
  messageText.placeholder=currentLang==='en'?'Up to 80 characters. Moderated before appearing publicly.':'最多 80 字。留言提交后进入审核，通过后才可能出现在下班留言墙。';
  messageSubmit.textContent=currentLang==='en'?'Submit for review':'提交审核';
  syncAudioControls();updateMusicHud();renderDiscoveries();updateRouteStrip();
  if(state==='menu'){overlayTitle.textContent=ui('heroTitle');overlayText.textContent=ui('heroText');startBtn.textContent=ui('start')}
  else if(state==='paused'){overlayTitle.textContent=currentLang==='en'?'Boss nearby. Look busy.':'老板路过，先装忙。';overlayText.textContent=currentLang==='en'?'Paused. Your escape progress is safe for now.':'游戏已暂停。你的摸鱼进度暂时安全。';startBtn.textContent=currentLang==='en'?'Resume':'继续摸鱼'}
  updateStage(true);updateScene(true);draw();
}
function toggleLanguage(){currentLang=currentLang==='en'?'zh':'en';applyLanguage(true)}
function updateRouteStrip(){if(!routeStrip)return;routeStrip.querySelectorAll('[data-route]').forEach(el=>{const i=Number(el.dataset.route);const active=(endingPhase==='decision'||endingPhase==='ontime'||endingPhase==='overtime')?i===4:i===Math.min(3,Math.max(0,sceneIndex));const done=(endingPhase!=='none')?i<4:i<Math.max(0,sceneIndex);el.classList.toggle('active',active);el.classList.toggle('done',done)})}
function syncPresentationState(){
  document.documentElement.dataset.gameState=state;
  const pressure=stageIndex>=4?'climax':(stageIndex>=3?'high':'normal');
  frame.dataset.pressure=pressure;
  const routeIndex=(endingPhase==='decision'||endingPhase==='ontime'||endingPhase==='overtime')?4:Math.min(3,Math.max(0,sceneIndex));
  const active=routeStrip?.querySelector('.route-step.active');
  if(active&&matchMedia('(max-width:700px)').matches&&state==='playing'&&syncPresentationState.routeIndex!==routeIndex){
    const left=active.offsetLeft-routeStrip.clientWidth*.12;routeStrip.scrollTo({left,behavior:'smooth'});
  }
  syncPresentationState.routeIndex=routeIndex;
}

const runtimeConfig=(window.MOYU_CONFIG&&typeof window.MOYU_CONFIG==='object')?window.MOYU_CONFIG:{};
const MESSAGE_ENDPOINT=typeof runtimeConfig.messageEndpoint==='string'?runtimeConfig.messageEndpoint.trim():'';
const MESSAGE_ENABLED=Boolean(MESSAGE_ENDPOINT);
const DEBUG_MODE=new URLSearchParams(location.search).get('debug')==='1';

const W=1200,H=620,GROUND=505,DPR_LIMIT=2,DAY_END_DISTANCE=2200;
const PLAYER_HIT={left:10,right:10,top:7,bottom:6},JUMP_BUFFER_WINDOW=.12;
let last=0,raf=0,startLock=0,state='menu',distance=0,runDistance=0,speed=350,spawnTimer=0,pickupTimer=0,worldTime=0,tickerTimer=0;
let obstacles=[],pickups=[],particles=[],floaters=[],speedLines=[];
let combo=0,comboAge=0,stageIndex=-1,screenShake=0,milestone18=false,pausedFrom=null,meetingSpawnCount=0,overtimeFlash=0,directorQueue=[],directorCooldown=0,lastObstacleLabel='',sameObstacleStreak=0,lastSpawnGapPx=0,tightGapStreak=0,spacingHistory=[];
let officeEvent='none',officeEventTimer=0,officeEventCooldown=12,eventRollTimer=9,coffeeRushRemaining=0,bossAwayTimer=0,bugPatchTimer=0,salaryFlash=0,pendingClimaxPattern='',climax17Done=false,climax1750Done=false;
let endingPhase='none',endingTimer=0,exitDoorX=W+80,endingResolved=false,endingCinematicTimer=0,endingCinematicType='none',endingPlayerOffset=0,endingBossX=W+100;
let soundOn=storageGet('91hwl_moyu_sound')==='1',audioCtx=null,sfxGain=null,musicGain=null,musicCompressor=null,musicTimer=null,nextMusicStepAt=0,musicStep=0,noiseBuffer=null,lastMusicStage=-1;
let jumpBufferTimer=0,lastGrounded=true;
let musicVolume=Math.max(0,Math.min(100,storedNumber('91hwl_moyu_music_vol',30)));
let sfxVolume=Math.max(0,Math.min(100,storedNumber('91hwl_moyu_sfx_vol',85)));
let best=Math.max(0,storedNumber('91hwl_moyu_best',0));
let bestCombo=Math.max(0,storedNumber('91hwl_moyu_best_combo',0));
let runs=Math.max(0,storedNumber('91hwl_moyu_runs',0));
let onTimeEndings=Math.max(0,storedNumber('91hwl_moyu_ontime_endings',0));
let overtimeEndings=Math.max(0,storedNumber('91hwl_moyu_overtime_endings',0));
let tutorialDone=storageGet('91hwl_moyu_tutorial_done')==='1',tutorialActive=false,tutorialStep=0,tutorialTimer=0;
let sceneIndex=-1,previousSceneIndex=0,sceneToastTimer=0,sceneBlend=0,sceneHalf=0,sceneHalfAnnounced=[false,false,false,false];
let rareMoment='none',rareMomentTimer=0,rareSceneRolled=[false,false,false,false],meetingSuppressTimer=0,gymRushTimer=0,rareVisualPulse=0;
let secretMoment='none',secretMomentTimer=0,secretVisualPulse=0,secretSceneRolled=[false,false,false,false],secretSceneThresholds=[.5,.5,.5,.5];
let deathCounts={};try{deathCounts=JSON.parse(storageGet('91hwl_moyu_death_counts')||'{}')||{}}catch{deathCounts={}}
let discoveries=new Set();try{discoveries=new Set(JSON.parse(storageGet('91hwl_moyu_discoveries')||'[]'))}catch{discoveries=new Set()}
const player={x:150,y:GROUND-66,w:44,h:66,vy:0,jumps:0,squash:0};

const scenes=[
  {from:0,to:550,name:'工位区',time:'14:00–15:00',halfTime:'14:30',tag:'先把今天的活装作已经做完。',lateTag:'工位开始躁动：老板巡视和临时需求正在抬头。'},
  {from:550,to:1100,name:'会议室',time:'15:00–16:00',halfTime:'15:30',tag:'摄像头开着，人可以不在状态。',lateTag:'会议开始拉长：邮件和插话明显变多。'},
  {from:1100,to:1650,name:'茶水间',time:'16:00–17:00',halfTime:'16:30',tag:'咖啡续命，老板也可能突然出现。',lateTag:'喘息结束：咖啡渍更多，老板开始来找人。'},
  {from:1650,to:2200,name:'员工健身房',time:'17:00–18:00',halfTime:'17:30',tag:'最后一小时，所有人都开始加速。',lateTag:'冲刺训练：组合障碍和催命邮件开始加密。'}
];
const stages=[
  {from:0,name:'工位摸鱼',msg:'14:00 · 工位区：先处理 BUG，顺便假装很忙。',weights:{'老板':2,'会议':1,'BUG':4,'临时需求':1,'邮件':0,'咖啡渍':0,'哑铃':0}},
  {from:550,name:'会议室脱身',msg:'15:00 · 会议室：摄像头已开启，别把二段跳浪费在桌子上。',weights:{'老板':2,'会议':5,'BUG':1,'临时需求':1,'邮件':2,'咖啡渍':0,'哑铃':0}},
  {from:1100,name:'茶水间喘息',msg:'16:00 · 茶水间：咖啡更多，但地上也更滑。',weights:{'老板':4,'会议':1,'BUG':2,'临时需求':2,'邮件':1,'咖啡渍':4,'哑铃':0}},
  {from:1650,name:'健身房冲刺',msg:'17:00 · 员工健身房：哑铃、邮件和临时需求一起上强度。',weights:{'老板':3,'会议':0.5,'BUG':3,'临时需求':4,'邮件':3,'咖啡渍':0,'哑铃':4}},
  {from:2108,name:'最后十分钟',msg:'17:50。最后十分钟——别在门口倒下。',weights:{'老板':4,'会议':0.4,'BUG':4,'临时需求':5,'邮件':3,'咖啡渍':0,'哑铃':4}},
  {from:2200,name:'18:00',msg:'18:00。门开了。',weights:{'老板':0,'会议':0,'BUG':0,'临时需求':0,'邮件':0,'咖啡渍':0,'哑铃':0}}
];
const obstacleKinds={
  '老板':{w:60,h:92},'会议':{w:136,h:210,gate:true},'BUG':{w:56,h:38,mutant:true},'临时需求':{w:84,h:56,drop:true},'邮件':{w:60,h:32,air:true,minY:250,maxY:360},'咖啡渍':{w:118,h:17},'哑铃':{w:68,h:30}
};
const tickerMessages=[
  '行政：冰箱里过期三天以上的食物今晚统一清理。',
  '同事小窗：你刚刚是不是在看网页？',
  '群公告：请大家及时填写今日工时。',
  '产品经理正在输入中……',
  '老板撤回了一条消息。',
  '开发群：谁动了线上环境？',
  '测试：我这边有一个“偶现”的问题。',
  '同事：晚上有空吗？有个小需求。',
  '你收到一封标题为「紧急」的邮件。',
  '邮箱：未读邮件 99+。',
  'HR：今晚的团建问卷还没填。'
];
const deathTips=[
  '你被抓住了，但需求依然没有因此减少。',
