from pathlib import Path
import json

ROOT = Path('.')

def read(rel):
    return (ROOT / rel).read_text(encoding='utf-8')

def write(rel, text):
    (ROOT / rel).write_text(text, encoding='utf-8')

def replace_once(text, old, new, rel):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{rel}: expected exactly one match, found {count}: {old[:100]!r}')
    return text.replace(old, new, 1)

updates = {}

# 1) Promote only the critical-damage multiplier responsibility.
rel = 'game/domain/combat/combat-rules-v130.js'
s = read(rel)
s = replace_once(s, '/* Dungeon Echo staged combat rules v1.3.0.', '/* Dungeon Echo production combat rules v1.3.0.', rel)
s = replace_once(s,
    ' * defense/combat-pressure work. This library owns NO production authority yet.\n *\n * Boundary rule:',
    ' * defense/combat-pressure work. This library owns only the canonical critical-damage\n * multiplier in production; all other helpers remain dormant pure exports.\n *\n * Boundary rule:', rel)
s = replace_once(s,
    "    version: 'v1.3.0-staged',\n    authority: 'none',\n    sources: Object.freeze([\n      'game/core/game.js',\n      'archive/quarantine-v130/gameplay/combat/defense-system.js',\n      'archive/quarantine-v130/gameplay/combat/combat-pressure.js',\n    ]),",
    "    version: 'v1.3.0-production',\n    authority: 'critical-damage-multiplier',\n    sources: Object.freeze([\n      'game/core/game.js',\n    ]),", rel)
updates[rel] = s

# 2) Core fail-closed binding + exact formula delegation.
rel = 'game/core/game.js'
s = read(rel)
old = "const pKillHeal = () => (player.regenBase || 0) + eqStat('regen');\nconst pCritMul  = () => 1.8 + (player.critPower || 0) / 100;"
new = "const pKillHeal = () => (player.regenBase || 0) + eqStat('regen');\nconst COMBAT_RULES = typeof window !== 'undefined' ? window.DE_COMBAT_RULES_V130 : null;\nif (!COMBAT_RULES || COMBAT_RULES.authority !== 'critical-damage-multiplier')\n  throw new Error('Dungeon Echo critical-damage-multiplier authority missing');\nconst pCritMul  = () => COMBAT_RULES.criticalMultiplier(player.critPower || 0);"
s = replace_once(s, old, new, rel)
updates[rel] = s

# 3-4) Production entries: progression -> combat -> core.
for rel in ['index.html', 'en/index.html']:
    s = read(rel)
    old = '  <script src="game/domain/progression/progression-rules-v130.js?v=169"></script>\n  <script src="game/core/game.js?v=169"></script>'
    new = '  <script src="game/domain/progression/progression-rules-v130.js?v=169"></script>\n  <script src="game/domain/combat/combat-rules-v130.js?v=169"></script>\n  <script src="game/core/game.js?v=169"></script>'
    s = replace_once(s, old, new, rel)
    updates[rel] = s

# 5) Release allowlist.
rel = 'ops/release/static-files.txt'
s = read(rel)
s = replace_once(s,
    'game/domain/progression/progression-rules-v130.js\ngame/core/game.js',
    'game/domain/progression/progression-rules-v130.js\ngame/domain/combat/combat-rules-v130.js\ngame/core/game.js', rel)
updates[rel] = s

# 6) Machine authority map.
rel = 'docs/authority-map-v130.json'
data = json.loads(read(rel))
if 'criticalDamageMultiplier' in data['authorities']:
    raise SystemExit(f'{rel}: criticalDamageMultiplier already exists')
if data.get('stagedPureLibraries', {}).get('combatRules') != 'game/domain/combat/combat-rules-v130.js':
    raise SystemExit(f'{rel}: staged combatRules entry missing/unexpected')
data['authorities']['criticalDamageMultiplier'] = 'game/domain/combat/combat-rules-v130.js'
del data['stagedPureLibraries']['combatRules']
updates[rel] = json.dumps(data, ensure_ascii=False, indent=2) + '\n'

# 7) Prose authority map.
rel = 'docs/ARCHITECTURE_SINGLE_AUTHORITY.md'
s = read(rel)
s = replace_once(s,
    '| Level-up arithmetic | `game/domain/progression/progression-rules-v130.js` | calculate XP threshold, level deltas and talent-due classification | mutate XP/player state, open talent UI, enforce caps/clamps or activate skill-evolution milestones |\n| Dungeon + town Canvas rendering |',
    '| Level-up arithmetic | `game/domain/progression/progression-rules-v130.js` | calculate XP threshold, level deltas and talent-due classification | mutate XP/player state, open talent UI, enforce caps/clamps or activate skill-evolution milestones |\n| Critical-damage multiplier | `game/domain/combat/combat-rules-v130.js` | calculate the canonical critical damage multiplier from caller-supplied crit power | roll critical hits, mutate actors, sequence attacks, or own other combat/defense/healing arithmetic |\n| Dungeon + town Canvas rendering |', rel)
s = replace_once(s,
    'The currently staged pure libraries are registered in `docs/authority-map-v130.json` and include town and combat rules. Content classification, equipment stat scoring, equipment transaction pricing and level-up arithmetic have completed their atomic authority transfers and are now active production.',
    'The currently staged pure libraries are registered in `docs/authority-map-v130.json` and currently include town rules only. Content classification, equipment stat scoring, equipment transaction pricing, level-up arithmetic and the critical-damage multiplier have completed their atomic authority transfers and are now active production.', rel)
s = replace_once(s,
    '- combat performs deterministic math from supplied values only.',
    '- combat currently owns only the canonical critical-damage multiplier; defense, grievous/healing, incoming/outgoing damage, thorns and kill-heal helpers remain dormant pure exports.', rel)
