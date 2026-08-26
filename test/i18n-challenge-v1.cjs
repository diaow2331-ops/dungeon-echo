'use strict';
const fs = require('fs');
const assert = require('assert');

const pressure = fs.readFileSync('challenge-pressure.js','utf8');
const i18n = fs.readFileSync('i18n.js','utf8');
const runtime = fs.readFileSync('i18n-runtime.js','utf8');
const content = fs.readFileSync('i18n-content.js','utf8');
const hotfix = fs.readFileSync('ux-hotfix-v121.js','utf8');
const loader = fs.readFileSync('runtime-bootstrap.js','utf8');
const shop = fs.readFileSync('equipment-shop-ui.js','utf8');
const tutorial = fs.readFileSync('combat-hint-polish.js','utf8');
const html = fs.readFileSync('index.html','utf8');
const release = fs.readFileSync('ops/release/static-files.txt','utf8').split(/\r?\n/);

// Mild challenge: raise mistake cost, not encounter duration.
assert(pressure.includes('MAX_REGULAR_BONUS = 0.08'), 'regular attack ceiling must remain mild');
assert(pressure.includes('ELITE_BONUS = 0.03'), 'elite follow-up pressure changed');
assert(pressure.includes('regularAttackMultiplier'), 'regular attack ramp missing');
assert(pressure.includes('20') && pressure.includes('100'), 'late-game pressure window missing');
assert(!/\.maxHp\s*=|\.hp\s*=/.test(pressure), 'challenge layer must not create HP sponges');
assert(!/armorBreak\s*=|pierce/i.test(pressure), 'challenge layer must not add hidden/extra armor bypass');
assert(/100:110/.test(pressure), 'final boss basic attack follow-up changed');
assert(/40:42/.test(pressure) && /90:96/.test(pressure), 'late guardian attack targets changed');

// Bilingual shell and shareable language routes.
assert(i18n.includes("new Set(['zh-CN','en'])"), 'zh/en language set missing');
assert(i18n.includes("url.searchParams.get('lang')"), 'shareable ?lang= route missing');
assert(i18n.includes("localStorage.getItem(STORAGE_KEY)"), 'language persistence missing');
assert(i18n.includes("browser.startsWith('zh') ? 'zh-CN' : 'en'"), 'browser-language default missing');
assert(i18n.includes("'game.name':'Dungeon Echo'"), 'English shell dictionary missing');
for (const cls of ['Warrior','Ranger','Arcanist','Assassin']) assert(i18n.includes(cls), `English class missing: ${cls}`);
assert(i18n.includes("'audio.music':'Music'") && i18n.includes("'audio.sfx':'SFX'"), 'audio localization missing');
assert(i18n.includes("'tutorial.guardian':'Armor Break"), 'guardian tutorial localization missing');
assert(tutorial.includes("tr('tutorial.attack.desktop'"), 'tutorial must consume central i18n API');

// v1.2.1 freezes language per page load: selection is title-only and reloads safely.
assert(hotfix.includes("#de-lang-toggle{display:none!important}"), 'legacy in-run language toggle must be hidden');
assert(hotfix.includes("box.id = 'de-title-language'"), 'title-screen language selector missing');
assert(hotfix.includes("location.replace(target.href)"), 'language selection must reload instead of hot-switching live gameplay');
assert(hotfix.includes("L.setLang = navigateLanguage"), 'public language API must follow reload semantics');
assert(hotfix.includes("localStorage.setItem(STORAGE_KEY, lang)"), 'title language preference persistence missing');

// Dynamic legacy-core text follows the central language owner.
assert(runtime.includes('syncClassCards'), 'class-card runtime localization missing');
assert(runtime.includes('syncCurrentClass'), 'current class HUD localization missing');
assert(runtime.includes('HP ${c.hpBase} · ATK ${c.atkBase}'), 'English class stat card missing');
assert(runtime.includes("Armor-break special · Hit ignores armor"), 'guardian warning translation missing');
assert(runtime.includes("Not enough mana:"), 'mana feedback translation missing');

