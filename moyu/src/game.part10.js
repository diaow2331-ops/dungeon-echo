  const pbox=playerHitbox();
  for(const o of obstacles){
    for(const obox of collisionRects(o))if(hit(pbox,obox,1)){gameOver(o.label);return}
  }
  for(const p of pickups)if(!p.got&&hit(pbox,p,2))collectCoffee(p);
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
  ctx.fillStyle='#d7d2c7';ctx.fillRect(0,-78,250,92);ctx.fillStyle='#c1b6a3';ctx.fillRect(0,-84,250,10);ctx.strokeStyle='#171717';ctx.lineWidth=2;ctx.strokeRect(0,-78,250,92);
  ctx.fillStyle='#c7b29a';ctx.fillRect(18,18,190,14);ctx.fillRect(28,32,10,84);ctx.fillRect(183,32,10,84);
  ctx.fillStyle='#b19f8b';ctx.fillRect(40,32,28,60);ctx.fillStyle='#a29280';ctx.fillRect(44,38,20,10);ctx.fillRect(44,54,20,10);
  ctx.fillStyle='#7f776d';ctx.fillRect(188,26,6,56);ctx.fillRect(164,80,28,4);
  ctx.save();ctx.translate(118,82);ctx.fillStyle=stageIndex>=4?'#b97b72':'#6f7f92';ctx.strokeStyle='#171717';ctx.lineWidth=2;
  rr(-26,-48,52,40,8);ctx.fill();ctx.stroke();rr(-22,-12,44,15,5);ctx.fill();ctx.stroke();ctx.fillStyle='#474747';ctx.fillRect(-3,3,6,28);ctx.beginPath();ctx.moveTo(0,31);ctx.lineTo(-18,39);ctx.moveTo(0,31);ctx.lineTo(18,39);ctx.moveTo(0,31);ctx.lineTo(0,43);ctx.stroke();ctx.fillRect(-23,38,10,4);ctx.fillRect(13,38,10,4);ctx.fillRect(-5,42,10,4);ctx.restore();
  ctx.fillStyle='#2a2a2a';ctx.fillRect(82,-34,78,46);
  ctx.fillStyle=stageIndex>=4?'#ffe0d8':'#eaf5fa';ctx.fillRect(88,-28,66,34);
  ctx.fillStyle=stageIndex>=4?'#d95a49':'#7ca2b5';ctx.fillRect(94,-20,38,4);ctx.fillRect(94,-11,48,4);ctx.fillRect(94,-2,26,4);
  ctx.fillStyle='#2a2a2a';ctx.fillRect(116,12,10,13);ctx.fillRect(98,25,46,4);
  ctx.fillStyle='#44474b';ctx.fillRect(150,38,30,60);ctx.strokeStyle='#171717';ctx.strokeRect(150,38,30,60);
  ctx.fillStyle='#2b2b2b';ctx.fillRect(156,47,18,34);ctx.fillStyle='#8ad39c';ctx.fillRect(157,42,4,4);ctx.fillStyle='#70757a';ctx.fillRect(157,85,16,3);
  ctx.beginPath();ctx.arc(165,66,7,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#ddd7cb';ctx.fillRect(82,7,58,8);ctx.strokeStyle='#aaa195';ctx.lineWidth=1;for(let k=0;k<6;k++)ctx.fillRect(86+k*8,9,5,2);
  ctx.fillStyle='#6f6a61';rr(146,8,10,7,3);ctx.fill();
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
