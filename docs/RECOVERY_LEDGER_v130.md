# Dungeon Echo v1.3.x recovery ledger

This ledger records what may be recovered from pre-v1.3 work and what must stay retired. It complements `MODULE_REINTEGRATION_PLAN_v130.md`: the plan defines how authority moves; this ledger defines what is worth bringing forward.

## v1.3.1 closure

The reviewed recovery sequence is complete in production authority:

- four-class combat FX, detailed town NPCs, dungeon props, loot and deep-monster art are rendered by core;
- conquered-depth town departures, finite tier-scaled market stock and 20/40/60/80 skill evolutions are owned by core;
- the Floor 10→100 guardian learning curve is owned, scheduled, saved and rendered by core;
- the historical wrapper/overlay/storage patterns listed below remain retired.

Future changes require reproducible player evidence from the open human-validation issues rather than another broad recovery pass.

## Recovery rule

Preserve product value, not historical topology.

Old code is evidence and design reference, never an automatic merge source. A recovered feature must enter the current production graph through the existing sole authority, or transfer that responsibility atomically. No overlay Canvas, second writer, second listener, post-render translator, storage shim or monkey patch may return.

## Tier A — preserve / promote first

### Canonical v11 entity and town art

Production assets already admitted:
- `art/hero-atlas-v11.png`
- `art/monster-atlas-v11.png`
- `art/guardian-atlas-v11.png`
- `art/final-boss-v11.png`
- `art/town-backdrop-v11.webp`

Policy: keep these as the visual baseline. Future art upgrades replace/promote asset families directly and are rendered only by the canonical renderer.

### Four-class combat visual language

Reference source: `archive/quarantine-v130/art/code/class-combat-fx-v163.js`.

Valuable ideas:
- Warrior: forward arc / heavy melee language.
- Ranger: directional line / volley language.
- Mage: orb / rune language.
- Assassin: crossed slash / after-image language.

Do not restore the old file. Its separate overlay Canvas and animation loop are retired. Rebuild selected effects inside the sole production Canvas renderer using existing combat/facing state only; presentation must not spend cooldowns, alter RNG, move actors or change combat outcomes.

### Detailed town NPC identity

Reference history: `art: replace town silhouettes with detailed NPC atlas` and `archive/quarantine-v130/art/code/town-art-v160.js`.

Preserve the role-specific NPC / service identity and tier-aware town presentation. Reimplement as data plus canonical-renderer drawing. Do not restore the town overlay runtime.

### Dungeon props, loot and deep-monster asset candidates

Candidate assets preserved in quarantine:
- `archive/quarantine-v130/art/assets/runtime/dungeon-props-atlas-v1.svg`
- `archive/quarantine-v130/art/assets/runtime/loot-atlas-v2.svg`
- `archive/quarantine-v130/art/assets/runtime/monster-deep-atlas-v2.svg`

These are asset candidates, not runtime authorities. Promote only after visual comparison against the v11 baseline and direct integration into the canonical renderer.

## Tier B — recover deliberately after gameplay review

### Town checkpoints and readiness

Reference: `game/domain/town/town-rules-v130.js` and quarantined town gameplay.

Checkpoint helpers and expedition readiness are useful product concepts, but current core behavior does not implement the same policy. Restoring them is a gameplay change, not a refactor. Route through #10 / a focused product issue; define the desired behavior first, then give exactly one owner authority.

### Skill evolution and class growth

Use #4 as the product evidence track. Preserve 20/40/60/80 evolution-route ideas and class identity, but do not layer old skill handlers or key listeners over current J/K + Mana contracts.

### Guardian and floor-100 presentation/mechanics

Use #5 and #7 for human readability/fairness evidence. Historical guardian/final-boss art and mechanic ideas are design references. Visual upgrades may be promoted independently; gameplay mechanics require focused evidence-driven changes.

### Town economy and fortune wheel

Use #10 and #11. Keep finite stock, chapter scaling, risk/reward and one-claim lifecycle ideas where they improve decisions. Do not restore duplicated shop/wheel state machines or UI-owned outcomes.

## Tier C — reference only / rebuild from ideas

- `archive/quarantine-v130/art/code/art-runtime-v2.js`
- `archive/quarantine-v130/art/code/art-runtime-v4.js`
- `archive/quarantine-v130/art/code/visual-polish.js`
- `archive/quarantine-v130/art/code/world-loot-polish-v122.js`
- historical presentation/runtime branches such as `feature/art-runtime-v3-review`

These may contain useful mappings, timing, silhouettes or material ideas. Never reconnect them as production followers. Extract a small deterministic idea into the current owner instead.

## Permanently retired patterns

Do not restore:
- second/overlay Canvas renderers that mask or redraw core entities;
- independent animation loops that infer gameplay by polling `DE_TEST`;
- dynamic equipment-on-body overlay runtime;
- the broken directional hero prototype runtime;
- DOM or Canvas translation-after-render/interception;
- duplicate keyboard/touch combat listeners;
- duplicate gameplay `localStorage` writers or migration shims;
- wrappers/monkey patches around production gameplay functions;
- archive/quarantine files in the release allowlist or runtime script graph.

Historical assets may be copied/promoted after review. Historical runtime topology may not.

## Recovery sequence

1. Lock this ledger and keep the single-authority gate green.
2. Recover presentation value first where gameplay is unchanged: class combat FX language, town NPC identity, props/loot/deep-monster assets.
3. Recover town/checkpoint/skill/guardian mechanics one focused responsibility at a time, tied to #4/#5/#10/#11 evidence.
4. After each promotion, remove or mark the superseded quarantine candidate so the repository has one obvious future path.
5. Raise semantic/cache versions only when the shipped runtime/art payload changes; build immutable release artifacts from exact main.

## Acceptance rule for every recovery PR

A recovery PR must answer:
- What user-visible value is being restored?
- Which historical file/commit is only the reference source?
- Who is the sole production authority after the change?
- Which old runtime path remains retired?
- Is gameplay/state/RNG/save behavior unchanged? If not, which focused product issue owns that change?
- What targeted regression prevents the old duplicate-authority pattern from returning?

The desired direction is additive product quality with subtractive architecture: more useful art and mechanics, fewer runtime owners and fewer historical compatibility layers.
