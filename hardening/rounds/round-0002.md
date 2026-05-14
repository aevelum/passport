# round-0002: Offline CI Enforcement

## Target

Selected surfaces:

- `inv.ci.default-green-bar`
- former `prop.ci.default-ci-offline` policy, superseded by `prop.ci.standard-hosted-toolchain`
- `prop.ci.generated-artifacts-current`
- `inv.cdm.schema-reproducibility`

## Decision

Deepen the CI and generated-artifact controls after PR review found that default GitHub CI still bootstrapped over the network and regenerated tracked artifacts without a freshness gate.

## Evidence Added

- `.github/workflows/ci.yml`
- `scripts/generated-time.mjs`
- `hardening/scripts/lib.mjs`
- `hardening/scripts/hardening-gate.mjs`
- `hardening/maps/passport.invariants.json`
- `npm run hardening:gate`
- `npm run ci`

## Kill Gates

- Reject workflow YAML, shell scripts, package scripts, or repo-authored JS that introduce network primitives outside the explicit CDM vendor refresh module.
- Reject hardening-sensitive tracked files missing from the invariant map source inventory.
- Reject stale tracked artifacts, hardening maps, or hardening frontiers after default CI regeneration.
- Reject changes that make AJV's `require-from-string` dependency a direct or unpinned dynamic-execution dependency.

## Result

Historical status: guarded under the former strict offline-runner policy. This policy was superseded on 2026-05-14 by standard GitHub-hosted PR CI with explicit toolchain setup; the remaining active guard is that repo-authored validation and generation paths do not fetch schemas, plugin code, or mutable runtime inputs outside explicit vendoring commands.
