'use strict';
const fs=require('fs');
const path=require('path');
const pages=process.argv.slice(2);
if(pages.length!==6)throw new Error('usage: node build-site-v1117.cjs HOME DUNGEON MOYU ABOUT PRIVACY CONTACT');
const [homePath,dePath,moyuPath]=pages;
const repo=path.resolve(__dirname,'../..');
const readVersion=rel=>fs.readFileSync(path.join(repo,rel),'utf8').trim();
const versions=Object.freeze({
  dungeon:readVersion('VERSION'),
  moyu:readVersion('moyu/VERSION'),
  board:readVersion('board-games/VERSION'),
});
for(const [name,value] of Object.entries(versions)){
  if(!/^\d+\.\d+\.\d+$/.test(value))throw new Error(`${name} version is not semantic: ${value}`);
}
const STAGE_SITE='1.11.7';
const securityUrl='https://github.com/diaow2331-ops/dungeon-echo/security/policy';
function upgradeSiteVersion(file){
  let body=fs.readFileSync(file,'utf8');
  if(!body.includes('data-site-version="1.11.6"'))throw new Error(`site v1.11.6 marker missing: ${file}`);
  body=body.replaceAll('data-site-version="1.11.6"',`data-site-version="${STAGE_SITE}"`)
    .replaceAll('site v1.11.6',`site v${STAGE_SITE}`);
  fs.writeFileSync(file,body);
}
pages.forEach(upgradeSiteVersion);
let home=fs.readFileSync(homePath,'utf8');
home=home.replaceAll('v1.5.0',`v${versions.dungeon}`)
  .replaceAll('v1.26.5',`v${versions.moyu}`)
  .replaceAll('v0.4.0',`v${versions.board}`);
if(!home.includes(securityUrl))throw new Error('homepage security-policy route missing');
fs.writeFileSync(homePath,home);

let dungeon=fs.readFileSync(dePath,'utf8');
dungeon=dungeon.replaceAll('softwareVersion":"1.5.0"',`softwareVersion":"${versions.dungeon}"`)
  .replaceAll('Dungeon Echo v1.5.0',`Dungeon Echo v${versions.dungeon}`);
fs.writeFileSync(dePath,dungeon);

let moyu=fs.readFileSync(moyuPath,'utf8');
moyu=moyu.replaceAll('softwareVersion":"1.26.5"',`softwareVersion":"${versions.moyu}"`);
fs.writeFileSync(moyuPath,moyu);

for(const file of pages){
  const body=fs.readFileSync(file,'utf8');
  if(!body.includes(`data-site-version="${STAGE_SITE}"`))throw new Error(`site version drift: ${file}`);
  if(/mailto:[^"'\s>]+@/i.test(body))throw new Error(`personal mail route remains: ${file}`);
  if(/https:\/\/x\.com\//i.test(body))throw new Error(`personal social route remains: ${file}`);
}
if(!fs.readFileSync(homePath,'utf8').includes(`03 / v${versions.board}`))throw new Error('Board version not synchronized from authority');
if(!fs.readFileSync(dePath,'utf8').includes(`softwareVersion":"${versions.dungeon}"`))throw new Error('Dungeon version not synchronized from authority');
if(!fs.readFileSync(moyuPath,'utf8').includes(`softwareVersion":"${versions.moyu}"`))throw new Error('Moyu version not synchronized from authority');
console.log(`site_v1117_authority_sync=PASS site=${STAGE_SITE} dungeon=${versions.dungeon} moyu=${versions.moyu} board=${versions.board}`);
