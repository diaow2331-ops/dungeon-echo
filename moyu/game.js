(() => {
'use strict';
const $ = id => document.getElementById(id);
const canvas=$('game'), ctx=canvas.getContext('2d',{alpha:false}), frame=$('gameFrame');
const overlay=$('overlay'), startBtn=$('startBtn'), overlayTitle=$('overlayTitle'), overlayText=$('overlayText');
const scoreEl=$('score'), speedEl=$('speed'), comboEl=$('combo'), bestEl=$('best'), bestBelow=$('bestBelow'), bestComboEl=$('bestCombo'), runsEl=$('runs'), onTimeEndsEl=$('onTimeEnds'), overtimeEndsEl=$('overtimeEnds');
const clockEl=$('clock'), stageEl=$('stage'), sceneHud=$('sceneHud'), sceneToast=$('sceneToast'), tickerEl=$('ticker'), dayProgress=$('dayProgress'), fullscreenBtn=$('fullscreenBtn'), fullscreenLabel=$('fullscreenLabel'), bgmChip=$('bgmChip'), bgmHud=$('bgmHud'), eventChip=$('eventChip'), eventHud=$('eventHud'), tutorialToast=$('tutorialToast'), discoveryCountEl=$('discoveryCount'), discoveryListEl=$('discoveryList');
const messageBtn=$('messageBtn'),messageComposer=$('messageComposer'),messageName=$('messageName'),messageText=$('messageText'),messageCount=$('messageCount'),messageSubmit=$('messageSubmit'),messageStatus=$('messageStatus'),lastRunSummaryEl=$('lastRunSummary'),topRunHistoryEl=$('topRunHistory'),dailyBtn=$('dailyBtn'),dailyBadge=$('dailyBadge'),dailyHud=$('dailyHud');
const settingsBtn=$('settingsBtn'), settingsPop=$('settingsPop'), masterSoundBtn=$('masterSoundBtn'), musicVolEl=$('musicVol'), sfxVolEl=$('sfxVol'), musicVolOut=$('musicVolOut'), sfxVolOut=$('sfxVolOut'), mixPresetBtn=$('mixPresetBtn'), langBtn=$('langBtn'), routeStrip=$('routeStrip');

const storageGet=key=>{try{return window.localStorage.getItem(key)}catch{return null}};
const storageSet=(key,value)=>{try{window.localStorage.setItem(key,String(value));return true}catch{return false}};
const storageRemove=key=>{try{window.localStorage.removeItem(key);return true}catch{return false}};
const storedNumber=(key,fallback=0)=>{const n=Number(storageGet(key));return Number.isFinite(n)?n:fallback};

const UI_I18N = {"brand":{"zh":"摸鱼到下班","en":"Clock Out Alive"},"brandMeta":{"zh":"91HWL · WEB TOY · 办公室逃班跑酷","en":"91HWL · WEB TOY · OFFICE ESCAPE RUNNER"},"home":{"zh":"← 91hwl 首页","en":"← 91hwl Home"},"settings":{"zh":"设置","en":"Settings"},"audioSettings":{"zh":"声音设置","en":"Audio"},"music":{"zh":"背景音乐","en":"Music"},"sfx":{"zh":"游戏音效","en":"SFX"},"mixPreset":{"zh":"恢复推荐 30 / 85","en":"Recommended 30 / 85"},"mixNote":{"zh":"当前推荐混音：音乐 30%，音效 85%。两者独立保存；按 M 可快速静音/恢复。","en":"Recommended mix: music 30%, SFX 85%. Saved separately. Press M to mute or restore."},"fullscreen":{"zh":"全屏","en":"Fullscreen"},"score":{"zh":"摸鱼","en":"Escape"},"speed":{"zh":"速度","en":"Speed"},"combo":{"zh":"连摸","en":"Combo"},"event":{"zh":"事件","en":"Event"},"scene":{"zh":"场景","en":"Scene"},"best":{"zh":"最高","en":"Best"},"heroTitle":{"zh":"别让老板逮到。","en":"Don't let the boss catch you."},"heroText":{"zh":"从 14:00 撑到 18:00。穿过工位区、会议室、茶水间和员工健身房，躲开工作，喝点咖啡，尽量活着看到下班。声音默认关闭，可在右上角开启原创 8-bit / Chiptune BGM。","en":"Survive the office from 14:00 to 18:00. Sprint through workstations, meetings, the pantry and the gym. Dodge work, grab coffee and reach the exit. Original 8-bit / Chiptune audio is off by default."},"start":{"zh":"开始摸鱼","en":"Start escaping"},"leaveMessage":{"zh":"写一句话","en":"Leave a note"},"controls":{"zh":"电脑：空格 / ↑ / 鼠标点击跳跃，空中可二段跳 · P / Esc 暂停 · M 快速静音<br>手机：轻触游戏画面。首次游玩会有两步无打断教学。18:00 会出现短暂「下班窗口」：及时操作可准点下班，否则将被判定为“自愿”加班。","en":"Desktop: Space / ↑ / click to jump; press again in mid-air for a double jump · P / Esc pause · M mute<br>Mobile: tap the game. First run includes a two-step tutorial. At 18:00, react during the short clock-out window—or be marked as “voluntary” overtime."},"localStats":{"zh":"本机战绩","en":"Local record"},"bestRun":{"zh":"最高摸鱼","en":"Best run"},"bestCombo":{"zh":"最佳连摸","en":"Best combo"},"runs":{"zh":"摸鱼次数","en":"Runs"},"onTime":{"zh":"准点下班","en":"On-time exits"},"overtime":{"zh":"“自愿”加班","en":"“Voluntary” OT"},"discoveries":{"zh":"发现档案","en":"Discovery file"},"discoveryNote":{"zh":"发现记录只保存在当前浏览器；未发现项目只显示为 ???。","en":"Discoveries stay in this browser. Locked entries remain ???."},"route0":{"zh":"工位区 · Workstation","en":"Workstation · survive"},"route1":{"zh":"会议室 · Meeting","en":"Meeting · slip out"},"route2":{"zh":"茶水间 · Pantry","en":"Pantry · refuel"},"route3":{"zh":"健身房 · Gym","en":"Gym · final sprint"},"route4":{"zh":"下班门 · Clock out","en":"Exit · clock out"},"messageModeration":{"zh":"提交后需审核 · 不即时公开","en":"Moderated · not published instantly"}};
const TRANSLATIONS = {"正常":"Normal","工位区":"Workstation","会议室":"Meeting room","茶水间":"PANTRY","员工健身房":"Staff gym","工位摸鱼":"Workstation drift","会议室脱身":"Escape the meeting","茶水间喘息":"Pantry breather","健身房冲刺":"Gym sprint","最后十分钟":"Last ten minutes","18:00":"18:00","老板":"Boss","会议":"Meeting","临时需求":"Last-minute request","邮件":"Email","咖啡渍":"Coffee spill","哑铃":"Dumbbell","先把今天的活装作已经做完。":"Pretend today’s work is already done.","工位开始躁动：老板巡视和临时需求正在抬头。":"The floor gets restless: boss patrols and last-minute requests increase.","摄像头开着，人可以不在状态。":"Camera on. Attention optional.","会议开始拉长：邮件和插话明显变多。":"The meeting drags on; emails and interruptions pile up.","咖啡续命，老板也可能突然出现。":"Coffee keeps you alive. The boss may still appear.","喘息结束：咖啡渍更多，老板开始来找人。":"Breather over: more spills, and the boss starts looking for you.","最后一小时，所有人都开始加速。":"Final hour. Everyone speeds up.","冲刺训练：组合障碍和催命邮件开始加密。":"Sprint training: chained hazards and urgent emails intensify.","老板离席":"Boss away","咖啡补货":"Coffee restock","补丁上线":"Patch deployed","工资到账":"Payday","擦边而过":"Near miss","十连摸":"10-hit combo","准点下班":"Clocked out on time","“自愿”加班":"“Voluntary” overtime","全勤受害者":"Full attendance victim","全员开会":"All-hands meeting","投影仪蓝屏":"Projector blue screen","咖啡机暴走":"Coffee machine frenzy","跑步机失控":"Treadmill runaway","教学 1/2 · 空格 / ↑ / 点击：跳跃":"Tutorial 1/2 · Space / ↑ / click: jump","教学 2/2 · 在空中再按一次：二段跳":"Tutorial 2/2 · Press again in mid-air: double jump","教学完成 · 看预警、留第二段，活到 18:00。":"Tutorial complete · Read warnings, save the second jump, survive to 18:00.","叮——工资到账。摸鱼意志 +88m。":"Payday! Escape morale +88m.","突发事件：老板被临时叫去开会。短暂安全窗口！":"Event: the boss got pulled into a meeting. Brief safe window!","行政：咖啡机刚补货。接下来几杯来得更勤。":"Admin: coffee restocked. More cups incoming.","开发群：紧急补丁已上线。BUG 暂时不会变异。":"Dev chat: hotfix deployed. BUGs stop mutating for a moment.","稀有场景：全员都被叫去开会了。工位区突然安静得可怕。":"Rare: everyone got called into a meeting. The floor is eerily quiet.","稀有场景：投影仪蓝屏。主持人正在研究 HDMI，会议短暂失去战斗力。":"Rare: projector blue screen. The host is fighting HDMI; the meeting is briefly harmless.","稀有场景：咖啡机开始疯狂出杯。今天至少机器站在你这边。":"Rare: the coffee machine goes berserk. At least one machine is on your side.","稀有场景：跑步机突然加速。办公室健身房决定替老板催你下班。":"Rare: the treadmill accelerates. The gym is now rushing you toward clock-out.","行政：冰箱里过期三天以上的食物今晚统一清理。":"Admin: food expired for 3+ days will be cleared tonight.","同事小窗：你刚刚是不是在看网页？":"Coworker DM: were you browsing just now?","群公告：请大家及时填写今日工时。":"Group notice: please log today’s work hours.","产品经理正在输入中……":"Product manager is typing…","老板撤回了一条消息。":"The boss unsent a message.","开发群：谁动了线上环境？":"Dev chat: who touched production?","测试：我这边有一个“偶现”的问题。":"QA: I have an “occasional” issue here.","同事：晚上有空吗？有个小需求。":"Coworker: free tonight? Tiny request.","你收到一封标题为「紧急」的邮件。":"You received an email titled “URGENT”.","邮箱：未读邮件 99+。":"Inbox: 99+ unread.","HR：今晚的团建问卷还没填。":"HR: you still haven’t filled tonight’s team-building survey.","同事小窗：还有多久下班？":"Coworker DM: how long until clock-out?","群里突然安静了，所有人都在看右下角时间。":"The group chat goes silent. Everyone is watching the clock.","产品经理：下班前最后确认一个小问题。":"PM: one last tiny thing before you leave.","邮箱：未读 99+，但你已经不想知道是什么了。":"Inbox: 99+ unread. You no longer want to know why.","IDE：还有 3 个 warning 被你当作不存在。":"IDE: 3 warnings are still being treated as imaginary.","会议主持人：这个问题我们再展开聊五分钟。":"Host: let’s unpack this for five more minutes.","摄像头提示：检测到你正在走神。":"Camera alert: distraction detected.","咖啡机：今日第 47 杯，建议适量。":"Coffee machine: cup #47 today. Consider moderation.","行政：是谁把咖啡洒地上了？":"Admin: who spilled coffee on the floor?","跑步机：速度已自动提高。":"Treadmill: speed increased automatically.","同事：下班前再练最后一组？":"Coworker: one last set before clock-out?","你被抓住了，但需求依然没有因此减少。":"You got caught. The backlog did not shrink.","老板没有消失，他只是终于滚进了碰撞箱。":"The boss did not vanish. He finally entered your hitbox.","摸鱼失败。建议明天换一个更大的显示器。":"Escape failed. Try a bigger monitor tomorrow.","你试图假装在调试，但控制台甚至没打开。":"You pretended to debug. The console was not even open.","你没挤进会议缝。好消息是，下一场会依然会照常召开。":"You missed the meeting gap. Good news: the next meeting is still happening.","突击检查成功。老板确认你确实有屏幕。":"Spot check successful. The boss confirmed you own a screen.","BUG 完成了变异，你没有。":"The BUG evolved. You did not.","临时需求精准落在了你的下班计划上。":"The last-minute request landed directly on your clock-out plan.","催命邮件成功命中，未读数量仍然是 99+。":"Urgent email hit confirmed. Unread count remains 99+.","你踩进了茶水间最危险的东西：没人愿意擦的咖啡。":"You stepped into the pantry’s deadliest hazard: coffee nobody cleaned.","健身房提醒你：摸鱼也需要核心力量。":"The gym reminds you: slacking also requires core strength.","会议进行中 · 摄像头已开启":"MEETING LIVE · CAMERA ON","第一次：单跳即可":"First one: single jump","从绿色区域穿过去":"Pass through green","↓ 临时需求":"↓ LAST-MINUTE REQUEST","全员开会中 · 工位暂时无人":"ALL-HANDS · FLOOR EMPTY","正在重新连接 HDMI…":"RECONNECTING HDMI…","咖啡机：今日进入超频模式":"COFFEE MACHINE · OVERCLOCKED","跑步机失控 · 节奏加速中":"TREADMILL RUNAWAY · SPEED UP","会议已延长 30 分钟":"MEETING EXTENDED +30 MIN","你 已 被 静 音":"Y O U  A R E  M U T E D","其实也没人发现":"Nobody noticed anyway","今天也辛苦了":"You survived today","下班记得吃饭":"Eat after work","更衣":"LOCKERS"};
Object.assign(UI_I18N,{
  mission:{zh:'今日任务',en:'Mission'},missionGoal:{zh:'撑到 18:00，别被工作逮住',en:'Reach 18:00 without getting caught'},
  missionStatus:{zh:'本地运行 · 就绪',en:'Local · ready'},missionControlLabel:{zh:'核心操作',en:'Core move'},missionControl:{zh:'二段跳',en:'Double jump'},
  missionAudioLabel:{zh:'声音',en:'Audio'},missionAudio:{zh:'原创 8-bit',en:'Original 8-bit'},shiftKicker:{zh:'今日工时 14:00 → 18:00',en:'SHIFT 14:00 → 18:00'},
  factScenes:{zh:'办公室场景',en:'office scenes'},factJump:{zh:'跳跃层级',en:'jump depth'},factEnds:{zh:'不同结局',en:'endings'},
  localOnly:{zh:'仅保存在本机',en:'Local only'},footerPrivacy:{zh:'本地存档 · 无需账号 · 无需安装',en:'Local save · no account · no install'},
  runLedger:{zh:'跑局记录',en:'Run ledger'},runLedgerLocal:{zh:'Top 5 · 仅本机',en:'Top 5 · local only'},lastRunSummary:{zh:'上局总结',en:'Last run'},topRuns:{zh:'最佳 5 局',en:'Top 5 runs'},noFinishedRuns:{zh:'尚无完整跑局。',en:'No completed runs yet.'},
  dailyShift:{zh:'今日挑战',en:'Daily Shift'},dailyShiftOn:{zh:'今日挑战 · 已选',en:'Daily Shift · ON'},dailyShiftHint:{zh:'同一天固定障碍与事件序列',en:'Same hazards and events for the local day'}
});
Object.assign(TRANSLATIONS,{
  '下班！':'CLOCK OUT!','连摸断了':'Combo dropped','临时需求空投！':'LAST-MINUTE DROP!','提示：第一次会议缝已加宽，普通单跳即可稳定通过。':'TIP: the first meeting gap is wider. One clean jump is enough.','第一次会议：单跳即可':'FIRST MEETING: ONE JUMP','下 班 出 口':'CLOCK OUT','空格 / 点击！':'SPACE / CLICK!','18:00 · 下班成功':'18:00 · CLOCKED OUT','大家先别走。':'Hold on, everyone.','出口 → 还有10分钟':'EXIT → 10 MIN','出口 → 18:00':'EXIT → 18:00','会议':'MEETING','茶水间':'PANTRY','更衣':'LOCKERS',
  '14:00 · 工位区：先处理 BUG，顺便假装很忙。':'14:00 · Workstation: patch BUGs and look busy.',
  '15:00 · 会议室：摄像头已开启，别把二段跳浪费在桌子上。':'15:00 · Meeting: camera on. Save the second jump for the gap.',
  '16:00 · 茶水间：咖啡更多，但地上也更滑。':'16:00 · Pantry: more coffee, more things to slip on.',
  '17:00 · 员工健身房：哑铃、邮件和临时需求一起上强度。':'17:00 · Gym: dumbbells, emails and requests all ramp up.',
  '17:50。最后十分钟——别在门口倒下。':'17:50. Final ten minutes—do not collapse at the exit.',
  '18:00。门开了。':'18:00. The door is open.'
});
const LANG_KEY='91hwl_lang';
const readSharedLangCookie=()=>{const row=document.cookie.split('; ').find(x=>x.startsWith('91hwl_lang='));return row?decodeURIComponent(row.slice('91hwl_lang='.length)):''};
const writeSharedLangCookie=value=>{if(!location.hostname.endsWith('91hwl.cn'))return;document.cookie=`91hwl_lang=${encodeURIComponent(value)}; Path=/; Domain=.91hwl.cn; Max-Age=31536000; SameSite=Lax`};
const langParam=new URLSearchParams(location.search).get('lang');
const cookieLang=readSharedLangCookie();
const storedLang=storageGet(LANG_KEY);
const browserLang=(navigator.language||'zh').toLowerCase().startsWith('zh')?'zh':'en';
let currentLang=(langParam==='en'||langParam==='zh')?langParam:
  ((cookieLang==='en'||cookieLang==='zh')?cookieLang:((storedLang==='en'||storedLang==='zh')?storedLang:browserLang));
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
  writeSharedLangCookie(currentLang);
  const home=new URL('https://91hwl.cn/');home.searchParams.set('lang',currentLang);const theme=new URLSearchParams(location.search).get('theme');if(theme==='dark'||theme==='light')home.searchParams.set('theme',theme);
  const homeLink=$('homeLink');if(homeLink)homeLink.href=home.href;
  messageName.previousElementSibling.textContent=currentLang==='en'?'Display name (optional)':'展示昵称（可留空）';
  messageText.previousElementSibling.textContent=currentLang==='en'?'Leave a note':'留一句话';
  messageName.placeholder=currentLang==='en'?'e.g. Definitely leaving on time':'例如：今晚不加班的人';
  messageText.placeholder=currentLang==='en'?'Up to 80 characters. Moderated before appearing publicly.':'最多 80 字。留言提交后进入审核，通过后才可能出现在下班留言墙。';
  messageSubmit.textContent=currentLang==='en'?'Submit for review':'提交审核';
  syncAudioControls();updateMusicHud();renderDiscoveries();renderRunLedger();updateDailyUi();updateRouteStrip();
  if(state==='menu'){overlayTitle.textContent=ui('heroTitle');overlayText.textContent=ui('heroText');startBtn.textContent=ui('start')}
  else if(state==='paused'){overlayTitle.textContent=currentLang==='en'?'Boss nearby. Look busy.':'老板路过，先装忙。';overlayText.textContent=currentLang==='en'?'Paused. Your escape progress is safe for now.':'游戏已暂停。你的摸鱼进度暂时安全。';startBtn.textContent=currentLang==='en'?'Resume':'继续摸鱼'}
  updateStage(true);updateScene(true);draw();
}
function toggleLanguage(){currentLang=currentLang==='en'?'zh':'en';applyLanguage(true)}
function updateRouteStrip(){if(!routeStrip)return;routeStrip.querySelectorAll('[data-route]').forEach(el=>{const i=Number(el.dataset.route);const active=(endingPhase==='decision'||endingPhase==='ontime'||endingPhase==='overtime')?i===4:i===Math.min(3,Math.max(0,sceneIndex));const done=(endingPhase!=='none')?i<4:i<Math.max(0,sceneIndex);el.classList.toggle('active',active);el.classList.toggle('done',done)})}
function syncPresentationState(force=false){
  const pressure=stageIndex>=4?'climax':(stageIndex>=3?'high':'normal');
  const routeIndex=(endingPhase==='decision'||endingPhase==='ontime'||endingPhase==='overtime')?4:Math.min(3,Math.max(0,sceneIndex));
  const signature=`${state}|${pressure}|${routeIndex}`;
  if(!force&&syncPresentationState.signature===signature)return;
  syncPresentationState.signature=signature;
  if(document.documentElement.dataset.gameState!==state)document.documentElement.dataset.gameState=state;
  if(frame.dataset.pressure!==pressure)frame.dataset.pressure=pressure;
  if(fitGameFrameToViewport(true))invalidateCanvasLayout();
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
let jumpBufferTimer=0,lastGrounded=true,leaveSlipHits=0,leaveSlipTimer=0,riskBoostTimer=0,runNearMisses=0,runPerfectNearMisses=0;
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
let topRuns=[];try{const raw=JSON.parse(storageGet('91hwl_moyu_top_runs')||'[]');topRuns=Array.isArray(raw)?raw.map(cleanRunRecord).filter(Boolean).slice(0,5):[]}catch{topRuns=[]}
let lastRunRecord=null;try{lastRunRecord=cleanRunRecord(JSON.parse(storageGet('91hwl_moyu_last_run')||'null'))}catch{lastRunRecord=null}
let runPeakCombo=0,runDiscoveryStart=discoveries.size,runRecordSaved=false,runStartedAt=0;
let dailyMode=false,dailySeedDate='',dailySeed=0,dailyRngState=0,dailyModifierId='meeting';
const player={x:150,y:GROUND-66,w:44,h:66,vy:0,jumps:0,squash:0};
function localDateKey(date=new Date()){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`}
function seedFromText(text){let h=2166136261>>>0;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
const dailyModifierDefs=[{id:'meeting',zh:'会议马拉松',en:'Meeting Marathon'},{id:'bug',zh:'BUG 爆发',en:'Buggy Build'},{id:'coffee',zh:'咖啡短缺',en:'Coffee Shortage'}];
function dailyModifierForDate(date=localDateKey()){return dailyModifierDefs[seedFromText(`91hwl-moyu-mod-${date}`)%dailyModifierDefs.length]}
function dailyModifierLabel(date=dailySeedDate||localDateKey()){const m=dailyModifierForDate(date);return currentLang==='en'?m.en:m.zh}
function resetGameRandom(){dailySeedDate=localDateKey();dailySeed=seedFromText(`91hwl-moyu-daily-${dailySeedDate}`)||1;dailyRngState=dailySeed;dailyModifierId=dailyModifierForDate(dailySeedDate).id}
function gameRandom(){if(!dailyMode)return Math.random();dailyRngState=(dailyRngState+0x6D2B79F5)|0;let t=dailyRngState;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}
function dailyShortLabel(date=dailySeedDate||localDateKey()){return date.slice(5)}
function updateDailyUi(){if(!dailyBtn||!dailyBadge||!dailyHud)return;dailyBtn.dataset.active=dailyMode?'true':'false';dailyBtn.setAttribute('aria-pressed',dailyMode?'true':'false');dailyBtn.textContent=dailyMode?`${ui('dailyShift')} · ${dailyModifierLabel()}`:ui('dailyShift');dailyBadge.classList.toggle('hidden',!dailyMode);dailyHud.textContent=dailyMode?`${dailyShortLabel()} · ${dailyModifierLabel()}`:'—';dailyBadge.title=ui('dailyShiftHint')}
function setDailyMode(enabled){dailyMode=!!enabled;resetGameRandom();updateDailyUi();return dailyMode}

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
function cleanRunRecord(value){
  if(!value||typeof value!=='object')return null;const outcome=['caught','ontime','overtime'].includes(value.outcome)?value.outcome:'caught';
  return {distance:Math.max(0,Math.floor(Number(value.distance)||0)),combo:Math.max(0,Math.floor(Number(value.combo)||0)),near:Math.max(0,Math.floor(Number(value.near)||0)),perfect:Math.max(0,Math.floor(Number(value.perfect)||0)),discoveries:Math.max(0,Math.floor(Number(value.discoveries)||0)),outcome,cause:String(value.cause||'').slice(0,20),scene:Math.max(0,Math.min(4,Math.floor(Number(value.scene)||0))),clock:String(value.clock||'14:00').slice(0,12),daily:Boolean(value.daily),dailyDate:String(value.dailyDate||'').slice(0,10),ts:Math.max(0,Math.floor(Number(value.ts)||0))}
}
function runOutcomeLabel(r){if(r.outcome==='ontime')return currentLang==='en'?'On-time exit':'准点下班';if(r.outcome==='overtime')return currentLang==='en'?'“Voluntary” OT':'“自愿”加班';return currentLang==='en'?`Caught · ${tr(r.cause||'工作')}`:`被「${r.cause||'工作'}」截胡`}
function runSceneLabel(r){if(r.scene>=4)return currentLang==='en'?'Exit':'下班门';const sc=scenes[r.scene];return sc?tr(sc.name):(currentLang==='en'?'Office':'办公室')}
function runDailyLabel(r){if(!r?.daily)return '';const mod=dailyModifierLabel(r.dailyDate);return currentLang==='en'?`DAILY ${dailyShortLabel(r.dailyDate)} · ${mod}`:`今日挑战 ${dailyShortLabel(r.dailyDate)} · ${mod}`}
function runMetricLine(){const d=dailyMode?(currentLang==='en'?`DAILY ${dailyShortLabel()} · `:`今日挑战 ${dailyShortLabel()} · `):'';return currentLang==='en'?`${d}Peak combo ${runPeakCombo} · Near misses ${runNearMisses} (Perfect ${runPerfectNearMisses})`:`${d}峰值连摸 ${runPeakCombo} · 擦边 ${runNearMisses}（极限 ${runPerfectNearMisses}）`}
function renderRunLedger(){
  if(!lastRunSummaryEl||!topRunHistoryEl)return;
  if(!lastRunRecord)lastRunSummaryEl.textContent=ui('noFinishedRuns');
  else{const r=lastRunRecord,d=runDailyLabel(r),prefix=d?`${d} · `:'';lastRunSummaryEl.textContent=currentLang==='en'?`${prefix}${runOutcomeLabel(r)} · ${r.clock} · ${runSceneLabel(r)} · ${r.distance}m · Peak combo ${r.combo} · Near ${r.near} (Perfect ${r.perfect}) · New finds ${r.discoveries}`:`${prefix}${runOutcomeLabel(r)} · ${r.clock} · ${runSceneLabel(r)} · ${r.distance}m · 峰值连摸 ${r.combo} · 擦边 ${r.near}（极限 ${r.perfect}） · 新发现 ${r.discoveries}`}
  topRunHistoryEl.replaceChildren();
  if(!topRuns.length){const e=document.createElement('div');e.className='run-empty';e.textContent=ui('noFinishedRuns');topRunHistoryEl.append(e);return}
  topRuns.forEach((r,i)=>{const row=document.createElement('div'),rank=document.createElement('span'),main=document.createElement('span'),score=document.createElement('span');row.className='run-history-row';rank.className='run-rank';main.className='run-history-main';score.className='run-history-score';rank.textContent=`#${i+1}`;main.textContent=`${runDailyLabel(r)?runDailyLabel(r)+' · ':''}${runOutcomeLabel(r)} · ${r.clock} · ${runSceneLabel(r)} · N${r.near}/P${r.perfect}`;score.textContent=`${r.distance}m · C${r.combo}`;if(r.ts)row.title=new Date(r.ts).toLocaleString(currentLang==='en'?'en-US':'zh-CN');row.append(rank,main,score);topRunHistoryEl.append(row)})
}
function recordFinishedRun(outcome,cause=''){
  if(runRecordSaved)return lastRunRecord;runRecordSaved=true;
  const rec=cleanRunRecord({distance,combo:runPeakCombo,near:runNearMisses,perfect:runPerfectNearMisses,discoveries:Math.max(0,discoveries.size-runDiscoveryStart),outcome,cause,scene:outcome==='caught'?Math.max(0,sceneIndex):4,clock:clockEl.textContent||'14:00',daily:dailyMode,dailyDate:dailyMode?dailySeedDate:'',ts:Date.now()});
  if(!rec)return null;lastRunRecord=rec;topRuns=[...topRuns,rec].sort((a,b)=>b.distance-a.distance||b.combo-a.combo||b.perfect-a.perfect||b.near-a.near||b.ts-a.ts).slice(0,5);storageSet('91hwl_moyu_last_run',JSON.stringify(rec));storageSet('91hwl_moyu_top_runs',JSON.stringify(topRuns));renderRunLedger();return rec
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

let canvasLayoutDirty=true,lastFrameViewportKey='';
function invalidateCanvasLayout(){canvasLayoutDirty=true}
function viewportFrameMaxWidth(viewportH,frameTop,viewportW){
  const borderAllowance=6,bottomReserve=viewportW<=700?6:12;
  const availableH=Math.max(200,viewportH-frameTop-bottomReserve);
  const contentH=Math.max(1,availableH-borderAllowance);
  return Math.max(320,Math.floor(contentH*W/H)+borderAllowance);
}
function fitGameFrameToViewport(force=false){
  const vv=window.visualViewport,viewportH=Math.max(1,Math.floor(vv?.height||window.innerHeight||document.documentElement.clientHeight||H));
  const viewportW=Math.max(1,Math.floor(vv?.width||window.innerWidth||document.documentElement.clientWidth||W));
  const fullscreen=document.fullscreenElement===frame,frameTop=Math.max(0,Math.round(frame.getBoundingClientRect().top));
  const key=`${viewportW}|${viewportH}|${frameTop}|${fullscreen?'full':'page'}`;
  if(!force&&key===lastFrameViewportKey)return false;
  lastFrameViewportKey=key;
  const nextMax=fullscreen?'none':`${viewportFrameMaxWidth(viewportH,frameTop,viewportW)}px`;
  const changed=frame.style.width!=='100%'||frame.style.maxWidth!==nextMax;
  frame.style.width='100%';frame.style.maxWidth=nextMax;
  if(changed)canvasLayoutDirty=true;
  return changed;
}
function resizeCanvas(force=false){
  fitGameFrameToViewport(force);
  if(!force&&!canvasLayoutDirty)return false;
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,DPR_LIMIT);
  const pxW=Math.max(1,Math.round(rect.width*dpr)),pxH=Math.max(1,Math.round(rect.height*dpr));
  if(canvas.width!==pxW||canvas.height!==pxH){canvas.width=pxW;canvas.height=pxH}
  ctx.setTransform(pxW/W,0,0,pxH/H,0,0);ctx.imageSmoothingEnabled=true;
  canvasLayoutDirty=false;return true;
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
function toggleSettings(force=null){const shouldOpen=force===null?settingsPop.classList.contains('hidden'):!!force;settingsPop.classList.toggle('hidden',!shouldOpen);settingsBtn.setAttribute('aria-expanded',shouldOpen?'true':'false')}

function tone(freq,start,dur,type='square',vol=.02,target='music',attack=.002,detune=0){
  if(!soundOn||!ensureAudio())return;
  const o=audioCtx.createOscillator(),g=audioCtx.createGain(),dest=target==='sfx'?sfxGain:musicGain;
  o.type=type;o.frequency.setValueAtTime(freq,start);o.detune.value=detune;
  const peak=Math.max(.0002,vol),atk=Math.min(attack,dur*.12),rel=Math.max(start+atk+.008,start+dur*.70);
  g.gain.setValueAtTime(.0001,start);g.gain.linearRampToValueAtTime(peak,start+atk);g.gain.setValueAtTime(peak,Math.max(start+atk,rel-.008));g.gain.exponentialRampToValueAtTime(.0001,start+dur);
  o.connect(g);g.connect(dest);o.start(start);o.stop(start+dur+.025);
}
function pulse(freq,start,dur,vol=.025,detune=0,target='music'){tone(freq,start,dur,'square',vol,target,.0015,detune)}
function tri(freq,start,dur,vol=.045,target='music'){tone(freq,start,dur,'triangle',vol,target,.002)}
function noiseHit(start,dur=.035,vol=.02,freq=4200,type='highpass'){
  if(!soundOn||!ensureAudio()||!noiseBuffer)return;
  const s=audioCtx.createBufferSource(),f=audioCtx.createBiquadFilter(),g=audioCtx.createGain();s.buffer=noiseBuffer;f.type=type;f.frequency.value=freq;f.Q.value=.7;
  g.gain.setValueAtTime(Math.max(.0001,vol),start);g.gain.exponentialRampToValueAtTime(.0001,start+dur);s.connect(f);f.connect(g);g.connect(musicGain);s.start(start);s.stop(start+dur+.02);
}
function kick(start,vol=.075){
  if(!soundOn||!ensureAudio())return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='triangle';o.frequency.setValueAtTime(115,start);o.frequency.exponentialRampToValueAtTime(48,start+.075);g.gain.setValueAtTime(vol,start);g.gain.exponentialRampToValueAtTime(.0001,start+.10);o.connect(g);g.connect(musicGain);o.start(start);o.stop(start+.12)
}
function snare(start,vol=.028){noiseHit(start,.055,vol,1800,'highpass')}
function hat(start,vol=.009,open=false){noiseHit(start,open?.075:.022,vol,6500,'highpass')}
function beep(freq=440,dur=.06,type='square',vol=.035){
  if(!soundOn||!ensureAudio())return;const t=audioCtx.currentTime;tone(freq,t,dur,type,vol,'sfx',.0015)
}
const CHIP_THEME_A=[12,null,15,17,19,null,17,15,12,null,10,12,15,null,12,10];
const CHIP_THEME_B=[12,15,17,null,19,22,19,17,15,null,17,15,12,10,12,null];
const CHIP_THEME_C=[12,null,15,17,19,22,24,22,19,17,15,12,10,12,15,17];
const musicProfiles=[
  {name:'工位摸鱼曲',bpm:96, root:110.00,layers:2,prog:[0,5,8,3],mel:CHIP_THEME_A,lead:.030,arp:.012,bass:.040},
  {name:'会议室卡点曲',bpm:106,root:116.54,layers:3,prog:[0,3,8,5],mel:CHIP_THEME_A,lead:.032,arp:.016,bass:.041},
  {name:'茶水间续命曲',bpm:114,root:123.47,layers:3,prog:[0,5,3,8],mel:CHIP_THEME_B,lead:.034,arp:.014,bass:.044},
  {name:'健身房冲刺曲',bpm:124,root:103.83,layers:4,prog:[0,5,8,10],mel:CHIP_THEME_B,lead:.036,arp:.017,bass:.052},
  {name:'下班冲刺曲',bpm:136,root:110.00,layers:5,prog:[0,5,8,3],mel:CHIP_THEME_C,lead:.038,arp:.019,bass:.054},
  {name:'加班暴走曲',bpm:148,root:98.00,layers:6,prog:[0,6,8,10],mel:CHIP_THEME_C,lead:.041,arp:.020,bass:.055}
];
function profile(){
  const base=musicProfiles[Math.max(0,Math.min(stageIndex,musicProfiles.length-1))];
  // 每个主场景后半段把同一主题再推进半档：不是换歌，而是 BPM、琶音和声部密度轻微增加。
  if(stageIndex>=4||sceneHalf===0)return base;
  return {...base,name:base.name+' · 后半',bpm:base.bpm+5,layers:Math.min(6,base.layers+1),lead:base.lead*1.04,arp:base.arp*1.10,bass:base.bass*1.03};
}
function updateMusicHud(){
  const p=profile();bgmHud.textContent='8BIT · '+p.bpm+' BPM';bgmChip.classList.toggle('hidden',!soundOn);masterSoundBtn.textContent=currentLang==='en'?`Master: ${soundOn?'ON':'OFF'}`:'总开关：'+(soundOn?'开':'关');masterSoundBtn.setAttribute('aria-pressed',soundOn?'true':'false')
}
function scheduleMusic(){
  if(!soundOn||state!=='playing'||!audioCtx)return;
  const ahead=.24;
  while(nextMusicStepAt<audioCtx.currentTime+ahead){
    const p=profile(),stepDur=60/p.bpm/4,s=musicStep++,i=s%16,bar=Math.floor(s/16),chord=p.prog[Math.floor(i/4)%4],root=p.root*Math.pow(2,chord/12);
    // Noise channel：NES 风格鼓组，前期就有稳定拍点，后期逐渐密集。
    if(i===0||i===8||(p.layers>=5&&(i===6||i===14)))kick(nextMusicStepAt,p.layers>=5?.082:.070);
    if(i===4||i===12)snare(nextMusicStepAt,p.layers>=4?.034:.026);
    if(p.layers===2){if(i%4===2)hat(nextMusicStepAt,.008)}
    else if(p.layers<=4){if(i%2===0)hat(nextMusicStepAt,.0085,i===14&&p.layers>=4)}
    else {hat(nextMusicStepAt,i%2===0?.010:.0055,i===14);}
    // Triangle channel：低音根音。短促、稳定，保持 8-bit 的机械脉搏。
    if(i%4===0)tri(root,nextMusicStepAt,stepDur*2.45,p.bass);
    if(p.layers>=4&&i%4===2)tri(root*Math.pow(2,7/12),nextMusicStepAt,stepDur*1.35,p.bass*.70);
    // Pulse 2：琶音。14:00 就存在，保证从第一秒听起来就是 Chiptune 而不是环境音。
    if(i%2===0){
      const arpSeq=p.layers>=5?[0,7,12,15,12,7,3,7]:[0,7,12,7,3,7,12,7];
      const semi=arpSeq[(i/2)%8];pulse(root*2*Math.pow(2,semi/12),nextMusicStepAt,stepDur*(p.layers>=4?.78:.92),p.arp,p.layers>=5?-5:0);
    }
    // Pulse 1：原创主题旋律。所有阶段保留同一 Hook，只做节奏与音区变奏。
    const semi=p.mel[i];
    if(semi!==null){
      const leadFreq=p.root*2*Math.pow(2,semi/12);pulse(leadFreq,nextMusicStepAt,stepDur*(p.layers>=5?1.35:1.65),p.lead,0);
      if(p.layers>=5&&i%4===0)pulse(leadFreq*2,nextMusicStepAt+stepDur*.04,stepDur*.62,p.lead*.32,4);
    }
    // 高阶段增加“第二脉冲声部”，形成典型 8-bit 双方波对位。
    if(p.layers>=4&&i%4===2){const counter=[7,10,12,15][Math.floor(i/4)%4];pulse(root*2*Math.pow(2,counter/12),nextMusicStepAt,stepDur*.72,p.arp*.72,6)}
    // 每两小节尾部做一个小型像素音阶，防止循环像节拍器。
    if(i===15&&bar%2===1&&p.layers>=3){pulse(p.root*4,nextMusicStepAt,stepDur*.45,p.lead*.42);pulse(p.root*4*Math.pow(2,3/12),nextMusicStepAt+stepDur*.45,stepDur*.42,p.lead*.36)}
    nextMusicStepAt+=stepDur;
  }
}
function musicSting(idx){
  if(!soundOn||!ensureAudio()||state!=='playing')return;const now=audioCtx.currentTime+.015,p=musicProfiles[idx]||profile(),r=p.root*2;
  if(idx===5){
    kick(now,.09);snare(now+.11,.034);pulse(r,now,.10,.042);pulse(r*Math.pow(2,3/12),now+.08,.10,.040);pulse(r*Math.pow(2,7/12),now+.16,.10,.040);pulse(r*2,now+.24,.24,.046);
  }else{
    pulse(r,now,.09,.034);pulse(r*Math.pow(2,3/12),now+.07,.09,.032);pulse(r*Math.pow(2,7/12),now+.14,.14,.034);hat(now+.14,.012)
  }
}
function alignMusicPhrase(delay=.11){
  if(!soundOn||!audioCtx||state!=='playing')return;musicStep=0;nextMusicStepAt=Math.max(audioCtx.currentTime+delay,nextMusicStepAt-.05)
}
function duckMusic(depth=.66,dur=.20){
  if(!soundOn||!audioCtx||!musicGain)return;const now=audioCtx.currentTime,target=musicTargetLevel(),low=Math.max(.0001,target*depth);musicGain.gain.cancelScheduledValues(now);musicGain.gain.setTargetAtTime(low,now,.018);musicGain.gain.setTargetAtTime(target,now+dur,.05)
}
function startMusic(resetPhase=false){
  if(!soundOn||state!=='playing'||!ensureAudio())return;
  if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
  const now=audioCtx.currentTime;musicGain.gain.cancelScheduledValues(now);musicGain.gain.setValueAtTime(Math.max(.0001,musicGain.gain.value),now);musicGain.gain.exponentialRampToValueAtTime(musicTargetLevel(),now+.20);
  if(resetPhase){musicStep=0;nextMusicStepAt=now+.035}else nextMusicStepAt=Math.max(nextMusicStepAt,now+.035);
  if(!musicTimer)musicTimer=setInterval(scheduleMusic,55);scheduleMusic();updateMusicHud();
}
function stopMusic(fade=.16){
  if(musicTimer){clearInterval(musicTimer);musicTimer=null}if(!audioCtx||!musicGain)return;
  const now=audioCtx.currentTime;musicGain.gain.cancelScheduledValues(now);musicGain.gain.setValueAtTime(Math.max(.0001,musicGain.gain.value),now);musicGain.gain.exponentialRampToValueAtTime(.0001,now+Math.max(.03,fade));nextMusicStepAt=now+.10;
}
function previewMusic(){
  if(!soundOn||!ensureAudio())return;if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
  const now=audioCtx.currentTime+.025,p=musicProfiles[0],q=60/p.bpm/4;musicGain.gain.cancelScheduledValues(now);musicGain.gain.setValueAtTime(musicTargetLevel(),now);
  kick(now,.07);snare(now+q*4,.025);
  for(let i=0;i<8;i++){
    const semi=CHIP_THEME_A[i];if(semi!==null)pulse(p.root*2*Math.pow(2,semi/12),now+i*q,q*1.5,.034);
    if(i%2===0){const a=[0,7,12,7][(i/2)%4];pulse(p.root*2*Math.pow(2,a/12),now+i*q,q*.82,.013,-4);}
    if(i%4===0)tri(p.root,now+i*q,q*2.5,.043);
    if(i%2===0)hat(now+i*q,.0075);
  }
}
function setSound(force=null){
  soundOn=force===null?!soundOn:!!force;storageSet('91hwl_moyu_sound',soundOn?'1':'0');updateMusicHud();
  if(soundOn){ensureAudio();if(audioCtx&&audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});beep(740,.045);if(state==='playing')startMusic(true);else previewMusic()}
  else stopMusic(.09);
}

function currentSceneIndex(){return Math.max(0,Math.min(3,Math.floor(Math.min(runDistance,DAY_END_DISTANCE-1)/(DAY_END_DISTANCE/4))))}
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
  resetMessageComposer();resetGameRandom();updateDailyUi();
  distance=0;runDistance=0;speed=350;runPeakCombo=0;runRecordSaved=false;sceneIndex=-1;previousSceneIndex=0;sceneToastTimer=0;sceneBlend=0;sceneHalf=0;sceneHalfAnnounced=[false,false,false,false];rareMoment='none';rareMomentTimer=0;rareSceneRolled=[false,false,false,false];meetingSuppressTimer=0;gymRushTimer=0;rareVisualPulse=0;secretMoment='none';secretMomentTimer=0;secretVisualPulse=0;secretSceneRolled=[false,false,false,false];secretSceneThresholds=Array.from({length:4},()=>.24+gameRandom()*.52);spawnTimer=.72+gameRandom()*.72;pickupTimer=2.8;worldTime=0;tickerTimer=7;combo=0;comboAge=0;stageIndex=-1;screenShake=0;milestone18=false;meetingSpawnCount=0;overtimeFlash=0;musicStep=0;lastMusicStage=-1;directorQueue=[];directorCooldown=0;lastObstacleLabel='';sameObstacleStreak=0;lastSpawnGapPx=0;tightGapStreak=0;spacingHistory=[];endingPhase='none';endingTimer=0;exitDoorX=W+80;endingResolved=false;endingCinematicTimer=0;endingCinematicType='none';endingPlayerOffset=0;endingBossX=W+100;jumpBufferTimer=0;lastGrounded=true;leaveSlipHits=0;leaveSlipTimer=0;riskBoostTimer=0;runNearMisses=0;runPerfectNearMisses=0;officeEvent='none';officeEventTimer=0;officeEventCooldown=12;eventRollTimer=8+gameRandom()*5;coffeeRushRemaining=0;bossAwayTimer=0;bugPatchTimer=0;salaryFlash=0;pendingClimaxPattern='';climax17Done=false;climax1750Done=false;setEventHud('正常');tutorialActive=false;tutorialStep=0;tutorialTimer=0;tutorialToast.classList.add('hidden');
  obstacles=[];pickups=[];particles=[];floaters=[];speedLines=[];
  player.y=GROUND-player.h;player.vy=0;player.jumps=0;player.squash=0;
  scoreEl.textContent='0';speedEl.textContent='1.0';comboEl.textContent='0';clockEl.textContent='14:00';stageEl.textContent=tr('工位摸鱼');sceneHud.textContent=tr('工位区');dayProgress.style.width='0%';updateRouteStrip();
  updateStage(true);updateScene(true);updateMusicHud();
}
function start(){
  const now=performance.now();if(now-startLock<220)return;startLock=now;
  reset();runDiscoveryStart=discoveries.size;runStartedAt=Date.now();runs++;storageSet('91hwl_moyu_runs',String(runs));syncStats();state='playing';overlay.classList.add('hidden');beginTutorial();last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);beep(520,.06);startMusic(true);
}
function gameOver(cause='工作'){ 
  state='gameover';duckMusic(.45,.10);stopMusic(.18);screenShake=12;const rounded=Math.floor(distance);
  if(rounded>best){best=rounded;storageSet('91hwl_moyu_best',String(best))}
  if(combo>bestCombo){bestCombo=combo;storageSet('91hwl_moyu_best_combo',String(bestCombo))}
  deathCounts[cause]=(deathCounts[cause]||0)+1;storageSet('91hwl_moyu_death_counts',JSON.stringify(deathCounts));
  if(['会议','老板','BUG','临时需求','邮件'].every(k=>(deathCounts[k]||0)>0))unlockDiscovery('allDeaths',true);
  recordFinishedRun('caught',cause);syncStats();renderDiscoveries();if(navigator.vibrate)navigator.vibrate(45);beep(130,.16,'sawtooth',.05);
  overlayTitle.textContent=currentLang==='en'?`${tr(cause)} got you.`:`被「${cause}」截胡。`;
  const funny=tr(causeTips[cause]||deathTips[(Math.random()*deathTips.length)|0]),coach=currentLang==='en'?(TRANSLATIONS[coachTips[cause]]||'Tip: read the next hazard before spending your second jump.'):(coachTips[cause]||'操作建议：先看清下一组障碍，再决定是否保留二段跳。'),count=deathCounts[cause]||1;
  overlayText.textContent=currentLang==='en'?`Run: ${rounded}m.\n${funny}\n\n${coach}\n${runMetricLine()} · Caught by ${tr(cause)} ${count} time${count===1?'':'s'}.`:`本局：${rounded} 米。\n${funny}\n\n${coach}\n${runMetricLine()} · 已被「${cause}」截胡 ${count} 次。`;
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
  const groundTakeoff=before===0&&Math.abs((player.y+player.h)-GROUND)<10;
  if(groundTakeoff)for(let i=0;i<6;i++)particles.push({x:player.x+10+Math.random()*24,y:GROUND-5,vx:-20-Math.random()*90,vy:-8-Math.random()*55,a:.72,r:1.5+Math.random()*2.2,c:'#8e877d'});
  return true
}
function jump(){
  if(state==='menu'||state==='gameover'||state==='ended'){start();return}if(state==='ending')return;if(state!=='playing')return;
  if(endingPhase==='decision'){resolveEnding('ontime');return}
  if(performJump())return;
  // 如果玩家在即将落地前已经按下跳跃，短暂记住这次输入；落地瞬间自动执行下一跳。
  const feet=player.y+player.h,nearGround=player.vy>0&&(GROUND-feet)<58;if(nearGround)jumpBufferTimer=JUMP_BUFFER_WINDOW
}

