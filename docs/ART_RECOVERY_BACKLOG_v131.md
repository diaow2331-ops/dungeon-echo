# Dungeon Echo post-v1.3.1 art recovery backlog

The v1.3.1 recovery closeout completed the reviewed single-authority recovery sequence, but it did **not** mean that every historically shipped or staged art improvement had been re-admitted to production.

## Recovered after the v1.3.1 closeout

- v13 weapon and wearable sheets are promoted to production and statically mapped to all 26 equipment icon cells.
- Safe static visual-polish values are restored for the main dungeon canvas and Echo Town without restoring any overlay Canvas or follower runtime.

## Still missing from the current production art graph

### Hero action atlas

Historical v1.2.12 shipped `art/runtime/hero-action-atlas-v2.svg` with four classes × four states: idle / attack / hurt / skill. Current production still draws the base hero from `art/hero-atlas-v11.png`.

Recovery requirement: integrate action-state selection directly into the canonical core renderer. Do not restore the old overlay, polling loop or state inference runtime.

### Guardian / Floor-100 v3 art

Historical v1.2.12 shipped `boss-guardian-atlas-v3.png` and `final-boss-v3.png`, including nine dedicated guardian cells. Current production still lists the v11 guardian/final-boss assets.

Recovery requirement: visually compare v3 against the current v11 baseline, then promote only if it is an actual quality improvement. Keep encounter mechanics and telegraphs in canonical core.

### 21-theme terrain material pass

Historical `art-runtime-v4.js` defined deterministic visual material/motif treatment across all 21 classic-100 themes. The old implementation used a second terrain Canvas and is therefore retired.

Recovery requirement: rebuild the useful hue/material/motif rules inside the canonical terrain draw path, with no second Canvas and no duplicate FOV or map authority.

### Remaining historical art-library candidates

Source-atlas manifests still mark the newer hero-action source batch as staged rather than runtime-ready. Any later event illustration, loading/result art, directional hero work or other library candidate must be admitted through focused visual QA rather than by reconnecting archived runtimes.

## Rule

Recover product value, not topology. A historical feature is not considered recovered until the production route visibly uses it through the current sole owner and the release allowlist contains the required assets.
