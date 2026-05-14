# 02 Foundation Release Scope

## Canonical Passport Scope

Aevelum Passport is the public Canton/Daml foundation for private collateral-readiness credentials.

Passport records readiness. It models collateral-capacity accounts, collateral policies, credential requests, credential issuance, counterparty-scoped presentation, bounded reservation, residual capacity, revocation, expiry, dispute metadata, reservation handoff metadata, and scoped audit disclosure. Passport may emit bounded interop artifacts and adapter-readiness reports.

Passport may record a reservation handoff notice. The notice is for downstream readiness metadata only. Passport does not execute the downstream trade. Passport does not custody, transfer, settle, or move collateral.

Aevelum Passport demonstrates a roomless Canton-native collateral credential account for repo pre-trade capacity verification and reservation.

## Public Core Workflow

The public core proves one committee-ready readiness workflow:

> repo pre-trade collateral-capacity credentialing, presentation, reservation, and non-executing reservation handoff metadata.

## In scope

- Collateral-capacity account creation and close.
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

## Out of scope

- Not repo execution or securities-lending execution.
- Not a repo venue, securities-lending venue, or any other trading venue.
- Not a margin engine.
- Not asset custody, a custody module, or a wallet.
- Not settlement, a settlement rail, or transaction finality.
- Not collateral transfer, collateral movement, or token movement.
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
5. partial reservation;
6. residual credential issuance;
7. reservation handoff metadata as a non-executing notice;
8. reservation release;
9. reservation expiry and dispute metadata;
10. revocation, expiry, and supersession;
11. scoped audit disclosure;
12. unauthorized party non-visibility.
