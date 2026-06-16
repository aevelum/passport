# round-0011: Repo Audit Campaign Review Loop

## Target

Run a bounded repo-audit campaign after the CI and Codex review loop, with focus on documentation claim controls, release/package integrity, local CI reproducibility, and interop boundary hardening.

## Scope

- Default local CI and DPM SDK pin behavior.
- Interop adapter contract and readiness evidence references.
- Public documentation and SVG asset overclaim scanning.
- Review package contents for the generated core DAR release artifact.
- Hardening gates and invariant-map writeback for each confirmed finding.

## Findings And Remedies

1. Local DPM entrypoints did not export the package-pinned SDK.
   - Evidence: this shell had active `dpm version --active` as `3.5.1-rc3` with no `DPM_SDK_VERSION`, while local scripts invoked `dpm` directly.
   - Remedy: added `scripts/dpm-sdk-env.sh`, sourced it from local CI, Daml test, Canton smoke, and Daml build entrypoints, and routed `npm run daml:build` through `scripts/daml-build.sh`.
   - Kill gate: `hardening:gate` requires every local DPM entrypoint to source the helper and rejects inconsistent SDK env values.

2. Adapter readiness evidence references could point outside the repository.
   - Evidence: `assertReadinessEvidenceReferences` accepted `/etc/passwd` as an existing path before the fix.
   - Remedy: normalized references before existence checks so absolute paths and parent traversal references are rejected.
   - Kill gate: hardening negative cases reject absolute and parent-path evidence references.

3. Adapter plugin identity and artifact names were not constrained to safe output path segments.
   - Evidence: `defineAdapterPlugin` accepted `framework: "../escape"` and artifact type `../../README` before the fix.
   - Remedy: added safe-segment validation to the shared adapter contract and generated-result validation before artifact writes.
   - Kill gate: hardening negative cases reject unsafe adapter framework and artifact path segments, and the runner rejects undeclared or mismatched generated results.

4. Public SVG graphics were outside readiness overclaim scan coverage.
   - Evidence: readiness claim gates scanned docs, rounds, and generated JSON artifacts, but not `assets/*.svg`, even though README banner and Open Graph graphics carry public positioning text.
   - Remedy: added SVG assets to readiness and structural claim-scan inputs and stripped XML tags before claim classification.
   - Kill gate: XML-shaped unsafe claim fixtures prove markup text is classified, and `hardening:gate` scans tracked SVG assets.

5. The review package omitted the generated core DAR while docs named it as the release artifact.
   - Evidence: `/Users/charlesdusek/Code/aevelum-passport-foundation.zip` contained README and generated JSON artifacts but no `.dar`, because `scripts/package.mjs` used only `git ls-files` and `.daml/` outputs are ignored.
   - Remedy: package creation now requires and includes `packages/passport-core/.daml/dist/aevelum-passport-core-0.3.0.dar`.
   - Kill gate: `hardening:gate` requires the package script to include the generated core DAR and fail clearly if the artifact is missing; `npm run ci` still runs `npm run package`.

## Executable Evidence

- `npm run hardening:map`
- `npm run hardening:frontier`
- `npm run hardening:select`
- `npm run hardening:formal`
- `npm run hardening:gate`
- `npm run gate`
- `npm run interop:validate`
- `npm run daml:build`
- `npm run package`
- `npm run ci`
- `npm audit --json`

## Boundary

This round does not add custody, settlement, clearing, transfer, wallet, token issuance, venue operation, dynamic plugin loading, arbitrary plugin loading, live external integration, or Passport provenance inside generated CDM payloads. It only tightens local reproducibility, static adapter boundaries, public claim scanning, and package integrity.
