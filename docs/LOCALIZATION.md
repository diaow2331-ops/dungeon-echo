# Dungeon Echo Localization Contract

Dungeon Echo supports `zh-CN` and `en` through **two fixed production entries on the same origin**:

- Chinese: `/dungeon-echo/`
- English: `/dungeon-echo/en/`

The two routes share gameplay code, runtime followers, assets and browser save namespaces. Localization must never create a second gameplay product or a language-specific save.

## Goals

- A first-time English player can understand the title screen, controls, class choice, HUD, onboarding, sound settings, combat feedback, town loop and end-state screens without knowing Chinese.
- Chinese remains fully supported as its own fixed source route.
- Legacy `?lang=en`, `?lang=zh` and `?lang=zh-CN` links remain usable through route redirects.
- The title language selector navigates between fixed routes and reloads the page.
- Language selection never changes gameplay state, RNG, saves, item identity or combat balance.
- Production contains no generic translation-after-render stack, localization polling or DOM tree observer.

## Ownership

### Fixed HTML entries

`index.html` owns the Chinese static shell. `en/index.html` owns the English static shell and uses `<base href="../">` so both routes resolve the same root assets.

The synchronous gameplay script list must stay identical between both files.

### `fixed-locale-entry-v130.js`

Owns:

- route identity;
- the title-screen language selector;
- navigation between `/` and `/en/`;
- compatibility redirects from legacy `?lang=` URLs;
- the legacy presentation preference key `de-language-v1`.

It must not read, write, fork or clear gameplay save namespaces.

### `locale-data-v134.js`

Owns route-aware display catalogs and stable identity helpers for:

- rarity;
- class;
- equipment slots;
- affixes;
- equipment base names;
- mechanic/refinement labels;
- monsters, world objects and themes.

Canonical saved names may remain as migration fallback, but display rendering should prefer stable language-neutral IDs where available.

### `core-locale-data-v139.js`

Localizes core class/achievement display data once after `game.js` boots. It does not observe DOM or poll state.

### `stable-item-id-migration-v150.js`

Adds language-neutral item identity such as `baseId`, `rarityId` and `slotId` to compatible runtime/save objects without renaming stored items or changing save keys.

### `core-screen-owner-v153.js`

Owns only the remaining exact dynamic English screens still emitted Chinese-first by legacy core code:

- title/save summary;
- class selection;
- pause copy;
- death/victory overlay;
- dungeon shop;
- town dynamic bag/stash/status rows.

It follows real input/page events and owns no `MutationObserver`, `setInterval`, permanent RAF or generic tree translation.

### `town-canvas-locale-v153.js`

Owns text written by the two legacy town Canvas sinks only:

- `town-scene`;
- `wheel-canvas`.

It must bind those concrete contexts only. It must not patch `CanvasRenderingContext2D.prototype`, scan arbitrary canvases, mutate stored item names or create its own animation loop.

### Feature modules

New or migrated feature modules should derive language from the fixed route (`data-de-locale`) and render their own copy directly. Examples include town, commerce, forge, onboarding, help, expedition record, progression and guardian/finale presentation.

Do not reintroduce a central live translation dictionary simply to avoid a small route-aware render branch.

## Retired production localization layers

The following files are historical artifacts and must not return to `runtime-bootstrap.js` or `ops/release/static-files.txt`:

- `i18n.js`
- `i18n-runtime.js`
- `i18n-content.js`
- `ux-hotfix-v121.js`
- `locale-event-owner-v130.js`
- `locale-runtime-v122.js`
- `locale-completeness-v128.js`

Tests or release notes may reference them as history, but production must not depend on them.

## Never translate identity/state fields

The following are stable program identities and must remain language-neutral:

- class IDs: `warrior`, `ranger`, `mage`, `assassin`;
- equipment slot IDs: `weapon`, `armor`, `helmet`, `boots`, `ring`, `amulet`;
- equipment base/rarity/refinement/mechanic IDs;
- item icon IDs;
- monster sprite/archetype IDs;
- talent IDs;
- skill IDs;
- save keys / save schema fields;
- profile IDs;
- test markers and release markers.

Translate the displayed label, never the stored identity.

## Save compatibility

Both routes share the same origin and therefore the same gameplay storage:

- `de-run-v6`;
- `de-greedy-meta-v1`;
- `de-town-wheel-state-v1`;
- all other gameplay/meta namespaces.

`de-language-v1` is presentation preference only. It must never become part of run validation, meta identity, equipment identity or progression logic.

Stable item migration is additive. An old compatible save without stable IDs must still load; a newly migrated item must remain valid when switching routes.

## English writing style

- Prefer concise game UI English over literal translation.
- `回城` → `Return`.
- `破甲` → `Armor Break`.
- Keep class identity consistent: `战士` Warrior, `游侠` Ranger, `秘术师` Arcanist, `刺客` Assassin.
- Keep `Dungeon Echo` as the English product name.
- Use `Floor 100`, `ATK`, `DEF`, `Crit`, `CD`, `Mana` consistently.

## Regression expectations

Localization checks should verify:

1. Chinese and English entries expose fixed route markers and the same synchronous gameplay script graph.
2. English static HTML contains no accidental CJK presentation copy.
3. Legacy `?lang=` URLs redirect onto the fixed paths.
4. The title selector navigates between fixed routes rather than translating live DOM.
5. Gameplay/save keys remain shared and language-neutral.
6. The production runtime and release manifest contain none of the retired translation-after-render layers.
7. `core-screen-owner-v153.js` and `town-canvas-locale-v153.js` own no observer/polling/generic tree translation.
8. Town Canvas localization is limited to the two exact contexts.
9. PC, gamepad and mobile controls keep the same gameplay actions in both languages.
10. English strings do not overflow critical HUD/touch buttons.
11. Repeated Return Scroll T×2 behavior remains responsive in a real browser.
12. A representative full English run does not leak visible Chinese from dynamic sinks.

Static/source tests can guard architecture. Real-browser verification is still required before claiming full-session presentation or the repeated Return Scroll freeze path is proven fixed.