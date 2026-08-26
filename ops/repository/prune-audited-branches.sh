#!/usr/bin/env bash
set -euo pipefail

# Dungeon Echo audited branch-prune helper.
#
# Default: dry run only.
# Apply:   bash ops/repository/prune-audited-branches.sh --apply
#
# Safety model:
# - every deletable branch is pinned to the exact remote head SHA observed during
#   the 2026-08-27 governance audit;
# - a moved branch is REFUSED rather than deleted;
# - main and the four temporarily retained untagged release-boundary refs are
#   never present in the deletion table;
# - missing branches are treated as already-cleaned and skipped.

REMOTE="${REMOTE:-origin}"
APPLY=0

case "${1:-}" in
  "") ;;
  --apply) APPLY=1 ;;
  -h|--help)
    cat <<'EOF'
Usage:
  bash ops/repository/prune-audited-branches.sh          # dry run
  bash ops/repository/prune-audited-branches.sh --apply  # delete verified refs

Optional environment:
  REMOTE=origin

The script refuses to delete any branch whose current remote SHA differs from
its audited SHA. It intentionally retains:
  main
  release/v1.1.0
  release/v1.2.0
  hotfix/v1.2.1-language-hints
  release/v1.2.2-final-polish
until immutable GitHub release/tag boundaries exist for the latter four.
EOF
    exit 0
    ;;
  *)
    echo "unknown argument: $1" >&2
    exit 2
    ;;
esac

command -v git >/dev/null 2>&1 || { echo "git is required" >&2; exit 2; }
git remote get-url "$REMOTE" >/dev/null 2>&1 || { echo "remote '$REMOTE' is not configured" >&2; exit 2; }

