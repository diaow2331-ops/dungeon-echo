# Dungeon Echo post-v1.3.1 art recovery backlog

The v1.3.1 recovery closeout completed the reviewed single-authority recovery sequence, but it did **not** mean that every historically shipped or staged art improvement had been re-admitted to production.

## Recovered after the v1.3.1 closeout

- v13 weapon and wearable sheets are promoted to production and statically mapped to all 26 equipment icon cells.
- Safe static visual-polish values are restored for the main dungeon canvas and Echo Town without restoring any overlay Canvas or follower runtime.
- The historical four-class × four-state hero action atlas is now a production asset. It is visibly used for class-card action previews and the HUD class identity chip while the newer large class roster art remains intact.
- All 21 historical classic-100 depth palettes/motif identities are restored as a low-opacity atmosphere layer. A DOM-only observer derives the band from the already-rendered HUD floor text; it does not read gameplay APIs or own a Canvas.

## Still missing from the current production art graph

### Hero action atlas — partial recovery

Historical v1.2.12 shipped `hero-action-atlas-v2.svg` with four classes × four states: idle / attack / hurt / skill. The atlas is now admitted to production and exposed in the DOM UI/HUD, but the dungeon Canvas still draws the base hero from `art/hero-atlas-v11.png`.

Remaining requirement: integrate action-state selection directly into the canonical core renderer using its existing transient combat signals. Do not restore the old overlay, polling loop or state-inference runtime. The large class-selection portrait should remain on the newer roster art unless visual QA proves a replacement is superior.

### Guardian / Floor-100 v3 art

Historical v1.2.12 shipped `boss-guardian-atlas-v3.png` and `final-boss-v3.png`, including nine dedicated guardian cells. Current production still lists the v11 guardian/final-boss assets.

Recovery requirement: visually compare v3 against the current v11 baseline, then promote only if it is an actual quality improvement. Keep encounter mechanics and telegraphs in canonical core. Do not infer visual quality from the historical version number alone.

### 21-theme terrain material pass — partial recovery

The retired `art-runtime-v4.js` defined deterministic visual language across all 21 classic-100 themes. Those palette and motif identities are now represented in production by the DOM/CSS atmosphere layer without a second Canvas or duplicate FOV/map authority.

Remaining requirement: if tile-level wall/floor material detail is still desirable after visual QA, implement it inside the canonical `game/core/game.js` theme texture path. The old terrain overlay Canvas must remain retired.

### Remaining historical art-library candidates

Source-atlas manifests may contain later candidates that never became production-ready. Any event illustration, loading/result art, directional hero work or other library candidate must be admitted through focused visual QA rather than by reconnecting archived runtimes. Previously retired directional-hero and simplified combat-FX experiments remain excluded unless independently redesigned.

## Rule

Recover product value, not topology. A historical feature is not considered fully recovered until the production route visibly uses it through the current sole owner and the release allowlist contains the required assets.
