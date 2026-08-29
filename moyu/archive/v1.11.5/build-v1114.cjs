'use strict';
const assert=require('assert');
const fs=require('fs');
const [,,indexPath,gamePath]=process.argv;
assert(indexPath&&gamePath,'usage: node build-v1114.cjs <index.html> <game.js>');
const replaceOnce=(text,from,to,label)=>{const first=text.indexOf(from);assert(first>=0,`missing ${label}`);assert.equal(text.indexOf(from,first+from.length),-1,`duplicate ${label}`);return text.slice(0,first)+to+text.slice(first+from.length)};
let index=fs.readFileSync(indexPath,'utf8');
let game=fs.readFileSync(gamePath,'utf8');

index=replaceOnce(index,'<meta name="version" content="1.11.3" />','<meta name="version" content="1.11.4" />','version meta');
index=replaceOnce(index,'style.css?v=1113','style.css?v=1114','base css fingerprint');
index=replaceOnce(index,'visual-v1113.css?v=1113','visual-v1113.css?v=1114','visual css fingerprint');
index=replaceOnce(index,'<span class="version-badge">v1.11.3</span>','<span class="version-badge">v1.11.4</span>','visible version badge');
index=replaceOnce(index,'91HWL / CLOCK OUT ALIVE / v1.11.3','91HWL / CLOCK OUT ALIVE / v1.11.4','footer version');
index=replaceOnce(index,'game.js?v=1113','game.js?v=1114','game fingerprint');

game=replaceOnce(game,
`function syncPresentationState(){
  document.documentElement.dataset.gameState=state;
  const pressure=stageIndex>=4?'climax':(stageIndex>=3?'high':'normal');
  frame.dataset.pressure=pressure;
  const routeIndex=(endingPhase==='decision'||endingPhase==='ontime'||endingPhase==='overtime')?4:Math.min(3,Math.max(0,sceneIndex));`,
`function syncPresentationState(force=false){
  const pressure=stageIndex>=4?'climax':(stageIndex>=3?'high':'normal');
  const routeIndex=(endingPhase==='decision'||endingPhase==='ontime'||endingPhase==='overtime')?4:Math.min(3,Math.max(0,sceneIndex));
  const signature=\`${'${state}'}|${'${pressure}'}|${'${routeIndex}'}\`;
  if(!force&&syncPresentationState.signature===signature)return;
  syncPresentationState.signature=signature;
  if(document.documentElement.dataset.gameState!==state)document.documentElement.dataset.gameState=state;
  if(frame.dataset.pressure!==pressure)frame.dataset.pressure=pressure;`,
'presentation-state memoization');

game=replaceOnce(game,
`function resizeCanvas(){
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,DPR_LIMIT);
  const pxW=Math.max(1,Math.round(rect.width*dpr)),pxH=Math.max(1,Math.round(rect.height*dpr));
  if(canvas.width!==pxW||canvas.height!==pxH){canvas.width=pxW;canvas.height=pxH}
  ctx.setTransform(pxW/W,0,0,pxH/H,0,0);ctx.imageSmoothingEnabled=true;
}`,
`let canvasLayoutDirty=true;
function invalidateCanvasLayout(){canvasLayoutDirty=true}
function resizeCanvas(force=false){
  if(!force&&!canvasLayoutDirty)return false;
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,DPR_LIMIT);
  const pxW=Math.max(1,Math.round(rect.width*dpr)),pxH=Math.max(1,Math.round(rect.height*dpr));
  if(canvas.width!==pxW||canvas.height!==pxH){canvas.width=pxW;canvas.height=pxH}
  ctx.setTransform(pxW/W,0,0,pxH/H,0,0);ctx.imageSmoothingEnabled=true;
  canvasLayoutDirty=false;return true;
}`,
'canvas layout invalidation');

game=replaceOnce(game,
`function enforcePairGapPx(gapPx,prev,next){return Math.max(gapPx,minimumPairGapPx(prev,next))}
function delayForClearGap(gapPx,spawned){`,
`function enforcePairGapPx(gapPx,prev,next){return Math.max(gapPx,minimumPairGapPx(prev,next))}
function effectiveSpawnWidth(spawned){
  // Long-mutating BUGs expand from 56px to 116px after their warning. Reserve the
  // final width now so the visible mutation cannot silently consume the next gap.
  if(spawned.label==='BUG'&&spawned.mutation==='long')return Math.max(116,spawned.w);
  return Math.max(36,spawned.w);
}
function delayForClearGap(gapPx,spawned){`,
'spawn-width reserve helper');
game=replaceOnce(game,'return Math.max(.62,(gapPx+Math.max(36,spawned.w))/Math.max(300,speed));','return Math.max(.62,(gapPx+effectiveSpawnWidth(spawned))/Math.max(300,speed));','spawn-width delay');

