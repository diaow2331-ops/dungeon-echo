from pathlib import Path
import json

changed=[]
def read(p): return Path(p).read_text()
def write(p,s): Path(p).write_text(s); changed.append(p)
def one(s,b,a,label):
    n=s.count(b)
    if n!=1: raise SystemExit(f'{label}: expected exactly one match, found {n}')
    return s.replace(b,a,1)

p='game/domain/progression/progression-rules-v130.js'; s=read(p)
s=one(s,
'''/* Dungeon Echo staged progression rules v1.3.0.
 *
 * Pure progression calculations extracted from the canonical core and quarantined
 * progression work. This library owns NO production authority yet and is not shipped.
 *
 * Boundary rule: progression may calculate thresholds, caps and milestone metadata;
 * it must not mutate player/meta state, listen to input, write storage or touch the DOM.
 */''',
'''/* Dungeon Echo production level-up-arithmetic authority v1.3.0.
 *
 * Sole production authority for canonical XP thresholds, per-level HP/ATK/heal deltas and
 * talent-due classification. Caps, growth clamps, next-talent metadata and skill-evolution
 * milestones remain dormant pure exports until separately transferred.
 *
 * Boundary rule: no XP/player/meta mutation, talent-screen control, input, DOM or storage.
 */''','progression header')
s=one(s,"    version: 'v1.3.0-staged',\n    authority: 'none',","    version: 'v1.3.0-production',\n    authority: 'level-up-arithmetic',",'progression authority')
s=one(s,
"    sources: Object.freeze([\n      'game/core/game.js',\n      'archive/quarantine-v130/gameplay/progression/progression-guard-system.js',\n      'archive/quarantine-v130/gameplay/progression/progression-system.js',\n    ]),",
"    sources: Object.freeze(['game/core/game.js']),",'progression provenance')
write(p,s)

p='game/core/game.js'; s=read(p)
s=one(s,
'''function killMonster(m) {
  const boomHit = m.boom && player.hp > 0 &&''',
'''const PROGRESSION_RULES = typeof window !== 'undefined' ? window.DE_PROGRESSION_RULES_V130 : null;
if (!PROGRESSION_RULES || PROGRESSION_RULES.authority !== 'level-up-arithmetic')
  throw new Error('Dungeon Echo level-up-arithmetic authority missing');
function killMonster(m) {
  const boomHit = m.boom && player.hp > 0 &&''','core progression binding')
s=one(s,
'''  while (player.xp >= player.lvl * 15) {
    player.xp -= player.lvl * 15;
    player.lvl++; player.hpBase += 6; player.atkBase += 1;
    player.hp = Math.min(pMaxHp(), player.hp + 8);
    floater(player, 'LEVEL UP!', '#eda23a');
    burst(player.fx, player.fy, '#eda23a', 16);
    sfx.levelup();
    msg(ui(`你升到了 ${player.lvl} 级！攻击+1，生命上限+6。`, `Level ${player.lvl}! ATK +1, Max HP +6.`), 'gold');
    if (player.lvl % 3 === 0) pendingTalent = true;
  }''',
'''  while (player.xp >= PROGRESSION_RULES.xpThreshold(player.lvl)) {
    player.xp -= PROGRESSION_RULES.xpThreshold(player.lvl);
    const delta = PROGRESSION_RULES.levelUpDelta();
    player.lvl++; player.hpBase += delta.hpBase; player.atkBase += delta.atkBase;
    player.hp = Math.min(pMaxHp(), player.hp + delta.immediateHeal);
    floater(player, 'LEVEL UP!', '#eda23a');
    burst(player.fx, player.fy, '#eda23a', 16);
    sfx.levelup();
    msg(ui(`你升到了 ${player.lvl} 级！攻击+1，生命上限+6。`, `Level ${player.lvl}! ATK +1, Max HP +6.`), 'gold');
    if (PROGRESSION_RULES.talentDue(player.lvl)) pendingTalent = true;
  }''','core level-up delegation')
write(p,s)

