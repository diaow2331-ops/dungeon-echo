# Clock Out Alive / 摸鱼到下班 v1.11.4

v1.11.4 is a focused play-quality release. It does not extend the route, change rewards, retune obstacle weights, reset saves or alter the two endings.

## Input integrity

- One-shot keyboard actions now ignore `KeyboardEvent.repeat`.
- Holding Space / Arrow Up no longer burns the second jump through OS key repeat.
- Holding a jump key before 18:00 no longer auto-accepts the clock-out window; the player must make a fresh input during the decision window.
- Pause, restart, fullscreen, master mute and settings keys can no longer oscillate from a held key.
- Mouse jumping accepts the primary button only; touch/pen pointer input remains unchanged.

## Mobile/runtime smoothness

- Canvas backing-size measurement is now invalidated by real window / VisualViewport / fullscreen changes instead of reading `getBoundingClientRect()` every animation frame.
- Presentation state synchronization is memoized by game state, pressure band and route index, avoiding repeated `dataset` writes and active-route DOM queries during steady-state frames.

## Obstacle fairness

- A long-mutating BUG reserves its final 116px width when scheduling the following obstacle. The visual mutation therefore no longer steals roughly 60px from the intended clear gap behind it.

## Preserved contracts

- `DAY_END_DISTANCE=2200` and the four-scene 14:00 → 18:00 route are unchanged.
- `PLAYER_HIT={left:10,right:10,top:7,bottom:6}` is unchanged.
- Existing obstacle weights, boss/BUG/request mechanics, coffee rewards, combo rewards, endings and localStorage keys are unchanged.
- v1.11.3 prepaint/notranslate, typography, shared-language propagation, no-player-halo and ground-only jump-dust fixes remain active.
- Browsers still receive one deterministic final `game.js`; v1.11.4 adds no runtime patch loader.

## Release verification

`test/moyu-release.cjs` reconstructs the accepted runtime chain, applies the v1.11.4 patch, runs the v1.11.4 build adapter, parses the final JavaScript with `node --check`, then builds and inspects the Moyu deployment ZIP.

Public deployment is only proven after the Moyu bundle deployer and healthcheck emit their real PASS markers and a human desktop/mobile run confirms input feel and the 18:00 decision window.
