'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const zh=read('index.html'),en=read('en/index.html'),css=read('style.css'),core=read('game/core/game.js');

for(const [name,html] of [['zh',zh],['en',en]]){
  assert(html.includes('id="town-fullscreen-toggle"'),name+' town must expose an in-overlay fullscreen control');
  assert(html.includes('data-town-page="wheel"'),name+' town keeps the fortune tab');
}
assert(css.includes('v1.8.1 town viewport & scale polish'),'town presentation patch marker missing');
assert(/#town-screen \.town-shell\s*\{[\s\S]*?width:\s*min\(1480px/.test(css),'desktop town shell should use more viewport width');
assert(/#wheel-canvas\s*\{[\s\S]*?width:\s*clamp\(300px,\s*30vw,\s*390px\)/.test(css),'fortune wheel should scale beyond the old 230px cap');
assert(/\.town-service-stage\s*\{[\s\S]*?grid-template-columns:\s*124px/.test(css),'service artwork should use the larger desktop column');
assert(css.includes('#wrap:fullscreen #town-screen'),'town must receive explicit fullscreen layout rules');
assert(css.includes('v1.8.1 town mobile shell correction') && /#town-screen \.town-primary-actions \{[\s\S]*?grid-template-columns:\s*repeat\(3/.test(css),'mobile town must restore compact shell padding and a non-cramped action grid');
assert(core.includes("$('town-fullscreen-toggle')"),'core must bind and synchronize the town fullscreen control');
assert(core.includes("[$('fullscreen-toggle'), $('town-fullscreen-toggle')]"),'both fullscreen controls must share one state authority');
console.log('town-presentation-v181: PASS');
