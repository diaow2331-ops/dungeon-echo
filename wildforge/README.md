# 荒境熔炉 / Wildforge

Wildforge is an original browser-native 2D sandbox survival game designed landscape-first for desktop and touch devices. The current v0.3.0 build is an incubation build, not a public production release.

## v0.3.0 playable incubation build

Core loop: Explore → Mine → Collect → Craft → Build → Fight → Upgrade → Explore deeper.

- deterministic 480×144 destructible world;
- three authored biome families: Verdant Reach, Ember Wastes, Frostglass Shelf;
- caves, ore clusters, trees, glow moss and underground ruins;
- 20+ materials/placeables, four pick tiers, five weapon tiers and 16 recipes;
- five original enemy families, contact combat and resource drops;
- 180-second day/night cycle;
- Starcore Forge deep-rift finale: craft the forge, ignite it in the Starshard Rift, summon and defeat the Rift Behemoth, then continue in the completed world;
- backward-compatible loading of the previous v0.1.0 local save format;
- local browser save with explicit and automatic saves;
- desktop mouse/keyboard and landscape touch controls;
- portrait touch devices receive a rotate-to-landscape guard instead of a compressed alternate UI.

## Originality boundary

The project may take genre-level inspiration from block sandbox and side-scrolling survival games, but it must not copy Terraria or Minecraft characters, enemies, names, recipes, UI, music, textures, biome identities or other protected assets. Current visuals are procedural and repository-native.

## Source authority

`src/game.js` owns live state mutation, runtime input, physics, combat, inventory, crafting and persistence. `src/world.js` owns deterministic world generation/serialization. `src/data.js` is immutable content data. No other game source root is imported.
