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
  drawPlayerFocus(drawX,footY,altitude);
  ctx.save();ctx.globalAlpha=.13*shadowScale;ctx.fillStyle='#171717';ctx.beginPath();ctx.ellipse(drawX+player.w/2,GROUND+3,22*shadowScale,4.5*shadowScale,0,0,Math.PI*2);ctx.fill();ctx.restore();
  // Motion echoes are purely visual; the collision box remains the original 44×66 body.
  if(grounded&&speed>520){ctx.save();ctx.globalAlpha=Math.min(.10,(speed-500)/1800);ctx.strokeStyle='#171717';ctx.lineWidth=3;for(let i=0;i<3;i++){const yy=footY-18-i*13;ctx.beginPath();ctx.moveTo(drawX-22-i*10,yy);ctx.lineTo(drawX-5,yy);ctx.stroke()}ctx.restore()}
  ctx.save();ctx.translate(drawX+player.w/2,footY+bob);const lean=grounded?run*.014:(ascending?-.055:.042);ctx.rotate(lean);ctx.scale(sx,sy);
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
