# Docs / Code Congruence Tracker

## Objective
Bring Passport docs, generated artifacts, gates, and implementation claims into congruence with current `main`.

## Branch
`chore/docs-code-congruence`

## Non-negotiable boundaries
- Passport records external readiness attestations and scoped evidence only.
- Do not add custody, transfer, settlement, clearing, token issuance, wallet, venue operation, trade execution, legal-compliance determination, license granting, participant registration, production identity, live integration, dynamic plugin loading, `eval`, arbitrary plugin paths, or repo-authored network fetches in validation/generation paths.
- Do not raise any adapter readiness level above current evidence.

## Known audit findings

### DC-001 Interop artifact version mismatch
- Files: `interop/runner.js`, `artifacts/interop/report.json`, `scripts/gates.mjs`
- Current mismatch: root package and Daml package are `0.3.0`, but interop report generation and the committed report still say `0.2.0`.
- Intended fix: derive the interop report version from the root package version, regenerate the committed report, and gate report/package version congruence.
- Validation evidence: `npm run interop:validate` regenerated `artifacts/interop/report.json` with version `0.3.0`; `npm run gate` passed and reported `interop report version matches package.json 0.3.0`.
- Status: done

### DC-002 Daml/readiness object spine docs omit support and liveness templates
- Files: `docs/01_daml_as_spec.md`, `docs/11_readiness_credential_framework.md`
- Current mismatch: docs omit current support/liveness templates, especially `ReadinessCredentialActiveStatus`, from readiness ledger descriptions.
- Intended fix: document the primary spine separately from support, liveness, lifecycle, revocation, and audit-disclosure contracts; describe active status as a minimal liveness witness.
- Validation evidence: `npm run gate`, `npm run readiness:claim-gate`, and `npm run ci` passed after the Daml spine docs documented `ReadinessCredentialActiveStatus` as liveness-only evidence.
- Status: done

### DC-003 Collateral credential positioning overstates product scope
- Files: `docs/03_collateral_capacity_credential.md`
- Current mismatch: `CapacityCredential` is described as the primary product object rather than the primary object for the collateral-capacity credential family.
- Intended fix: narrow the sentence to the collateral-capacity family while preserving collateral semantics.
- Validation evidence: `npm run readiness:claim-gate` passed with 106 bounded claims across 37 scanned files; `npm run ci` passed.
- Status: done

### DC-004 Adapter contract docs omit negative-case hook
- Files: `docs/06_interop_adapters.md`
- Current mismatch: docs list `generate` and `validate` but omit optional `validateNegativeCases(context, input)`.
- Intended fix: document the optional hook and its role in Level 2 Artifact Conformance evidence without expanding adapter scope.
- Validation evidence: `npm run interop:validate` passed with 3 artifacts and 3 negative cases; `npm run gate` passed with the adapter doc updated for the optional hook.
- Status: done

### DC-005 Release notes understate current Daml test inventory
- Files: `docs/15_release_notes_passport_0_3.md`
- Current mismatch: release notes say tests run through `t128`, while current test/gate inventory includes `t129`, `t130`, and `t131`.
- Intended fix: update release notes to reflect tests through `t131` and name the later revocation/liveness checks.
- Validation evidence: `npm run daml:test` passed and included `t129_reject_binding_after_readiness_credential_revocation`, `t130_reject_venue_readiness_evidence_after_credential_revocation`, and `t131_active_status_visibility_is_liveness_only`.
- Status: done

### DC-006 README project layout is stale
- Files: `README.md`
- Current mismatch: layout omits current agent skills, tracker/decision docs, interop context, hardening/formal files, generated-time and Daml coverage gates, and readiness claim artifacts.
- Intended fix: update the layout with stable globs and important source-of-truth files without making it exhaustive.
- Validation evidence: `npm run gate` passed after adding the missing layout paths and required-file checks.
- Status: done