// Dynamic content localization is display-only and reversible at source level.
assert(content.includes("window.__DE_I18N_CONTENT_V2"), 'content-localization owner missing');
assert(content.includes('sourceByNode=new WeakMap()'), 'reversible DOM source cache missing');
assert(content.includes("canvas.getContext('2d')"), 'Canvas text localization hook missing');
assert(content.includes("ctx.fillText=function"), 'Canvas fillText translation wrapper missing');
assert(content.includes("equipmentName(text)"), 'equipment-name localization parser missing');
for (const name of ['Iron Sword','Chaos Staff','Void Sovereign','Lord of the Final Abyss']) assert(content.includes(name), `English dynamic content missing: ${name}`);
assert(content.includes("replace(/攻击 \\+(\\d+)/g,'ATK +$1')"), 'equipment stat localization missing');
assert(content.includes("'已征服检查点':'Conquered Checkpoints'"), 'checkpoint localization missing');
assert(content.includes("'保险符':'Insurance Charm'"), 'town supply localization missing');
assert(content.includes("'锋锐':'Keen'") && content.includes("'凝神':'Focus'"), 'forge path localization missing');
assert(content.includes("Depart from conquered Floor $1"), 'checkpoint departure copy missing');
assert(content.includes("Town Tier $1 · Claimed $2/8 slots"), 'wheel-state localization missing');
assert(content.includes("Owned $1 · Stock $2"), 'town commerce inventory localization missing');
assert(content.includes("Bind Wounds (Full heal · Missing $1)"), 'dungeon merchant service localization missing');
assert(content.includes("+3 Refinement: choose a path"), 'forge refinement dialog localization missing');
assert(content.includes("'霜环蓄积':'Frost Ring'") && content.includes("'终局第三相 · 深渊心爆':'Finale Phase III · Abyss Heart Nova'"), 'guardian/finale title localization missing');
assert(content.includes('Heart Nova misses: you created distance at the last moment.'), 'guardian outcome localization missing');
assert(content.includes('Lord of the Final Abyss enters Phase III'), 'finale phase feedback localization missing');
assert(content.includes('let out=src;') && content.includes('return replaceNames(out);'), 'sentence grammar must translate before entity names');
assert(!/\.name\s*=\s*translateEn|\.name\s*=\s*nameEn/.test(content), 'content localization must not mutate saved/gameplay names');

// v1.2.1 repairs the high-frequency mixed-log/slot remnants seen in human play.
assert(hotfix.includes('repairMixedEnglish'), 'mixed English repair layer missing');
assert(hotfix.includes('你Gear了') && hotfix.includes('击中你') && hotfix.includes('你击中'), 'observed mixed-log repair cases missing');
assert(hotfix.includes('syncEmptyEquipmentSlots'), 'empty equipment slot localization follower missing');
assert(hotfix.includes('syncStandingHint'), 'standing hint localization follower missing');

// Core controls + balance are synchronous; late bootstrap owns presentation/accessibility followers only.
const desktopPos = html.indexOf('<script src="desktop-controls.js"></script>');
const controlsPos = html.indexOf('<script src="combat-controls.js"></script>');
const challengePos = html.indexOf('<script src="challenge-pressure.js"></script>');
const bootstrapPos = html.indexOf('<script src="runtime-bootstrap.js"></script>');
assert(desktopPos >= 0 && controlsPos > desktopPos && challengePos > controlsPos && bootstrapPos > challengePos,
  'production order desktop -> combat controls -> challenge pressure -> UX bootstrap broken');
assert(!loader.includes("'combat-controls.js'") && !loader.includes("'challenge-pressure.js'"), 'late UX bootstrap must not own core input or balance');
assert(loader.includes('window.__DE_PRODUCTION_UX_BOOTSTRAP'), 'production UX bootstrap owner missing');
const i18nPos = loader.indexOf("'i18n.js'");
const runtimePos = loader.indexOf("'i18n-runtime.js'");
const contentPos = loader.indexOf("'i18n-content.js'");
const hotfixPos = loader.indexOf("'ux-hotfix-v121.js'");
const hintPos = loader.indexOf("'combat-hint-polish.js'");
const audioPos = loader.indexOf("'audio-director.js'");
const mobilePos = loader.indexOf("'mobile-ux.js'");
assert(i18nPos >= 0 && runtimePos > i18nPos && contentPos > runtimePos && hotfixPos > contentPos && hintPos > hotfixPos && audioPos > hintPos && mobilePos > audioPos,
  'production UX chain i18n -> runtime -> content -> stability -> hint -> audio -> mobile broken');
assert(!shop.includes('loadProductionUx') && !shop.includes("loadScript('i18n.js'"), 'optional shop art must not own production UX boot');
for (const f of ['runtime-bootstrap.js','challenge-pressure.js','i18n.js','i18n-runtime.js','i18n-content.js','ux-hotfix-v121.js','combat-controls.js','combat-hint-polish.js','audio-director.js','mobile-ux.js']) {
  assert(release.includes(f), `release manifest missing ${f}`);
}

console.log('i18n_challenge_v1=PASS');
