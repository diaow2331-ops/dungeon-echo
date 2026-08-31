(()=>{
'use strict';
const root=document.documentElement,langBtn=document.getElementById('langBtn'),fullBtn=document.getElementById('fullscreenBtn'),soundBtn=document.getElementById('soundBtn'),volumeRange=document.getElementById('volumeRange'),volumeValue=document.getElementById('volumeValue');
const browserLang=()=>navigator.language&&navigator.language.toLowerCase().startsWith('en')?'en':'zh';
let lang=read('board-trio-lang-v1',browserLang()),musicOn=read('board-trio-sound-v1','on')!=='off',volume=readVolume(),ctx=null,master=null,timer=0,step=0;
function read(k,f){try{return localStorage.getItem(k)??f}catch{return f}}
function write(k,v){try{localStorage.setItem(k,v)}catch{}}
function readVolume(){const value=Number(read('board-trio-volume-v1','60'));return Number.isFinite(value)?Math.max(0,Math.min(100,value)):60}
function tr(zh,en){return lang==='en'?en:zh}
function applyLanguage(){
  root.lang=lang==='en'?'en':'zh-CN';root.dataset.lang=lang;
  document.querySelectorAll('[data-zh][data-en]').forEach(el=>{el.textContent=el.dataset[lang]||el.dataset.zh});
  langBtn.textContent=lang==='en'?'中文':'EN';langBtn.setAttribute('aria-label',lang==='en'?'切换至中文':'Switch to English');
  document.title=lang==='en'?'Board Trio · Gomoku / Xiangqi / Go':'方寸棋局 · 五子棋 / 象棋 / 围棋';
  syncButtons();syncVolumeSurface();window.dispatchEvent(new CustomEvent('board:language',{detail:{lang}}));
}
function syncButtons(){
  const fs=!!document.fullscreenElement;
  fullBtn.querySelector('span').textContent=fs?tr('退出全屏','Exit Fullscreen'):tr('全屏','Fullscreen');fullBtn.setAttribute('aria-pressed',String(fs));
  soundBtn.querySelector('span').textContent=musicOn?tr('雅乐 开','Music On'):tr('雅乐 关','Music Off');soundBtn.setAttribute('aria-pressed',String(musicOn));
}
function syncVolumeSurface(){if(!volumeRange||!volumeValue)return;volumeRange.value=String(volume);volumeValue.value=volumeValue.textContent=Math.round(volume)+'%';volumeRange.setAttribute('aria-valuetext',Math.round(volume)+'%')}
function masterLevel(){return musicOn?.09*(volume/100):.0001}
function applyMaster(immediate=false){if(!master||!ctx)return;const now=ctx.currentTime,target=masterLevel();master.gain.cancelScheduledValues(now);if(immediate)master.gain.setValueAtTime(Math.max(.0001,target),now);else master.gain.setTargetAtTime(Math.max(.0001,target),now,.08)}
function makeAudio(){if(ctx)return true;try{ctx=new(window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=Math.max(.0001,masterLevel());master.connect(ctx.destination);return true}catch{return false}}
function pluck(freq,when,dur=.9,vol=.14){if(!ctx||!master)return;const osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();osc.type='triangle';osc.frequency.setValueAtTime(freq,when);filter.type='lowpass';filter.frequency.setValueAtTime(1500,when);gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(vol,when+.018);gain.gain.exponentialRampToValueAtTime(.0001,when+dur);osc.connect(filter).connect(gain).connect(master);osc.start(when);osc.stop(when+dur+.05)}
function breathe(freq,when,dur=3.8,vol=.018){if(!ctx||!master)return;const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,when);gain.gain.linearRampToValueAtTime(vol,when+.9);gain.gain.linearRampToValueAtTime(.0001,when+dur);osc.connect(gain).connect(master);osc.start(when);osc.stop(when+dur+.05)}
const phrase=[220,293.66,329.63,392,440,392,329.63,293.66,246.94,293.66,392,329.63,220,246.94,293.66,220];
function musicTick(){if(!musicOn||!ctx||ctx.state==='closed'||volume<=0)return;const now=ctx.currentTime+.04,n=phrase[step%phrase.length];pluck(n,now,.9,.11);if(step%4===0)pluck(n/2,now+.12,1.8,.055);if(step%8===0)breathe(step%16===0?110:146.83,now,3.8,.015);step++}
function startMusic(){if(!musicOn||!makeAudio())return;ctx.resume().then(()=>{applyMaster(true);if(timer)return;musicTick();timer=setInterval(musicTick,1550)}).catch(()=>{})}
function stopMusic(){if(timer){clearInterval(timer);timer=0}applyMaster()}
function toggleMusic(){musicOn=!musicOn;write('board-trio-sound-v1',musicOn?'on':'off');if(musicOn)startMusic();else stopMusic();syncButtons();window.dispatchEvent(new CustomEvent('board:sound',{detail:{enabled:musicOn,volume}}))}
function changeVolume(){volume=Math.max(0,Math.min(100,Number(volumeRange.value)||0));write('board-trio-volume-v1',String(volume));syncVolumeSurface();applyMaster(true);if(musicOn&&volume>0)startMusic();window.dispatchEvent(new CustomEvent('board:sound',{detail:{enabled:musicOn,volume}}))}
function resetLocalData(){
  try{for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key&&key.startsWith('board-trio-'))localStorage.removeItem(key)}}catch{}
  lang=browserLang();musicOn=true;volume=60;syncVolumeSurface();applyMaster(true);startMusic();applyLanguage();return{lang,musicOn,volume};
}
async function toggleFullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await root.requestFullscreen({navigationUI:'hide'})}catch{window.dispatchEvent(new CustomEvent('board:notice',{detail:{text:tr('当前浏览器未允许全屏','Fullscreen is unavailable in this browser')}}))}}
langBtn.addEventListener('click',()=>{lang=lang==='zh'?'en':'zh';write('board-trio-lang-v1',lang);applyLanguage()});
fullBtn.addEventListener('click',toggleFullscreen);soundBtn.addEventListener('click',toggleMusic);if(volumeRange)volumeRange.addEventListener('input',changeVolume);
document.addEventListener('fullscreenchange',()=>{root.dataset.fullscreen=String(!!document.fullscreenElement);syncButtons();requestAnimationFrame(()=>window.dispatchEvent(new Event('board:layout')))});
document.addEventListener('pointerdown',startMusic,{once:true,passive:true});document.addEventListener('keydown',startMusic,{once:true});
window.BoardUI={lang:()=>lang,t:tr,musicEnabled:()=>musicOn,volume:()=>volume/100,startMusic,applyLanguage,resetLocalData};
applyLanguage();syncButtons();syncVolumeSurface();
})();
