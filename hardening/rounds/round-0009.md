# round-0009: Typed Time Temporal Validity

## Target

Upgrade Passport policy, credential, presentation, and reservation validity from ISO timestamp text metadata to authoritative Daml `Time` fields so downstream Markets can compare Passport state against ledger time.

## Scope

- Daml ledger schema and choices.
- Daml Script temporal validity and freshness tests.
- Package/DAR versioning and release notes.
- Hardening invariant map, frontier, and formal ledger-core obligations.

## Decision

Use parallel typed `Time` fields while preserving text timestamps as display and interop metadata. `CollateralPolicy`, `CapacityCredential`, `CredentialPresentation`, and `CapacityReservation` now expose typed validity/freshness fields. Choices use ledger `getTime` for presentation, reservation, release, expiry, handoff, dispute, and policy validation checks where ledger time is authoritative.

The upgrade is a schema-breaking Daml package release, so the core and test packages move to `0.2.0`.

## Executable Evidence

- `t024_policy_active_within_typed_validity_window`
- `t025_policy_rejected_after_typed_valid_until`
- `t026_credential_freshness_rejected_after_window`
- `t027_presentation_reservation_rejected_after_typed_validity_expiry`
- `t028_reservation_release_rejected_after_typed_validity_expiry`
- `t029_reservation_expiry_uses_typed_time`
- `t030_legacy_text_timestamps_metadata_only`
- `npm run daml:test`
- `npm run hardening:formal`
- `npm run hardening:gate`

## Kill Gates

- Daml tests fail if typed `Time` fields stop controlling policy validity, credential freshness, presentation validity, or reservation validity.
- Daml tests fail if legacy text timestamps become authoritative for validity checks.
- Hardening formal validation fails if temporal obligations lose invariant-map coverage, source assertions, or bounded model evidence.
- Hardening gates continue to reject out-of-scope custody, settlement, transfer, wallet, venue, trade execution, credit, legal-title, ZK, production identity, and live integration language.

## Boundary

Passport remains collateral-readiness, presentation, reservation, revocation, expiry, release, dispute, audit disclosure, and handoff metadata. This round does not add custody, transfer, settlement, clearing, collateral movement, token issuance, wallet operation, venue operation, downstream trade execution, legal-title proof, ZK proofing, production identity, or live external integration.

## Verification

- `npm run hardening:frontier`
- `npm run hardening:formal`
- `npm run hardening:gate`
- `npm run daml:test`
- `npm run ci`

Local verification used `DPM_SDK_VERSION=3.4.11` because the app shell's user-level active DPM SDK was `3.5.1-rc3`; package pins remain `3.4.11`.
