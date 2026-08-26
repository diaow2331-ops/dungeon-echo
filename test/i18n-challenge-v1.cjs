'use strict';
const fs = require('fs');
const assert = require('assert');

const pressure = fs.readFileSync('challenge-pressure.js','utf8');
const locale = fs.readFileSync('locale-runtime-v122.js','utf8');
const loader = fs.readFileSync('runtime-bootstrap.js','utf8');
const loot = fs.readFileSync('world-loot-polish-v122.js','utf8');
const forge = fs.readFileSync('forge-feedback-v122.js','utf8');
const tutorial = fs.readFileSync('combat-hint-polish.js','utf8');
const html = fs.readFileSync('index.html','utf8');
const release = fs.readFileSync('ops/release/static-files.txt','utf8').split(/\r?\n/).filter(Boolean);

// Mild challenge remains unchanged by final polish.
assert(pressure.includes('MAX_REGULAR_BONUS = 0.08'), 'regular attack ceiling changed');
assert(pressure.includes('ELITE_BONUS = 0.03'), 'elite follow-up pressure changed');
assert(!/\.maxHp\s*=|\.hp\s*=/.test(pressure), 'challenge layer must not create HP sponges');
assert(!/armorBreak\s*=|pierce/i.test(pressure), 'challenge layer must not add hidden armor bypass');

// One locale per page load; title selection reloads instead of live whole-run translation.
assert(locale.includes("url.searchParams.get('lang')"), 'shareable ?lang route missing');
assert(locale.includes("localStorage.getItem(STORAGE_KEY)"), 'language persistence missing');
assert(locale.includes("browser.startsWith('zh')"), 'browser-language fallback missing');
assert(locale.includes("location.replace(target.href)"), 'language choice must reload the page');
assert(locale.includes("box.id = 'de-title-language'"), 'title-screen language chooser missing');
assert(locale.includes("window.DE_I18N ="), 'central locale API missing');
for (const cls of ['Warrior','Ranger','Arcanist','Assassin']) assert(locale.includes(cls), `English class missing: ${cls}`);
for (const name of ['Iron Sword','Chaos Staff','Void Sovereign','Lord of the Final Abyss']) assert(locale.includes(name), `English content missing: ${name}`);
assert(locale.includes('You hit $1 for $2 damage.'), 'outgoing combat grammar missing');
assert(locale.includes('$1 hits you for $2 damage.'), 'incoming combat grammar missing');
assert(locale.includes('Picked up $1 Gold'), 'Gold pickup grammar missing');
assert(locale.includes('+3 Refinement: choose a path'), 'forge localization missing');

// Performance contract: old polling/live-translation chain is retired from production.
for (const retired of ['i18n.js','i18n-runtime.js','i18n-content.js','ux-hotfix-v121.js']) {
  assert(!loader.includes(`'${retired}'`), `retired locale layer still loads: ${retired}`);
  assert(!release.includes(retired), `retired locale layer still ships: ${retired}`);
}
assert(!locale.includes('setInterval('), 'locale owner must not poll');
assert(!locale.includes("observe(document.body,{childList:true,subtree:true,characterData:true})"), 'locale owner must not globally watch characterData');
assert(locale.includes("observe(document.body,{childList:true,subtree:true})"), 'event-driven added-node translation missing');
assert(tutorial.includes("window.DE_I18N"), 'tutorial must consume locale owner');

// Production ordering: gameplay synchronous, final presentation late and isolated.
const desktopPos = html.indexOf('<script src="desktop-controls.js"></script>');
const controlsPos = html.indexOf('<script src="combat-controls.js"></script>');
const challengePos = html.indexOf('<script src="challenge-pressure.js"></script>');
const bootstrapPos = html.indexOf('<script src="runtime-bootstrap.js"></script>');
assert(desktopPos >= 0 && controlsPos > desktopPos && challengePos > controlsPos && bootstrapPos > challengePos,
  'desktop -> combat-controls -> challenge -> bootstrap order broken');
const localePos = loader.indexOf("'locale-runtime-v122.js'");
const lootPos = loader.indexOf("'world-loot-polish-v122.js'");
const forgePos = loader.indexOf("'forge-feedback-v122.js'");
const hintPos = loader.indexOf("'combat-hint-polish.js'");
assert(localePos >= 0 && lootPos > localePos && forgePos > lootPos && hintPos > forgePos,
  'locale -> loot polish -> forge feedback -> tutorial order broken');

// Art polish cannot mutate loot/gameplay values or reveal loot through walls.
assert(loot.includes("api.items"), 'ground loot source missing');
assert(loot.includes('function los('), 'ground loot polish must respect line of sight');
assert(!/\.rarity\s*=|\.stats\s*=|\.val\s*=|items\.push|items\.splice/.test(loot), 'loot polish must not mutate item/gameplay data');
assert(loot.includes("z-index:3"), 'ground loot polish must remain a presentation overlay');

// Forge feedback observes canonical forge results; it must not mutate stats/forge level/gold.
assert(forge.includes("[data-forge]"), 'forge feedback hook missing');
assert(forge.includes('statDelta'), 'forge stat-delta feedback missing');
assert(forge.includes('Refinement unlocked') && forge.includes('Masterwork completed'), 'forge milestone feedback missing');
assert(forge.includes('de-forge-stage'), 'forge stage badge missing');
assert(!/item\.forge\s*=|item\.stats\s*=|meta\.gold\s*=|addStats\(/.test(forge), 'forge feedback must remain presentation-only');

for (const f of ['runtime-bootstrap.js','challenge-pressure.js','locale-runtime-v122.js','world-loot-polish-v122.js','forge-feedback-v122.js','combat-controls.js','combat-hint-polish.js','audio-director.js','mobile-ux.js']) {
  assert(release.includes(f), `release manifest missing ${f}`);
}

console.log('i18n_challenge_v122=PASS');
