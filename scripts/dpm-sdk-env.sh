#!/usr/bin/env bash

pin_passport_dpm_sdk() {
  local expected
  expected="$(node -e "const fs=require('node:fs'); const text=fs.readFileSync('packages/passport-core/daml.yaml','utf8'); const match=text.match(/^sdk-version:\\s*(\\S+)\\s*$/m); if (!match) process.exit(1); process.stdout.write(match[1]);")"

  if [[ -n "${DPM_SDK_VERSION:-}" && "$DPM_SDK_VERSION" != "$expected" ]]; then
    echo "expected DPM_SDK_VERSION $expected, got $DPM_SDK_VERSION" >&2
    return 1
  fi

  export DPM_SDK_VERSION="$expected"
}

pin_passport_dpm_sdk
