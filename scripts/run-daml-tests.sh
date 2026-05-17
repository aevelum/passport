#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v dpm >/dev/null 2>&1; then
  echo "dpm CLI not found. Install DPM outside the default CI path and pin SDK 3.4.11." >&2
  exit 127
fi

mkdir -p artifacts

dpm build --all

coverage_out="artifacts/daml_test_coverage.txt"
(
  cd "$ROOT/packages/passport-tests"
  dpm test \
    --all \
    --show-coverage \
    --coverage-ignore-choice '.*:Archive'
) 2>&1 | tee "$coverage_out"

node scripts/daml-coverage-gate.mjs "$coverage_out"
