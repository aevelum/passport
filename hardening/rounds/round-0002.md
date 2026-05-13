# round-0002: Offline CI Enforcement

## Target

Selected surfaces:

- `inv.ci.default-green-bar`
- `prop.ci.default-ci-offline`
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

Current status: guarded. Default CI now assumes a pre-baked offline runner and treats networked dependency or toolchain bootstrap as outside the default PR path.
