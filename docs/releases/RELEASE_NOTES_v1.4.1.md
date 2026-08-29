# Dungeon Echo v1.4.1

Release boundary: cache generation 177, runtime bootstrap v29.

## Hero presentation

- High-detail class art now owns the idle dungeon and town hero.
- The simplified action atlas is limited to real attack, hurt, and skill moments.
- Fake weapon strokes, armor bars, helmet triangles, and hard rarity outlines no longer cross the hero silhouette.
- Equipped rarity uses a restrained ground glow and a few high-tier motes instead of line geometry.

## Living Echo Town

- Echo Town is now a walkable foreground plaza: use WASD/arrows or click to move, then E/Enter to interact.
- Seven labelled hotspots connect the quartermaster, smith, innkeeper, merchant, oracle, records clerk, and portal warden to their real services.
- The authored town backdrop is shown at a useful height, and previously underused NPC cells now provide smith/oracle actions, portal support, watch, apprentice, scout, merchant, clerk, and innkeeper art.
- Interaction highlights and scroll focus connect the visual town to stash, forge, market, tavern, wheel, records, and departure UI.

## Ember Tavern

- A toast is available only after returning from an expedition and only once for that expedition.
- Each character can drink at most eight permanent toasts; prices rise every time.
- Rewards are deliberately small: Max HP +2, Crit +1%, Gold Find +1%, or the low-weight Base ATK +1 result.
- Tavern state is sanitized and preserved in the existing Greedy meta save without changing the v130 storage epoch.

The single-authority architecture remains unchanged: gameplay, town movement, tavern economy, state, and persistence stay in canonical `game/core/game.js`.
