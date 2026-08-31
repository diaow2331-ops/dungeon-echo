# Dungeon Echo test policy

The repository intentionally keeps both **current release gates** and **historical recovery evidence**.
Do not treat every `.cjs` file in this directory as a current requirement.

## Current full gate

Run:

```bash
node test/current-suite.cjs
```

The `tests` array inside `current-suite.cjs` is the sole machine-readable list of current gates.
The current multi-game release gate contains 38 focused contracts, including repository/catalog,
Board Trio rules and mechanics, Dungeon production entry, single-authority, save/control, 1→100/Endless,
town, art, audio, release and repository governance.

Run the authority layer independently with:

```bash
bash ops/check-authority-local.sh
```

A release/freeze is not green unless both commands pass on the exact source tree being released.

## Historical tests

Other tests may describe retired wrappers, older runtime graphs, previous cache generations,
pre-v130 saves, or one-time migration/cutover tools. They remain in the repository because they
are useful when recovering product value or understanding why an old architecture was retired.

Historical evidence must **not** be made current by loosening production ownership or reconnecting
archived runtime modules. If an old product feature returns, write a focused new/current contract
against the canonical owner.

## Naming debt

Several current files retain old suffixes such as `v131`, `v132`, or `v133`. Those suffixes record
when the contract was introduced; they do not mean the product is still on that release.
Do not mass-rename working gates merely for cosmetics. New tests should use responsibility-oriented
names where practical.

## Claims

- `PASS` means the named command was actually executed and exited successfully.
- A focused PASS is not a full-suite PASS.
- A bot/simulation PASS is not human balance acceptance.
- A repository/release PASS is not proof that the public deployment was updated.
