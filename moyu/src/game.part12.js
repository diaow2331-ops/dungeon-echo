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
  ctx.fillStyle='#d1c9bd';ctx.fillRect(boundary-34,82,54,423);
  ctx.fillStyle='#9f978c';ctx.fillRect(boundary-34,82,6,423);
  ctx.fillStyle='#fffdf8';ctx.fillRect(boundary+12,82,8,423);
  ctx.fillStyle='rgba(23,23,23,.12)';ctx.fillRect(boundary+20,82,18,423);
  ctx.restore();
}
function drawSharedFloor(){
  const floorTop=287;
  ctx.save();
  ctx.fillStyle='#d6d1c6';ctx.fillRect(0,floorTop,W,H-floorTop);
  ctx.fillStyle='#c2baae';ctx.fillRect(0,floorTop,W,8);
  ctx.strokeStyle='rgba(120,112,101,.34)';ctx.lineWidth=1.35;
  const tileX=-((runDistance*6.2)%150)-150;
  for(let x=tileX;x<W;x+=150){ctx.beginPath();ctx.moveTo(x,floorTop);ctx.lineTo(x,GROUND+58);ctx.stroke()}
  for(let y=floorTop+38;y<H;y+=42){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
  ctx.fillStyle='rgba(255,253,248,.34)';ctx.fillRect(0,GROUND-20,W,54);
  ctx.fillStyle='rgba(255,255,255,.62)';ctx.fillRect(0,GROUND-2,W,2);
  ctx.fillStyle='rgba(23,23,23,.58)';ctx.fillRect(0,GROUND+2,W,4);
  ctx.fillStyle='rgba(23,23,23,.18)';ctx.fillRect(0,GROUND+8,W,1);
  const markerX=-((runDistance*7.4)%140)-140;
  ctx.fillStyle='rgba(23,23,23,.22)';
  for(let x=markerX;x<W;x+=140)ctx.fillRect(x,GROUND+17,38,2);
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
  ctx.fillStyle='#bcb3a4';ctx.fillRect(x,y,205,17);ctx.fillRect(x+22,y+17,11,100);ctx.fillRect(x+171,y+17,11,100);
  ctx.fillStyle='#242424';ctx.fillRect(x+72,y-66,96,57);ctx.fillRect(x+116,y-9,9,18);ctx.fillRect(x+94,y+9,55,5);
  ctx.fillStyle=stageIndex>=4?'#ffe0d8':(stageIndex>=3?'#fff1cf':'#f4f2ec');ctx.fillRect(x+81,y-57,78,38);ctx.fillStyle=stageIndex>=3?'#9c3f2f':'#747474';ctx.fillRect(x+88,y-49,49,4);ctx.fillRect(x+88,y-38,60,4);ctx.fillRect(x+88,y-27,38,4);
  if(stageIndex>=4){ctx.fillStyle='#d95a49';ctx.font='950 9px ui-monospace,monospace';ctx.textAlign='right';ctx.fillText('99+',x+154,y-24)}
  ctx.fillStyle='#8a7a66';ctx.fillRect(x+42,y-18,18,18);ctx.fillStyle='#f3f0e8';ctx.fillRect(x+46,y-25,10,8);ctx.strokeStyle='#8a7a66';ctx.lineWidth=2;ctx.strokeRect(x+59,y-14,7,8);
  ctx.fillStyle='#e7e1d5';ctx.fillRect(x+96,y-2,46,6);ctx.fillStyle='#6f6a61';ctx.fillRect(x+147,y+1,8,5);
}

function drawTinyCoworker(x,y,pose='desk',accent='#7f8792',alpha=.34){
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.strokeStyle='#171717';ctx.fillStyle='#e6ccb0';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(0,-24,7,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=accent;rr(-8,-17,16,20,3);ctx.fill();ctx.stroke();
  ctx.strokeStyle='#3d3d3d';ctx.lineWidth=3;ctx.lineCap='round';