updates[rel] = s

# 8) Combat rule contract: production authority, shipped once, still pure.
rel = 'test/combat-rules-v130.cjs'
s = read(rel)
s = replace_once(s, "assert.equal(rules.authority, 'none');", "assert.equal(rules.authority, 'critical-damage-multiplier');", rel)
s = replace_once(s, "assert.equal(rules.version, 'v1.3.0-staged');", "assert.equal(rules.version, 'v1.3.0-production');", rel)
s = replace_once(s,
    "assert(!/DE_TEST|addEventListener|getContext\\s*\\(|localStorage|sessionStorage|document\\b|fetch\\s*\\(|Math\\.random/.test(executableSource), 'staged combat rules must stay pure, deterministic and disconnected');",
    "assert(!/DE_TEST|addEventListener|getContext\\s*\\(|localStorage|sessionStorage|document\\b|fetch\\s*\\(|Math\\.random/.test(executableSource), 'production combat rules must stay pure and deterministic');", rel)
s = replace_once(s,
    "assert(!manifest.includes(rel), 'staged combat rules must not enter release before atomic authority transfer');\nfor (const entry of ['index.html', 'en/index.html']) {\n  const html = fs.readFileSync(path.join(root, entry), 'utf8');\n  assert(!html.includes(rel), `${entry}: staged combat rules must not be loaded in production`);\n}",
    "assert(manifest.includes(rel), 'production combat rules must ship exactly once');\nassert.equal(manifest.filter(x => x === rel).length, 1, 'combat rules duplicated in release allowlist');\nfor (const entry of ['index.html', 'en/index.html']) {\n  const html = fs.readFileSync(path.join(root, entry), 'utf8');\n  assert.equal((html.match(/game\\/domain\\/combat\\/combat-rules-v130\\.js\\?v=169/g) || []).length, 1, `${entry}: combat rules must load exactly once`);\n  assert(html.indexOf('game/domain/combat/combat-rules-v130.js?v=169') < html.indexOf('game/core/game.js?v=169'), `${entry}: combat authority must load before core`);\n}", rel)
updates[rel] = s

# 9) Entry contract.
rel = 'test/entry-authority-v130.cjs'
s = read(rel)
s = replace_once(s,
    "  'game/domain/progression/progression-rules-v130.js?v=169',\n  'game/core/game.js?v=169',",
    "  'game/domain/progression/progression-rules-v130.js?v=169',\n  'game/domain/combat/combat-rules-v130.js?v=169',\n  'game/core/game.js?v=169',", rel)
updates[rel] = s

# 10) Single-authority contract.
rel = 'test/single-authority-v130.cjs'
s = read(rel)
s = replace_once(s,
    "assert.equal(authority.authorities.levelUpArithmetic, 'game/domain/progression/progression-rules-v130.js');",
    "assert.equal(authority.authorities.levelUpArithmetic, 'game/domain/progression/progression-rules-v130.js');\nassert.equal(authority.authorities.criticalDamageMultiplier, 'game/domain/combat/combat-rules-v130.js');", rel)
s = replace_once(s,
    "for (const dormant of ['progressionCaps','clampGrowthSnapshot','reachedEvolutionMilestones','nextEvolutionMilestone','nextTalentLevel']) assert(!game.includes(`PROGRESSION_RULES.${dormant}(`), `core unexpectedly adopted dormant progression helper ${dormant}`);",
    "for (const dormant of ['progressionCaps','clampGrowthSnapshot','reachedEvolutionMilestones','nextEvolutionMilestone','nextTalentLevel']) assert(!game.includes(`PROGRESSION_RULES.${dormant}(`), `core unexpectedly adopted dormant progression helper ${dormant}`);\nassert(!game.includes(\"const pCritMul  = () => 1.8 + (player.critPower || 0) / 100;\"), 'core still duplicates critical multiplier arithmetic');\nassert(game.includes(\"const pCritMul  = () => COMBAT_RULES.criticalMultiplier(player.critPower || 0);\"), 'core must delegate critical multiplier');\nfor (const dormant of ['warriorDamageReduction','totalDefense','grievousHealMultiplier','outgoingHitDamage','incomingMeleeDamage','incomingRangedDamage','thornsDamage','killHeal']) assert(!game.includes(`COMBAT_RULES.${dormant}(`), `core unexpectedly adopted dormant combat helper ${dormant}`);", rel)
s = replace_once(s,
    '  "const PROGRESSION_RULES = typeof window !== \'undefined\' ? window.DE_PROGRESSION_RULES_V130 : null",\n  "document.addEventListener(\'keydown\'",',
    '  "const PROGRESSION_RULES = typeof window !== \'undefined\' ? window.DE_PROGRESSION_RULES_V130 : null",\n  "const COMBAT_RULES = typeof window !== \'undefined\' ? window.DE_COMBAT_RULES_V130 : null",\n  "document.addEventListener(\'keydown\'",', rel)
s = replace_once(s,
    "  'game/domain/economy/economy-rules-v130.js',\n  'game/domain/progression/progression-rules-v130.js',\n  'art/hero-atlas-v11.png',",
    "  'game/domain/economy/economy-rules-v130.js',\n  'game/domain/progression/progression-rules-v130.js',\n  'game/domain/combat/combat-rules-v130.js',\n  'art/hero-atlas-v11.png',", rel)
updates[rel] = s

# Preflight: do not write until every target transformation succeeded.
for rel, text in updates.items():
    if not text:
        raise SystemExit(f'{rel}: empty transformed content')

for rel, text in updates.items():
    write(rel, text)

print(f'combat_critical_cutover=PASS files={len(updates)}')
