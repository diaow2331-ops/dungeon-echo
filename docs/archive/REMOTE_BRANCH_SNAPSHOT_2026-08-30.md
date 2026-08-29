# Retired remote branch snapshot — 2026-08-30

This file records stale remote branch tips immediately before repository cleanup. The branches were
not active PR heads and were superseded by the current single-authority mainline. Keeping the names
on the remote would imply they remained supported development lines, so they were retired after this
snapshot and repository-level main protection were established.

| Branch | Tip | Last authored UTC | Last subject | PR record |
| --- | --- | --- | --- | --- |
| `architecture/single-authority-v168` | `fc1dcf75027f30d30377eedc0feb1c9ed7966fe1` | 2026-08-29T01:50:37Z | docs: close all secondary rendering ownership | none |
| `art/recover-utility-loot-v2` | `f56c0efea9fcc1da0c13e888c36c875232c91103` | 2026-08-29T15:30:32Z | release: admit unified loot v2 atlas | #248 (closed) |
| `audio/recover-adaptive-bgm-v132` | `f06325a7b38c940e6e68f2118b846e744086bc4b` | 2026-08-29T16:21:27Z | test: align runtime contract with generation 170 | none |
| `core/theme-material-rng-v131` | `516a81eaadab661c0d2af35216169334da353725` | 2026-08-29T15:37:38Z | test: add canonical art material regression gate | none |
| `feature/art-directional-heroes-v165` | `008cdf0b8bf2c461588d0e9b0eaa63e052152929` | 2026-08-29T00:39:11Z | test: verify four-direction hero strips | #185 (merged) |
| `feature/art-monster-elite-v164` | `e7485bf0fc12ad8ec9998a65a95d68fcd0e3408c` | 2026-08-29T00:16:12Z | art: unify elite monster presentation | none |
| `feature/art-runtime-v3-review` | `dd07f13d006c18a2abed3b743ef1ab6e9c6fc0b3` | 2026-08-28T23:38:50Z | test: preserve v2 fallback contract with v3 loader | none |
| `feature/recover-presentation-polish-v132` | `933e7069c3ba802f8ee69fecd6a29c7645f880fb` | 2026-08-29T14:47:57Z | test(ui): include recovered polish guard in current suite | none |
| `refactor/economy-pricing-authority-v130` | `2bffb23d4b6e1ec2d2f6ef621d60bc7b56bcac8d` | 2026-08-29T10:52:22Z | refactor: transfer economy pricing authority | #205 (closed) |
| `refactor/equipment-stat-authority-v130` | `2ebd211a0dd84a1e877be37a79bec10f8b263452` | 2026-08-29T10:41:55Z | ci: fix one-shot equipment stat cutover runner | none |
| `test/current-suite-truth-v132` | `32c4f9c5cca26ffd7d90c5ac513e98285793ca17` | 2026-08-29T16:25:16Z | test: finish current suite truth pass | none |
| `ui/recover-expedition-pressure-v132` | `dbe356249ba1c7f56bcd36eb2def632a2b8ffb40` | 2026-08-29T16:36:10Z | ui: recover greedy expedition pressure surface | none |

Historical product value is preserved by `main`, release notes, merged/closed PRs and `archive/`.
If a retired branch contains a useful idea, recover the behavior into the current authority owner;
do not recreate the retired branch as a long-lived development line.
