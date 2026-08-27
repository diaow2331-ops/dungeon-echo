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