### DC-007 Historical tracker can be misread as current schema
- Files: `docs/trackers/typed-time-policy-reservation-freshness.md`
- Current mismatch: historical 0.1/0.2 timestamp-model wording can read like the current 0.3 schema.
- Intended fix: mark the tracker historical/completed and rename current-model wording to original 0.1.0 model wording.
- Validation evidence: `npm run readiness:claim-gate` and `npm run ci` passed after marking the tracker historical/completed for the 0.2 typed-time upgrade.
- Status: done

### DC-008 Repo pretrade workflow version phrasing is stale
- Files: `docs/04_repo_pretrade_workflow.md`
- Current mismatch: typed `Time` language says "For Passport 0.2.0" even though current Passport is 0.3.0 and still uses those fields.
- Intended fix: rephrase as historically introduced in 0.2.0 and still current in 0.3.0.
- Validation evidence: `npm run readiness:claim-gate` and `npm run ci` passed after the version phrasing was updated.
- Status: done

### DC-009 Hardening inventory and change log need congruence record
- Files: `hardening/change-log.md`, `hardening/maps/passport.invariants.json`, `hardening/frontiers/passport.frontier.json`
- Current mismatch: new tracker, version-gate invariant, and source inventory need to be evaluated against repo-local hardening records.
- Intended fix: update hardening records if required and regenerate frontier when inputs change.
- Validation evidence: `npm run hardening:map`, `npm run hardening:frontier`, `npm run hardening:formal`, `npm run hardening:gate`, and final `npm run ci` passed after updating the change log, invariant map, frontier, and generated hardening reports.
- Status: done

## Work log
- Branch setup completed from up-to-date `main`.
- Tracker created as first repository change.
- Updated `interop/runner.js` to derive report package metadata from the root `package.json`.
- Added a local gate check for interop report/package version congruence and required-file coverage for the new tracker, readiness claim report, and `round-0010`.
- Regenerated `artifacts/interop/report.json` through `npm run interop:validate`.
- Updated Daml spine, readiness framework, collateral credential, repo pre-trade, adapter, release-note, README layout, Phase A tracker, and typed-time tracker docs.
- Updated `hardening/change-log.md`, `hardening/maps/passport.invariants.json`, and `hardening/rounds/round-0010.md`.
- Ran `npm run hardening:select`; selected `bd.ci.network-fetch-default` as the top frontier candidate with action `deepen`.
- Corrected the invariant-map evidence mapping so interop report version congruence is covered by `npm run gate`, `npm run interop:validate`, and full CI rather than `npm run hardening:gate` alone.
- First full CI rerun after the evidence-mapping correction failed at the freshness gate because `artifacts/hardening_report.json` was regenerated from an intermediate map; reran `npm run hardening:gate` and final `npm run ci` passed.

## Validation matrix
| Command | Result | Notes |
|---|---|---|
| `npm run interop:validate` | passed | 3 artifacts, 3 negative cases; regenerated interop report version `0.3.0`. |
| `npm run gate` | passed | 752 checks; includes interop report/package version congruence. |
| `npm run readiness:claim-gate` | passed | 106 bounded claims, 37 scanned files. |
| `npm run hardening:map` | passed | 1295 checks. |
| `npm run hardening:frontier` | passed | 23 candidates, top `bd.ci.network-fetch-default`. |
| `npm run hardening:formal` | passed | 7 obligations, 26 bounded checks, 235 assertions. |
| `npm run hardening:gate` | passed | 2772 checks. |
| `npm run daml:build` | passed | Both DPM packages unchanged. |
| `npm run daml:test` | passed | 22/22 external templates and 27/27 external template choices covered. |
| `npm run canton:smoke` | passed | Loaded `aevelum-passport-core-0.3.0.dar`; DAR contains 30 packages. |
| `npm run ci` | passed | Final rerun passed after generated hardening report was stabilized; one intermediate rerun failed only at freshness due stale generated report baseline. |
