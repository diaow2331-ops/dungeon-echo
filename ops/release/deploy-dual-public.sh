#!/usr/bin/env bash
set -euo pipefail

fail(){ echo "PUBLIC_ARTIFACT_RUNNER_ERROR: $*" >&2; exit 1; }
test "${EUID:-$(id -u)}" -eq 0 || fail 'run with sudo/root'
test "$#" -eq 1 || fail 'usage: deploy-dual-public.sh /tmp/<prebuilt-release>.zip'

archive="$1"
test -r "$archive" || fail "release ZIP is not readable: $archive"
for cmd in unzip sha256sum; do command -v "$cmd" >/dev/null || fail "missing command: $cmd"; done

work="$(mktemp -d /tmp/91hwl-public-artifact.XXXXXX)"
cleanup(){ rm -rf -- "$work"; }
trap cleanup EXIT

# Reject archive paths that could escape the isolated staging directory.
while IFS= read -r entry; do
  case "$entry" in
    /*|../*|*/../*|*/..) fail "unsafe archive entry: $entry" ;;
  esac
done < <(unzip -Z1 "$archive")

unzip -q "$archive" -d "$work"
test -r "$work/SHA256SUMS" || fail 'artifact SHA256SUMS missing'
test -r "$work/ops/deploy.sh" || fail 'artifact ops/deploy.sh missing'

(
  cd "$work"
  sha256sum -c SHA256SUMS
) || fail 'artifact checksum verification failed'

# The artifact owns all release-specific activation, health checks and rollback.
# This runner deliberately does not know about Git, source trees, Node, source transforms,
# builders, semantic versions or cache generations.
bash "$work/ops/deploy.sh"

echo "artifact=$archive"
echo 'public_artifact_runner=PASS'
