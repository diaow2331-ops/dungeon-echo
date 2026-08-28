# Dungeon Echo v1.2.5

v1.2.5 is a cache-coherence hotfix following the v1.2.4 Help / Expedition Log navigation repair.

## Fixed

- Production CSS and JavaScript references now carry the current release fingerprint (`?v=125`).
- Late runtime followers use the same release fingerprint instead of reusing potentially stale browser-cache entries.
- The native `style.css` ownership of **How to Play / 玩法说明** and **Expedition Log / 远征录** remains unchanged from the v1.2.4 repair.
- Deployment refuses a v1.2.5 bundle if its stylesheet, runtime bootstrap, or follower cache fingerprint is missing.

## Why

v1.2.4 was correctly deployed on the server, but the production entry still referenced long-lived static assets by bare names such as `style.css` and `runtime-bootstrap.js`. A browser could therefore keep the previous stylesheet while the `/VERSION` endpoint already reported 1.2.4, making the repaired screens appear unresponsive.

## Unchanged

Combat, Mana, loot, economy, progression, RNG, input semantics and save schema are unchanged.
