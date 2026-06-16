# round-0010: Generic Readiness Credential Expansion

## Target

Upgrade Passport from collateral-capacity readiness only to a regulated-market readiness credential foundation while preserving the existing collateral-capacity credential family.

## Scope

- Daml readiness and venue-readiness modules.
- Initial Daml Script tests `t100` through `t119`; later C.1 review additions extended the current 0.3 inventory through `t131`.
- License or registration attestation-only semantics.
- Scoped readiness presentation, binding, audit disclosure, and venue evidence visibility.
- Overclaim gates for license, venue, trade, clearing, settlement, custody, asset transfer, token, and wallet language.
- Docs, ADR, generated transcripts, invariant map, frontier, and release artifacts.

## Decision

Keep Phase A inside `passport-core` and bump the Daml packages to `0.3.0`. Markets can vendor one Passport DAR while Passport remains a readiness evidence ledger schema, not a venue, licensing authority, legal-compliance engine, custodian, settlement system, clearinghouse, wallet, token issuer, credit engine, or legal-title oracle.

License or registration credentials require `LicenseAttestationScope.attestationOnly = True`. Readiness bindings are non-executing context evidence records.

## Executable Evidence

- `t100_create_readiness_account`
- `t101_publish_readiness_policy`
- `t102_request_participant_eligibility_credential`
- `t103_issue_readiness_credential`
- `t104_present_readiness_to_verifier`
- `t105_bind_readiness_to_workflow_context`
- `t106_issue_license_registration_attestation_only`
- `t107_reject_license_attestation_without_scope`
- `t108_reject_license_scope_when_attestation_only_false`
- `t109_reject_unapproved_credential_kind`
- `t110_reject_unapproved_jurisdiction`
- `t111_reject_unapproved_activity`
- `t112_reject_expired_readiness_policy`
- `t113_reject_stale_readiness_presentation`
- `t114_revoke_readiness_credential`
- `t115_grant_readiness_audit_disclosure`
- `t116_auditor_cannot_see_full_readiness_credential`
- `t117_unauthorized_party_cannot_see_readiness_credential`
- `t118_create_venue_readiness_evidence_from_binding`
- `t119_readiness_binding_is_non_executing_evidence_only`
- `npm run readiness:claim-gate`
- `npm run gate`
- `npm run daml:test`

## Kill Gates

- Daml tests fail if license or registration attestations can be requested without valid attestation-only scope.
- Daml tests fail if unapproved credential kind, jurisdiction, activity, expired policy, or stale presentation is accepted.
- Daml privacy tests fail if verifier, auditor, or outsider visibility widens beyond scoped contracts.
- The readiness claim gate rejects docs or artifacts that imply Passport grants licenses, registers participants, approves legal compliance, admits participants to a venue, operates venues, executes trades, forms trades, clears, settles, custodies, transfers assets, issues tokens, or operates wallets.

## Boundary

Passport records readiness attestations and scoped evidence only. It does not grant licenses, determine legal compliance, admit participants to a venue, operate a venue, execute trades, form trades, match orders, clear, settle, custody, transfer assets, issue tokens, operate wallets, decide credit, determine legal title, provide production identity, or provide live external integration.

## Verification

- `dpm build --all` passed after adding readiness modules.
- `./scripts/run-daml-tests.sh` passed with 21/21 external templates and 25/25 external choices covered.
- `npm run gate` passed after docs, transcripts, and claim gate updates.
