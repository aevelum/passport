#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

npm run demo
npm run interop:validate
npm run hardening:map
npm run hardening:frontier
npm run hardening:gate
npm run gate
npm run daml:test
npm run canton:smoke
