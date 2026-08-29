from pathlib import Path
import json

changed = []
def read(p): return Path(p).read_text()
def write(p, s):
    Path(p).write_text(s)
    changed.append(p)
def one(s, before, after, label):
    n = s.count(before)
    if n != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {n}')
    return s.replace(before, after, 1)

# Economy module: production authority is deliberately narrow; other helpers remain dormant exports.
p = 'game/domain/economy/economy-rules-v130.js'
s = read(p)
s = one(s,
'''/* Dungeon Echo staged economy rules v1.3.0.
 *
 * Pure calculations extracted from the canonical core and quarantined commerce work.
 * This library owns NO production authority yet and is intentionally not shipped.
 *
 * Boundary rule: inventory/equipment decides an item's value score; economy only turns
 * that value into prices/costs. No duplicated equipment scoring lives here.
 */''',
'''/* Dungeon Echo production equipment-transaction-pricing authority v1.3.0.
 *
 * Sole production authority for canonical forge/sell price quotes from an item-value input.
 * Town supply, dungeon-heal, quick-dive and wheel helpers remain dormant pure exports and are
 * not production decisions without separate atomic authority transfers.
 *
 * Boundary rule: no item valuation, gold/stock mutation, transaction commit, RNG, UI or storage.
 */''', 'economy header')
s = one(s, "    version:'v1.3.0-staged',\n    authority:'none',", "    version:'v1.3.0-production',\n    authority:'equipment-transaction-pricing',", 'economy authority')
s = one(s,
"    sources:Object.freeze([\n      'game/core/game.js',\n      'archive/quarantine-v130/gameplay/economy/commerce-system.js',\n    ]),",
"    sources:Object.freeze(['game/core/game.js']),", 'economy provenance')
write(p, s)

# Core relinquishes exactly the two formulas and keeps value calculation + transaction mutation.
p = 'game/core/game.js'
s = read(p)
s = one(s,
"const forgeCost = it => 30 + Math.round(itemValueScore(it) * 1.2) * ((it.forge || 0) + 1);\nconst sellPrice = it => Math.max(4, Math.round(itemValueScore(it) * .45) + (it.forge || 0) * 15);",
"const ECONOMY_RULES = typeof window !== 'undefined' ? window.DE_ECONOMY_RULES_V130 : null;\nif (!ECONOMY_RULES || ECONOMY_RULES.authority !== 'equipment-transaction-pricing')\n  throw new Error('Dungeon Echo equipment-transaction-pricing authority missing');\nconst forgeCost = it => ECONOMY_RULES.forgeCost(itemValueScore(it), it.forge || 0);\nconst sellPrice = it => ECONOMY_RULES.sellPrice(itemValueScore(it), it.forge || 0);",
'core equipment transaction pricing delegation')
write(p, s)

# Production entries and release boundary.
for p in ['index.html', 'en/index.html']:
    s = read(p)
    s = one(s,
'<script src="game/domain/inventory/equipment-rules-v130.js?v=169"></script>\n<script src="game/core/game.js?v=169"></script>',
'<script src="game/domain/inventory/equipment-rules-v130.js?v=169"></script>\n<script src="game/domain/economy/economy-rules-v130.js?v=169"></script>\n<script src="game/core/game.js?v=169"></script>',
 f'{p} economy script order')
    write(p, s)
p = 'ops/release/static-files.txt'
s = read(p)
s = one(s,
'game/domain/inventory/equipment-rules-v130.js\ngame/core/game.js',
'game/domain/inventory/equipment-rules-v130.js\ngame/domain/economy/economy-rules-v130.js\ngame/core/game.js',
'release economy module')
write(p, s)

# Machine authority map.
p = 'docs/authority-map-v130.json'
m = json.loads(read(p))
if m.get('authorities', {}).get('equipmentTransactionPricing'):
    raise SystemExit('authority map already has equipmentTransactionPricing')
if m.get('stagedPureLibraries', {}).get('economyRules') != 'game/domain/economy/economy-rules-v130.js':
    raise SystemExit('economy staged shelf mismatch')
m['authorities']['equipmentTransactionPricing'] = 'game/domain/economy/economy-rules-v130.js'
del m['stagedPureLibraries']['economyRules']
write(p, json.dumps(m, indent=2) + '\n')

# Prose architecture stays narrow.
p = 'docs/ARCHITECTURE_SINGLE_AUTHORITY.md'
s = read(p)
s = one(s,
'| Equipment stat scoring | `game/domain/inventory/equipment-rules-v130.js` | return the canonical deterministic equipment stat score to core | mutate bag/equipment/player state, consume RNG, generate loot, alter class-fit/rarity/depth rules, or price economy transactions |',
'| Equipment stat scoring | `game/domain/inventory/equipment-rules-v130.js` | return the canonical deterministic equipment stat score to core | mutate bag/equipment/player state, consume RNG, generate loot, alter class-fit/rarity/depth rules, or price economy transactions |\n| Equipment transaction pricing | `game/domain/economy/economy-rules-v130.js` | quote canonical forge/sell prices from supplied item value + forge level | value items, mutate gold/stock/items, commit transactions, or own town/heal/quick-dive/wheel pricing |',
'architecture economy row')
s = one(s,
'The currently staged pure libraries are registered in `docs/authority-map-v130.json` and include economy, progression, town and combat rules. Content classification and equipment stat scoring have completed their atomic authority transfers and are now active production. Remaining staged libraries must stay absent from the release allowlist and both production entries until their own transfer is deliberately performed.',
'The currently staged pure libraries are registered in `docs/authority-map-v130.json` and include progression, town and combat rules. Content classification, equipment stat scoring and equipment transaction pricing have completed their atomic authority transfers and are now active production. Remaining staged libraries must stay absent from the release allowlist and both production entries until their own transfer is deliberately performed.',
'architecture staged status')
s = one(s,
'- economy converts value/depth inputs into prices and costs;',
'- economy currently owns only canonical forge/sell pricing; town/heal/quick-dive/wheel helpers remain dormant until separately transferred;',
'architecture economy boundary')
write(p, s)

