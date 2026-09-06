# Merchant Frontier v0.10 design contract

Wildforge is a landscape-first 2D open-world merchant sandbox. Terrain, caves, monsters, mining and construction remain physical systems, but the primary progression authority is commerce: work, information, route cost, inventory risk and capital growth.

## Vertical slice

A fresh character starts with **0 copper**, no pickaxe and no free economic shortcut. The nearby Greenfield settlement supplies a tool-free starter errand. That first wage buys food or seeds a tiny trade. The player then learns the Greenfield → Embercross price spread, crosses a dangerous surface route, manages satiety, sells/finishes deliveries and builds working capital. The first pickaxe is deliberately expensive at **12 gold 50 silver** and marks entry into the underground resource economy rather than the beginning of the game.

## Surface economy authority

- Currency: 100 copper = 1 silver; 100 silver = 1 gold; 100 gold = 1 platinum.
- Settlements are deterministic surface nodes with factions, guarded radii and local market multipliers.
- Markets persist stock and bounded pressure; buying drains stock and pushes asks upward, selling replenishes stock and pushes prices downward.
- Same-market resale is structurally lossy; profit comes from geography, demand and timing.
- Satiety is route operating cost, not decorative survival UI. Distance, night travel and burden consume more food.
- Settlements suppress ordinary route danger inside guarded surface radii; the player is not expected to farm monsters inside towns.
- Contracts may provide consigned quest cargo so a penniless character can work before owning trade inventory.
- Commodity and merchant rules stay pure. `game.js` remains the single live-state/persistence authority when the runtime is wired.

## Initial surface nodes

1. **青麦镇 / Greenfield** — Verdant League agricultural market. Cheap grain, bread, timber, hides and herbs; expensive metal/tools.
2. **赤炉城 / Embercross** — Ember Guild industrial market. Cheap charcoal, tools and bars; expensive food/timber.
3. **白岩堡 / Frostgate** — Northern Watch frontier market. Cheap dried provisions/frostglass/salt; expensive food, lamp oil and selected imports.

## Deferred world layers

The existing underground remains compatible but is economically gated behind the first expensive pickaxe. Deeper mining economies, hell-like strata and sky islands are later expansion layers. They must plug into the same trade/capital loop instead of replacing it. Art direction, final music, caravans, pack animals, hired guards and full faction diplomacy are also deferred until the surface loop proves fun.

## v0.10 success condition

A representative player can enjoy at least 20–30 minutes without mining: accept work, earn copper, buy food, discover another settlement, carry goods, experience a real changing price spread, survive a risky journey, return richer and understand why the first pickaxe is worth saving for.
