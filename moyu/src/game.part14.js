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
function drawPickup(p){const yy=p.y+Math.sin(p.spin)*5;ctx.save();ctx.translate(p.x,yy);ctx.globalAlpha=.16+.05*Math.sin(p.spin*2);ctx.fillStyle='#f0d487';ctx.beginPath();ctx.arc(15,20,26+Math.sin(p.spin)*3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#fffdf8';ctx.strokeStyle='#171717';ctx.lineWidth=3;rr(3,8,24,27,4);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(27,19,7,Math.PI*1.5,Math.PI*.5);ctx.stroke();ctx.strokeStyle='#76604d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(9,4);ctx.quadraticCurveTo(5,-2,11,-7);ctx.moveTo(17,4);ctx.quadraticCurveTo(13,-2,19,-7);ctx.stroke();ctx.fillStyle='#171717';ctx.font='950 9px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText('+35',15,24);ctx.restore()}
function drawEffects(){
  ctx.lineWidth=2;for(const l of speedLines){ctx.globalAlpha=l.a;ctx.strokeStyle='#777';ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.lineTo(l.x+l.len,l.y);ctx.stroke()}ctx.globalAlpha=1;
  for(const d of particles){ctx.globalAlpha=Math.max(0,d.a);ctx.fillStyle=d.c;ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
  ctx.textAlign='left';ctx.font='950 14px ui-monospace,monospace';for(const f of floaters){ctx.globalAlpha=Math.max(0,f.a);ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y)}ctx.globalAlpha=1;
}
function draw(){
  resizeCanvas();syncPresentationState();ctx.save();if(screenShake>0&&window.matchMedia('(prefers-reduced-motion: reduce)').matches===false)ctx.translate((Math.random()-.5)*screenShake,(Math.random()-.5)*screenShake);drawBackground();drawAmbientOfficeLife();drawRunAtmosphere();for(const p of pickups)drawPickup(p);for(const o of obstacles)drawObstacle(o);drawPlayer();drawEffects();ctx.restore();
  if(state==='paused'){ctx.fillStyle='rgba(243,240,232,.2)';ctx.fillRect(0,0,W,H)}
}
function loop(t){if(state!=='playing'&&state!=='ending'){draw();return}const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();if(state==='playing'||state==='ending')raf=requestAnimationFrame(loop)}

function activate(e){if(e&&e.cancelable)e.preventDefault();jump()}
function isFormTarget(target){return target instanceof Element&&Boolean(target.closest('input,textarea,select,button,label,[contenteditable="true"]'))}
frame.addEventListener('pointerdown',e=>{if(!settingsPop.classList.contains('hidden')){toggleSettings(false);return}if(!overlay.classList.contains('hidden')||isFormTarget(e.target))return;activate(e)},{passive:false});
startBtn.addEventListener('click',e=>{e.stopPropagation();if(state==='paused')togglePause();else start()});
settingsBtn.addEventListener('click',e=>{e.stopPropagation();if(state==='playing')togglePause();toggleSettings()});
masterSoundBtn.addEventListener('click',e=>{e.stopPropagation();setSound()});
mixPresetBtn.addEventListener('click',e=>{e.stopPropagation();musicVolEl.value='30';sfxVolEl.value='85';applyAudioLevels(true);if(soundOn)beep(760,.045)});
musicVolEl.addEventListener('input',e=>{e.stopPropagation();applyAudioLevels(true)});
sfxVolEl.addEventListener('input',e=>{e.stopPropagation();applyAudioLevels(true)});
settingsPop.addEventListener('pointerdown',e=>e.stopPropagation());
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.settings-wrap'))toggleSettings(false)});
fullscreenBtn.addEventListener('click',async e=>{e.stopPropagation();try{if(!document.fullscreenElement)await frame.requestFullscreen();else await document.exitFullscreen()}catch{}});
document.addEventListener('fullscreenchange',()=>{const on=Boolean(document.fullscreenElement);fullscreenLabel.textContent=currentLang==='en'?(on?'Exit fullscreen':'Fullscreen'):(on?'退出全屏':'全屏');fullscreenBtn.setAttribute('aria-label',currentLang==='en'?(on?'Exit fullscreen':'Enter fullscreen'):(on?'退出全屏':'进入全屏'));resizeCanvas();draw()});
langBtn.addEventListener('click',e=>{e.stopPropagation();toggleLanguage()});