game=replaceOnce(game,
"frame.addEventListener('pointerdown',e=>{if(!settingsPop.classList.contains('hidden')){toggleSettings(false);return}if(!overlay.classList.contains('hidden')||isFormTarget(e.target))return;activate(e)},{passive:false});",
"frame.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;if(!settingsPop.classList.contains('hidden')){toggleSettings(false);return}if(!overlay.classList.contains('hidden')||isFormTarget(e.target))return;activate(e)},{passive:false});",
'primary-pointer activation');

game=replaceOnce(game,
"document.addEventListener('fullscreenchange',()=>{const on=Boolean(document.fullscreenElement);fullscreenLabel.textContent=currentLang==='en'?(on?'Exit fullscreen':'Fullscreen'):(on?'退出全屏':'全屏');fullscreenBtn.setAttribute('aria-label',currentLang==='en'?(on?'Exit fullscreen':'Enter fullscreen'):(on?'退出全屏':'进入全屏'));resizeCanvas();draw()});",
"document.addEventListener('fullscreenchange',()=>{const on=Boolean(document.fullscreenElement);fullscreenLabel.textContent=currentLang==='en'?(on?'Exit fullscreen':'Fullscreen'):(on?'退出全屏':'全屏');fullscreenBtn.setAttribute('aria-label',currentLang==='en'?(on?'Exit fullscreen':'Enter fullscreen'):(on?'退出全屏':'进入全屏'));invalidateCanvasLayout();resizeCanvas();syncPresentationState(true);draw()});",
'fullscreen layout invalidation');

game=replaceOnce(game,
`window.addEventListener('keydown',e=>{if(isFormTarget(e.target))return;if(['Space','ArrowUp'].includes(e.code)){e.preventDefault();jump()}else if(e.code==='KeyP'||e.code==='Escape'){e.preventDefault();togglePause()}else if(e.code==='KeyR'&&(state==='gameover'||state==='menu'||state==='ended')){e.preventDefault();start()}else if(e.code==='KeyF'){e.preventDefault();fullscreenBtn.click()}else if(e.code==='KeyM'){e.preventDefault();setSound()}else if(e.code==='KeyS'&&(state==='menu'||state==='paused'||state==='gameover'||state==='ended')){e.preventDefault();toggleSettings()}});
window.addEventListener('resize',()=>{resizeCanvas();draw()});`,
`const repeatSensitiveKeys=new Set(['Space','ArrowUp','KeyP','Escape','KeyR','KeyF','KeyM','KeyS']);
window.addEventListener('keydown',e=>{if(isFormTarget(e.target))return;if(e.repeat&&repeatSensitiveKeys.has(e.code)){e.preventDefault();return}if(['Space','ArrowUp'].includes(e.code)){e.preventDefault();jump()}else if(e.code==='KeyP'||e.code==='Escape'){e.preventDefault();togglePause()}else if(e.code==='KeyR'&&(state==='gameover'||state==='menu'||state==='ended')){e.preventDefault();start()}else if(e.code==='KeyF'){e.preventDefault();fullscreenBtn.click()}else if(e.code==='KeyM'){e.preventDefault();setSound()}else if(e.code==='KeyS'&&(state==='menu'||state==='paused'||state==='gameover'||state==='ended')){e.preventDefault();toggleSettings()}});
const handleViewportResize=()=>{invalidateCanvasLayout();resizeCanvas();syncPresentationState(true);draw()};
window.addEventListener('resize',handleViewportResize);window.visualViewport?.addEventListener('resize',handleViewportResize);`,
'one-shot keyboard and viewport handling');

game=replaceOnce(game,"dataset.gameVersion='1.11.3'","dataset.gameVersion='1.11.4'",'runtime version');

assert(game.includes("dataset.gameVersion='1.11.4'"),'runtime version missing');
assert(game.includes('repeatSensitiveKeys'),'keyboard repeat guard missing');
assert(game.includes('canvasLayoutDirty'),'canvas layout invalidation guard missing');
assert(game.includes('syncPresentationState.signature'),'presentation-state memoization missing');
assert(game.includes('effectiveSpawnWidth(spawned)'),'spawn-width fairness guard missing');
assert(index.includes('translate="no"'));
assert(index.includes('name="google" content="notranslate"'));
assert(index.includes('visual-v1113.css?v=1114'));
fs.writeFileSync(indexPath,index);
fs.writeFileSync(gamePath,game);
