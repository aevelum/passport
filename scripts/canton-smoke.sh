#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CORE_DAR="$ROOT/packages/passport-core/.daml/dist/aevelum-passport-core-0.1.0.dar"
TMP_DIR="$(mktemp -d)"
PORT_FILE="$TMP_DIR/canton-ports.json"
LOG_FILE="$TMP_DIR/canton-smoke.log"
SANDBOX_PID=""

pick_port() {
  node -e "const net = require('node:net'); const server = net.createServer(); server.listen(0, '127.0.0.1', () => { console.log(server.address().port); server.close(); });"
}

cleanup() {
  if [[ -n "$SANDBOX_PID" ]] && kill -0 "$SANDBOX_PID" 2>/dev/null; then
    kill "$SANDBOX_PID" 2>/dev/null || true
    wait "$SANDBOX_PID" 2>/dev/null || true
  fi
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

dpm build --all

if [[ ! -f "$CORE_DAR" ]]; then
  echo "missing core DAR: $CORE_DAR" >&2
  exit 1
fi

dpm validate-dar "$CORE_DAR"

LEDGER_API_PORT="$(pick_port)"
ADMIN_API_PORT="$(pick_port)"
JSON_API_PORT="$(pick_port)"
SEQUENCER_PUBLIC_PORT="$(pick_port)"
SEQUENCER_ADMIN_PORT="$(pick_port)"
MEDIATOR_ADMIN_PORT="$(pick_port)"

dpm sandbox \
  --dar "$CORE_DAR" \
  --ledger-api-port "$LEDGER_API_PORT" \
  --admin-api-port "$ADMIN_API_PORT" \
  --json-api-port "$JSON_API_PORT" \
  --sequencer-public-port "$SEQUENCER_PUBLIC_PORT" \
  --sequencer-admin-port "$SEQUENCER_ADMIN_PORT" \
  --mediator-admin-port "$MEDIATOR_ADMIN_PORT" \
  --canton-port-file "$PORT_FILE" \
  --no-tty >"$LOG_FILE" 2>&1 &
SANDBOX_PID="$!"

for _ in {1..90}; do
  if [[ -f "$PORT_FILE" ]]; then
    if kill -0 "$SANDBOX_PID" 2>/dev/null; then
      echo "Canton sandbox loaded $CORE_DAR"
      echo "Port file: $PORT_FILE"
      exit 0
    fi
  fi
  if ! kill -0 "$SANDBOX_PID" 2>/dev/null; then
    echo "Canton sandbox exited before becoming ready" >&2
    cat "$LOG_FILE" >&2 || true
    exit 1
  fi
  sleep 1
done

echo "Canton sandbox did not become ready within timeout" >&2
cat "$LOG_FILE" >&2 || true
exit 1
