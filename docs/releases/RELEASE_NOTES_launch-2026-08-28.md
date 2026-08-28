# 91HWL public launch set · 2026-08-28

This publication set launches the two browser games and their product-facing site together from one repository revision:

- **Dungeon Echo v1.2.10** — 100-floor turn-based roguelike, fixed ZH/EN routes, desktop one-shot input integrity, laptop layout pass and mobile touch-target pass.
- **Clock Out Alive v1.11.5** — office runner with final language/runtime consistency, repeat-input/layout performance work and mobile safe-area/header compaction.
- **91hwl site v1.3.4** — homepage and project pages updated to the current game versions, with a first-screen GitHub/source CTA for public traffic.

## Publication policy

This is the launch boundary. Broad gameplay, balance and art expansion stops here until player evidence justifies a focused patch. Post-launch changes should be issue-driven and preserve compatible browser saves wherever possible.

## Deployment

On the production checkout at the exact merged `main` revision, run:

```bash
sudo bash ops/release/deploy-dual-public.sh
```

The orchestrator builds all three immutable bundles, deploys Dungeon Echo, then Clock Out Alive, then the main site, and finally checks public VERSION/site markers. Expected final marker:

```text
dual_public_release=PASS
```

Component deployers retain their existing rollback and health-check behavior.

## Promotion entry points

- Site: https://91hwl.cn/
- Dungeon Echo: https://play.91hwl.cn/dungeon-echo/
- Dungeon Echo English: https://play.91hwl.cn/dungeon-echo/en/
- Clock Out Alive: https://play.91hwl.cn/moyu/
- Source / issues / release history: https://github.com/diaow2331-ops/dungeon-echo

The site is deliberately structured so external traffic can either play immediately or move directly into the public repository.
