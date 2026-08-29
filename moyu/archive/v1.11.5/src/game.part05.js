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
