'use strict';
const fs = require('fs');
const assert = require('assert');

const hotfix = fs.readFileSync('ux-hotfix-v121.js','utf8');
const runtime = fs.readFileSync('runtime-bootstrap.js','utf8');
const manifest = fs.readFileSync('ops/release/static-files.txt','utf8').split(/\r?\n/).filter(Boolean);

assert(hotfix.includes("#de-lang-toggle{display:none!important}"), 'legacy in-run language toggle must be hidden');
assert(hotfix.includes("id = 'de-title-language'") || hotfix.includes("box.id = 'de-title-language'"), 'title-screen language picker missing');
assert(hotfix.includes("location.replace(target.href)"), 'language selection must reload instead of hot-switching the live run');
assert(hotfix.includes("L.setLang = navigateLanguage"), 'public language setter must use safe reload semantics');
assert(hotfix.includes("localStorage.setItem(STORAGE_KEY, lang)"), 'language preference persistence missing');
assert(hotfix.includes("searchParams.set('lang'"), 'language URL routing missing');

assert(hotfix.includes("你Gear了"), 'mixed equipment-log repair missing');
assert(hotfix.includes("击中你"), 'mixed incoming-combat-log repair missing');
assert(hotfix.includes("你击中"), 'mixed outgoing-combat-log repair missing');
assert(hotfix.includes("枚\\s*Gold") || hotfix.includes("枚\\s*金币"), 'mixed Gold pickup repair missing');
assert(hotfix.includes("syncEmptyEquipmentSlots"), 'empty equipment-slot language consistency missing');
assert(hotfix.includes("syncStandingHint"), 'standing hint language consistency missing');

assert(hotfix.includes("hint.mark('skill')"), 'real successful skill feedback must complete tutorial skill step');
assert(hotfix.includes('skillFeedbackSeen'), 'routine repeated skill feedback suppression missing');
assert(hotfix.includes("el.hidden = true"), 'repeated routine prompt suppression missing');

const iContent = runtime.indexOf("['i18n-content.js'");
const iHotfix = runtime.indexOf("['ux-hotfix-v121.js'");
const iHint = runtime.indexOf("['combat-hint-polish.js'");
assert(iContent >= 0 && iHotfix > iContent && iHint > iHotfix, 'UX hotfix must load after content localization and before tutorial/audio/mobile followers');
assert(manifest.includes('ux-hotfix-v121.js'), 'release manifest missing UX hotfix');

console.log('ux_hotfix_v121=PASS');
