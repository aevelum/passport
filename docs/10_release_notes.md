# 10 Release Notes

## 0.3.0 - Generic Regulated-Market Readiness Credentials

Passport 0.3.0 upgrades the public Canton/Daml foundation from collateral-readiness-only to regulated-market readiness credentials, with collateral capacity remaining the first credential family.

### Schema changes

- Adds `Aevelum.Passport.Readiness.Types` and `Aevelum.Passport.Readiness.Foundation`.
- Adds `ReadinessAccount`, `ReadinessPolicy`, `ReadinessPolicyLifecycleEvent`, `ReadinessCredentialRequest`, `ReadinessCredential`, `ReadinessPresentation`, `ReadinessBinding`, `ReadinessRevocation`, and `ReadinessAuditDisclosureGrant`.
- Adds `ReadinessCredentialKind` values for participant eligibility, license or registration attestation, venue access readiness, product eligibility, operational capability, disclosure consent, settlement or clearing readiness evidence, collateral capacity readiness, and other readiness credentials.
- Adds `LicenseAttestationScope` and requires `attestationOnly = True` for license or registration attestation credentials.
- Adds `Aevelum.Passport.VenueReadiness.Types`, `Aevelum.Passport.VenueReadiness.Foundation`, and `VenueReadinessEvidence`.

### Validation behavior

- Readiness policies, credentials, presentations, bindings, revocations, audit grants, and venue-readiness evidence use typed Daml `Time` fields where ledger-time validation matters.
- Readiness credential issuance checks holder, attester, credential kind, jurisdiction, activity refs, policy validity, and credential validity.
- Readiness presentation rejects expired or stale credentials.
- Readiness binding is a non-executing evidence record tied to workflow, venue profile, or rulebook context.

### Migration notes for Markets

- Update Markets DAR dependency from `aevelum-passport-core-0.2.0.dar` to `aevelum-passport-core-0.3.0.dar`.
- Use generic readiness templates for participant eligibility, license or registration attestation, venue access readiness, product eligibility, operational capability, disclosure consent, and settlement or clearing readiness evidence.
- Continue using collateral-capacity templates for the existing repo pre-trade capacity credential and reservation demo until Markets migrates that family onto generic readiness objects.

### Release artifact

- DAR: `packages/passport-core/.daml/dist/aevelum-passport-core-0.3.0.dar`

### Boundary

Passport records attested readiness and scoped evidence only. Passport does not grant licenses, register participants, approve legal compliance, admit participants to a venue, operate a venue, execute trades, form trades, match orders, clear, settle, custody, transfer assets, issue tokens, operate wallets, decide credit, determine legal title, provide production identity, or provide live external integration.

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
