import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const wf=path.join(root,'wildforge');
const version=fs.readFileSync(path.join(wf,'VERSION'),'utf8').trim();
const target=process.argv[2]||path.join('/tmp',`Wildforge-v${version}-single.html`);
const read=rel=>fs.readFileSync(path.join(wf,rel),'utf8');
const stripImports=code=>code.replace(/^\s*import\s+[^;]+;\s*$/gm,'');
const stripExports=code=>code.replace(/^export\s+/gm,'');

let html=read('index.html');
const coreArtData=fs.readFileSync(path.join(wf,'assets/core-art.webp')).toString('base64');
const atlasUrl=`data:image/webp;base64,${coreArtData}`;
const inventoryCss=read('inventory-ui.css').replace(/url\(['"]?\.\/assets\/core-art\.webp['"]?\)/g,`url(${atlasUrl})`);
const css=[read('style.css'),inventoryCss].join('\n');

const dataCode=stripExports(stripImports(read('src/data.js')));
const surfaceCode=stripExports(stripImports(read('src/surface-content.js')));
const worldCode=stripExports(stripImports(read('src/world.js')));
const inventoryCode=stripExports(stripImports(read('src/inventory-ui.js')));
const combatCode=stripExports(stripImports(read('src/combat-tuning.js')));
const settlementCode=stripExports(stripImports(read('src/settlement-economy.js')));
const contractCode=stripExports(stripImports(read('src/transport-contracts.js')));
const coreArtSource="const CORE_ART_SRC='./assets/core-art.webp';";
const gameCode=stripExports(stripImports(read('src/game.js'))).replace(coreArtSource,()=>`const CORE_ART_SRC='${atlasUrl}';`);

const js=[
  `const __WF_DATA=(()=>{\n${dataCode}\nreturn {VERSION,TILE,BIOMES,TILE_DEFS,ITEMS,RECIPES,ENEMY_TYPES,itemName,tileName};\n})();`,
  `const __WF_SURFACE=(()=>{\n${surfaceCode}\nreturn {decorateSurface,buildSettlements,surfaceContentDensity};\n})();`,
  `const __WF_WORLD=((__data,__surface)=>{\nconst {BIOMES,TILE,TILE_DEFS}=__data;\nconst {decorateSurface,buildSettlements}=__surface;\n${worldCode}\nreturn {World,LEGACY_WORLD_W,WORLD_W,WORLD_H,BIOME_BAND_W,encodeTiles,decodeTiles,biomeIndexAt,makeRng};\n})(__WF_DATA,__WF_SURFACE);`,
  `const __WF_INVENTORY=(()=>{\n${inventoryCode}\nreturn {INVENTORY_SLOT_COUNT,renderInventorySlots,renderHotbarSlots,normalizeHotbar,normalizeInventoryLayout};\n})();`,
  `const __WF_COMBAT=(()=>{\n${combatCode}\nreturn {ENCOUNTER_TUNING,encounterCap,nextEncounterDelay,suppressEarlySurfaceEncounter,knockbackResistance,applyEnemyKnockback};\n})();`,
  `const __WF_SETTLEMENT=(()=>{\n${settlementCode}\nreturn {SETTLEMENT_TRADE_RADIUS,SETTLEMENT_SAFE_RADIUS,SETTLEMENT_GENERAL_DEMAND_CAP,SETTLEMENT_MAX_RELIABILITY,SETTLEMENT_PREFERENCE_PREMIUM,settlementName,settlementLongTermPreference,settlementDailyDemand,settlementDemandKey,settlementDemandRemaining,settlementSellPrice};\n})();`,
  `const __WF_CONTRACTS=(()=>{\n${contractCode}\nreturn {TRANSPORT_CONTRACT_DAYS,makeTransportOffer,contractDaysLeft};\n})();`,
  `(()=>{\nconst {VERSION,TILE,TILE_DEFS,ITEMS,RECIPES,ENEMY_TYPES,itemName,tileName}=__WF_DATA;\nconst {World,WORLD_W,WORLD_H,encodeTiles,biomeIndexAt,makeRng}=__WF_WORLD;\nconst {renderInventorySlots,renderHotbarSlots,normalizeHotbar,normalizeInventoryLayout,INVENTORY_SLOT_COUNT}=__WF_INVENTORY;\nconst {encounterCap,nextEncounterDelay,suppressEarlySurfaceEncounter,applyEnemyKnockback}=__WF_COMBAT;\nconst {SETTLEMENT_TRADE_RADIUS,SETTLEMENT_SAFE_RADIUS,SETTLEMENT_GENERAL_DEMAND_CAP,SETTLEMENT_MAX_RELIABILITY,SETTLEMENT_PREFERENCE_PREMIUM,settlementName,settlementLongTermPreference,settlementDailyDemand,settlementDemandKey,settlementDemandRemaining,settlementSellPrice}=__WF_SETTLEMENT;\nconst {TRANSPORT_CONTRACT_DAYS,makeTransportOffer,contractDaysLeft}=__WF_CONTRACTS;\n${gameCode}\n})();`
].join('\n\n');

const styleTag=`<style data-wildforge-inline="${version}">\n${css}\n</style>`;
const scriptTag=`<script data-wildforge-inline="${version}">\n${js.replace(/<\/script/gi,'<\\/script')}\n<\/script>`;
html=html.replace(/\s*<link rel="stylesheet" href="style\.css\?v=[^"]+">/,()=>`\n  ${styleTag}`);
html=html.replace(/\s*<link rel="stylesheet" href="inventory-ui\.css\?v=[^"]+">/,'');
html=html.replace(/\s*<script type="module" src="src\/game\.js\?v=[^"]+"><\/script>/,()=>`\n  ${scriptTag}`);
if(/src\/game\.js|(?:style|inventory-ui)\.css\?v=|^\s*import\s/m.test(html))throw new Error('single-file export still contains external runtime references');
const marker='<!-- GENERATED: use ops/release/build-wildforge-single-html.mjs; source authority remains modular. -->\n';
if(!html.startsWith(marker))html=marker+html;
fs.mkdirSync(path.dirname(target),{recursive:true});
fs.writeFileSync(target,html);
console.log(`wildforge_single_html=${target}`);
console.log(`version=${version}`);
console.log(`bytes=${Buffer.byteLength(html)}`);