# Economy contract becomes production-aware but keeps dormant helpers tested as pure helpers.
p = 'test/economy-rules-v130.cjs'
s = read(p)
s = one(s,
"assert.equal(rules.authority, 'none');\nassert.equal(rules.version, 'v1.3.0-staged');\nassert(!/DE_TEST|addEventListener|getContext\\s*\\(|localStorage|sessionStorage|document\\b/.test(executableSource), 'staged economy rules must stay pure and disconnected');",
"assert.equal(rules.authority, 'equipment-transaction-pricing');\nassert.equal(rules.version, 'v1.3.0-production');\nassert.deepEqual([...rules.sources], ['game/core/game.js']);\nassert(!/DE_TEST|addEventListener|getContext\\s*\\(|localStorage|sessionStorage|document\\b|Math\\.random/.test(executableSource), 'production economy pricing rules must stay pure and deterministic');",
'economy test authority')
s = one(s,
"assert(!manifest.includes(rel), 'staged economy rules must not enter release before atomic authority transfer');\nfor (const entry of ['index.html', 'en/index.html']) {\n  const html = fs.readFileSync(path.join(root, entry), 'utf8');\n  assert(!html.includes(rel), `${entry}: staged economy rules must not be loaded in production`);\n}",
"assert(manifest.includes(rel), 'production economy pricing rules must ship');\nfor (const entry of ['index.html', 'en/index.html']) {\n  const html = fs.readFileSync(path.join(root, entry), 'utf8');\n  assert(html.includes(`${rel}?v=169`), `${entry}: economy pricing authority must be loaded`);\n  assert(html.indexOf(`${rel}?v=169`) < html.indexOf('game/core/game.js?v=169'), `${entry}: economy pricing authority must load before core`);\n}",
'economy test production graph')
write(p, s)

# Entry order.
p = 'test/entry-authority-v130.cjs'
s = read(p)
s = one(s,
"  'game/domain/inventory/equipment-rules-v130.js?v=169',\n  'game/core/game.js?v=169',",
"  'game/domain/inventory/equipment-rules-v130.js?v=169',\n  'game/domain/economy/economy-rules-v130.js?v=169',\n  'game/core/game.js?v=169',",
'entry economy script')
write(p, s)

# Single-authority contract: reject old formulas and forbid dormant economy helper adoption.
p = 'test/single-authority-v130.cjs'
s = read(p)
s = one(s,
"assert.equal(authority.authorities.equipmentStatScoring, 'game/domain/inventory/equipment-rules-v130.js');\nassert.equal(authority.authorities.canvasRendering, 'game/core/game.js');",
"assert.equal(authority.authorities.equipmentStatScoring, 'game/domain/inventory/equipment-rules-v130.js');\nassert.equal(authority.authorities.equipmentTransactionPricing, 'game/domain/economy/economy-rules-v130.js');\nassert.equal(authority.authorities.canvasRendering, 'game/core/game.js');",
'single authority economy owner')
s = one(s,
"assert(!game.includes('Math.round((stats.atk || 0) * 3'), 'core still duplicates inventory stat-score formula');",
"assert(!game.includes('Math.round((stats.atk || 0) * 3'), 'core still duplicates inventory stat-score formula');\nassert(!game.includes('30 + Math.round(itemValueScore(it) * 1.2)'), 'core still duplicates forge pricing');\nassert(!game.includes('Math.max(4, Math.round(itemValueScore(it) * .45)'), 'core still duplicates sell pricing');\nassert(game.includes('const forgeCost = it => ECONOMY_RULES.forgeCost(itemValueScore(it), it.forge || 0);'), 'core must delegate forge pricing');\nassert(game.includes('const sellPrice = it => ECONOMY_RULES.sellPrice(itemValueScore(it), it.forge || 0);'), 'core must delegate sell pricing');\nfor (const dormant of ['townTier','townPriceScale','townSupplyPrice','townSupplyStock','dungeonTier','dungeonHealPrice','quickDiveCost','wheelSpinCost','wheelResetCost']) assert(!game.includes(`ECONOMY_RULES.${dormant}(`), `core unexpectedly adopted dormant economy helper ${dormant}`);",
'single authority economy duplicate/adoption guards')
s = one(s,
"  \"const INVENTORY_RULES = typeof window !== 'undefined' ? window.DE_INVENTORY_RULES_V130 : null\",\n  \"document.addEventListener('keydown'\",",
"  \"const INVENTORY_RULES = typeof window !== 'undefined' ? window.DE_INVENTORY_RULES_V130 : null\",\n  \"const ECONOMY_RULES = typeof window !== 'undefined' ? window.DE_ECONOMY_RULES_V130 : null\",\n  \"document.addEventListener('keydown'\",",
'single authority economy binding token')
s = one(s,
"  'game/domain/content/content-rules-v130.js','game/domain/inventory/equipment-rules-v130.js',\n  'art/hero-atlas-v11.png'",
"  'game/domain/content/content-rules-v130.js','game/domain/inventory/equipment-rules-v130.js',\n  'game/domain/economy/economy-rules-v130.js',\n  'art/hero-atlas-v11.png'",
'single authority economy canonical source')
write(p, s)

print(f'equipment_transaction_cutover=PASS changed={len(changed)}')
for p in changed: print(f'changed={p}')