function currentStage(){let s=stages[0];for(const st of stages)if(runDistance>=st.from)s=st;return s}
function updateStage(force=false){
  let idx=0;for(let i=0;i<stages.length;i++)if(runDistance>=stages[i].from)idx=i;
  if(force||idx!==stageIndex){
    const changed=idx!==stageIndex;stageIndex=idx;const s=stages[idx];stageEl.textContent=tr(s.name);tickerEl.textContent=tr(s.msg);updateRouteStrip();tickerTimer=5;if(idx===5)addFloater(player.x+110,115,tr(s.name),'#b84832');updateMusicHud();
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
  if(dailyMode&&dailyModifierId==='meeting'&&weights['会议']>0)weights['会议']*=1.45;
  if(dailyMode&&dailyModifierId==='bug'&&weights['BUG']>0)weights['BUG']*=1.50;
  if(bossAwayTimer>0&&weights['老板']>0)weights['老板']*=.05;if(meetingSuppressTimer>0&&weights['会议']>0)weights['会议']*=.04;
  if(lastObstacleLabel&&weights[lastObstacleLabel]>0){weights[lastObstacleLabel]*=sameObstacleStreak>=2?.16:.46}
  let sum=0;for(const k in weights)sum+=weights[k];let r=gameRandom()*sum,label='BUG';
  for(const k in weights){r-=weights[k];if(r<=0){label=k;break}}
  if(runDistance<170&&(label==='会议'||label==='临时需求'||label==='邮件'))label=gameRandom()<.58?'BUG':'老板';
  return label;
}
function rand(a,b){return a+gameRandom()*(b-a)}
function sampleNormalGapPx(spawned){
  // 三档“呼吸节奏”：短压迫 / 正常 / 长空档。随进度推进，短间距概率上升，但长空档永远保留。
  let bands;
  if(runDistance<360){bands=[{w:.24,a:420,b:540},{w:.47,a:590,b:760},{w:.29,a:840,b:1110}]}
  else if(runDistance<1050){bands=[{w:.31,a:380,b:500},{w:.48,a:540,b:710},{w:.21,a:760,b:980}]}
  else if(runDistance<1800){bands=[{w:.36,a:350,b:470},{w:.46,a:500,b:660},{w:.18,a:710,b:900}]}
  else{bands=[{w:.42,a:330,b:445},{w:.43,a:475,b:625},{w:.15,a:680,b:840}]}
  // 连续两次短间距以后强制给一次喘息，随机但不恶意。
  if(tightGapStreak>=2)bands=[{w:0,a:0,b:0},{w:.18,a:600,b:720},{w:.82,a:790,b:1040}];
  let pick=gameRandom(),band=bands[bands.length-1],acc=0;
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
  if(lastSpawnGapPx&&Math.abs(gap-lastSpawnGapPx)<85){gap+=gameRandom()<.5?-rand(90,155):rand(90,175)}
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
function effectiveSpawnWidth(spawned){
  // Long-mutating BUGs expand from 56px to 116px after their warning. Reserve the
  // final width now so the visible mutation cannot silently consume the next gap.
  if(spawned.label==='BUG'&&spawned.mutation==='long')return Math.max(116,spawned.w);
  return Math.max(36,spawned.w);
}
function delayForClearGap(gapPx,spawned){
  // 下一障碍从同一出生线进入，因此 delay * speed - 当前宽度 ≈ 实际净空。
  // 速度变化很缓慢，这个换算比“固定秒数”稳定得多。
  return Math.max(.62,(gapPx+effectiveSpawnWidth(spawned))/Math.max(300,speed));
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
  let chance=stageIndex>=4?.22:(stageIndex>=3?.18:.13);if(stageIndex<4)chance*=sceneHalf?1.22:.72;if(gameRandom()>chance)return false;
  let available=directorPatterns.filter(p=>p.minStage<=stageIndex);
  if(bossAwayTimer>0)available=available.filter(p=>!p.seq.some(x=>x.label==='老板'));
  if(!available.length)return false;
  const picked=available[(gameRandom()*available.length)|0];directorQueue=picked.seq.map(x=>({label:x.label,gapPx:x.gapPx,pattern:picked.name}));directorCooldown=8.5;return true;
}
function spawnObstacle(forcedLabel=null){
  const label=forcedLabel||chooseObstacle(),k=obstacleKinds[label];
  let x=W+35,y=k.air?(k.minY+gameRandom()*(k.maxY-k.minY)):(GROUND-k.h);
  if(k.drop){x=760+gameRandom()*320;y=-90}
  if(k.gate){y=286}
  const obstacle={x,y,w:k.w,h:k.h,label,passed:false,air:!!k.air,gate:!!k.gate,drop:!!k.drop,variant:(Math.random()*3)|0};
  if(obstacle.air){obstacle.baseY=y;obstacle.wave=gameRandom()*6.28;obstacle.waveAmp=8+gameRandom()*14;obstacle.waveSpeed=2.1+gameRandom()*1.6}
  if(label==='老板'){obstacle.rush=sceneIndex===0&&gameRandom()<0.58;obstacle.rushTriggered=false;obstacle.rushWarnTimer=0;obstacle.rushTimer=0;obstacle.extraSpeed=210+gameRandom()*90}
  if(label==='BUG'){obstacle.mutation=bugPatchTimer>0?'none':(gameRandom()<.78?(gameRandom()<.5?'tall':'long'):'none');obstacle.mutationState='idle';obstacle.mutationTimer=0;obstacle.baseW=k.w;obstacle.baseH=k.h;obstacle.targetW=k.w;obstacle.targetH=k.h}
  if(label==='临时需求'){obstacle.dropState='warning';obstacle.warning=.62;obstacle.vy=0;obstacle.targetY=GROUND-k.h;obstacle.warningPulse=Math.random()*6.28}
  if(label==='会议'){
    meetingSpawnCount++;const first=meetingSpawnCount===1;
    const gapSize=first?210:(stageIndex===1?(sceneHalf?194:204):(stageIndex<=3?194:(stageIndex===4?190:186)));
    const gapCenter=394;obstacle.y=220;obstacle.baseGapCenter=gapCenter;obstacle.gapTop=gapCenter-gapSize/2;obstacle.gapBottom=gapCenter+gapSize/2;obstacle.panelH=obstacle.gapTop-obstacle.y;obstacle.tableH=GROUND-obstacle.gapBottom;obstacle.gatePulse=Math.random()*6.28;obstacle.firstGate=first;obstacle.tutorialShown=false;obstacle.meetingDrift=sceneIndex===1&&!first;obstacle.driftAmp=sceneHalf?12:8;obstacle.driftPhase=gameRandom()*6.28
  }
  if(label==='哑铃'&&sceneIndex===3){obstacle.gymBounce=true;obstacle.baseY=y;obstacle.bouncePhase=gameRandom()*6.28;obstacle.bounceAmp=18+gameRandom()*12;obstacle.bounceSpeed=3.1+gameRandom()*1.2}
  if(label===lastObstacleLabel)sameObstacleStreak++;else{lastObstacleLabel=label;sameObstacleStreak=1}
  obstacles.push(obstacle);return obstacle
}
function choosePickupKind(){
  const r=gameRandom();
  if(sceneIndex===2)return r<.38?'risk':(r<.56?'leave':'coffee');
  if(sceneIndex===3)return r<.28?'risk':(r<.42?'leave':'coffee');
  if(sceneIndex===1)return r<.14?'leave':'coffee';
  return r<.12?'leave':'coffee';
}
function spawnPickup(forcedKind=null){
  const kind=forcedKind||choosePickupKind();let y=GROUND-115-gameRandom()*110;
  if(kind==='leave')y=GROUND-145-gameRandom()*85;
  else if(kind==='risk')y=GROUND-245-gameRandom()*62;
  pickups.push({kind,x:W+35,y,w:32,h:40,spin:Math.random()*6.28,got:false})
}
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
function nearMissTier(o){
  if(o.label==='会议'||o.label==='临时需求')return 0;
  const topGap=o.y-(player.y+player.h),bottomGap=player.y-(o.y+o.h);
  let gap=o.air?Math.min(...[topGap,bottomGap].filter(v=>v>=0)):topGap;
  if(!Number.isFinite(gap)||gap<0||gap>24)return 0;
  return gap<=8?2:1;
}
function passObstacle(o){
  o.passed=true;combo++;runPeakCombo=Math.max(runPeakCombo,combo);comboAge=0;comboEl.textContent=combo;
  const baseBonus=Math.min(45,8+combo*2),nearTier=nearMissTier(o),boosted=riskBoostTimer>0;
  const nearBonus=nearTier?(nearTier===2?26:14)*(boosted?2:1):0;
  const mechanicBonus=o.label==='会议'?10:(o.label==='临时需求'?8:(o.label==='BUG'&&o.mutationState==='done'?10:0));
  const bonus=baseBonus+nearBonus+mechanicBonus;distance+=bonus;
  if(nearTier){runNearMisses++;if(nearTier===2)runPerfectNearMisses++;unlockDiscovery('nearMiss')}
  let text=currentLang==='en'?`Combo ${combo}  +${bonus}m`:`连摸 ${combo}  +${bonus}m`;
  if(o.label==='会议')text=currentLang==='en'?`Through the meeting gap! Combo ${combo}  +${bonus}m`:`穿过会议缝！连摸 ${combo}  +${bonus}m`;
  else if(o.label==='临时需求')text=currentLang==='en'?`Dodged the drop! Combo ${combo}  +${bonus}m`:`躲过空投！连摸 ${combo}  +${bonus}m`;
  else if(o.label==='BUG'&&o.mutationState==='done')text=currentLang==='en'?`Dodged mutated BUG! +${bonus}m`:`躲过变异 BUG！ +${bonus}m`;
  else if(nearTier===2)text=currentLang==='en'?`PERFECT NEAR MISS${boosted?' ×2':''}! +${bonus}m`:`极限擦边${boosted?' ×2':''}！ +${bonus}m`;
  else if(nearTier===1)text=currentLang==='en'?`Near miss${boosted?' ×2':''}! +${bonus}m`:`擦边${boosted?' ×2':''}！ +${bonus}m`;
  else if(o.label==='咖啡渍')text=currentLang==='en'?`Cleared coffee spill! Combo ${combo}  +${bonus}m`:`跨过咖啡渍！连摸 ${combo}  +${bonus}m`;
  else if(o.label==='哑铃')text=currentLang==='en'?`Cleared dumbbell! Combo ${combo}  +${bonus}m`:`跨过哑铃！连摸 ${combo}  +${bonus}m`;
  addFloater(player.x+65,player.y-12,text,(nearTier||mechanicBonus)?'#9c3f2f':(combo>=8?'#9c3f2f':'#171717'));
  if(nearTier||mechanicBonus){screenShake=Math.max(screenShake,2.5);beep(920,.045,'triangle',.025)}
  if(combo>=10)unlockDiscovery('combo10');
  if(combo>bestCombo){bestCombo=combo;bestComboEl.textContent=bestCombo}
  beep(Math.min(980,430+combo*24),.035,'square',.022);
}
function collectPickup(p){
  p.got=true;
  if(p.kind==='leave'){
    leaveSlipHits=1;leaveSlipTimer=8;distance+=10;addFloater(p.x-10,p.y-10,currentLang==='en'?'Leave slip · 1 save':'请假条 · 挡一次','#506b2c');beep(620,.08,'triangle',.035);screenShake=1.5;return
  }
  if(p.kind==='risk'){
    riskBoostTimer=Math.max(riskBoostTimer,7);distance+=15;addFloater(p.x-16,p.y-10,currentLang==='en'?'Risk bonus · near-miss ×2':'绩效单 · 擦边 ×2','#8a6a16');beep(988,.08,'triangle',.035);screenShake=2;return
  }
  distance+=35;addFloater(p.x,p.y-10,currentLang==='en'?'Coffee +35m':'咖啡 +35m','#5e4a3d');beep(840,.07,'triangle',.03);screenShake=2;for(let i=0;i<14;i++)particles.push({x:p.x+16,y:p.y+18,vx:(Math.random()-.5)*210,vy:(Math.random()-.5)*180,a:1,r:2+Math.random()*3,c:'#5e4a3d'})
}
function absorbWithLeaveSlip(o){
  if(leaveSlipHits<1||leaveSlipTimer<=0)return false;
  leaveSlipHits=0;leaveSlipTimer=0;o.passed=true;o.x=-999;combo=0;comboAge=0;comboEl.textContent='0';addFloater(player.x+55,player.y-16,currentLang==='en'?`Leave slip saved you from ${tr(o.label)}`:`请假条挡住了「${o.label}」`,'#506b2c');screenShake=5;beep(540,.07,'triangle',.04);return true
}

function setEventHud(name='正常'){const active=name&&name!=='正常';eventHud.textContent=active?tr(name):tr('正常');eventChip.classList.toggle('hidden',!active)}
function triggerOfficeEvent(id){
  const def=officeEventDefs.find(e=>e.id===id);if(!def||endingPhase!=='none'||secretMoment!=='none')return false;
  officeEvent=id;officeEventTimer=def.dur;officeEventCooldown=18+gameRandom()*10;setEventHud(def.name);unlockDiscovery(id);tickerEl.textContent=tr(def.msg);tickerTimer=Math.max(tickerTimer,5.5);
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
  eventRollTimer=10+gameRandom()*8;if(gameRandom()>.44)return;
  let pool=officeEventDefs.filter(e=>e.minStage<=stageIndex);
  if(directorQueue.some(x=>x.label==='老板')||obstacles.some(o=>o.label==='老板'&&!o.passed))pool=pool.filter(e=>e.id!=='bossAway');
  if(!pool.length)return;let sum=pool.reduce((s,e)=>s+e.weight,0),r=gameRandom()*sum,pick=pool[0];
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
  if(!rareSceneRolled[idx]&&progress>.38){rareSceneRolled[idx]=true;if(progress<.78&&gameRandom()<.36)triggerRareMoment(rareMomentDefs[idx].id)}
}
function triggerSecretMoment(id){
  const def=secretMomentDefs.find(x=>x.id===id);if(!def||def.scene!==sceneIndex||endingPhase!=='none'||secretMoment!=='none'||rareMoment!=='none'||officeEvent!=='none')return false;
  secretMoment=id;secretMomentTimer=def.dur;secretVisualPulse=0;return true
}
function updateSecretMoment(dt){
  secretVisualPulse+=dt;if(secretMomentTimer>0){secretMomentTimer=Math.max(0,secretMomentTimer-dt);if(secretMomentTimer===0)secretMoment='none'}
  if(endingPhase!=='none'||stageIndex>=5||secretMoment!=='none'||rareMoment!=='none'||officeEvent!=='none')return;
  const idx=Math.max(0,sceneIndex),p=sceneProgress(idx);if(!secretSceneRolled[idx]&&p>=secretSceneThresholds[idx]){secretSceneRolled[idx]=true;if(gameRandom()<.065)triggerSecretMoment(secretMomentDefs[idx].id)}
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
    overlayTitle.textContent=currentLang==='en'?'Ending 1: Clocked out on time.':'结局一：准点下班。';overlayText.textContent=currentLang==='en'?`18:00. You pretended not to hear “hold on everyone” and slipped out before the door closed. Escape distance: ${rounded}m. Tomorrow’s requests belong to tomorrow.`:`18:00，你假装没听见“大家等一下”，在门关上前冲了出去。今日摸鱼 ${rounded} 米。明天的需求，明天再说。`;
    for(let i=0;i<30;i++)particles.push({x:player.x+35+Math.random()*150,y:GROUND-60-Math.random()*110,vx:100+Math.random()*220,vy:-70-Math.random()*180,a:1.4,r:2+Math.random()*4,c:['#d8ef9f','#f2c4ad','#d7ecfb','#f0d487'][i%4]});
  }else{
    overtimeEndings++;storageSet('91hwl_moyu_overtime_endings',String(overtimeEndings));unlockDiscovery('overtime',true);endingJingle('overtime');overtimeFlash=3.5;
    overlayTitle.textContent=currentLang==='en'?'Ending 2: “Voluntary” overtime.':'结局二：“自愿”加班。';overlayText.textContent=currentLang==='en'?`18:00:04. The boss asks, “No objections, right?” You stay silent for four seconds. The system records consent. Escape distance: ${rounded}m. Overtime willingness: 100% (system decision).`:`18:00:04，老板问“大家没意见吧？”。你沉默了四秒，系统自动识别为同意。今日摸鱼 ${rounded} 米，加班意愿：100%（系统判定）。`;
  }
  overlayText.textContent+=`\n\n${runMetricLine()}`;recordFinishedRun(type);syncStats();renderDiscoveries();last=performance.now()
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
  leaveSlipTimer=Math.max(0,leaveSlipTimer-dt);if(leaveSlipTimer===0)leaveSlipHits=0;riskBoostTimer=Math.max(0,riskBoostTimer-dt);
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
      if(!entryBusy){spawnPickup('coffee');coffeeRushRemaining--;pickupTimer=.85+gameRandom()*.55}else pickupTimer=.28;
    }else{const teaRoom=sceneIndex===2;const teaEarly=teaRoom&&sceneHalf===0;let chance=teaEarly?.94:(teaRoom?.82:.72);if(dailyMode&&dailyModifierId==='coffee')chance*=.62;if(!entryBusy&&gameRandom()<chance)spawnPickup();pickupTimer=(teaEarly?1.72:(teaRoom?2.35:2.8))+gameRandom()*(teaEarly?1.95:(teaRoom?2.55:3.6))}
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
      if(o.meetingDrift){const gapSize=o.gapBottom-o.gapTop,center=o.baseGapCenter+Math.sin(o.gatePulse*.72+o.driftPhase)*o.driftAmp;o.gapTop=center-gapSize/2;o.gapBottom=center+gapSize/2;o.panelH=o.gapTop-o.y;o.tableH=GROUND-o.gapBottom}
      if(o.firstGate&&!o.tutorialShown&&o.x<820){o.tutorialShown=true;tickerEl.textContent=tr('提示：第一次会议缝已加宽，普通单跳即可稳定通过。');tickerTimer=4.5;addFloater(o.x-35,o.gapTop-12,tr('第一次会议：单跳即可'),'#506b2c')}
    }
    if(o.gymBounce){o.bouncePhase+=dt*o.bounceSpeed;o.y=o.baseY-Math.abs(Math.sin(o.bouncePhase))*o.bounceAmp}
    if(!o.passed&&o.x+o.w<player.x+3)passObstacle(o)
  }
  for(const p of pickups){p.x-=speed*dt;p.spin+=dt*5}
  obstacles=obstacles.filter(o=>o.x>-140);pickups=pickups.filter(p=>p.x>-90&&!p.got);
  const pbox=playerHitbox();
  for(const o of obstacles){
    let collided=false;for(const obox of collisionRects(o))if(hit(pbox,obox,1)){collided=true;break}
    if(collided){if(absorbWithLeaveSlip(o))continue;gameOver(o.label);return}
  }
  for(const p of pickups)if(!p.got&&hit(pbox,p,2))collectPickup(p);
  if(speed>560&&Math.random()<dt*8)speedLines.push({x:W+20,y:120+Math.random()*340,len:28+Math.random()*80,a:.45});
  for(const l of speedLines){l.x-=speed*dt*1.45;l.a-=dt*.7}speedLines=speedLines.filter(l=>l.x>-120&&l.a>0);
  for(const d of particles){d.x+=d.vx*dt;d.y+=d.vy*dt;d.vy+=240*dt;d.a-=dt*1.9}particles=particles.filter(d=>d.a>0);
  for(const f of floaters){f.y+=f.vy*dt;f.a-=dt*.9}floaters=floaters.filter(f=>f.a>0);
  screenShake=Math.max(0,screenShake-dt*24);overtimeFlash=Math.max(0,overtimeFlash-dt);
}

