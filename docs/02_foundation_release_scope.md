# 02 Foundation Release Scope

## Canonical Passport Scope

Aevelum Passport is the public Canton/Daml foundation for private regulated-market readiness credentials. Collateral capacity is the first credential family.

Passport records attested readiness and scoped evidence only. It models readiness accounts, readiness policies, credential requests, credential issuance, scoped presentation, binding to workflow or venue-profile context, revocation, expiry-by-validity, audit disclosure, and venue-readiness evidence wrappers. It also preserves collateral-capacity accounts, collateral policies, counterparty-scoped presentation, bounded reservation, residual capacity, revocation, expiry, dispute metadata, reservation handoff metadata, and scoped audit disclosure as the first credential family. Passport may emit bounded interop artifacts and adapter-readiness reports.

Passport may record a reservation handoff notice. The notice is for downstream readiness metadata only. Passport does not grant licenses or legal permissions. Passport does not admit participants to a venue. Passport does not determine legal compliance. Passport does not execute the downstream trade. Passport does not custody, transfer, settle, clear, or move collateral or assets.

Passport 0.3.0 adds generic regulated-market readiness templates and keeps ledger-comparable Daml `Time` fields authoritative for policy validity, credential validity/freshness, presentation validity, binding freshness, audit validity, and event times. ISO timestamp text fields are retained as display and interop metadata only.

ReadinessCredential is visible to holder and attester. ReadinessPresentation and ReadinessBinding are visible to holder, attester, and verifier. ReadinessAuditDisclosureGrant is visible to the auditor. VenueReadinessEvidence is visible to holder, attester, and verifier. CapacityReservation is visible to holder, attester, and verifier. ReservationHandoffInstruction is visible to the handoff recipient. AuditDisclosureGrant is visible to the auditor.

Aevelum Passport demonstrates a roomless Canton-native collateral credential account for repo pre-trade capacity verification and reservation.

## Public Core Workflow

The public core proves two committee-ready readiness workflows:

> generic regulated-market readiness credentialing, scoped presentation, workflow or venue-profile binding, and scoped audit disclosure.

> repo pre-trade collateral-capacity credentialing, presentation, reservation, and non-executing reservation handoff metadata.

## In scope

- Collateral-capacity account creation and close.
- Readiness account creation and close.
- Readiness policy publish and retire.
- Participant eligibility, license or registration attestation, venue access readiness, product eligibility, operational capability, disclosure consent, settlement or clearing readiness evidence, and collateral capacity readiness credential kinds.
- Attestation-only license or registration scope.
- Scoped readiness presentation and workflow or venue-profile binding.
- Venue readiness evidence wrapper referencing a valid readiness binding.
- Collateral policy publish, amend, and retire.
- Credential request and issuance.
- Counterparty-scoped presentation.
- Bounded reservation and residual capacity.
- Reservation release, expiry, dispute metadata, and reservation handoff metadata.
- Credential revocation, expiry, and supersession.
- Scoped audit disclosure.
- Repo pre-trade capacity verification and reservation demo.
- Securities-lending pre-trade, margin capacity check, and secured-credit pre-clearance as presentation or reservation purposes only.
- Daml Script tests.
- Privacy assertions.
- Framework-neutral interop adapter surface.
- CDM 6.0 collateral eligibility plugin at Level 2 — Artifact Conformance.
- Local structural gates.
- Typed Daml `Time` validity and freshness fields for downstream ledger-time comparison.

## Out of scope

- Not repo execution or securities-lending execution.
- Not a repo venue, securities-lending venue, or any other trading venue.
- Not an exchange, ATS, SEF, MTF, regulated market, matching engine, or order book.
- Not license granting, legal permission granting, participant registration, venue admission, or legal-compliance determination.
- Not a margin engine.
- Not asset custody, a custody module, or a wallet.
- Not clearing, settlement, a settlement rail, or transaction finality.
- Not collateral transfer, asset transfer, collateral movement, token issuance, or token movement.
- Not collateral optimization.
- Not credit approval or credit decisioning.
- Not legal-title determination.
- Not ZK proofs or a ZK proof system.
- Not a diligence room or diligence workspace UI.
- Not production identity integration.
- Not live external integration.
- Not Rosetta Engine execution, CDM eligibility-engine execution, or formal standards-body endorsement.
- Not Canton Token Standard integration or production partner integration.

## Acceptance definition

The public core is acceptable when it can show:

1. policy publication;
2. credential request;
3. credential issuance;
4. scoped presentation;
5. readiness binding to workflow or venue-profile context;
6. license or registration attestation with `attestationOnly = True`;
7. partial collateral reservation;
8. residual credential issuance;
9. reservation handoff metadata as a non-executing notice;
10. reservation release;
11. reservation expiry and dispute metadata;
12. revocation, expiry, and supersession;
13. scoped audit disclosure;
14. unauthorized party non-visibility.
