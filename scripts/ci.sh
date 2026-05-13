#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FRESHNESS_BASELINE="$(mktemp)"
FRESHNESS_CURRENT="$(mktemp)"
cleanup() {
  rm -f "$FRESHNESS_BASELINE" "$FRESHNESS_CURRENT"
}
trap cleanup EXIT

git diff -- artifacts hardening/frontiers hardening/maps >"$FRESHNESS_BASELINE"

npm run demo
npm run interop:validate
npm run hardening:map
npm run hardening:frontier
npm run hardening:gate
npm run gate
npm run daml:test
npm run canton:smoke
npm run package

if git diff --quiet -- artifacts hardening/frontiers hardening/maps; then
  git diff --exit-code -- artifacts hardening/frontiers hardening/maps
else
  git diff -- artifacts hardening/frontiers hardening/maps >"$FRESHNESS_CURRENT"
  if cmp -s "$FRESHNESS_BASELINE" "$FRESHNESS_CURRENT"; then
    echo "generated artifact freshness gate passed with stable pre-existing local diff"
  else
    echo "generated artifact freshness gate failed: regenerated tracked outputs changed" >&2
    diff -u "$FRESHNESS_BASELINE" "$FRESHNESS_CURRENT" >&2 || true
    exit 1
  fi
fi
