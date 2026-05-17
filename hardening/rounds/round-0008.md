# round-0008: DPM Latest Stable Migration Stress Test

## Objective

Stress-test the hardening loop by moving Passport from the `3.5.1-rc3` DPM SDK line to the latest stable release reported by Digital Asset's stable installer endpoint.

The endpoint `https://get.digitalasset.com/install/latest` returned `3.4.11` during this round. Local `dpm version --all -o json` also listed `3.4.11` as a remote stable release and `3.5.1-rc3` as the active RC before this migration.

## Selected Surfaces

- DPM SDK pins in package `daml.yaml` files.
- GitHub Actions DPM install, cache, and verification.
- README toolchain documentation.
- Daml test runner missing-DPM guidance.
- Hardening architecture policy and gates.
- Invariant map and hardening frontier.

## Semantic Decision

This is a stable-toolchain migration, not a move to the numerically highest observed SDK. The repo now defaults to `3.4.11` because the official stable endpoint reports that version. The 3.5 line remains RC-named in the current local and knowledge-base observations, so it is not treated as the stable baseline for this repo.

## Kill Gates

- `npm run hardening:gate` fails if package `sdk-version` values disagree.
- `npm run hardening:gate` fails if the shared package SDK pin contains `rc` or `snapshot`.
- `npm run hardening:gate` fails if GitHub Actions cache/install/verification, README docs, `run-daml-tests.sh`, architecture policy, or gate report metadata do not match the package SDK pin.
- `npm run hardening:gate` fails if `run-daml-tests.sh` reintroduces the `dpm test --package-root` path that failed under SDK `3.4.11` instead of entering the package directory before running tests.
- `npm run ci` fails if DPM build, Daml Script tests, Canton smoke, packaging, or generated artifact freshness regress under the stable SDK.

## Evidence

- `curl -fsSL https://get.digitalasset.com/install/latest`
- `dpm version --active`
- `dpm version --all -o json`
- `npm run hardening:map`
- `npm run hardening:frontier`
- `npm run hardening:formal`
- `npm run hardening:gate`
- `npm run gate`
- `npm run daml:test`
- `npm run ci`

## Next Frontier

- Keep `bd.ci.network-fetch-default` as a live guard: default validation and generation paths still must not fetch schemas, plugin code, or mutable runtime inputs.
- Revisit the SDK pin only when Digital Asset's stable endpoint advances or when a deliberate RC evaluation is recorded as a separate non-default experiment.
