'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const version = read('VERSION').trim();
const zh = read('index.html');
const en = read('en/index.html');
const manifest = read('ops/release/static-files.txt').split(/\r?\n/).filter(Boolean);
const builder = read('ops/release/build-site-bundle.sh');
const deploy = read('ops/site-bundle/deploy.sh');
const deployReadme = read('ops/site-bundle/README.txt');
const productionBootstrapPath = 'game/core/production-bootstrap.js';
const runtimePath = 'game/core/runtime-bootstrap.js';
const responsivePath = 'game/ui/responsive-final-v154.js';
const saveIntegrityPath = 'game/core/save-integrity-system.js';
const desktopControlsPath = 'game/input/desktop-controls.js';
const fixedLocalePath = 'game/locale/fixed-locale-entry-v130.js';
const stableIdsPath = 'game/locale/stable-item-id-migration-v150.js';
const screenOwnerPath = 'game/locale/core-screen-owner-v153.js';
const canvasOwnerPath = 'game/locale/town-canvas-locale-v153.js';
const npcPath = 'game/systems/npc-stability-system.js';
const progressionGuardPath = 'game/systems/progression-guard-system.js';
const riskRewardPath = 'game/systems/risk-reward-system.js';
const productionBootstrap = read(productionBootstrapPath);
const runtime = read(runtimePath);
const responsive = read(responsivePath);
const fixedLocale = read(fixedLocalePath);
const screenOwner = read(screenOwnerPath);
const canvasOwner = read(canvasOwnerPath);
const saveIntegrity = read(saveIntegrityPath);
const desktopControls = read(desktopControlsPath);
const releaseStampPath = `game/core/release-stamp-v${version.replace(/\./g, '')}.js`;
const releaseStamp = fs.existsSync(path.join(root, releaseStampPath)) ? read(releaseStampPath) : '';
const assetVersion = (runtime.match(/const assetVersion = '(\d+)'/) || [,''])[1];
const sourceGeneration = (zh.match(/\?v=(\d+)/) || [,''])[1];
const cleanRef = ref => ref.split(/[?#]/, 1)[0];

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
}

console.log('[release] static package');
ok(/^\d+\.\d+\.\d+$/.test(version), 'VERSION uses SemVer');
ok(/^\d+$/.test(assetVersion), 'runtime declares an explicit numeric asset generation');
ok(/^\d+$/.test(sourceGeneration), 'source entries declare a numeric cache generation');
ok(manifest.includes(releaseStampPath) && runtime.includes(releaseStampPath) && releaseStamp.includes(`const version = '${version}'`),
  'runtime release stamp matches semantic VERSION');
ok(manifest.every(file => fs.existsSync(path.join(root, file))), 'every release-manifest resource exists');
ok(!manifest.some(file => /^(?:dev\.html|test\/|profiles\/classic-(?:10|20|30|40|50|60)\.profile\.js$)/.test(file)),
  'release manifest excludes development entry/tests/short profiles');
ok(manifest.includes('index.html') && manifest.includes('en/index.html') && manifest.includes(fixedLocalePath),
  'release package ships fixed Chinese/English entries and route owner');
ok(manifest.includes(screenOwnerPath) && manifest.includes(canvasOwnerPath) && manifest.includes(stableIdsPath),
  'release package ships exact fixed-route sinks and stable item IDs');
ok(manifest.includes(responsivePath), 'release package ships final PC/mobile responsive owner');
ok(manifest.includes('art/title-backdrop.webp') && manifest.includes('art/class-roster.webp') && manifest.includes('art/loot-atlas.png'),
  'production art assets are packaged');

function refs(html) {
  return [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map(m => m[1])
    .filter(ref => !/^(?:data:|https?:|#|\.\.\/$)/.test(ref));
}
for (const [label, html] of [['zh', zh], ['en', en]]) {
  const local = refs(html), files = local.map(cleanRef);
  ok(files.every(ref => fs.existsSync(path.join(root, ref))), `${label} entry local assets resolve from shared root`);
  ok(files.every(ref => manifest.includes(ref)), `${label} entry local assets are release-manifested`);
  const critical = local.filter(ref => /(?:\.css|\.js)(?:\?|$)/.test(ref));
  ok(critical.length > 0 && critical.every(ref => ref.endsWith(`?v=${sourceGeneration}`)), `${label} source CSS/JS use stable source generation ${sourceGeneration}`);
}
ok(/<base href="\.\.\/">/.test(en), 'English entry shares the root asset graph through base href');
ok(!/[\u3400-\u9fff]/.test(en), 'English static entry contains no CJK presentation text');

console.log('\n[release] ownership');
ok(runtime.includes(`const assetVersion = '${assetVersion}'`) && runtime.includes(`fresh('${releaseStampPath}')`),
  'late followers share the public cache generation');
const pFixed=runtime.indexOf(`fresh('${fixedLocalePath}')`);
const pIds=runtime.indexOf(`fresh('${stableIdsPath}')`);
const pScreen=runtime.indexOf(`fresh('${screenOwnerPath}')`);
const pCanvas=runtime.indexOf(`fresh('${canvasOwnerPath}')`);
const pMobile=runtime.indexOf("fresh('game/ui/mobile-ux.js')");
const pResponsive=runtime.indexOf(`fresh('${responsivePath}')`);
ok(pFixed>0 && pIds>pFixed && pScreen>pIds && pCanvas>pScreen,
  'fixed route identity, stable item IDs and exact presentation sinks boot in deterministic order');
ok(pMobile>0 && pResponsive>pMobile,
  'final responsive owner boots after the established mobile UX owner');
ok(responsive.includes('@media (min-width:901px) and (max-width:1180px)') &&
    responsive.includes('grid-template-areas:"game" "side"') &&
    responsive.includes('grid-template-columns:repeat(6,minmax(0,1fr))'),
  'mid-width PC layout stops squeezing the dungeon beside the sidebar');
ok(responsive.includes('@media (max-width:900px) and (orientation:portrait)') &&
    responsive.includes('min-height:44px!important') && responsive.includes('min-height:52px!important'),
  'portrait mobile actions keep reliable thumb targets');
for(const retired of ['locale-event-owner-v130.js','locale-runtime-v122.js','locale-completeness-v128.js']){
  ok(!runtime.includes(retired) && !manifest.some(file=>file===retired||file.endsWith('/'+retired)), `${retired} is retired from production and release`);
}
ok(manifest.includes(npcPath) && manifest.includes(progressionGuardPath) && manifest.includes(riskRewardPath),
  'explicit gameplay owners are release-manifested');
ok(fixedLocale.includes("const storageKey = 'de-language-v1'") && !/de-run-v6|de-greedy-meta-v1|de-town-wheel-state-v1/.test(fixedLocale),
  'fixed locale routing cannot fork gameplay save namespaces');
ok(screenOwner.includes("owner:'core-screen-owner-v153'") && !/MutationObserver|translateTree|setInterval|requestAnimationFrame/.test(screenOwner),
  'final core screen ownership is exact and follower-free');
ok(canvasOwner.includes("owner:'town-canvas-locale-v153'") && !/MutationObserver|setInterval|requestAnimationFrame/.test(canvasOwner),
  'town canvas localization is exact and adds no follower');

console.log('\n[release] save/input invariants');
ok(saveIntegrity.includes("const RUN_KEY = 'de-run-v6'") && saveIntegrity.includes("const META_KEY = 'de-greedy-meta-v1'") &&
    saveIntegrity.includes('validGrid(raw.map, false)') && saveIntegrity.includes('validGrid(raw.explored, true)'),
  'save-integrity owner validates canonical run/meta and map structures');
ok(!/setInterval\s*\(/.test(saveIntegrity), 'save-integrity owner has no polling loop');
ok(productionBootstrap.includes('const ONE_SHOT_REPEAT_KEYS = new Set([') &&
    productionBootstrap.includes("'j', 'J', 'k', 'K'") &&
    productionBootstrap.includes("'q', 'Q', 'e', 'E', 't', 'T'") &&
    productionBootstrap.includes("'Escape', ' ', 'Spacebar', '.'") &&
    productionBootstrap.includes('event.repeat') &&
    productionBootstrap.includes('event.stopImmediatePropagation()'),
  'production bootstrap blocks repeat for tactical one-shot keyboard actions');
ok(!/ONE_SHOT_REPEAT_KEYS[\s\S]{0,260}'ArrowUp'/.test(productionBootstrap) &&
    !/ONE_SHOT_REPEAT_KEYS[\s\S]{0,260}'ArrowDown'/.test(productionBootstrap) &&
    !/ONE_SHOT_REPEAT_KEYS[\s\S]{0,260}'w'/.test(productionBootstrap),
  'movement keys retain normal keyboard repeat');
ok(productionBootstrap.includes("owner:'production-bootstrap'") && productionBootstrap.includes("window.addEventListener('keydown', repeatGuard, true)"),
  'repeat guard installs before synchronous core/combat input owners');
ok(desktopControls.includes("edgeButton(pad, 7, 'j')") && desktopControls.includes('RT Attack'),
  'gamepad attack remains parity-mapped to J');
ok(/function\s+triggerReturn\s*\(\)/.test(desktopControls) && /commerce\.extractionReady\(\)/.test(desktopControls),
  'gamepad Return delegates to the production extraction owner');

console.log('\n[release] bundle/deploy');
ok(/public\/dungeon-echo/.test(builder) && /static-files\.txt/.test(builder) && /mkdir -p "\$bundle\/public\/dungeon-echo\/\$\(dirname "\$file"\)"/.test(builder),
  'site bundle supports nested fixed-locale routes from the manifest');
ok(/SHA256SUMS/.test(builder) && /git -C "\$repo_root" cat-file -e/.test(builder),
  'bundle validates tracked HEAD files and generates hashes');
ok(builder.includes(`source_generation=${sourceGeneration}`) && builder.includes(`asset_generation=${assetVersion}`) &&
    builder.includes('sed -i') && builder.includes('en/index.html'),
  'bundle deterministically advances both public entries to the release cache generation');
ok(deployReadme.includes(`91hwl-play-dungeon-echo-v${version}.zip`) && deployReadme.includes(`/tmp/91hwl-play-dungeon-echo-v${version}`),
  'deployment instructions use current semantic VERSION');
ok(/SITE_ROOT=\/srv\/91hwl-play/.test(deploy) && /previous_release\/moyu\/index\.html/.test(deploy),
  'deployment reuses the site release tree and protects the Moyu game');
ok(/mv -Tf "\$next_link" "\$CURRENT_LINK"/.test(deploy) && /ROLLED_BACK/.test(deploy),
  'deployment switches current atomically and retains rollback');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'de-release-'));
const archive = path.join(tmp, `dungeon-${version}.zip`);
let r = spawnSync('bash', [path.join(root,'ops/release/build-site-bundle.sh'), archive], { cwd:root, encoding:'utf8' });
ok(r.status === 0 && /dungeon_echo_bundle_build=PASS/.test(r.stdout || ''), 'Dungeon release bundle builds successfully');
if (r.status === 0) {
  for (const entry of ['public/dungeon-echo/index.html','public/dungeon-echo/en/index.html']) {
    const out = spawnSync('unzip', ['-p', archive, entry], { encoding:'utf8' });
    ok(out.status === 0 && out.stdout.includes(`?v=${assetVersion}`) && !out.stdout.includes(`?v=${sourceGeneration}`), `${entry} ships cache generation ${assetVersion}`);
  }
  const files = spawnSync('unzip', ['-Z1', archive], { encoding:'utf8' });
  ok(files.status === 0 && files.stdout.includes(`public/dungeon-echo/${responsivePath}`), 'bundle contains final responsive owner');
}
fs.rmSync(tmp, { recursive:true, force:true });

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