# Format: <branch><TAB><audited-head-sha>
read -r -d '' AUDITED <<'EOF' || true
art/character-gear-overlay-v1	a1b9cad3662f3777982c28dc18b312e540951a20
art/desktop-visual-polish-v1	0959bcd137958dd5cd106e0bbe0c537268725365
art/equipment-shop-parity-v1	6ca35faff51f450e0758337f86ade481cdb77b24
art/equipment-tier-identity-v1	7c469dda2f965d86ab19ff0df03983c2bebcd66e
art/equipment-town-parity-v1	1274d090a00925ad6206de2d0cd1b62ba5a7defb
art/equipment-v13-atlases	513aea40335505be478cf57e6175b919f15603d4
balance/guardian-special-pressure-v1	9c5d4fffdab0792c35a35f50d1e42c7ee816e2d3
balance/human-pressure-v2	ebe4203fd13bba0bf56e67e04d6bbb9edab8c0e6
balance/sustain-pressure-v1	91b607de1c9be2ca4a2892ab4f355a9eb35fbe81
chore/open-source-governance	885a8a4d126204ff76451a658135e7739a8e87d1
chore/p0-human-playtest-governance	14b493152f865ab0938cae96bbaea6c2e755d2b5
chore/production-ux-bootstrap-v1	c783e1c9b44fc063006a9c48df745bb0531f4bab
chore/release-ux-contract-audit	bd12e50e7f52cfa9ce681372bc52017c21bdc36e
chore/static-challenge-pressure-v1	1f77e5ca94f140643915534218800af1b583ff94
chore/static-combat-controls-v1	68465ccfb7d60466cafded2a438c5117c7fb0cf6
chore/v1.1-repository-hygiene	6f03f409ec8d3889599a88e5db884998be224b2f
chore/v1.2.2-repo-alignment	8662bbd4bdae9b9803f1ad3fb9340e93741ecef8
chore/v1.2.2-governance-sweep	15c6b989972d857959364abca851ce7160f0ef89
feat/extraction-channel	945dd18983e2a2c28b93dff02327f4334cadef35
feat/forge-refinement-v1	710609467d7e23b2a91ecc3e39f1a735868e2152
feat/mount-dungeon-echo-home	f2c518026179d2daa7f2643834e06f2e0c1307b5
feat/town-commerce-v1	e05ca4ac1296ef3d9dbf31f88aea4aa02edd4c06
feat/v1.1-art-town-remaster	606cb8835d4aedccd4f1bc9b7e9de8c966c9ef55
feature/guardian-mechanics-20-40	a9b43467f7cc61509c0086b3e36c25aa0cf4040e
feature/guardian-mechanics-50-70	b80599d0072478825ad9d7ed683879a9864e3e28
feature/guardian-mechanics-80-100	61df18d28c673e73d746662bc175afe15945f595
feature/i18n-balance-x-ready-v1	c9064c6649095a48b2648c26a9023510f30226c0
feature/i18n-content-v2	9efe35004efaac4793d3fbb684a91aef1fd3e0a3
feature/skill-evolution-milestones	bbf6a62b2320da9535c72dd2ca7debe8a92908c6
fix/audio-mobile-resume-v1	1d5275f4455d8f2e8a5433072189de90a053778b
fix/audio-muted-i18n-v1	b1e5f22a5b51687a8f01dc788a79be5040bbf183
fix/defense-semantics	09619e36349a9844d57f1df58756d33a22d8be36
fix/dungeon-service-safety	95791e92f2e3001bed4214e56a4975d03bd83a46
fix/equipment-single-turn-owner	7ac40a91b2f5c2b853525bc1b0fadbe872a3ae66
fix/equipment-swap-turn-cost	2accbfefea545321ea641355e912ddc2c4d42b92
fix/floor10-armorbreak-resume	468166d35426135f8e40f4aed5a163458f1f9f19
fix/floor10-armorbreak-resume-clean	4edf09504754257695a39924abb4e95c70f0eb92
fix/greedy-meta-derived-stats	c4513ba4aa815faf85ba0e6289140d89f4a1b52c
fix/guardian-telegraph-resume	9ea28e4581da7975039045ad643614aadec29cfe
fix/interaction-pathing	f75de05329f45a679f79799956756c68ae50f83f
fix/mana-persistence-v1	e4409d4e057b596ea7f56d1260648fac189fdcc7
fix/mobile-onboarding-clearance-v1	afb9996b220ec49deac097628838dbbcbc65a3ad
fix/next-attack-input-parity	b6756c52967bca9f05ef47226dcea0bc01e74d98
fix/nginx-route-origin-probe	e48593664d0879bec93969ad2c281b6fbd74f6ad
fix/p0-mechanics-integrity	6b399ca041b5594d12691a62bc4f021dd90a7d35
fix/p0-progression-commitment	ebaaa63515c659ca1a1235cb420b1465a3f770cf
fix/resource-pressure-v1	74bc6f3d8a2b5e636277c5169f7307dfbe640990
fix/risk-reward-interactions	273975aef63aebfedb36eff9975f736bb6aabd9b
fix/site-overlay-deployment	16b9331d5f3704fad5b31ff321738b6d41649d75
fix/talent-exhaustion-fallback	d98c0d1515c51dcd45e005e791aad4e2903c7c83
fix/v1.1-equipment-art-unification	7788766469ebddad84feaccaaeca2854a5f94533
fix/web-toys-host	86d0253461c87ac4bcd20fe7a58fafc78a2588e5
fix/wheel-death-reroll	2393895f86af9d2d0f57612aa53214873c2e15f8
fix/wheel-lifecycle	f38a0c5b8d99a63373a0263e006e66b2eaa3d8c1
migration/from-dragon-workshop	3843808d73519f575cc551e60c6a27d585f914b8
noop-should-not-create	8a87d5b61d144a3e3897679786d78bd34c368404
ops/dungeon-echo-server-install	e1bf48c837ea8c42c573302652af6efae2ee9028
opt/golden20-build-traits	aaba278d1c22b63a5e47fcc9d7b1a7301102c2d4
opt/golden20-item-value	7ea55d6bdb6f6b1a3bd1456f0d32e4c1c3a41a46
opt/golden20-p0-counterplay	0398ea5f90bce0608241493b535e86f15b7a66d2
release/first-public-rc	aa930d2ed09d9fca1fb52945c878f7afb28ed38a
release/v1.0.0-art	9a9769fcfbc7b01692358a5c86e60fd71302e2a9
temp-no	09d60051297bc1aec80e0f51d0e70763d52bba4b
ux/mobile-audio-tutorial-v1	d1228d7d1921de6e086df2410263c642d7e48e05
EOF

verified=0
missing=0
moved=0
deleted=0

printf 'mode=%s\n' "$([ "$APPLY" -eq 1 ] && echo APPLY || echo DRY_RUN)"
printf 'remote=%s\n' "$REMOTE"

while IFS=$'\t' read -r branch expected; do
  [ -n "$branch" ] || continue
  current="$(git ls-remote --heads "$REMOTE" "refs/heads/$branch" | awk 'NR==1 {print $1}')"

  if [ -z "$current" ]; then
    printf 'SKIP missing    %s\n' "$branch"
    missing=$((missing + 1))
    continue
  fi

  if [ "$current" != "$expected" ]; then
    printf 'REFUSE moved   %s expected=%s current=%s\n' "$branch" "$expected" "$current" >&2
    moved=$((moved + 1))
    continue
  fi

  verified=$((verified + 1))
  if [ "$APPLY" -eq 1 ]; then
    printf 'DELETE verified %s %s\n' "$branch" "$current"
    git push "$REMOTE" --delete "$branch"
    deleted=$((deleted + 1))
  else
    printf 'WOULD_DELETE   %s %s\n' "$branch" "$current"
  fi
done <<< "$AUDITED"

cat <<EOF
branch_prune_verified=$verified
branch_prune_missing=$missing
branch_prune_moved_refused=$moved
branch_prune_deleted=$deleted
EOF

if [ "$moved" -ne 0 ]; then
  echo "branch_prune=REFUSED_MOVED_REFS" >&2
  exit 1
fi

if [ "$APPLY" -eq 1 ]; then
  echo "branch_prune=PASS"
else
  echo "branch_prune=DRY_RUN_PASS"
fi
