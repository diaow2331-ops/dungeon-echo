'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const version = read('VERSION').trim();
const zh = read('index.html');
const en = read('en/index.html');
const manifest = read('ops/release/static-files.txt').split(/\r?\n/).filter(Boolean);
const builder = read('ops/release/build-site-bundle.sh');
const deploy = read('ops/site-bundle/deploy.sh');
const deployReadme = read('ops/site-bundle/README.txt');
const runtime = read('runtime-bootstrap.js');
const fixedLocale = read('fixed-locale-entry-v130.js');
const saveIntegrity = read('save-integrity-system.js');
const desktopControls = read('desktop-controls.js');
const releaseStampName = `release-stamp-v${version.replace(/\./g, '')}.js`;
const releaseStamp = fs.existsSync(path.join(root, releaseStampName)) ? read(releaseStampName) : '';
const assetVersion = (runtime.match(/const assetVersion = '(\d+)'/) || [,''])[1];
const cleanRef = ref => ref.split(/[?#]/, 1)[0];

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
}

console.log('[release] static package');
ok(/^\d+\.\d+\.\d+$/.test(version), 'VERSION uses SemVer');
ok(/^\d+$/.test(assetVersion), 'runtime declares an explicit numeric asset generation');
ok(manifest.includes(releaseStampName) && runtime.includes(releaseStampName) && releaseStamp.includes(`const version = '${version}'`),
  'runtime release stamp matches semantic VERSION');
ok(manifest.every(file => fs.existsSync(path.join(root, file))), 'every release-manifest resource exists');
ok(!manifest.some(file => /^(?:dev\.html|test\/|profiles\/classic-(?:10|20|30|40|50|60)\.profile\.js$)/.test(file)),
  'release manifest excludes development entry/tests/short profiles');
ok(manifest.includes('index.html') && manifest.includes('en/index.html') && manifest.includes('fixed-locale-entry-v130.js'),
  'release package ships fixed Chinese/English entries and route owner');
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
  ok(critical.length > 0 && critical.every(ref => ref.endsWith(`?v=${assetVersion}`)), `${label} CSS/JS use generation ${assetVersion}`);
}
ok(/<base href="\.\.\/">/.test(en), 'English entry shares the root asset graph through base href');

console.log('\n[release] ownership');
ok(runtime.includes(`const assetVersion = '${assetVersion}'`) && runtime.includes(`fresh('${releaseStampName}')`),
  'late followers share the direct-entry cache generation');
const pFixed=runtime.indexOf("fresh('fixed-locale-entry-v130.js')");
const pEvent=runtime.indexOf("fresh('locale-event-owner-v130.js')");
const pRuntime=runtime.indexOf("fresh('locale-runtime-v122.js')");
const pComplete=runtime.indexOf("fresh('locale-completeness-v128.js')");
ok(pFixed>0 && pEvent>pFixed && pRuntime>pEvent && pComplete>pRuntime,
  'fixed route identity precedes event-owned transitional locale presentation');
ok(manifest.includes('npc-stability-system.js') && manifest.includes('progression-guard-system.js') && manifest.includes('risk-reward-system.js'),
  'explicit gameplay owners are release-manifested');
ok(manifest.includes('locale-event-owner-v130.js') && manifest.includes('locale-runtime-v122.js') && manifest.includes('locale-completeness-v128.js'),
  'transitional locale stack is explicit and packaged');
ok(fixedLocale.includes("const storageKey = 'de-language-v1'") && !/de-run-v6|de-greedy-meta-v1|de-town-wheel-state-v1/.test(fixedLocale),
  'fixed locale routing cannot fork gameplay save namespaces');

console.log('\n[release] save/input invariants');
ok(saveIntegrity.includes("const RUN_KEY = 'de-run-v6'") && saveIntegrity.includes("const META_KEY = 'de-greedy-meta-v1'") &&
    saveIntegrity.includes('validGrid(raw.map, false)') && saveIntegrity.includes('validGrid(raw.explored, true)'),
  'save-integrity owner validates canonical run/meta and map structures');
ok(!/setInterval\s*\(/.test(saveIntegrity), 'save-integrity owner has no polling loop');
ok(desktopControls.includes("edgeButton(pad, 7, 'j')") && desktopControls.includes('RT Attack'),
  'gamepad attack remains parity-mapped to J');

console.log('\n[release] bundle/deploy');
ok(/public\/dungeon-echo/.test(builder) && /static-files\.txt/.test(builder) && /mkdir -p "\$bundle\/public\/dungeon-echo\/\$\(dirname "\$file"\)"/.test(builder),
  'site bundle supports nested fixed-locale routes from the manifest');
ok(/SHA256SUMS/.test(builder) && /git -C "\$repo_root" cat-file -e/.test(builder),
  'bundle validates tracked HEAD files and generates hashes');
ok(deployReadme.includes(`91hwl-play-dungeon-echo-v${version}.zip`) && deployReadme.includes(`/tmp/91hwl-play-dungeon-echo-v${version}`),
  'deployment instructions use current semantic VERSION');
ok(/SITE_ROOT=\/srv\/91hwl-play/.test(deploy) && /previous_release\/moyu\/index\.html/.test(deploy),
  'deployment reuses the site release tree and protects the Moyu game');
ok(/mv -Tf "\$next_link" "\$CURRENT_LINK"/.test(deploy) && /ROLLED_BACK/.test(deploy),
  'deployment switches current atomically and retains rollback');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
