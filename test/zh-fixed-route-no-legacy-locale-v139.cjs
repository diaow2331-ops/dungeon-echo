'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'..','runtime-bootstrap.js'),'utf8');

function boot(locale){
  const listeners={};
  const context={
    URL,
    setTimeout(){return 1;}, clearTimeout(){},
    Promise,
    document:{
      documentElement:{dataset:{deLocale:locale}},
      body:null,
      addEventListener(type,fn){(listeners[type] ||= []).push(fn);},
      querySelector(){return null;},
      createElement(){throw new Error('bootstrap must not start before DOMContentLoaded in this harness');},
    },
    window:{addEventListener(type,fn){(listeners[type] ||= []).push(fn);}},
  };
  context.window.window=context.window;
  context.window.document=context.document;
  vm.runInNewContext(source,context,{filename:'runtime-bootstrap.js'});
  return context.window.__DE_PRODUCTION_UX_BOOTSTRAP;
}

const zh=boot('zh-CN');
assert(zh&&zh.version==='v11','Chinese runtime bootstrap must report v11');
assert.equal(zh.locale,'zh-CN');
assert.equal(zh.english,false);
const zhSrc=zh.chain.map(row=>String(row[0]));
assert(!zhSrc.some(s=>s.includes('locale-event-owner-v130.js')),'Chinese route must not load locale event owner');
assert(!zhSrc.some(s=>s.includes('locale-runtime-v122.js')),'Chinese route must not load legacy locale runtime');
assert(!zhSrc.some(s=>s.includes('locale-completeness-v128.js')),'Chinese route must not load completeness translator');
assert(zhSrc.some(s=>s.includes('fixed-locale-entry-v130.js')),'Chinese route keeps fixed route owner');
assert(zhSrc.some(s=>s.includes('combat-hint-polish.js')),'Chinese route keeps shared source-owned followers');

const en=boot('en');
assert(en&&en.version==='v11','English runtime bootstrap must report v11');
assert.equal(en.locale,'en');
assert.equal(en.english,true);
const enSrc=en.chain.map(row=>String(row[0]));
assert(enSrc.some(s=>s.includes('locale-event-owner-v130.js')),'English route keeps transitional event owner until core cut');
assert(enSrc.some(s=>s.includes('locale-runtime-v122.js')),'English route keeps transitional core translator until game.js cut');
assert(enSrc.some(s=>s.includes('locale-completeness-v128.js')),'English route keeps completeness fallback until game.js cut');
assert(enSrc.every(s=>s.includes('?v=140')),'all late assets share generation 140');

console.log('fixed_route_bridge_isolation_v139=PASS');
