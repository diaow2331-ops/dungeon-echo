/* Dungeon Echo production content bridge v1.
 * Adds late-game chapter palettes so floors 85-100 do not clamp to one theme, and
 * gives each ten-floor guardian a distinct behavior combination using mechanics the
 * core already understands. Floor 10 now teaches the first telegraphed counterplay rule;
 * later bespoke boss phases can replace the remaining interim combinations.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined') return;
  if (window.__DE_CONTENT_SYSTEM) return;
  const api = window.DE_TEST;
  if (!api || api.profileId !== 'classic-100' || !api.runProfile) return;
  window.__DE_CONTENT_SYSTEM = 'v1';

  const p = api.runProfile;

  // themeBandSize is 4. classic-100 originally had 21 palettes: index 20 starts at 81
  // and then clamps through floor 100. Appending four more palettes restores a real
  // late-game cadence: 85-88 / 89-92 / 93-96 / 97-100.
  if (Array.isArray(p.themes) && p.themes.length === 21) {
    p.themes.push(
      { name: '噤声王庭', fl: '#11131d', fl2: '#0e1019', sp1: '#080a12', sp2: '#202536', wa: '#2b3144', wl: '#151925', wh: 'rgba(185,198,235,.10)' },
      { name: '黑星墓海', fl: '#17121d', fl2: '#120e19', sp1: '#0b0810', sp2: '#2a2034', wa: '#382b42', wl: '#1b1422', wh: 'rgba(208,176,230,.10)' },
      { name: '终末天井', fl: '#211014', fl2: '#1a0c10', sp1: '#100609', sp2: '#351920', wa: '#47212a', wl: '#210f15', wh: 'rgba(245,155,170,.11)' },
      { name: '回响王座', fl: '#0d0918', fl2: '#090612', sp1: '#05030c', sp2: '#211332', wa: '#301b48', wl: '#120a20', wh: 'rgba(210,185,255,.14)' }
    );
  }

  // Interim guardian differentiation. These are deliberately combinations of already
  // tested core traits, so content gets gameplay identity now without coupling this
  // data module to combat implementation. Bespoke telegraphed phases remain a later P1.
  const guardians = Array.isArray(p.midBosses) ? p.midBosses : [];
  const patch = {
    // 第一位守卫是破甲教学：先亮出蓄力，再给玩家一整回合拉开距离。
    10: { armorBreak: true },
    20: { slow: true, regen: true },
    30: { boom: true, enrage: true },
    40: { ranged: 3 },
    50: { ranged: 2, regen: true },
    60: { leech: 0.20, enrage: true },
    70: { slow: true, regen: true, boom: true },
    80: { ranged: 3, regen: true },
    90: { ranged: 3, enrage: true, leech: 0.15 },
  };
  for (const g of guardians) {
    const extra = patch[g && g.depth];
    if (extra) Object.assign(g, extra);
  }

  if (p.boss) {
    Object.assign(p.boss, {
      ranged: 3,
      regen: true,
      enrage: true,
      leech: 0.12,
    });
  }
})();