# Clock Out Alive / 摸鱼到下班 v1.16.1

v1.16.1 is a focused animation continuity patch.

- Grounded run frames now play in the order `2,3,6,5,7,4` instead of `2,3,4,5,6,7`.
- The existing sprite sheet binary is unchanged.
- Animation FPS, hero display size, jump states, 44×66 physics body, collision geometry and route pacing are unchanged.
- Browser sampling confirms the runtime loop follows the new order.
