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

for(const [locale,english] of [['zh-CN',false],['en',true]]){
  const booted=boot(locale);
  assert(booted&&booted.version==='v13',`${locale} runtime bootstrap must report v13`);
  assert.equal(booted.locale,locale==='en'?'en':'zh-CN');
  assert.equal(booted.english,english);
  const src=booted.chain.map(row=>String(row[0]));
  assert(!src.some(s=>s.includes('locale-event-owner-v130.js')),`${locale} must not load locale event owner`);
  assert(!src.some(s=>s.includes('locale-runtime-v122.js')),`${locale} must not load legacy locale runtime`);
  assert(!src.some(s=>s.includes('locale-completeness-v128.js')),`${locale} must not load completeness translator`);
  assert(src.some(s=>s.includes('fixed-locale-entry-v130.js')),`${locale} keeps fixed route owner`);
  assert(src.some(s=>s.includes('stable-item-id-migration-v150.js')),`${locale} keeps shared stable item migration`);
  assert(src.some(s=>s.includes('core-screen-owner-v153.js')),`${locale} keeps fixed core screen owner`);
  assert(src.some(s=>s.includes('town-canvas-locale-v153.js')),`${locale} keeps fixed town canvas sink`);
  assert(src.some(s=>s.includes('combat-hint-polish.js')),`${locale} keeps shared source-owned followers`);
  assert(src.every(s=>s.includes('?v=153')),`${locale} late assets all share generation 153`);
}

const zh=boot('zh-CN'),en=boot('en');
assert.deepStrictEqual(zh.chain.map(r=>r[0]),en.chain.map(r=>r[0]),'Chinese and English fixed routes must boot the same late graph');
console.log('fixed_route_bridge_retired_v153=PASS');