for p in ['index.html','en/index.html']:
    s=read(p)
    s=one(s,
'<script src="game/domain/economy/economy-rules-v130.js?v=169"></script>\n<script src="game/core/game.js?v=169"></script>',
'<script src="game/domain/economy/economy-rules-v130.js?v=169"></script>\n<script src="game/domain/progression/progression-rules-v130.js?v=169"></script>\n<script src="game/core/game.js?v=169"></script>',f'{p} progression order')
    write(p,s)
p='ops/release/static-files.txt'; s=read(p)
s=one(s,'game/domain/economy/economy-rules-v130.js\ngame/core/game.js','game/domain/economy/economy-rules-v130.js\ngame/domain/progression/progression-rules-v130.js\ngame/core/game.js','release progression')
write(p,s)

p='docs/authority-map-v130.json'; m=json.loads(read(p))
if m.get('stagedPureLibraries',{}).get('progressionRules')!='game/domain/progression/progression-rules-v130.js': raise SystemExit('progression staged shelf mismatch')
m['authorities']['levelUpArithmetic']='game/domain/progression/progression-rules-v130.js'; del m['stagedPureLibraries']['progressionRules']
write(p,json.dumps(m,indent=2)+'\n')

p='docs/ARCHITECTURE_SINGLE_AUTHORITY.md'; s=read(p)
s=one(s,
'| Equipment transaction pricing | `game/domain/economy/economy-rules-v130.js` | quote canonical forge/sell prices from supplied item value + forge level | value items, mutate gold/stock/items, commit transactions, or own town/heal/quick-dive/wheel pricing |',
'| Equipment transaction pricing | `game/domain/economy/economy-rules-v130.js` | quote canonical forge/sell prices from supplied item value + forge level | value items, mutate gold/stock/items, commit transactions, or own town/heal/quick-dive/wheel pricing |\n| Level-up arithmetic | `game/domain/progression/progression-rules-v130.js` | calculate XP threshold, level deltas and talent-due classification | mutate XP/player state, open talent UI, enforce caps/clamps or activate skill-evolution milestones |','architecture progression row')
s=one(s,
'The currently staged pure libraries are registered in `docs/authority-map-v130.json` and include progression, town and combat rules. Content classification, equipment stat scoring and equipment transaction pricing have completed their atomic authority transfers and are now active production. Remaining staged libraries must stay absent from the release allowlist and both production entries until their own transfer is deliberately performed.',
'The currently staged pure libraries are registered in `docs/authority-map-v130.json` and include town and combat rules. Content classification, equipment stat scoring, equipment transaction pricing and level-up arithmetic have completed their atomic authority transfers and are now active production. Remaining staged libraries must stay absent from the release allowlist and both production entries until their own transfer is deliberately performed.','architecture staged status')
s=one(s,'- progression calculates thresholds, caps and milestones;','- progression currently owns only XP thresholds, level deltas and talent-due classification; caps/clamps/next-talent/skill-evolution helpers remain dormant until separately transferred;','architecture progression boundary')
write(p,s)

p='test/progression-rules-v130.cjs'; s=read(p)
s=one(s,
"assert.equal(rules.authority, 'none');\nassert.equal(rules.version, 'v1.3.0-staged');\nassert(!/DE_TEST|addEventListener|getContext\\s*\\(|localStorage|sessionStorage|document\\b|fetch\\s*\\(/.test(executableSource), 'staged progression rules must stay pure and disconnected');",
"assert.equal(rules.authority, 'level-up-arithmetic');\nassert.equal(rules.version, 'v1.3.0-production');\nassert.deepEqual([...rules.sources], ['game/core/game.js']);\nassert(!/DE_TEST|addEventListener|getContext\\s*\\(|localStorage|sessionStorage|document\\b|fetch\\s*\\(|Math\\.random/.test(executableSource), 'production progression arithmetic must stay pure and deterministic');",'progression test authority')
s=one(s,
"assert(!manifest.includes(rel), 'staged progression rules must not enter release before atomic authority transfer');\nfor (const entry of ['index.html', 'en/index.html']) {\n  const html = fs.readFileSync(path.join(root, entry), 'utf8');\n  assert(!html.includes(rel), `${entry}: staged progression rules must not be loaded in production`);\n}",
"assert(manifest.includes(rel), 'production progression arithmetic must ship');\nfor (const entry of ['index.html', 'en/index.html']) {\n  const html = fs.readFileSync(path.join(root, entry), 'utf8');\n  assert(html.includes(`${rel}?v=169`), `${entry}: progression authority must be loaded`);\n  assert(html.indexOf(`${rel}?v=169`) < html.indexOf('game/core/game.js?v=169'), `${entry}: progression authority must load before core`);\n}",'progression production graph')
write(p,s)

