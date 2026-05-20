# 10 Release Notes

## 0.2.0 - Typed Time Policy And Reservation Freshness

Passport 0.2.0 upgrades the Daml schema so downstream Canton/Daml consumers can validate policy validity, credential freshness, presentation freshness, and reservation validity with typed `Time` values instead of parsing ISO timestamp `Text`.

### Schema changes

- `CollateralPolicy` adds `validFromTime` and `validUntilTime`.
- `CapacityCredential` uses typed `valuationTime` and adds `validFromTime`, `validUntilTime`, `freshnessWindowHours`, and `freshUntilTime`; `valuationTimestamp` carries the legacy text timestamp.
- `CredentialPresentation` adds `presentedAtTime`, typed credential validity/freshness fields, and `presentationValidUntilTime`.
- `CapacityReservation` adds `reservedAtTime` and `validUntilTime`, and carries source credential typed validity/freshness fields for release without freshness refresh.
- Audit grants, revocations, reservation handoff records, and reservation disputes now carry typed ledger-time metadata where the Daml choice records the event time.

### Validation behavior

- `ValidatePolicyActiveAtLedgerTime` checks a policy against ledger `getTime`.
- `PresentToVerifier` rejects credentials outside typed validity or freshness windows.
- `ReserveFromPresentation` rejects expired presentations and reservations whose typed expiry is not after ledger reservation time or outlives presentation validity.
- `ReleaseReservation`, `ExpireReservation`, `CreateReservationHandoff`, and `DisputeReservation` use ledger time against typed reservation validity.

### Migration notes for Markets

- Treat typed `Time` fields as authoritative.
- Treat ISO timestamp text fields as display and interop metadata only.
- Update Markets DAR dependency from `aevelum-passport-core-0.1.0.dar` to `aevelum-passport-core-0.2.0.dar`.
- During quote acceptance, compare Markets ledger time with Passport `CollateralPolicy.validUntilTime`, `CapacityCredential.freshUntilTime`, `CredentialPresentation.presentationValidUntilTime`, and `CapacityReservation.validUntilTime`.

### Release artifact

- DAR: `packages/passport-core/.daml/dist/aevelum-passport-core-0.2.0.dar`
- SHA-256: `3b39cd70c9b7ff0dc856b4cf2913a37b4657ba7bfcfa5e3df99bc16702f3f89e`

### Boundary

Passport remains collateral-readiness, presentation, reservation, revocation, expiry, release, dispute, audit disclosure, and handoff metadata. It does not custody, transfer, settle, clear, move collateral, issue tokens, operate a wallet, operate a venue, execute downstream trades, prove legal title, or provide production external integration.
