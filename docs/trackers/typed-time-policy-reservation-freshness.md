# Typed Time Policy And Reservation Freshness Tracker

## Problem statement

Aevelum Markets verifies typed Passport `CapacityReservation` and `CollateralPolicy` contracts during Repo RFQ quote acceptance, but Passport 0.1.0 models policy validity, credential valuation and validity, presentation time, and reservation validity primarily as ISO timestamp `Text`. Markets cannot compare those text fields against ledger time in Daml, so stale policies, credentials, presentations, or reservations require out-of-band parsing.

## Current timestamp model

- `IsoTimestamp = Text` is the current timestamp alias.
- `CollateralPolicy.validFrom` and `CollateralPolicy.validUntil` are text metadata only.
- `CapacityCredential.valuationTime`, `validFrom`, and `validUntil` are text metadata only.
- `CredentialPresentation.presentedAt` and `validUntil` are text metadata only.
- `CapacityReservation.validUntil` is text metadata only.
- Revocation, expiry, audit disclosure, handoff, and dispute timestamps are also text metadata.

## Target timestamp model

- Add authoritative Daml `Time` fields alongside compatibility text metadata.
- `CollateralPolicy` exposes `validFromTime` and `validUntilTime`.
- `CapacityCredential` exposes typed `valuationTime`, `validFromTime`, `validUntilTime`, `freshnessWindowHours`, and `freshUntilTime`; its legacy valuation timestamp is retained as text metadata.
- `CredentialPresentation` exposes `presentedAtTime`, credential typed validity and freshness fields, and `presentationValidUntilTime`.
- `CapacityReservation` exposes `reservedAtTime` and `validUntilTime`, and carries the credential typed validity and freshness fields needed to reconstruct released capacity without refreshing stale attestations.
- Text timestamp fields remain display/interop metadata and are not authoritative for ledger-time validation.

## Compatibility strategy

- Bump the Passport Daml package version to `0.2.0` because template schemas change.
- Preserve existing text fields where practical, but move validation semantics to typed `Time` fields.
- Where an existing field name is better used as typed data, retain the legacy text value under an explicit metadata name such as `valuationTimestamp`.
- Downstream Markets should migrate to the 0.2.0 DAR and read `validFromTime`, `validUntilTime`, `valuationTime`, `freshUntilTime`, `presentedAtTime`, `presentationValidUntilTime`, `reservedAtTime`, and reservation `validUntilTime`.

## Architecture options considered

- Parse ISO timestamp `Text` in downstream consumers: rejected because Daml consumers need comparable ledger-native `Time` values and parser behavior would be duplicated outside the Passport schema.
- Add only helper choices without schema fields: rejected because Markets needs typed contract data for quote-acceptance validation and auditability.
- Replace all text timestamps with `Time`: rejected for this round because existing text fields remain useful for display, interop payloads, and migration.
- Add parallel typed `Time` fields and make them authoritative: chosen because it gives Markets comparable values while preserving text metadata.

## Chosen architecture and justification

Passport 0.2.0 adds typed temporal fields to policy, credential, presentation, and reservation contracts while preserving the non-executing collateral-readiness boundary. Ledger choices use `getTime` for acceptance, presentation, reservation, release, expiry, and metadata event timestamps where ledger time is authoritative. Attester-supplied valuation and validity windows remain explicit typed contract data, with Daml guards proving coherent windows and freshness deadlines.

This keeps Passport as readiness, presentation, reservation, revocation, expiry, release, dispute, audit disclosure, and handoff metadata. It does not add custody, transfer, settlement, clearing, token issuance, wallet operation, venue operation, downstream trade execution, legal-title proof, or production integration behavior.

## Implementation checklist

- [x] Confirm clean working tree and create follow-up branch.
- [x] Add typed `Time` fields to `CollateralPolicy`.
- [x] Add typed valuation, validity, and freshness fields to `CapacityCredential`.
- [x] Add typed presentation and credential validity fields to `CredentialPresentation`.
- [x] Add typed reservation validity fields to `CapacityReservation`.
- [x] Update choices to propagate typed time fields and use `getTime` for ledger-time checks.
- [x] Preserve text timestamp fields as metadata only.
- [x] Add Daml Script tests for typed happy path and stale/expired rejection paths.
- [x] Bump Daml package version and update test package data dependency.
- [x] Update docs and release/migration notes for Markets.
- [x] Update hardening map/frontier/change log for the new temporal invariant.
- [x] Build DAR and record SHA-256.
- [x] Run required hardening and CI checks.

## Test matrix

- Active policy validates inside `validFromTime`/`validUntilTime`.
- Policy validation rejects after typed `validUntilTime`.
- Credential presentation rejects after typed freshness expiry even when credential validity remains open.
- Presentation reservation rejects after typed presentation validity expiry.
- Reservation release rejects after typed reservation expiry.
- Reservation expiry uses typed ledger time and can consume an expired reservation.
- Legacy text timestamps are metadata only; typed `Time` fields control validation.
- Hardening gates cover out-of-scope behavior claims.

## Explicit non-goals

- No custody, transfer, settlement, clearing, collateral movement, token issuance, wallet operation, venue operation, downstream trade execution, margin engine, optimizer, credit decisioning, legal-title proof, ZK proof system, production identity integration, or live external integration.
- No dynamic plugin loading, eval-style execution, arbitrary plugin path resolution, or mutable runtime schema/plugin fetches.
- No CDM eligibility-engine execution or Rosetta Engine execution.
- No policy lifecycle redesign beyond typed validity helpers.
- No uniqueness-key redesign for logical IDs.

## Final verification results

- Initial working tree check: `git status --short` was clean before branching; no uncommitted user changes were present.
- Branch: `feature/typed-time-policy-reservation-freshness`.
- Core DAR: `packages/passport-core/.daml/dist/aevelum-passport-core-0.2.0.dar`.
- Core DAR SHA-256: `3b39cd70c9b7ff0dc856b4cf2913a37b4657ba7bfcfa5e3df99bc16702f3f89e`.
- Test DAR SHA-256: `0a7b4b4a89ba4f16ae2d88a44fe1a03eea55ed4a65200678553827fb5c689804`.
- `npm run hardening:frontier`: passed, 19 candidates, top `bd.ci.network-fetch-default`.
- `npm run hardening:formal`: passed, 7 obligations, 26 bounded checks, 235 assertions.
- `npm run hardening:gate`: passed, 2032 checks.
- `npm run daml:test`: passed, 11 external templates and 16 external template choices at 100% coverage.
- `npm run ci`: passed after regenerated tracked artifacts stabilized.
- Local verification used `DPM_SDK_VERSION=3.4.11` because this app shell's user-level active DPM SDK was `3.5.1-rc3`; package `daml.yaml` pins remain `3.4.11`.
