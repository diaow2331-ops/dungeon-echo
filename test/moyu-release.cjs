'use strict';
const assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path'),crypto=require('crypto'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const version=read('moyu/VERSION').trim(),index=read('moyu/index.html'),game=read('moyu/game.js'),style=read('moyu/style.css');
assert.equal(version,'1.26.0'); assert.match(index,/content="1\.26\.0"/); assert.match(index,/game\.js\?v=1260/);
assert.match(game,/dataset\.gameVersion='1\.26\.0'/); assert.match(game,/DAY_END_DISTANCE=2200/); assert.match(game,/RUN_PROGRESS_SCALE=\.020/); assert.match(game,/MAX_MISTAKES=3/);
assert.match(game,/assets\/sprites\/hero-v125\.webp\?v=1260/); assert.match(game,/assets\/sprites\/office-hazards-v124\.webp\?v=1240/);
assert.match(game,/const SCENE_BACKDROPS=\[/); assert.match(game,/assets\/scenes-v126\/workstation\.svg\?v=1260/); assert.match(game,/function drawSceneBackdrop\(idx\)/); assert.match(game,/imageSmoothingQuality='high'/);
for(const name of ['workstation','meeting','pantry','gym']){const f=`moyu/assets/scenes-v126/${name}.svg`,svg=read(f);assert(svg.length>5000,`${name} scene too small`);assert.match(svg,/<svg[^>]+width="1920"[^>]+height="820"/);}
assert.match(style,/data-game-state="menu"\] \.overlay/); assert.match(style,/backdrop-filter:none/); assert.match(style,/height:min\(54svh,440px\)/);
assert.match(game,/function drawBossArt\(o\)/); assert.match(game,/drawOfficeHazardFrame\(rushing\?'bossRush':'bossPatrol'.*true\)/s); assert.match(game,/function drawBugArt\(o\)/); assert.match(game,/function drawRequestArt\(o\)/);
let r=spawnSync(process.execPath,['--check',path.join(root,'moyu/game.js')],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'moyu1260-')),archive=path.join(tmp,'moyu.zip');r=spawnSync('bash',[path.join(root,'ops/release/build-moyu-bundle.sh'),archive],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/version=1\.26\.0/);assert.match(r.stdout,/moyu_bundle_build=PASS/);
const unzip=(file,binary=false)=>{const x=spawnSync('unzip',['-p',archive,file],{cwd:root});assert.equal(x.status,0,x.stderr&&x.stderr.toString());return binary?x.stdout:x.stdout.toString()};
assert.equal(digest(unzip('public/moyu/game.js')),digest(game)); for(const name of ['workstation','meeting','pantry','gym'])assert.equal(unzip(`public/moyu/assets/scenes-v126/${name}.svg`),read(`moyu/assets/scenes-v126/${name}.svg`));
assert.equal(unzip('public/moyu/VERSION').trim(),'1.26.0'); fs.rmSync(tmp,{recursive:true,force:true}); console.log('RESULT Clock Out Alive v1.26.0 HD vector scenes PASS');
