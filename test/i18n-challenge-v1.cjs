'use strict';
const fs = require('fs');
const assert = require('assert');

const pressure = fs.readFileSync('challenge-pressure.js','utf8');
const i18n = fs.readFileSync('i18n.js','utf8');
const runtime = fs.readFileSync('i18n-runtime.js','utf8');
const loader = fs.readFileSync('equipment-shop-ui.js','utf8');
const tutorial = fs.readFileSync('combat-hint-polish.js','utf8');
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

// Bilingual shell and shareable English route.
assert(i18n.includes("new Set(['zh-CN','en'])"), 'zh/en language set missing');
assert(i18n.includes("url.searchParams.get('lang')"), 'shareable ?lang= route missing');
assert(i18n.includes("localStorage.getItem(STORAGE_KEY)"), 'language persistence missing');
assert(i18n.includes("browser.startsWith('zh') ? 'zh-CN' : 'en'"), 'browser-language default missing');
assert(i18n.includes("setLang(lang==='en'?'zh-CN':'en'"), 'manual language toggle missing');
assert(i18n.includes("window.dispatchEvent(new CustomEvent('de:languagechange'"), 'language-change contract missing');
assert(i18n.includes("'game.name':'Dungeon Echo'"), 'English shell dictionary missing');
for (const cls of ['Warrior','Ranger','Arcanist','Assassin']) assert(i18n.includes(cls), `English class missing: ${cls}`);
assert(i18n.includes("'audio.music':'Music'") && i18n.includes("'audio.sfx':'SFX'"), 'audio localization missing');
assert(i18n.includes("'tutorial.guardian':'Armor Break"), 'guardian tutorial localization missing');
assert(tutorial.includes("tr('tutorial.attack.desktop'"), 'tutorial must consume central i18n API');
assert(tutorial.includes("de:languagechange"), 'active tutorial must refresh on language switch');

// Dynamic legacy-core text follows the central language owner.
assert(runtime.includes('syncClassCards'), 'class-card runtime localization missing');
assert(runtime.includes('syncCurrentClass'), 'current class HUD localization missing');
assert(runtime.includes('HP ${c.hpBase} · ATK ${c.atkBase}'), 'English class stat card missing');
assert(runtime.includes("Armor-break special · Hit ignores armor"), 'guardian warning translation missing');
assert(runtime.includes("Not enough mana:"), 'mana feedback translation missing');
assert(runtime.includes("de:languagechange"), 'dynamic runtime language refresh missing');

// Production order and release packaging.
const challengePos = loader.indexOf("loadScript('challenge-pressure.js'");
const i18nPos = loader.indexOf("loadScript('i18n.js'");
const runtimePos = loader.indexOf("loadScript('i18n-runtime.js'");
const controlsPos = loader.indexOf("loadScript('combat-controls.js'");
assert(challengePos >= 0 && i18nPos > challengePos && runtimePos > i18nPos && controlsPos > runtimePos, 'production order challenge -> i18n -> runtime -> controls broken');
for (const f of ['challenge-pressure.js','i18n.js','i18n-runtime.js']) assert(release.includes(f), `release manifest missing ${f}`);

console.log('i18n_challenge_v1=PASS');
