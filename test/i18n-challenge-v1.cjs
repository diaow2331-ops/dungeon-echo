'use strict';
const fs = require('fs');
const assert = require('assert');

const pressure = fs.readFileSync('challenge-pressure.js','utf8');
const fixed = fs.readFileSync('fixed-locale-entry-v130.js','utf8');
const screen = fs.readFileSync('core-screen-owner-v153.js','utf8');
const canvas = fs.readFileSync('town-canvas-locale-v153.js','utf8');
const loader = fs.readFileSync('runtime-bootstrap.js','utf8');
const loot = fs.readFileSync('world-loot-polish-v122.js','utf8');
const forge = fs.readFileSync('forge-feedback-v122.js','utf8');
const tutorial = fs.readFileSync('combat-hint-polish.js','utf8');
const html = fs.readFileSync('index.html','utf8');
const en = fs.readFileSync('en/index.html','utf8');
const release = fs.readFileSync('ops/release/static-files.txt','utf8').split(/\r?\n/).filter(Boolean);

// Mild challenge remains unchanged by locale/runtime cleanup.
assert(pressure.includes('MAX_REGULAR_BONUS = 0.08'), 'regular attack ceiling changed');
assert(pressure.includes('ELITE_BONUS = 0.03'), 'elite follow-up pressure changed');
assert(!/\.maxHp\s*=|\.hp\s*=/.test(pressure), 'challenge layer must not create HP sponges');
assert(!/armorBreak\s*=|pierce/i.test(pressure), 'challenge layer must not add hidden armor bypass');

// Fixed locales are page identities. Legacy ?lang converges to / or /en/; no live translator remains.
assert(fixed.includes("searchParams.get('lang')"), 'legacy shareable ?lang compatibility route missing');
assert(fixed.includes("localStorage.setItem(storageKey"), 'language preference persistence missing');
assert(fixed.includes('location.replace(target.href)'), 'language choice must navigate to fixed route');
assert(fixed.includes("box.id = 'de-title-language'"), 'title-screen language chooser missing');
assert(!/[\u3400-\u9fff]/.test(en), 'English fixed entry contains CJK presentation text');
assert(screen.includes("owner:'core-screen-owner-v153'"), 'exact core English screen owner missing');
assert(canvas.includes("owner:'town-canvas-locale-v153'"), 'exact English town Canvas owner missing');

// Performance contract: all runtime translation layers are retired from production.
for (const retired of ['i18n.js','i18n-runtime.js','i18n-content.js','ux-hotfix-v121.js','locale-event-owner-v130.js','locale-runtime-v122.js','locale-completeness-v128.js']) {
  assert(!loader.includes(`'${retired}'`), `retired locale layer still loads: ${retired}`);
  assert(!release.includes(retired), `retired locale layer still ships: ${retired}`);
}
assert(!/MutationObserver|translateTree|setInterval|requestAnimationFrame/.test(screen), 'core locale screen owner must stay exact and follower-free');
assert(!/MutationObserver|setInterval|requestAnimationFrame/.test(canvas), 'Canvas locale sink must not add a follower');
assert(!tutorial.includes('window.DE_I18N'), 'tutorial must use fixed-route copy rather than runtime translator');

// Production ordering: gameplay synchronous, exact presentation owners late and isolated.
const desktopPos = html.indexOf('desktop-controls.js?v=153');
const controlsPos = html.indexOf('combat-controls.js?v=153');
const challengePos = html.indexOf('challenge-pressure.js?v=153');
const bootstrapPos = html.indexOf('runtime-bootstrap.js?v=153');
assert(desktopPos >= 0 && controlsPos > desktopPos && challengePos > controlsPos && bootstrapPos > challengePos,
  'desktop -> combat-controls -> challenge -> bootstrap order broken');
const fixedPos = loader.indexOf("'fixed-locale-entry-v130.js'");
const screenPos = loader.indexOf("'core-screen-owner-v153.js'");
const canvasPos = loader.indexOf("'town-canvas-locale-v153.js'");
const lootPos = loader.indexOf("'world-loot-polish-v122.js'");
const forgePos = loader.indexOf("'forge-feedback-v122.js'");
const hintPos = loader.indexOf("'combat-hint-polish.js'");
assert(fixedPos >= 0 && screenPos > fixedPos && canvasPos > screenPos && lootPos > canvasPos && forgePos > lootPos && hintPos > forgePos,
  'fixed route -> exact locale sinks -> loot -> forge -> tutorial order broken');
assert(loader.includes("assetVersion = '153'") && loader.includes("version:'v13'"), 'final runtime generation mismatch');

// Art polish cannot mutate loot/gameplay values or reveal loot through walls.
assert(loot.includes('api.items'), 'ground loot source missing');
assert(loot.includes('function los('), 'ground loot polish must respect line of sight');
assert(!/\.rarity\s*=|\.stats\s*=|\.val\s*=|items\.push|items\.splice/.test(loot), 'loot polish must not mutate item/gameplay data');
assert(loot.includes('z-index:3'), 'ground loot polish must remain a presentation overlay');

// Forge feedback observes canonical forge results; it must not mutate stats/forge level/gold.
assert(forge.includes('[data-forge]'), 'forge feedback hook missing');
assert(forge.includes('statDelta'), 'forge stat-delta feedback missing');
assert(forge.includes('Refinement unlocked') && forge.includes('Masterwork completed'), 'forge milestone feedback missing');
assert(forge.includes('de-forge-stage'), 'forge stage badge missing');
assert(!/item\.forge\s*=|item\.stats\s*=|meta\.gold\s*=|addStats\(/.test(forge), 'forge feedback must remain presentation-only');

for (const f of ['runtime-bootstrap.js','challenge-pressure.js','core-screen-owner-v153.js','town-canvas-locale-v153.js','world-loot-polish-v122.js','forge-feedback-v122.js','combat-controls.js','combat-hint-polish.js','audio-director.js','mobile-ux.js']) {
  assert(release.includes(f), `release manifest missing ${f}`);
}

console.log('fixed_route_i18n_challenge_v153=PASS');
