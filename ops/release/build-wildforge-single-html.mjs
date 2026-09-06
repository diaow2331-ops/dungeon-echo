#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const wf=path.join(root,'wildforge');
const version=fs.readFileSync(path.join(wf,'VERSION'),'utf8').trim();
const target=process.argv[2]||path.join('/tmp',`Wildforge-v${version}-single.html`);
const read=rel=>fs.readFileSync(path.join(wf,rel),'utf8');
let html=read('index.html');
const css=read('style.css');
const stripImports=(code)=>code.replace(/^\s*import\s+[^;]+;\s*$/gm,'');
const stripExports=(code)=>code.replace(/^export\s+/gm,'');
const dataCode=stripExports(stripImports(read('src/data.js')));
const worldCode=stripExports(stripImports(read('src/world.js')));
const coreArtData=fs.readFileSync(path.join(wf,'assets/core-art.webp')).toString('base64');
const coreArtSource="const CORE_ART_SRC='./assets/core-art.webp';";
const gameCode=stripExports(stripImports(read('src/game.js'))).replace(coreArtSource,()=>`const CORE_ART_SRC='data:image/webp;base64,${coreArtData}';`);
const dataExports=['VERSION','TILE','BIOMES','TILE_DEFS','ITEMS','RECIPES','ENEMY_TYPES','itemName','tileName'];
const worldExports=['World','WORLD_W','WORLD_H','encodeTiles','decodeTiles','biomeIndexAt','makeRng'];
const js=[
  `const __WF_DATA=(()=>{\n${dataCode}\nreturn {${dataExports.join(',')}};\n})();`,
  `const __WF_WORLD=((__data)=>{\nconst {BIOMES,TILE,TILE_DEFS}=__data;\n${worldCode}\nreturn {${worldExports.join(',')}};\n})(__WF_DATA);`,
  `(()=>{\nconst {VERSION,TILE,TILE_DEFS,ITEMS,RECIPES,ENEMY_TYPES,itemName,tileName}=__WF_DATA;\nconst {World,WORLD_W,WORLD_H,encodeTiles,biomeIndexAt,makeRng}=__WF_WORLD;\n${gameCode}\n})();`
].join('\n\n');
const styleTag=`<style data-wildforge-inline="${version}">\n${css}\n</style>`;
const scriptTag=`<script data-wildforge-inline="${version}">\n${js.replace(/<\/script/gi,'<\\/script')}\n<\/script>`;
html=html.replace(/\s*<link rel="stylesheet" href="style\.css\?v=[^"]+">/,()=>`\n  ${styleTag}`);
html=html.replace(/\s*<script type="module" src="src\/game\.js\?v=[^"]+"><\/script>/,()=>`\n  ${scriptTag}`);
if(/src\/game\.js|style\.css\?v=|^\s*import\s/m.test(html))throw new Error('single-file export still contains external runtime references');
const marker='<!-- GENERATED: use ops/release/build-wildforge-single-html.mjs; source authority remains modular. -->\n';
if(!html.startsWith(marker))html=marker+html;
fs.mkdirSync(path.dirname(target),{recursive:true});
fs.writeFileSync(target,html);
console.log(`wildforge_single_html=${target}`);
console.log(`version=${version}`);
console.log(`bytes=${Buffer.byteLength(html)}`);