function rr(x,y,w,h,r){const m=Math.min(r,w/2,h/2);ctx.beginPath();ctx.roundRect(x,y,w,h,m)}
function officeSkyColor(){
  const p=Math.min(1,runDistance/DAY_END_DISTANCE);if(p<.35)return '#dcecf3';if(p<.68)return '#eadfc5';if(p<.90)return '#e7b98f';return '#8d8aa4';
}
function drawEndingDoor(){
  if(endingPhase!=='decision'&&!(state==='ending'&&endingCinematicType==='ontime'))return;const x=exitDoorX,y=GROUND-154;
  ctx.save();ctx.fillStyle='#d8ef9f';ctx.strokeStyle='#171717';ctx.lineWidth=3;ctx.fillRect(x-4,y-31,104,25);ctx.strokeRect(x-4,y-31,104,25);ctx.fillStyle='#171717';ctx.font='950 16px ui-monospace,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(tr('下 班 出 口'),x+48,y-18);
  ctx.fillStyle='#725f4f';ctx.fillRect(x,y,96,154);ctx.strokeRect(x,y,96,154);ctx.fillStyle='#d7ecfb';ctx.fillRect(x+12,y+15,72,78);ctx.strokeRect(x+12,y+15,72,78);
  ctx.fillStyle='#f0d487';ctx.beginPath();ctx.arc(x+78,y+118,5,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#506b2c';ctx.font='950 14px ui-monospace,monospace';ctx.fillText(tr('空格 / 点击！'),x+48,y-48);ctx.restore();
}
function drawEndingCinematicFx(){
  if(state!=='ending')return;
  ctx.save();
  if(endingCinematicType==='ontime'){
    const a=Math.max(0,Math.min(1,1-endingCinematicTimer/1.55));ctx.fillStyle=`rgba(240,212,135,${.08+.12*a})`;ctx.fillRect(0,82,W,GROUND-82);
    ctx.fillStyle='rgba(216,239,159,.82)';ctx.strokeStyle='#171717';ctx.lineWidth=2;ctx.fillRect(W-240,110,176,34);ctx.strokeRect(W-240,110,176,34);ctx.fillStyle='#171717';ctx.font='950 15px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(tr('18:00 · 下班成功'),W-152,132);
  }else{
    const a=Math.max(0,Math.min(1,1-endingCinematicTimer/1.75));ctx.fillStyle=`rgba(55,48,74,${.10+.24*a})`;ctx.fillRect(0,82,W,GROUND-82);
    const bx=endingBossX,by=GROUND-92;ctx.fillStyle='#151515';ctx.fillRect(bx+16,by+34,28,38);ctx.fillStyle='#f0cfb2';ctx.beginPath();ctx.arc(bx+30,by+18,14,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c74c3d';ctx.beginPath();ctx.moveTo(bx+30,by+35);ctx.lineTo(bx+24,by+56);ctx.lineTo(bx+36,by+56);ctx.closePath();ctx.fill();ctx.fillStyle='#171717';ctx.font='950 16px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(tr('大家先别走。'),bx+28,by-12);
  }
  ctx.restore()
}
function drawLateOfficeFx(){
  if(stageIndex<4||endingPhase==='decision')return;
  ctx.save();for(let i=0;i<6;i++){
    const span=W+320,x=W+120-((worldTime*(78+i*9)+i*205)%span),y=170+((i*57)%215)+Math.sin(worldTime*1.8+i)*12;
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(worldTime*2.2+i)*.22);ctx.fillStyle=i%2?'rgba(255,253,248,.72)':'rgba(242,196,173,.58)';ctx.strokeStyle='rgba(23,23,23,.35)';ctx.lineWidth=1.5;ctx.fillRect(-12,-7,24,14);ctx.strokeRect(-12,-7,24,14);ctx.restore();
  }ctx.restore()
}
function drawExitHint(){
  if(stageIndex<3||endingPhase!=='none')return;const pulse=stageIndex>=4?.65+.35*Math.sin(worldTime*5):1;
  ctx.save();ctx.globalAlpha=stageIndex>=4?Math.max(.42,pulse):.62;ctx.fillStyle='#d8ef9f';ctx.strokeStyle='#171717';ctx.lineWidth=2;ctx.fillRect(W-168,252,124,28);ctx.strokeRect(W-168,252,124,28);ctx.fillStyle='#171717';ctx.font='950 13px ui-monospace,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(tr(stageIndex>=4?'出口 → 还有10分钟':'出口 → 18:00'),W-106,266);ctx.restore()
}

function drawWorkPod(x,y){
  ctx.save();ctx.translate(x,y);
  // 隔断、桌板、抽屉与理线槽
  ctx.fillStyle='#d7d2c7';ctx.fillRect(0,-78,250,92);ctx.fillStyle='#c1b6a3';ctx.fillRect(0,-84,250,10);ctx.strokeStyle='#171717';ctx.lineWidth=2;ctx.strokeRect(0,-78,250,92);
  ctx.fillStyle='#c7b29a';ctx.fillRect(18,18,190,14);ctx.fillRect(28,32,10,84);ctx.fillRect(183,32,10,84);
  ctx.fillStyle='#b19f8b';ctx.fillRect(40,32,28,60);ctx.fillStyle='#a29280';ctx.fillRect(44,38,20,10);ctx.fillRect(44,54,20,10);
  ctx.fillStyle='#7f776d';ctx.fillRect(188,26,6,56);ctx.fillRect(164,80,28,4);

  // 办公椅
  ctx.save();ctx.translate(118,82);ctx.fillStyle=stageIndex>=4?'#b97b72':'#6f7f92';ctx.strokeStyle='#171717';ctx.lineWidth=2;
  rr(-26,-48,52,40,8);ctx.fill();ctx.stroke();rr(-22,-12,44,15,5);ctx.fill();ctx.stroke();ctx.fillStyle='#474747';ctx.fillRect(-3,3,6,28);ctx.beginPath();ctx.moveTo(0,31);ctx.lineTo(-18,39);ctx.moveTo(0,31);ctx.lineTo(18,39);ctx.moveTo(0,31);ctx.lineTo(0,43);ctx.stroke();ctx.fillRect(-23,38,10,4);ctx.fillRect(13,38,10,4);ctx.fillRect(-5,42,10,4);ctx.restore();

  // 台式电脑：显示器在桌面后排，键鼠在前沿，主机移到桌下，避免所有东西挤成一团。
  ctx.fillStyle='#2a2a2a';ctx.fillRect(82,-34,78,46);
  ctx.fillStyle=stageIndex>=4?'#ffe0d8':'#eaf5fa';ctx.fillRect(88,-28,66,34);
  ctx.fillStyle=stageIndex>=4?'#d95a49':'#7ca2b5';ctx.fillRect(94,-20,38,4);ctx.fillRect(94,-11,48,4);ctx.fillRect(94,-2,26,4);
  ctx.fillStyle='#2a2a2a';ctx.fillRect(116,12,10,13);ctx.fillRect(98,25,46,4);

  // 正常中塔机箱，放在桌下侧面而不是桌面上的 ITX 小盒子。
  ctx.fillStyle='#44474b';ctx.fillRect(150,38,30,60);ctx.strokeStyle='#171717';ctx.strokeRect(150,38,30,60);
  ctx.fillStyle='#2b2b2b';ctx.fillRect(156,47,18,34);ctx.fillStyle='#8ad39c';ctx.fillRect(157,42,4,4);ctx.fillStyle='#70757a';ctx.fillRect(157,85,16,3);
  ctx.beginPath();ctx.arc(165,66,7,0,Math.PI*2);ctx.stroke();

  // 键盘与鼠标靠桌面前沿，和显示器支架错开。
  ctx.fillStyle='#ddd7cb';ctx.fillRect(82,7,58,8);ctx.strokeStyle='#aaa195';ctx.lineWidth=1;for(let k=0;k<6;k++)ctx.fillRect(86+k*8,9,5,2);
  ctx.fillStyle='#6f6a61';rr(146,8,10,7,3);ctx.fill();

  // 杯子、小植物、便签
  ctx.fillStyle='#8a7a66';ctx.fillRect(52,2,18,18);ctx.fillStyle='#f3f0e8';ctx.fillRect(56,-5,10,8);ctx.strokeStyle='#8a7a66';ctx.lineWidth=2;ctx.strokeRect(69,6,7,8);
  ctx.fillStyle='#5d7f4d';ctx.fillRect(188,-6,10,16);ctx.fillStyle='#7b6859';ctx.fillRect(186,8,14,6);
  ctx.fillStyle='#fff3a8';ctx.fillRect(28,-42,16,16);ctx.strokeStyle='#171717';ctx.strokeRect(28,-42,16,16);
  if(stageIndex>=4){ctx.fillStyle='#d95a49';ctx.font='950 9px ui-monospace,monospace';ctx.textAlign='right';ctx.fillText('99+',152,-8)}
  ctx.restore();
}
function drawCeilingDetails(offset=0,tone='#d9d2c6'){
  ctx.save();
  ctx.fillStyle='#ece7de';ctx.fillRect(0,82,W,20);
  ctx.fillStyle=tone;ctx.fillRect(0,100,W,3);
  const o=-((runDistance*1.05+offset)%330)-330;
  for(let i=-1;i<6;i++){
    const x=i*330+o;
    ctx.fillStyle='rgba(255,253,248,.92)';ctx.strokeStyle='rgba(23,23,23,.24)';ctx.lineWidth=1.5;
    ctx.fillRect(x+36,88,122,7);ctx.strokeRect(x+36,88,122,7);
    ctx.fillStyle='#bdb6aa';ctx.fillRect(x+215,88,54,8);
    for(let k=0;k<4;k++){ctx.fillStyle='#9f988e';ctx.fillRect(x+221+k*11,90,7,2)}
  }
  ctx.restore();
}
function drawOfficeWindow(x,y,w,h,variant=0){
  ctx.save();
  ctx.fillStyle='#e5e0d7';ctx.fillRect(x-8,y-8,w+16,h+18);
  ctx.fillStyle=officeSkyColor();ctx.fillRect(x,y,w,h);
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  const dusk=Math.min(1,runDistance/DAY_END_DISTANCE);
  ctx.fillStyle=dusk>.72?'rgba(99,99,118,.36)':'rgba(115,132,142,.28)';
  const bw=34;for(let i=-1;i<8;i++){const bx=x+((i*61+variant*23)% (w+70))-20,bh=34+((i*29+variant*17)%58);ctx.fillRect(bx,y+h-bh,bw,bh);if(i%2===0){ctx.fillStyle='rgba(255,238,174,.28)';ctx.fillRect(bx+8,y+h-bh+10,4,5);ctx.fillRect(bx+20,y+h-bh+22,4,5);ctx.fillStyle=dusk>.72?'rgba(99,99,118,.36)':'rgba(115,132,142,.28)'}}
  ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(x+15,y+8,12,h-16);ctx.restore();
  ctx.strokeStyle='#262626';ctx.lineWidth=3;ctx.strokeRect(x,y,w,h);
  ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+w*.52,y);ctx.lineTo(x+w*.52,y+h);ctx.stroke();
  ctx.fillStyle='#a9a092';ctx.fillRect(x-4,y+h,w+8,7);
  ctx.restore();
}
function drawOfficeDoor(x,y,w=82,h=164,label=''){
  ctx.save();
  ctx.fillStyle='#d3cec5';ctx.fillRect(x-7,y-7,w+14,h+14);
  ctx.fillStyle='#b7a993';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#262626';ctx.lineWidth=3;ctx.strokeRect(x,y,w,h);
  ctx.fillStyle='#dcebf0';ctx.fillRect(x+12,y+14,w-24,54);ctx.strokeRect(x+12,y+14,w-24,54);
  ctx.fillStyle='#6f6256';ctx.fillRect(x+w-18,y+92,7,4);
  ctx.fillStyle='#8d8478';ctx.fillRect(x+w+9,y+18,34,18);ctx.strokeStyle='rgba(23,23,23,.55)';ctx.lineWidth=1.5;ctx.strokeRect(x+w+9,y+18,34,18);
  if(label){ctx.fillStyle='#fffdf8';ctx.font='900 8px ui-monospace,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(tr(label),x+w+26,y+27)}
  ctx.restore();
}
function drawWallPlant(x,y){
  ctx.save();ctx.fillStyle='#8d7a65';ctx.fillRect(x-13,y-18,26,18);ctx.fillStyle='#5f7f51';for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(x+(i-2)*5,y-27-Math.abs(i-2)*2,6,14,(i-2)*.18,0,Math.PI*2);ctx.fill()}ctx.restore();
}
function drawWorkstationScene(){
  ctx.fillStyle='#e8e3d9';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#f7f4ed';ctx.fillRect(0,82,W,205);
  drawCeilingDetails(0,'#d4ccbf');
  drawSharedFloor();

  // 后墙采用“窗 + 墙 + 门”的真实办公结构，而不是无限复制四格大窗。
  const back=-((runDistance*1.12)%430)-430;
  for(let i=-1;i<5;i++){
    const x=i*430+back,kind=((i%3)+3)%3;
    if(kind===0){drawOfficeWindow(x+24,116,230,126,i);ctx.fillStyle='#ded7ca';ctx.fillRect(x+276,108,116,154);drawWallPlant(x+334,259)}
    else if(kind===1){ctx.fillStyle='#e9e4dc';ctx.fillRect(x+12,106,118,166);drawOfficeDoor(x+148,108,84,164,'会议');ctx.fillStyle='#fffdf8';ctx.strokeStyle='#777067';ctx.lineWidth=1.5;ctx.fillRect(x+260,132,104,64);ctx.strokeRect(x+260,132,104,64);ctx.fillStyle='#7c746b';ctx.fillRect(x+278,150,64,4);ctx.fillRect(x+278,162,44,4)}
    else{drawOfficeWindow(x+18,116,248,126,i);ctx.fillStyle='#ded7ca';ctx.fillRect(x+288,108,92,154);ctx.fillStyle='#fff3a8';ctx.strokeStyle='#171717';ctx.lineWidth=1.5;ctx.fillRect(x+310,144,40,46);ctx.strokeRect(x+310,144,40,46)}
  }
  ctx.fillStyle='#bdb3a4';ctx.fillRect(0,279,W,8);

  const pod=-((runDistance*4.25)%380)-80;for(let i=-1;i<5;i++)drawWorkPod(i*380+pod,335);
}
function drawMeetingPod(x,y){
  ctx.save();ctx.translate(x,y);
  // 会议桌
  ctx.fillStyle='#e8e1d6';ctx.strokeStyle='#171717';ctx.lineWidth=2;ctx.fillRect(12,-34,314,18);ctx.strokeRect(12,-34,314,18);
  ctx.fillStyle='#9f9688';ctx.fillRect(32,-16,12,84);ctx.fillRect(294,-16,12,84);
  // 两侧会议椅，靠背朝桌面
  for(let i=0;i<4;i++){
    const cx=34+i*72;
    ctx.fillStyle='#747a80';rr(cx,-76,38,26,5);ctx.fill();ctx.stroke();ctx.fillStyle='#5d6267';ctx.fillRect(cx+7,-50,24,11);
    ctx.fillStyle='#747a80';rr(cx,6,38,16,4);ctx.fill();ctx.stroke();ctx.fillStyle='#5d6267';ctx.fillRect(cx+9,22,20,19);
  }
  // 桌上笔记本、水杯、会议电话
  ctx.fillStyle='#3e4347';ctx.fillRect(102,-50,64,34);ctx.fillStyle='#cfe2e9';ctx.fillRect(108,-45,52,22);ctx.fillStyle='#6f6a61';ctx.fillRect(118,-16,34,4);
  ctx.fillStyle='#f6f1e8';ctx.fillRect(207,-45,18,24);ctx.strokeStyle='#8a8176';ctx.strokeRect(207,-45,18,24);
  ctx.fillStyle='#2f3132';ctx.beginPath();ctx.arc(250,-25,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#81878a';ctx.fillRect(245,-29,10,3);
  ctx.restore();
}
function drawMeetingRoomScene(){
  ctx.fillStyle='#e4e1da';ctx.fillRect(0,0,W,H);ctx.fillStyle='#f4f3ee';ctx.fillRect(0,82,W,205);drawCeilingDetails(80,'#d0d2d2');drawSharedFloor();
  // 玻璃会议室应当有固定玻璃隔断、磨砂条和可识别的玻璃门。
  const off=-((runDistance*1.42)%460)-460;
  for(let i=-1;i<5;i++){
    const x=i*460+off;
    ctx.fillStyle='rgba(210,230,236,.70)';ctx.strokeStyle='#262626';ctx.lineWidth=3;ctx.fillRect(x+14,112,286,142);ctx.strokeRect(x+14,112,286,142);
    ctx.beginPath();ctx.moveTo(x+154,112);ctx.lineTo(x+154,254);ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.44)';ctx.fillRect(x+14,174,286,22);
    // 玻璃门
    ctx.fillStyle='rgba(218,234,239,.82)';ctx.fillRect(x+318,112,92,164);ctx.strokeRect(x+318,112,92,164);ctx.fillStyle='#5e5b57';ctx.fillRect(x+389,192,8,4);
    ctx.fillStyle='rgba(255,255,255,.45)';ctx.fillRect(x+318,174,92,22);
    // 墙挂屏 / 白板作为房间固定设施，不跟桌子一起飘。
    if(i%2===0){ctx.fillStyle='#262626';ctx.fillRect(x+56,126,122,48);ctx.fillStyle='#d7ecfb';ctx.fillRect(x+64,134,106,32);ctx.fillStyle='#6d96aa';ctx.fillRect(x+72,143,46,4);ctx.fillRect(x+72,153,70,4)}
    else{ctx.fillStyle='#fffdf8';ctx.strokeStyle='#7a746c';ctx.lineWidth=2;ctx.fillRect(x+62,128,114,44);ctx.strokeRect(x+62,128,114,44);ctx.fillStyle='#787169';ctx.fillRect(x+72,139,62,3);ctx.fillRect(x+72,149,40,3)}
  }
  const module=-((runDistance*3.0)%500)-120;for(let i=-1;i<4;i++)drawMeetingPod(i*500+module,408);
}
function drawPantryPod(x,y){
  ctx.save();ctx.translate(x,y);
  // 下柜与操作台
  ctx.fillStyle='#b7aa96';ctx.fillRect(0,-18,286,18);ctx.fillStyle='#c8bba7';ctx.fillRect(12,0,258,88);ctx.strokeStyle='#8f8578';ctx.lineWidth=1.5;for(let i=0;i<4;i++)ctx.strokeRect(18+i*61,8,54,70);
  // 水槽与龙头
  ctx.fillStyle='#889195';ctx.fillRect(16,-13,52,8);ctx.strokeStyle='#5f676a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(42,-20,10,Math.PI,Math.PI*2);ctx.stroke();ctx.fillRect(50,-22,3,12);
  // 咖啡机、微波炉、水壶
  ctx.fillStyle='#202020';ctx.fillRect(80,-78,66,58);ctx.fillStyle='#f0d487';ctx.fillRect(92,-64,40,14);ctx.fillStyle='#6a5848';ctx.fillRect(154,-48,28,28);ctx.fillStyle='#fff';ctx.fillRect(160,-60,16,12);
  ctx.fillStyle='#2f3132';ctx.fillRect(194,-72,48,34);ctx.fillStyle='#86a8b6';ctx.fillRect(201,-65,34,11);ctx.fillStyle='#d2d7d9';ctx.fillRect(248,-58,11,20);
  // 冰箱
  ctx.fillStyle='#dad5cb';ctx.fillRect(304,-84,138,172);ctx.strokeStyle='#171717';ctx.lineWidth=2;ctx.strokeRect(304,-84,138,172);ctx.beginPath();ctx.moveTo(304,-2);ctx.lineTo(442,-2);ctx.stroke();ctx.fillStyle='#777';ctx.fillRect(426,-46,4,26);ctx.fillRect(426,18,4,26);
  // 高脚凳
  for(let i=0;i<2;i++){ctx.fillStyle='#91877a';ctx.fillRect(210+i*36,20,22,8);ctx.fillRect(218+i*36,28,6,38);ctx.fillRect(210+i*36,64,22,4)}
  ctx.restore();
}
function drawPantryScene(){
  ctx.fillStyle='#ece6dc';ctx.fillRect(0,0,W,H);ctx.fillStyle='#f7f4ed';ctx.fillRect(0,82,W,205);drawCeilingDetails(160,'#d8cdbd');drawSharedFloor();
  // 茶水间后墙：瓷砖挡水墙、吊柜、门。家具和水电关系要看起来合理。
  ctx.fillStyle='#ddd6ca';ctx.fillRect(0,116,W,142);ctx.strokeStyle='rgba(120,112,101,.22)';ctx.lineWidth=1;
  for(let y=116;y<258;y+=28){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
  for(let x=-((runDistance*1.2)%110)-110;x<W;x+=110){ctx.beginPath();ctx.moveTo(x,116);ctx.lineTo(x,258);ctx.stroke()}
  const back=-((runDistance*1.15)%520)-520;
  for(let i=-1;i<5;i++){
    const x=i*520+back;
    if(i%3===1){drawOfficeDoor(x+364,108,86,166,'茶水间')}
    else{for(let c=0;c<3;c++){ctx.fillStyle='#c9bead';ctx.strokeStyle='#8e8578';ctx.lineWidth=1.5;ctx.fillRect(x+32+c*86,126,76,48);ctx.strokeRect(x+32+c*86,126,76,48);ctx.fillStyle='#777';ctx.fillRect(x+98+c*86,148,3,5)}}
    ctx.fillStyle='#a79a87';ctx.fillRect(x+300,240,42,34);ctx.fillStyle='#5d7f4d';ctx.fillRect(x+310,218,22,24);
  }
  const pod=-((runDistance*3.25)%540)-120;for(let i=-1;i<4;i++)drawPantryPod(i*540+pod,370);
}
function drawGymPod(x,y){
  ctx.save();ctx.translate(x,y);
  // 跑步机
  ctx.fillStyle='#383a3c';ctx.fillRect(10,-10,188,14);ctx.fillRect(28,4,12,38);ctx.fillRect(172,4,12,38);ctx.strokeStyle='#171717';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(70,-10);ctx.lineTo(112,-78);ctx.lineTo(154,-10);ctx.stroke();ctx.fillStyle='#6a6d70';ctx.fillRect(100,-68,24,10);
  // 哑铃架
  ctx.fillStyle='#626568';ctx.fillRect(238,-8,118,8);ctx.fillRect(248,-2,8,46);ctx.fillRect(338,-2,8,46);for(let j=0;j<5;j++){ctx.fillStyle='#777b7e';ctx.fillRect(250+j*22,-8-j*10,16,16)}
  // 长凳
  ctx.fillStyle='#3d3f41';ctx.fillRect(384,-4,92,12);ctx.fillRect(398,8,8,34);ctx.fillRect(456,8,8,34);
  ctx.restore();
}
function drawGymScene(){
  ctx.fillStyle='#dedee1';ctx.fillRect(0,0,W,H);ctx.fillStyle='#f4f4f1';ctx.fillRect(0,82,W,205);drawCeilingDetails(230,'#cbcdd0');drawSharedFloor();
  // 后墙为镜面 + 墙柱 + 门/储物柜，不再像一整排无尽玻璃窗。
  const off=-((runDistance*1.25)%500)-500;
  for(let i=-1;i<5;i++){
    const x=i*500+off;
    ctx.fillStyle='#dce8ec';ctx.strokeStyle='#262626';ctx.lineWidth=3;ctx.fillRect(x+18,110,270,144);ctx.strokeRect(x+18,110,270,144);ctx.beginPath();ctx.moveTo(x+153,110);ctx.lineTo(x+153,254);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(x+36,120,18,120);
    if(i%2===0){ctx.fillStyle='#b5b7b9';ctx.fillRect(x+310,112,130,156);ctx.strokeStyle='#777b7e';ctx.lineWidth=1.5;for(let r=0;r<3;r++)for(let c=0;c<2;c++){ctx.strokeRect(x+318+c*58,120+r*47,52,42);ctx.fillStyle='#777';ctx.fillRect(x+361+c*58,140+r*47,4,6)}}
    else{drawOfficeDoor(x+332,108,84,164,'更衣')}
  }
  // 墙上时钟与饮水提示
  ctx.fillStyle='#fffdf8';ctx.strokeStyle='#555';ctx.lineWidth=2;ctx.beginPath();ctx.arc(96,146,17,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(96,146);ctx.lineTo(96,136);ctx.moveTo(96,146);ctx.lineTo(103,150);ctx.stroke();
  const pod=-((runDistance*4.0)%520)-100;for(let i=-1;i<4;i++)drawGymPod(i*520+pod,418);
}
function drawSceneByIndex(idx){if(idx===1)drawMeetingRoomScene();else if(idx===2)drawPantryScene();else if(idx===3)drawGymScene();else drawWorkstationScene()}
function drawRareMomentFx(){
  if(rareMoment==='allHands'){
    ctx.save();ctx.fillStyle='rgba(216,239,159,.10)';ctx.fillRect(0,82,W,423);ctx.fillStyle='#171717';ctx.font='950 13px ui-monospace,monospace';ctx.fillText(tr('全员开会中 · 工位暂时无人'),820,278);ctx.restore();
  }else if(rareMoment==='projector'){
    ctx.save();ctx.globalAlpha=.88;ctx.fillStyle='#3158aa';ctx.fillRect(420,118,360,142);ctx.strokeStyle='#171717';ctx.lineWidth=3;ctx.strokeRect(420,118,360,142);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='950 22px ui-monospace,monospace';ctx.fillText('NO SIGNAL',600,176);ctx.font='850 12px ui-monospace,monospace';ctx.fillText(tr('正在重新连接 HDMI…'),600,207);ctx.restore();
  }else if(rareMoment==='coffeeMachine'){
    ctx.save();ctx.strokeStyle='rgba(111,76,47,.55)';ctx.lineWidth=3;for(let i=0;i<6;i++){const x=500+i*38,y=350-((rareVisualPulse*45+i*17)%90);ctx.beginPath();ctx.arc(x,y,8+Math.sin(rareVisualPulse*3+i)*3,Math.PI*.15,Math.PI*.85);ctx.stroke()}ctx.fillStyle='#8a6a16';ctx.font='950 14px ui-monospace,monospace';ctx.fillText(tr('咖啡机：今日进入超频模式'),760,282);ctx.restore();
  }else if(rareMoment==='treadmill'){
    ctx.save();ctx.fillStyle='rgba(217,90,73,.08)';ctx.fillRect(0,287,W,GROUND-287);ctx.strokeStyle='rgba(156,63,47,.55)';ctx.lineWidth=3;for(let x=-((worldTime*260)%120);x<W;x+=120){ctx.beginPath();ctx.moveTo(x,475);ctx.lineTo(x+55,445);ctx.stroke()}ctx.fillStyle='#9c3f2f';ctx.font='950 14px ui-monospace,monospace';ctx.fillText(tr('跑步机失控 · 节奏加速中'),820,282);ctx.restore();
  }
}
function drawSceneHalfFx(){
  if(!sceneHalf)return;ctx.save();ctx.textAlign='left';ctx.textBaseline='alphabetic';const pulse=.55+.45*Math.sin(worldTime*2.4);
  if(sceneIndex===0){ctx.fillStyle='rgba(217,90,73,.07)';ctx.fillRect(0,82,W,205);ctx.fillStyle='rgba(217,90,73,.55)';for(let x=245;x<W;x+=380)ctx.fillRect(x,284,9,9)}
  else if(sceneIndex===1){ctx.fillStyle='rgba(80,107,44,.08)';ctx.fillRect(0,82,W,205);ctx.fillStyle='#6f6a61';ctx.font='900 12px ui-monospace,monospace';ctx.fillText(tr('会议已延长 30 分钟'),890,282)}
  else if(sceneIndex===2){ctx.fillStyle='rgba(111,76,47,.06)';ctx.fillRect(0,287,W,GROUND-287);for(let i=0;i<4;i++){ctx.globalAlpha=.18+.10*pulse;ctx.fillStyle='#6f4c2f';ctx.beginPath();ctx.ellipse(210+i*270,470-i*4,28+i*4,5,0,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}
  else if(sceneIndex===3){ctx.fillStyle='rgba(156,63,47,.06)';ctx.fillRect(0,82,W,423);ctx.fillStyle='#9c3f2f';ctx.font='950 13px ui-monospace,monospace';ctx.fillText('LAST 30 MIN · KEEP MOVING',865,282)}
  ctx.restore()
}
function drawSecretMomentFx(){
  if(secretMoment==='none')return;ctx.save();
  if(secretMoment==='deskCat'){
    const x=((secretVisualPulse*115)%(W+120))-60,y=328;ctx.fillStyle='#171717';ctx.fillRect(x,y,18,9);ctx.fillRect(x+14,y-7,9,9);ctx.fillRect(x+2,y+9,4,5);ctx.fillRect(x+13,y+9,4,5);ctx.beginPath();ctx.moveTo(x+1,y+2);ctx.lineTo(x-9,y-7);ctx.lineTo(x-5,y+4);ctx.fill();ctx.fillStyle='#d8ef9f';ctx.fillRect(x+18,y-4,2,2)
  }else if(secretMoment==='meetingMute'){
    ctx.fillStyle='rgba(23,23,23,.86)';ctx.fillRect(470,126,260,86);ctx.strokeStyle='#fffdf8';ctx.lineWidth=2;ctx.strokeRect(470,126,260,86);ctx.fillStyle='#fffdf8';ctx.font='950 18px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(tr('你 已 被 静 音'),600,164);ctx.font='800 11px ui-monospace,monospace';ctx.fillText(tr('其实也没人发现'),600,190)
  }else if(secretMoment==='fridgeNote'){
    ctx.fillStyle='#fff3a8';ctx.strokeStyle='#171717';ctx.lineWidth=2;ctx.save();ctx.translate(815,320);ctx.rotate(-.045);ctx.fillRect(0,0,126,78);ctx.strokeRect(0,0,126,78);ctx.fillStyle='#171717';ctx.font='950 13px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(tr('今天也辛苦了'),63,31);ctx.font='800 10px ui-monospace,monospace';ctx.fillText(tr('下班记得吃饭'),63,53);ctx.restore()
  }else if(secretMoment==='bossCardio'){
    const bx=850+Math.sin(secretVisualPulse*5)*7,by=350;ctx.fillStyle='#151515';ctx.fillRect(bx,by,25,44);ctx.fillStyle='#f0cfb2';ctx.beginPath();ctx.arc(bx+12,by-10,10,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#171717';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(bx+4,by+42);ctx.lineTo(bx-4,by+64);ctx.moveTo(bx+20,by+42);ctx.lineTo(bx+30,by+64);ctx.stroke();ctx.fillStyle='#9c3f2f';ctx.font='900 10px ui-monospace,monospace';ctx.fillText('BOSS · CARDIO',820,432)
  }
  ctx.restore()
}
function drawSceneTransitionFx(){
  if(sceneBlend<=0||previousSceneIndex===sceneIndex)return;
  const boundary=W*Math.max(0,Math.min(1,sceneBlend));
  ctx.save();
  // 像跑过墙柱/门框，而不是两张背景互相半透明叠加。
  ctx.fillStyle='#d1c9bd';ctx.fillRect(boundary-34,82,54,423);
  ctx.fillStyle='#9f978c';ctx.fillRect(boundary-34,82,6,423);
  ctx.fillStyle='#fffdf8';ctx.fillRect(boundary+12,82,8,423);
  ctx.fillStyle='rgba(23,23,23,.12)';ctx.fillRect(boundary+20,82,18,423);
  ctx.restore();
}
function drawSharedFloor(){
  // 四个场景共享同一套“侧视跑动地面”。家具可以换，但玩家的落点参照永远一致。
  const floorTop=287;
  ctx.save();
  ctx.fillStyle='#d6d1c6';ctx.fillRect(0,floorTop,W,H-floorTop);
  // 远端墙脚/踢脚线
  ctx.fillStyle='#c2baae';ctx.fillRect(0,floorTop,W,8);
  // 地砖缝：只负责空间感，不承担落点提示。
  ctx.strokeStyle='rgba(120,112,101,.34)';ctx.lineWidth=1.35;
  const tileX=-((runDistance*6.2)%150)-150;
  for(let x=tileX;x<W;x+=150){ctx.beginPath();ctx.moveTo(x,floorTop);ctx.lineTo(x,GROUND+58);ctx.stroke()}
  for(let y=floorTop+38;y<H;y+=42){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}

  // 跑动通道：比上一版更明确，但仍然属于办公室地板的一部分。
  ctx.fillStyle='rgba(255,253,248,.34)';ctx.fillRect(0,GROUND-20,W,54);
  ctx.fillStyle='rgba(255,255,255,.62)';ctx.fillRect(0,GROUND-2,W,2);
  // 真正的落点边界位于脚底下方 2px。高速时只需要盯这一条即可。
  ctx.fillStyle='rgba(23,23,23,.58)';ctx.fillRect(0,GROUND+2,W,4);
  ctx.fillStyle='rgba(23,23,23,.18)';ctx.fillRect(0,GROUND+8,W,1);

  // 通道内部增加移动短标记，帮助眼睛感知横向速度，但不与障碍轮廓抢视觉权重。
  const markerX=-((runDistance*7.4)%140)-140;
  ctx.fillStyle='rgba(23,23,23,.22)';
  for(let x=markerX;x<W;x+=140)ctx.fillRect(x,GROUND+17,38,2);

  // 接触阴影让人物、老板、BUG 等地面对象“压”在地面上，而不是贴在线上。
  const g=ctx.createLinearGradient(0,GROUND-10,0,GROUND+12);
  g.addColorStop(0,'rgba(23,23,23,0)');g.addColorStop(.58,'rgba(23,23,23,.10)');g.addColorStop(1,'rgba(23,23,23,0)');
  ctx.fillStyle=g;ctx.fillRect(0,GROUND-10,W,22);
  ctx.restore();
}
function drawAtmosphere(){
  const p=Math.max(0,Math.min(1,runDistance/DAY_END_DISTANCE));
  ctx.save();
  const top=ctx.createLinearGradient(0,0,0,H);top.addColorStop(0,p>.78?'rgba(94,84,118,.08)':'rgba(255,255,255,.05)');top.addColorStop(.58,'rgba(255,255,255,0)');top.addColorStop(1,'rgba(20,20,20,.045)');ctx.fillStyle=top;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(255,255,255,.10)';ctx.lineWidth=1;for(let y=86;y<GROUND;y+=46){ctx.beginPath();ctx.moveTo(0,y+.5);ctx.lineTo(W,y+.5);ctx.stroke()}
  ctx.restore();
}
function drawBackground(){
  if(sceneBlend>0&&previousSceneIndex!==sceneIndex){
    drawSceneByIndex(previousSceneIndex);
    const boundary=W*Math.max(0,Math.min(1,sceneBlend));
    ctx.save();ctx.beginPath();ctx.rect(boundary,0,W-boundary,H);ctx.clip();drawSceneByIndex(sceneIndex);ctx.restore();
  }else drawSceneByIndex(sceneIndex);
  drawSceneTransitionFx();drawRareMomentFx();drawSceneHalfFx();drawSecretMomentFx();drawExitHint();drawLateOfficeFx();drawEndingDoor();drawEndingCinematicFx();
  if(stageIndex>=4){ctx.fillStyle='rgba(235,177,128,.09)';ctx.fillRect(0,0,W,H)}
  if(endingPhase==='decision'){ctx.fillStyle='rgba(216,239,159,.055)';ctx.fillRect(0,0,W,H)}
  if(endingPhase==='overtime'||stageIndex===5){ctx.fillStyle='rgba(78,68,105,.12)';ctx.fillRect(0,0,W,H)}
  if(salaryFlash>0){ctx.fillStyle=`rgba(240,212,135,${Math.min(.12,salaryFlash*.08)})`;ctx.fillRect(0,0,W,H)}
  drawAtmosphere();
}
function drawDesk(x,y){
  // 办公椅：放在桌子后方，让工位区真正像有人在这里上班。
  ctx.save();
  ctx.translate(x+148,y+8);
  const chairTint=stageIndex>=4?'#b97b72':'#7f8792';
  ctx.fillStyle=chairTint;ctx.strokeStyle='#171717';ctx.lineWidth=2;
  rr(-22,-58,44,42,8);ctx.fill();ctx.stroke();
  rr(-19,-18,38,16,5);ctx.fill();ctx.stroke();
  ctx.fillStyle='#4c4c4c';ctx.fillRect(-3,-2,6,28);
  ctx.beginPath();ctx.moveTo(0,26);ctx.lineTo(-18,34);ctx.moveTo(0,26);ctx.lineTo(18,34);ctx.moveTo(0,26);ctx.lineTo(0,38);ctx.stroke();
  ctx.fillStyle='#4c4c4c';ctx.fillRect(-23,33,10,4);ctx.fillRect(13,33,10,4);ctx.fillRect(-5,37,10,4);
  ctx.restore();

  // 桌体
  ctx.fillStyle='#bcb3a4';ctx.fillRect(x,y,205,17);ctx.fillRect(x+22,y+17,11,100);ctx.fillRect(x+171,y+17,11,100);
  // 显示器与支架
  ctx.fillStyle='#242424';ctx.fillRect(x+72,y-66,96,57);ctx.fillRect(x+116,y-9,9,18);ctx.fillRect(x+94,y+9,55,5);
  ctx.fillStyle=stageIndex>=4?'#ffe0d8':(stageIndex>=3?'#fff1cf':'#f4f2ec');ctx.fillRect(x+81,y-57,78,38);ctx.fillStyle=stageIndex>=3?'#9c3f2f':'#747474';ctx.fillRect(x+88,y-49,49,4);ctx.fillRect(x+88,y-38,60,4);ctx.fillRect(x+88,y-27,38,4);
  if(stageIndex>=4){ctx.fillStyle='#d95a49';ctx.font='950 9px ui-monospace,monospace';ctx.textAlign='right';ctx.fillText('99+',x+154,y-24)}
  // 杯子、键盘、鼠标
  ctx.fillStyle='#8a7a66';ctx.fillRect(x+42,y-18,18,18);ctx.fillStyle='#f3f0e8';ctx.fillRect(x+46,y-25,10,8);ctx.strokeStyle='#8a7a66';ctx.lineWidth=2;ctx.strokeRect(x+59,y-14,7,8);
  ctx.fillStyle='#e7e1d5';ctx.fillRect(x+96,y-2,46,6);ctx.fillStyle='#6f6a61';ctx.fillRect(x+147,y+1,8,5);
}

function drawTinyCoworker(x,y,pose='desk',accent='#7f8792',alpha=.34){
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.strokeStyle='#171717';ctx.fillStyle='#e6ccb0';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(0,-24,7,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=accent;rr(-8,-17,16,20,3);ctx.fill();ctx.stroke();
  ctx.strokeStyle='#3d3d3d';ctx.lineWidth=3;ctx.lineCap='round';
  if(pose==='walk'){ctx.beginPath();ctx.moveTo(-4,2);ctx.lineTo(-9,16);ctx.moveTo(4,2);ctx.lineTo(10,16);ctx.moveTo(-7,-10);ctx.lineTo(-14,-1);ctx.moveTo(7,-10);ctx.lineTo(14,-3);ctx.stroke()}
  else if(pose==='coffee'){ctx.beginPath();ctx.moveTo(-4,2);ctx.lineTo(-5,15);ctx.moveTo(4,2);ctx.lineTo(5,15);ctx.moveTo(7,-10);ctx.lineTo(16,-14);ctx.stroke();ctx.fillStyle='#fffdf8';ctx.strokeStyle='#6a5848';ctx.lineWidth=1;ctx.fillRect(15,-19,6,8);ctx.strokeRect(15,-19,6,8)}
  else if(pose==='gym'){ctx.beginPath();ctx.moveTo(-5,2);ctx.lineTo(-10,14);ctx.moveTo(5,2);ctx.lineTo(10,14);ctx.moveTo(-7,-10);ctx.lineTo(-16,-16);ctx.moveTo(7,-10);ctx.lineTo(16,-16);ctx.stroke();ctx.fillStyle='#3d3d3d';ctx.fillRect(-21,-19,42,4);ctx.fillRect(-24,-22,5,10);ctx.fillRect(19,-22,5,10)}
  else{ctx.beginPath();ctx.moveTo(-5,2);ctx.lineTo(-9,10);ctx.moveTo(5,2);ctx.lineTo(8,10);ctx.moveTo(-7,-10);ctx.lineTo(-14,-3);ctx.moveTo(7,-10);ctx.lineTo(14,-5);ctx.stroke()}
  ctx.restore();
}
function drawAmbientOfficeLife(){
  if(state==='menu'||rareMoment==='allHands')return;
  const drift=-((runDistance*.72)%520);
  if(sceneIndex===0){
    drawTinyCoworker(360+drift,392,'desk','#8394a3',.23);drawTinyCoworker(880+drift,395,'desk','#a8877c',.20);drawTinyCoworker(1390+drift,392,'walk','#768a73',.18);
  }else if(sceneIndex===1){
    drawTinyCoworker(455+drift*.42,255,'desk','#8e83a0',.24);drawTinyCoworker(760+drift*.42,255,'desk','#8394a3',.20);drawTinyCoworker(1040+drift*.42,255,'desk','#9b8870',.18);
  }else if(sceneIndex===2){
    drawTinyCoworker(510+drift*.62,375,'coffee','#8e83a0',.22);drawTinyCoworker(1010+drift*.62,372,'walk','#768a73',.18);
  }else if(sceneIndex===3){
    drawTinyCoworker(475+drift*.88,406,'gym','#9a766d',.20);drawTinyCoworker(980+drift*.88,405,'walk','#71859a',.18);
  }
}
function drawRunAtmosphere(){
  const day=Math.max(0,Math.min(1,runDistance/DAY_END_DISTANCE));
  ctx.save();
  // Shift the office from cool afternoon into warmer late-day pressure without changing collision readability.
  if(day>.18){
    const a=(day-.18)*.075;const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,'rgba(255,236,190,0)');g.addColorStop(1,`rgba(242,171,116,${a.toFixed(3)})`);ctx.fillStyle=g;ctx.fillRect(0,82,W,GROUND-82);
  }
  if(speed>470){
    const alpha=Math.min(.13,(speed-470)/1300);ctx.strokeStyle=`rgba(23,23,23,${alpha})`;ctx.lineWidth=2;
    const shift=(worldTime*speed*.82)%170;for(let x=-170+shift;x<W+170;x+=170){ctx.beginPath();ctx.moveTo(x,GROUND+32);ctx.lineTo(x-62,GROUND+32);ctx.stroke()}
  }
  // A thin progress-light at the top of the playfield gives the run a subtle arcade frame.
  const p=Math.max(0,Math.min(1,runDistance/DAY_END_DISTANCE));
  ctx.fillStyle='rgba(23,23,23,.12)';ctx.fillRect(0,0,W,4);ctx.fillStyle=stageIndex>=4?'rgba(156,63,47,.78)':(stageIndex>=3?'rgba(224,179,77,.72)':'rgba(80,107,44,.62)');ctx.fillRect(0,0,W*p,4);
  if(stageIndex>=4){const pulse=.035+.025*Math.sin(worldTime*5);ctx.fillStyle=`rgba(156,63,47,${pulse})`;ctx.fillRect(0,82,W,H-82)}
  ctx.restore();
}
function drawPlayerFocus(drawX,footY,altitude){
  if(state!=='playing'&&state!=='ending')return;
  const a=Math.max(.035,.075-altitude/4200);ctx.save();ctx.strokeStyle=`rgba(255,253,248,${a+.18})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(drawX+player.w/2,footY-31,26,40,0,0,Math.PI*2);ctx.stroke();ctx.restore();
}
function drawPlayer(){
  const grounded=player.y>=GROUND-player.h-1,ascending=!grounded&&player.vy<0,falling=!grounded&&player.vy>=0;
  const cadence=12+Math.min(7,(speed-350)/85),phase=worldTime*cadence,run=Math.sin(phase),stride=Math.cos(phase);
  const bob=0,sx=player.squash>0?1.08:1,sy=player.squash>0?.92:1;
  const footY=player.y+player.h,altitude=Math.max(0,GROUND-footY),shadowScale=Math.max(.45,1-altitude/310),drawX=player.x+((state==='ending'&&endingCinematicType==='ontime')?endingPlayerOffset:0);
  ctx.save();ctx.globalAlpha=.13*shadowScale;ctx.fillStyle='#171717';ctx.beginPath();ctx.ellipse(drawX+player.w/2,GROUND+3,22*shadowScale,4.5*shadowScale,0,0,Math.PI*2);ctx.fill();ctx.restore();
  // Motion echoes are purely visual; the collision box remains the original 44×66 body.
  if(grounded&&speed>520){ctx.save();ctx.globalAlpha=Math.min(.10,(speed-500)/1800);ctx.strokeStyle='#171717';ctx.lineWidth=3;for(let i=0;i<3;i++){const yy=footY-18-i*13;ctx.beginPath();ctx.moveTo(drawX-22-i*10,yy);ctx.lineTo(drawX-5,yy);ctx.stroke()}ctx.restore()}
  ctx.save();ctx.translate(drawX+player.w/2,footY+bob);const lean=grounded?run*.014:(ascending?-.055:.042),visualScale=1.10;ctx.rotate(lean);ctx.scale(sx*visualScale,sy*visualScale);
  function limb(x1,y1,x2,y2,x3,y3,w=5,color='#171717',boot=false){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x3,y3);ctx.stroke();if(boot){ctx.fillStyle='#252525';rr(x3-5,y3-4,12,5,1.5);ctx.fill()}}
  let lf={x:-8,y:0},rf={x:8,y:0},lk={x:-9,y:-9},rk={x:9,y:-9};let lh={x:-19,y:-22},rh={x:19,y:-22},le={x:-18,y:-31},re={x:18,y:-31};
  if(grounded){lf={x:-8+run*10,y:-Math.max(0,stride)*3};rf={x:8-run*10,y:-Math.max(0,-stride)*3};lk={x:(-7+lf.x)/2-run*2,y:-10-Math.max(0,stride)*2};rk={x:(7+rf.x)/2+run*2,y:-10-Math.max(0,-stride)*2};lh={x:-18-run*9,y:-22+Math.abs(run)*2};rh={x:18+run*9,y:-22+Math.abs(run)*2};le={x:-17-run*4,y:-32};re={x:17+run*4,y:-32}}
  else if(ascending&&player.jumps>=2){lf={x:-13,y:-8};rf={x:13,y:-8};lk={x:-15,y:-15};rk={x:15,y:-15};lh={x:-24,y:-47};rh={x:24,y:-47};le={x:-21,y:-38};re={x:21,y:-38}}
  else if(ascending){lf={x:-10,y:-3};rf={x:12,y:-6};lk={x:-13,y:-12};rk={x:13,y:-13};lh={x:-18,y:-49};rh={x:18,y:-49};le={x:-20,y:-39};re={x:20,y:-39}}
  else if(falling){lf={x:-11,y:-1};rf={x:11,y:-1};lk={x:-12,y:-11};rk={x:12,y:-11};lh={x:-22,y:-28};rh={x:22,y:-28};le={x:-19,y:-35};re={x:19,y:-35}}
  // Messenger bag behind the torso gives the runner a stronger silhouette without enlarging the hitbox.
  const bagSwing=grounded?run*3:(ascending?-4:4);ctx.save();ctx.translate(10+bagSwing,-30);ctx.rotate(-.12+run*.04);ctx.fillStyle='#8b6545';ctx.strokeStyle='#171717';ctx.lineWidth=2;rr(-2,-2,18,19,3);ctx.fill();ctx.stroke();ctx.restore();
  limb(-14,-39,le.x,le.y,lh.x,lh.y,5,'#262626');limb(14,-39,re.x,re.y,rh.x,rh.y,5,'#262626');
  limb(-7,-19,lk.x,lk.y,lf.x,lf.y,6,'#444',true);limb(7,-19,rk.x,rk.y,rf.x,rf.y,6,'#444',true);
  // Shirt, collar, lanyard and tie.
  ctx.fillStyle='#fffdf8';ctx.strokeStyle='#171717';ctx.lineWidth=2.2;rr(-16,-45,32,28,4);ctx.fill();ctx.stroke();
  ctx.fillStyle='#d7ecfb';ctx.beginPath();ctx.moveTo(-10,-43);ctx.lineTo(-2,-36);ctx.lineTo(-8,-32);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(10,-43);ctx.lineTo(2,-36);ctx.lineTo(8,-32);ctx.closePath();ctx.fill();
  const tieKick=Math.min(11,(speed-350)/52)+(grounded?Math.abs(run)*3:7);ctx.fillStyle='#171717';ctx.beginPath();ctx.moveTo(-3,-39);ctx.lineTo(3,-39);ctx.lineTo(6+tieKick,-24);ctx.lineTo(1,-19);ctx.lineTo(-4,-25);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#6f6a61';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-7,-43);ctx.lineTo(0,-29);ctx.lineTo(7,-43);ctx.stroke();ctx.fillStyle='#f3df9d';ctx.strokeStyle='#171717';ctx.lineWidth=1;rr(-5,-31,10,8,1);ctx.fill();ctx.stroke();
  // Head, hair, ears, expression.
  ctx.fillStyle='#e9d1b0';ctx.beginPath();ctx.arc(0,-54,14,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#171717';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#171717';ctx.beginPath();ctx.arc(0,-58,14,Math.PI,Math.PI*2);ctx.lineTo(14,-56);ctx.lineTo(10,-66);ctx.lineTo(-10,-66);ctx.lineTo(-14,-56);ctx.closePath();ctx.fill();
  ctx.fillStyle='#e9d1b0';ctx.beginPath();ctx.arc(-14,-53,3,0,Math.PI*2);ctx.arc(14,-53,3,0,Math.PI*2);ctx.fill();
  const blink=(worldTime%4.7)>4.58;ctx.fillStyle='#171717';if(blink){ctx.fillRect(-7,-54,4,1);ctx.fillRect(4,-54,4,1)}else{ctx.fillRect(-7,-55,3,3);ctx.fillRect(5,-55,3,3)}
  if(speed>610||stageIndex>=4){ctx.strokeStyle='#171717';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-9,-59);ctx.lineTo(-3,-60);ctx.moveTo(3,-60);ctx.lineTo(9,-59);ctx.stroke()}
  ctx.strokeStyle='#8a5f4c';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,-49,5,.15*Math.PI,.85*Math.PI);ctx.stroke();
  ctx.restore();
}

function drawObstacleShadow(o){
  if(o.label==='邮件'||(o.label==='临时需求'&&o.dropState==='warning'))return;
  const bottom=Math.min(GROUND,o.y+o.h),alt=Math.max(0,GROUND-bottom),scale=Math.max(.28,1-alt/250);
  let w=Math.max(20,Math.min(110,o.w*.78))*scale;
  if(o.label==='咖啡渍')w=o.w*.44;
  ctx.save();ctx.globalAlpha=.10*scale;ctx.fillStyle='#171717';ctx.beginPath();ctx.ellipse(o.x+o.w*.5,GROUND+3,w,Math.max(2.5,6*scale),0,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawObstacle(o){
  drawObstacleShadow(o);
  ctx.save();ctx.translate(o.x,o.y);
  if(o.label==='老板'){
    if(o.rushTriggered&&o.rushTimer>0){
      ctx.globalAlpha=.22;ctx.fillStyle='#d86d52';ctx.beginPath();ctx.moveTo(-42,20);ctx.lineTo(12,2);ctx.lineTo(12,88);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
      ctx.fillStyle='#d86d52';ctx.font='950 20px ui-monospace,monospace';ctx.fillText('!',-12,17);
    }
    if(o.x<520){ctx.fillStyle='rgba(23,23,23,.82)';rr(9,-13,44,15,2);ctx.fill();ctx.fillStyle='#fffdf8';ctx.font='900 8px ui-monospace,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('BOSS',31,-5.5)}
    ctx.fillStyle='#151515';ctx.fillRect(16,34,28,38);ctx.fillStyle='#f0cfb2';ctx.beginPath();ctx.arc(30,18,14,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#171717';ctx.lineWidth=2;ctx.strokeRect(18,12,9,6);ctx.strokeRect(33,12,9,6);ctx.beginPath();ctx.moveTo(27,15);ctx.lineTo(33,15);ctx.stroke();
    ctx.fillStyle='#fffefb';ctx.fillRect(18,34,24,21);ctx.fillStyle='#c74c3d';ctx.beginPath();ctx.moveTo(30,35);ctx.lineTo(24,56);ctx.lineTo(36,56);ctx.closePath();ctx.fill();
    ctx.fillStyle='#222';ctx.fillRect(12,72,14,18);ctx.fillRect(34,72,14,18);ctx.fillRect(8,89,18,3);ctx.fillRect(34,89,18,3);ctx.fillStyle='#6a5848';ctx.fillRect(44,40,14,18);ctx.strokeStyle='#171717';ctx.strokeRect(44,40,14,18);
  } else if(o.label==='会议'){
    const panelH=o.panelH,tableY=o.gapBottom-o.y,gapH=o.gapBottom-o.gapTop;
    ctx.fillStyle='#fffefb';ctx.strokeStyle='#171717';ctx.lineWidth=3;rr(3,2,o.w-6,panelH,8);ctx.fill();ctx.stroke();
    ctx.fillStyle='#d7ecfb';ctx.fillRect(11,10,o.w-22,14);ctx.fillStyle='#171717';ctx.font='900 11px ui-monospace,monospace';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(tr('会议进行中 · 摄像头已开启'),16,17);
    ctx.fillStyle='#ece6d9';ctx.fillRect(12,31,o.w-24,27);for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(25+i*25,44,7,0,Math.PI*2);ctx.fill()}
    ctx.strokeStyle='#c74c3d';ctx.lineWidth=2;ctx.setLineDash([7,6]);ctx.beginPath();ctx.moveTo(7,panelH+8);ctx.lineTo(o.w-7,tableY-8);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#bcb3a4';ctx.strokeStyle='#171717';ctx.lineWidth=3;rr(2,tableY,o.w-4,o.tableH,5);ctx.fill();ctx.stroke();
    ctx.fillStyle='#171717';ctx.font='950 12px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(o.firstGate?tr('第一次：单跳即可'):tr('从绿色区域穿过去'),o.w/2,tableY-15);
    const pulse=.55+.45*Math.sin(o.gatePulse);ctx.globalAlpha=o.firstGate?.42:(.25+.25*pulse);ctx.fillStyle='#d8ef9f';ctx.fillRect(8,panelH+7,o.w-16,Math.max(12,gapH-14));ctx.globalAlpha=1;
  } else if(o.label==='BUG'){
    const pulse=o.mutationState==='warn'?(.45+.55*Math.abs(Math.sin(worldTime*16))):1;ctx.globalAlpha=pulse;
    ctx.fillStyle=o.mutationState==='done'?'#4f8d43':'#6ba65d';ctx.strokeStyle='#171717';ctx.lineWidth=3;
    const cx=o.w/2,cy=o.h/2;ctx.beginPath();ctx.ellipse(cx,Math.min(cy,18),Math.max(15,o.w*.32),Math.min(13,o.h*.34),0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.ellipse(cx,Math.min(o.h-10,Math.max(28,cy+10)),Math.max(20,o.w*.43),Math.min(12,o.h*.27),0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.globalAlpha=1;
    ctx.fillStyle='#171717';ctx.beginPath();ctx.arc(cx-7,Math.min(cy,18),2.2,0,Math.PI*2);ctx.arc(cx+7,Math.min(cy,18),2.2,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#171717';for(const yy of [o.h*.38,o.h*.58,o.h*.76]){ctx.beginPath();ctx.moveTo(9,yy);ctx.lineTo(-1,yy-7);ctx.moveTo(o.w-9,yy);ctx.lineTo(o.w+1,yy-7);ctx.stroke()}
    if(o.mutationState==='warn'){ctx.fillStyle='#d95a49';ctx.font='950 18px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText('!',cx,-8)}
  } else if(o.label==='临时需求'){
    if(o.dropState==='warning'){
      const pulse=.45+.55*Math.abs(Math.sin(o.warningPulse));ctx.globalAlpha=.35+.45*pulse;ctx.strokeStyle='#d95a49';ctx.lineWidth=3;ctx.setLineDash([8,7]);ctx.strokeRect(0,GROUND-o.y-o.h,o.w,o.h);ctx.setLineDash([]);ctx.fillStyle='#d95a49';ctx.font='950 22px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(tr('↓ 临时需求'),o.w/2,GROUND-o.y-o.h-13);ctx.globalAlpha=1;
    }else{
      ctx.fillStyle='#fffefb';ctx.strokeStyle='#171717';ctx.lineWidth=3;rr(8,6,54,44,6);ctx.fill();ctx.stroke();ctx.fillStyle='#ffe4cf';ctx.fillRect(14,14,42,10);ctx.fillStyle='#171717';ctx.fillRect(16,18,15,3);ctx.fillRect(16,30,34,3);ctx.fillRect(16,38,24,3);
      ctx.fillStyle='#d95a49';ctx.beginPath();ctx.arc(64,12,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='900 15px ui-monospace,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('!',64,12);
      ctx.fillStyle='#6a5848';ctx.fillRect(62,25,18,22);ctx.strokeStyle='#171717';ctx.strokeRect(62,25,18,22);
      if(o.dropState==='fall'){ctx.strokeStyle='rgba(23,23,23,.35)';ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(18+i*20,-22-i*5);ctx.lineTo(18+i*20,-8);ctx.stroke()}}
    }
  } else if(o.label==='咖啡渍'){
    ctx.fillStyle='rgba(111,76,47,.82)';ctx.strokeStyle='#171717';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(o.w*.50,o.h*.58,o.w*.47,o.h*.58,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(o.w*.30,o.h*.36,18,3,0,0,Math.PI*2);ctx.fill();
  } else if(o.label==='哑铃'){
    ctx.fillStyle='#343434';ctx.strokeStyle='#171717';ctx.lineWidth=2;ctx.fillRect(14,12,o.w-28,7);ctx.fillRect(3,5,12,22);ctx.fillRect(o.w-15,5,12,22);ctx.fillRect(0,9,6,14);ctx.fillRect(o.w-6,9,6,14);ctx.strokeRect(14,12,o.w-28,7);
  } else if(o.label==='邮件'){
    ctx.translate(0,Math.sin(o.wave||0)*1.5);ctx.fillStyle='#fffefb';ctx.strokeStyle='#171717';ctx.lineWidth=3;rr(5,8,42,24,4);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(7,10);ctx.lineTo(26,24);ctx.lineTo(45,10);ctx.stroke();
    ctx.fillStyle='#d95a49';ctx.beginPath();ctx.arc(49,10,10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='900 12px ui-monospace,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('!',49,10);ctx.strokeStyle='rgba(23,23,23,.35)';ctx.beginPath();ctx.moveTo(-10,14);ctx.lineTo(0,14);ctx.moveTo(-5,22);ctx.lineTo(0,22);ctx.stroke();
  }
  ctx.restore();
}
function drawPickup(p){
  const yy=p.y+Math.sin(p.spin)*5;ctx.save();ctx.translate(p.x,yy);
  const glow=p.kind==='leave'?'#d8ef9f':(p.kind==='risk'?'#f0d487':'#f0d487');ctx.globalAlpha=.16+.05*Math.sin(p.spin*2);ctx.fillStyle=glow;ctx.beginPath();ctx.arc(15,20,26+Math.sin(p.spin)*3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  if(p.kind==='leave'){
    ctx.fillStyle='#eef6d9';ctx.strokeStyle='#171717';ctx.lineWidth=3;rr(1,5,29,31,3);ctx.fill();ctx.stroke();ctx.fillStyle='#506b2c';ctx.fillRect(6,10,19,4);ctx.fillRect(6,18,13,3);ctx.strokeStyle='#506b2c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(7,29);ctx.lineTo(13,34);ctx.lineTo(25,22);ctx.stroke();ctx.fillStyle='#171717';ctx.font='950 8px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText('SAVE',15,2)
  }else if(p.kind==='risk'){
    ctx.fillStyle='#fff0c6';ctx.strokeStyle='#171717';ctx.lineWidth=3;rr(1,5,29,31,3);ctx.fill();ctx.stroke();ctx.fillStyle='#9c3f2f';ctx.beginPath();ctx.moveTo(15,9);ctx.lineTo(18,16);ctx.lineTo(26,17);ctx.lineTo(20,22);ctx.lineTo(22,30);ctx.lineTo(15,26);ctx.lineTo(8,30);ctx.lineTo(10,22);ctx.lineTo(4,17);ctx.lineTo(12,16);ctx.closePath();ctx.fill();ctx.fillStyle='#171717';ctx.font='950 9px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText('×2',15,3)
  }else{
    ctx.fillStyle='#fffdf8';ctx.strokeStyle='#171717';ctx.lineWidth=3;rr(3,8,24,27,4);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(27,19,7,Math.PI*1.5,Math.PI*.5);ctx.stroke();ctx.strokeStyle='#76604d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(9,4);ctx.quadraticCurveTo(5,-2,11,-7);ctx.moveTo(17,4);ctx.quadraticCurveTo(13,-2,19,-7);ctx.stroke();ctx.fillStyle='#171717';ctx.font='950 9px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText('+35',15,24)
  }
  ctx.restore()
}
function drawRunPickupEffects(){
  if(leaveSlipTimer<=0&&riskBoostTimer<=0)return;ctx.save();
  const cx=player.x+player.w/2,cy=player.y+player.h/2;
  if(leaveSlipTimer>0){ctx.globalAlpha=.45+.15*Math.sin(worldTime*7);ctx.strokeStyle='#506b2c';ctx.lineWidth=3;ctx.setLineDash([7,5]);ctx.beginPath();ctx.arc(cx,cy,44,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;ctx.fillStyle='#506b2c';ctx.font='950 10px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(currentLang==='en'?'LEAVE SLIP':'请假条',cx,player.y-12)}
  if(riskBoostTimer>0){ctx.globalAlpha=.38+.17*Math.sin(worldTime*9);ctx.strokeStyle='#8a6a16';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,51,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle='#8a6a16';ctx.font='950 10px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(currentLang==='en'?`RISK ×2 ${riskBoostTimer.toFixed(1)}s`:`擦边 ×2 ${riskBoostTimer.toFixed(1)}s`,cx,player.y-25)}
  ctx.restore()
}
function drawEffects(){
  ctx.lineWidth=2;for(const l of speedLines){ctx.globalAlpha=l.a;ctx.strokeStyle='#777';ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.lineTo(l.x+l.len,l.y);ctx.stroke()}ctx.globalAlpha=1;
  for(const d of particles){ctx.globalAlpha=Math.max(0,d.a);ctx.fillStyle=d.c;ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
  ctx.textAlign='left';ctx.font='950 14px ui-monospace,monospace';for(const f of floaters){ctx.globalAlpha=Math.max(0,f.a);ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y)}ctx.globalAlpha=1;
}
function draw(){
  resizeCanvas();syncPresentationState();ctx.save();if(screenShake>0&&window.matchMedia('(prefers-reduced-motion: reduce)').matches===false)ctx.translate((Math.random()-.5)*screenShake,(Math.random()-.5)*screenShake);drawBackground();drawRunAtmosphere();for(const p of pickups)drawPickup(p);for(const o of obstacles)drawObstacle(o);drawPlayer();drawRunPickupEffects();drawEffects();ctx.restore();
  if(state==='paused'){ctx.fillStyle='rgba(243,240,232,.2)';ctx.fillRect(0,0,W,H)}
}
function loop(t){if(state!=='playing'&&state!=='ending'){draw();return}const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();if(state==='playing'||state==='ending')raf=requestAnimationFrame(loop)}

function activate(e){if(e&&e.cancelable)e.preventDefault();jump()}
function isFormTarget(target){return target instanceof Element&&Boolean(target.closest('input,textarea,select,button,label,[contenteditable="true"]'))}
frame.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;if(!settingsPop.classList.contains('hidden')){toggleSettings(false);return}if(!overlay.classList.contains('hidden')||isFormTarget(e.target))return;activate(e)},{passive:false});
startBtn.addEventListener('click',e=>{e.stopPropagation();if(state==='paused')togglePause();else start()});
dailyBtn.addEventListener('click',e=>{e.stopPropagation();if(state==='playing'||state==='ending'||state==='paused')return;setDailyMode(!dailyMode)});
settingsBtn.addEventListener('click',e=>{e.stopPropagation();if(state==='playing')togglePause();toggleSettings()});
masterSoundBtn.addEventListener('click',e=>{e.stopPropagation();setSound()});
mixPresetBtn.addEventListener('click',e=>{e.stopPropagation();musicVolEl.value='30';sfxVolEl.value='85';applyAudioLevels(true);if(soundOn)beep(760,.045)});
musicVolEl.addEventListener('input',e=>{e.stopPropagation();applyAudioLevels(true)});
sfxVolEl.addEventListener('input',e=>{e.stopPropagation();applyAudioLevels(true)});
settingsPop.addEventListener('pointerdown',e=>e.stopPropagation());
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.settings-wrap'))toggleSettings(false)});
fullscreenBtn.addEventListener('click',async e=>{e.stopPropagation();try{if(!document.fullscreenElement)await frame.requestFullscreen();else await document.exitFullscreen()}catch{}});
document.addEventListener('fullscreenchange',()=>{const on=Boolean(document.fullscreenElement);fullscreenLabel.textContent=currentLang==='en'?(on?'Exit fullscreen':'Fullscreen'):(on?'退出全屏':'全屏');fullscreenBtn.setAttribute('aria-label',currentLang==='en'?(on?'Exit fullscreen':'Enter fullscreen'):(on?'退出全屏':'进入全屏'));invalidateCanvasLayout();resizeCanvas();syncPresentationState(true);draw()});
langBtn.addEventListener('click',e=>{e.stopPropagation();toggleLanguage()});
messageBtn.addEventListener('click',e=>{e.stopPropagation();if(state!=='ended'||!MESSAGE_ENABLED)return;messageComposer.classList.toggle('hidden');if(!messageComposer.classList.contains('hidden'))messageText.focus()});
messageText.addEventListener('input',()=>{messageCount.textContent=String([...messageText.value].length)});
messageSubmit.addEventListener('click',e=>{e.stopPropagation();submitMessage()});
const repeatSensitiveKeys=new Set(['Space','ArrowUp','KeyP','Escape','KeyR','KeyF','KeyM','KeyS']);
window.addEventListener('keydown',e=>{if(isFormTarget(e.target))return;if(e.repeat&&repeatSensitiveKeys.has(e.code)){e.preventDefault();return}if(['Space','ArrowUp'].includes(e.code)){e.preventDefault();jump()}else if(e.code==='KeyP'||e.code==='Escape'){e.preventDefault();togglePause()}else if(e.code==='KeyR'&&(state==='gameover'||state==='menu'||state==='ended')){e.preventDefault();start()}else if(e.code==='KeyF'){e.preventDefault();fullscreenBtn.click()}else if(e.code==='KeyM'){e.preventDefault();setSound()}else if(e.code==='KeyS'&&(state==='menu'||state==='paused'||state==='gameover'||state==='ended')){e.preventDefault();toggleSettings()}});
const handleViewportResize=()=>{invalidateCanvasLayout();resizeCanvas();syncPresentationState(true);draw()};
window.addEventListener('resize',handleViewportResize);window.visualViewport?.addEventListener('resize',handleViewportResize);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')togglePause()});
window.addEventListener('blur',()=>{if(state==='playing')togglePause()});
syncAudioControls();updateMusicHud();resetMessageComposer();reset();renderRunLedger();updateDailyUi();applyLanguage(false);resizeCanvas();draw();
if(DEBUG_MODE)window.__GAME_TEST__={
  initialized:true,canvas:Boolean(ctx),version:'1.13.0',dayEndDistance:DAY_END_DISTANCE,
  getState:()=>({state,distance,runDistance,speed,stageIndex,combo,runNearMisses,runPerfectNearMisses,leaveSlipHits,leaveSlipTimer,riskBoostTimer,dailyMode,dailySeedDate,dailySeed,dailyRngState,dailyModifierId,dailyModifier:dailyModifierLabel(),player:{...player},obstacles:obstacles.map(o=>({label:o.label,x:o.x,y:o.y,w:o.w,h:o.h,state:o.dropState||o.mutationState||'',mutation:o.mutation||'',rush:!!o.rush,meetingDrift:!!o.meetingDrift,gymBounce:!!o.gymBounce})),pickups:pickups.map(p=>({kind:p.kind,x:p.x,y:p.y}))}),
  debugPickup:(kind='coffee')=>{const before={distance,runDistance,leaveSlipHits,leaveSlipTimer,riskBoostTimer};collectPickup({kind,x:500,y:300,w:32,h:40,spin:0,got:false});return {before,after:{distance,runDistance,leaveSlipHits,leaveSlipTimer,riskBoostTimer}}},debugCoffee:()=>window.__GAME_TEST__.debugPickup('coffee'),debugRunLedger:()=>({last:lastRunRecord?{...lastRunRecord}:null,top:topRuns.map(r=>({...r}))}),debugRecordRun:(patch={})=>{distance=Number(patch.distance)||0;runPeakCombo=Math.max(0,Number(patch.combo)||0);runNearMisses=Math.max(0,Number(patch.near)||0);runPerfectNearMisses=Math.max(0,Number(patch.perfect)||0);runRecordSaved=false;return recordFinishedRun(patch.outcome||'caught',patch.cause||'BUG')},
  debugDaily:(enabled=true)=>{setDailyMode(enabled);reset();return {dailyMode,dailySeedDate,dailySeed,dailyRngState,dailyModifierId,dailyModifier:dailyModifierLabel()}},debugDailySequence:(count=8)=>{resetGameRandom();return Array.from({length:Math.max(1,Math.min(32,Number(count)||8))},()=>gameRandom())},
  debugSpawn:(label)=>spawnObstacle(label),debugStep:(dt=.016)=>{if(state!=='playing'&&state!=='ending')state='playing';update(dt);return window.__GAME_TEST__.getState()},
  debugPassNear:(tier=1,boost=false)=>{riskBoostTimer=boost?7:0;const gap=tier===2?6:18,o={label:'BUG',x:player.x-70,y:player.y+player.h+gap,w:56,h:38,air:false,passed:false,mutationState:'idle'};const before=distance;passObstacle(o);return {delta:distance-before,tier,boost,runNearMisses,runPerfectNearMisses,riskBoostTimer}},
  debugUseLeaveSlip:(label='BUG')=>{leaveSlipHits=1;leaveSlipTimer=8;const o={label,x:player.x,y:player.y,w:56,h:38,passed:false};const saved=absorbWithLeaveSlip(o);return {saved,leaveSlipHits,leaveSlipTimer,combo,passed:o.passed,x:o.x}},
  debugClear:()=>{obstacles=[];pickups=[];return true},debugSetRunDistance:(v)=>{runDistance=Number(v)||0;updateStage(true);return runDistance},
  debugMeetingGeometry:()=>{const o=spawnObstacle('会议');return {first:o.firstGate,gapTop:o.gapTop,gapBottom:o.gapBottom,gapSize:o.gapBottom-o.gapTop,playerH:player.h,clearance:(o.gapBottom-o.gapTop)-player.h}},
  scenes:scenes.map(s=>({name:s.name,time:s.time,from:s.from,to:s.to,halfTime:s.halfTime})),debugScene:()=>({sceneIndex,previousSceneIndex,scene:scenes[Math.max(0,sceneIndex)]?.name,sceneHalf,progress:sceneProgress(),toastTimer:sceneToastTimer,sceneBlend,rareMoment,rareMomentTimer,secretMoment,secretMomentTimer}),musicProfiles:musicProfiles.map(p=>({name:p.name,bpm:p.bpm,layers:p.layers})),debugMusicState:()=>({soundOn,musicVolume,sfxVolume,stageIndex,profile:profile().name,bpm:profile().bpm,layers:profile().layers,musicStep}),debugAudioLevels:()=>({musicVolume,sfxVolume,musicTarget:musicTargetLevel(),sfxTarget:sfxTargetLevel()}),debugGround:()=>({ground:GROUND,playerBottom:player.y+player.h,delta:(player.y+player.h)-GROUND}),debugHitboxes:()=>({player:playerHitbox(),constants:{...PLAYER_HIT},jumpBufferTimer}),debugSetPlayer:(patch={})=>{Object.assign(player,patch);return {...player}},debugPairGap:(prev,next,gap=0)=>({prev,next,input:Number(gap)||0,minimum:minimumPairGapPx(prev,next),output:enforcePairGapPx(Number(gap)||0,prev,next)}),debugSetRunDistance:(d)=>{runDistance=Number(d)||0;updateStage();return {runDistance,stageIndex,stage:stageEl.textContent,pendingClimaxPattern}},debugDirector:()=>({queue:directorQueue.map(x=>x.label),cooldown:directorCooldown,pendingClimaxPattern}),debugOfficeEvent:()=>({officeEvent,officeEventTimer,officeEventCooldown,eventRollTimer,coffeeRushRemaining,bossAwayTimer,bugPatchTimer,rareMoment,rareMomentTimer,meetingSuppressTimer,gymRushTimer}),debugTriggerEvent:(id)=>{triggerOfficeEvent(id);return window.__GAME_TEST__.debugOfficeEvent()},debugTriggerRare:(id)=>{triggerRareMoment(id);return window.__GAME_TEST__.debugOfficeEvent()},debugTriggerSecret:(id)=>{triggerSecretMoment(id);return window.__GAME_TEST__.debugScene()},debugSpacing:()=>({lastGapPx:Math.round(lastSpawnGapPx),tightGapStreak,history:[...spacingHistory],lastObstacleLabel,sameObstacleStreak}),debugEnding:()=>({phase:endingPhase,timer:endingTimer,resolved:endingResolved,exitDoorX,onTimeEndings,overtimeEndings,state,endingCinematicTimer,endingCinematicType,endingPlayerOffset,endingBossX}),debugTriggerEnding:()=>{triggerEndingWindow();return window.__GAME_TEST__.debugEnding()},debugResolveEnding:(type)=>{resolveEnding(type);return window.__GAME_TEST__.debugEnding()},debugAdvanceEnding:(dt=.25)=>{if(state==='ending')updateEndingCinematic(dt);return window.__GAME_TEST__.debugEnding()},debugTutorial:()=>({tutorialDone,tutorialActive,tutorialStep,tutorialTimer,text:tutorialToast.textContent,hidden:tutorialToast.classList.contains('hidden')}),debugResetTutorial:()=>{tutorialDone=false;storageRemove('91hwl_moyu_tutorial_done');beginTutorial();return window.__GAME_TEST__.debugTutorial()},debugDiscoveries:()=>({count:discoveries.size,total:discoveryDefs.length,ids:[...discoveries]}),debugUnlock:(id)=>{unlockDiscovery(id,true);return window.__GAME_TEST__.debugDiscoveries()},debugDeathCounts:()=>({...deathCounts}),debugJump:()=>{jump();return window.__GAME_TEST__.debugTutorial()},debugGameOver:(cause)=>{gameOver(cause);return {state,deathCounts:{...deathCounts},text:overlayText.textContent}}
};document.documentElement.dataset.gameReady='true';document.documentElement.dataset.messageEnabled=MESSAGE_ENABLED?'true':'false';document.documentElement.dataset.gameVersion='1.13.0';
})();
