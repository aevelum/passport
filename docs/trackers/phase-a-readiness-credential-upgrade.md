# Phase A Readiness Credential Upgrade Tracker

## Objective

Upgrade Passport from a collateral-capacity readiness credential account into a regulated-market readiness credential foundation, with collateral capacity remaining the first credential family.

Passport records externally attested readiness and scoped evidence only. It must not grant licenses, determine legal compliance, admit participants to a venue, operate a venue, form trades, match orders, clear, settle, custody, transfer assets, issue tokens, operate wallets, decide credit, or determine legal title.

## Round Status

| Round | Scope | Status | Evidence |
| --- | --- | --- | --- |
| 0 | Inventory current `main`, hardening skill, gates, Daml package layout, and existing collateral behavior. | Done | Current repo is clean; old gates encode collateral-only wording that must move to readiness-boundary wording. |
| 1 | Version/package wiring and new readiness Daml modules. | Done | Added `Readiness` and `VenueReadiness` modules in `passport-core`; bumped DPM packages to `0.3.0`; early `dpm build --all` passed. |
| 2 | Daml Script tests and coverage map expansion. | Done | Initial Phase A added scripts `t100` through `t119`; later C.1 review additions extended the current 0.3 test inventory through `t131`. |
| 3 | Docs, guidance, claim gates, and demo artifacts. | Done | Updated canonical docs and guidance, added readiness transcripts and claim gate; `npm run gate` passed. |
| 4 | Hardening map/frontier/round records and generated reports. | Done | Updated invariant map, added `round-0010`, regenerated frontier, and passed `hardening:map`, `hardening:frontier`, `hardening:formal`, and `hardening:gate`. |
| 5 | Validation and package handoff. | Done | `daml:build`, `daml:test`, `canton:smoke`, `ci`, and `package` passed. `npm run ci` passed after regenerated artifacts were stabilized in the working tree. |
| C.1 | Venue-readiness evidence canonicality before merge. | Done | Added `ValidateVenueReadinessEvidence`, `readinessUseMatchesBindingPurpose`, and negative tests for wrong binding id, use, venue profile, and evidence hash. |
| C.1 review | Readiness audit grant typed validity review. | Done | Fixed `GrantReadinessAuditDisclosure` to validate against the credential validity window and added a negative expired-credential audit grant test. |
| C.1 review | Venue-readiness verifier validation and freshness review. | Done | Made `ValidateVenueReadinessEvidence` verifier-exercisable and added stale binding validation coverage. |
| C.1 review | License scope and binding purpose review. | Done | Bound license scope jurisdiction to credential jurisdiction and rejected binding purposes that differ from presentation purpose. |
| C.1 review | Source credential revocation review. | Done | `BindReadinessToContext` fetches the source `ReadinessCredential`; venue validation fetches `ReadinessCredentialActiveStatus`, with negative tests for binding or validating after revocation. |

## Required Boundary Checks

- License or registration credentials must require `attestationOnly = True`.
- Readiness bindings must be non-executing evidence only.
- VenueReadinessEvidence is a wrapper around a ReadinessBinding.
- Consumers must validate or cross-check the underlying ReadinessBinding before relying on VenueReadinessEvidence.
- Markets Phase C must not trust string readiness refs or copied wrapper fields alone.
- VenueReadinessUse must match ReadinessBindingPurpose.
- Venue-readiness validation must be exercisable by the verifier and reject revoked, stale, or expired readiness bindings.
- Verifiers must receive scoped presentations and bindings, not raw credentials.
- Auditors must receive scoped audit grants only.
- Unauthorized outsiders must see no readiness credential, presentation, binding, or audit grant.
- Static gates must reject prose or artifacts that imply Passport grants licenses, registers participants, admits participants to a venue, operates venues, executes trades, clears, settles, custodies, transfers assets, issues tokens, or operates wallets.

## Validation Commands

```bash
npm run hardening:map
npm run hardening:frontier
npm run hardening:formal
npm run hardening:gate
npm run daml:build
npm run daml:test
npm run canton:smoke
npm run ci
npm run package
```