p='test/entry-authority-v130.cjs'; s=read(p)
s=one(s,"  'game/domain/economy/economy-rules-v130.js?v=169',\n  'game/core/game.js?v=169',","  'game/domain/economy/economy-rules-v130.js?v=169',\n  'game/domain/progression/progression-rules-v130.js?v=169',\n  'game/core/game.js?v=169',",'entry progression')
write(p,s)

p='test/single-authority-v130.cjs'; s=read(p)
s=one(s,"assert.equal(authority.authorities.equipmentTransactionPricing, 'game/domain/economy/economy-rules-v130.js');\nassert.equal(authority.authorities.canvasRendering, 'game/core/game.js');","assert.equal(authority.authorities.equipmentTransactionPricing, 'game/domain/economy/economy-rules-v130.js');\nassert.equal(authority.authorities.levelUpArithmetic, 'game/domain/progression/progression-rules-v130.js');\nassert.equal(authority.authorities.canvasRendering, 'game/core/game.js');",'single progression owner')
s=one(s,
"for (const dormant of ['townTier','townPriceScale','townSupplyPrice','townSupplyStock','dungeonTier','dungeonHealPrice','quickDiveCost','wheelSpinCost','wheelResetCost']) assert(!game.includes(`ECONOMY_RULES.${dormant}(`), `core unexpectedly adopted dormant economy helper ${dormant}`);",
"for (const dormant of ['townTier','townPriceScale','townSupplyPrice','townSupplyStock','dungeonTier','dungeonHealPrice','quickDiveCost','wheelSpinCost','wheelResetCost']) assert(!game.includes(`ECONOMY_RULES.${dormant}(`), `core unexpectedly adopted dormant economy helper ${dormant}`);\nassert(!game.includes('while (player.xp >= player.lvl * 15)'), 'core still duplicates XP threshold');\nassert(!game.includes('player.lvl++; player.hpBase += 6; player.atkBase += 1;'), 'core still duplicates level-up deltas');\nassert(!game.includes('if (player.lvl % 3 === 0) pendingTalent = true;'), 'core still duplicates talent-due classification');\nassert(game.includes('PROGRESSION_RULES.xpThreshold(player.lvl)'), 'core must delegate XP threshold');\nassert(game.includes('PROGRESSION_RULES.levelUpDelta()'), 'core must delegate level-up delta');\nassert(game.includes('PROGRESSION_RULES.talentDue(player.lvl)'), 'core must delegate talent due');\nfor (const dormant of ['progressionCaps','clampGrowthSnapshot','reachedEvolutionMilestones','nextEvolutionMilestone','nextTalentLevel']) assert(!game.includes(`PROGRESSION_RULES.${dormant}(`), `core unexpectedly adopted dormant progression helper ${dormant}`);",'single progression guards')
s=one(s,"  \"const ECONOMY_RULES = typeof window !== 'undefined' ? window.DE_ECONOMY_RULES_V130 : null\",\n  \"document.addEventListener('keydown'\",","  \"const ECONOMY_RULES = typeof window !== 'undefined' ? window.DE_ECONOMY_RULES_V130 : null\",\n  \"const PROGRESSION_RULES = typeof window !== 'undefined' ? window.DE_PROGRESSION_RULES_V130 : null\",\n  \"document.addEventListener('keydown'\",",'single progression binding')
s=one(s,"  'game/domain/economy/economy-rules-v130.js',\n  'art/hero-atlas-v11.png'","  'game/domain/economy/economy-rules-v130.js',\n  'game/domain/progression/progression-rules-v130.js',\n  'art/hero-atlas-v11.png'",'single progression canonical')
write(p,s)

print(f'level_up_arithmetic_cutover=PASS changed={len(changed)}')
for p in changed: print(f'changed={p}')
