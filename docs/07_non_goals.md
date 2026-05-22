# 07 Non-Goals

Passport records attested readiness and scoped evidence only: eligibility, presentation, binding, reservation, revocation, expiry-by-validity, audit, bounded interop artifacts, and adapter readiness reports. Passport may record a reservation handoff notice.

ReadinessCredential is visible to holder and attester. ReadinessPresentation and ReadinessBinding are visible to holder, attester, and verifier. ReadinessAuditDisclosureGrant is visible to the auditor. VenueReadinessEvidence is visible to holder, attester, and verifier. CapacityReservation is visible to holder, attester, and verifier. ReservationHandoffInstruction is visible to the handoff recipient. AuditDisclosureGrant is visible to the auditor.

Passport intentionally excludes:

- not repo execution;
- not securities-lending execution;
- not venue operation;
- not exchange operation;
- not ATS operation;
- not SEF operation;
- not MTF operation;
- not regulated market operation;
- not matching engine operation;
- not order book operation;
- not participant registration;
- not license granting;
- not legal permission granting;
- not venue admission;
- not legal-compliance determination;
- not a margin engine;
- not clearing;
- not a clearinghouse;
- not asset custody;
- not a wallet;
- not settlement;
- not collateral transfer;
- not asset transfer;
- not token issuance;
- not collateral movement;
- not token movement;
- not collateral optimization;
- not credit approval;
- not credit decisioning;
- not legal-title determination;
- not ZK proofs;
- not diligence workspace UX;
- not production identity integration;
- not live external integration;
- not Rosetta Engine execution;
- not formal standards-body endorsement.

## Safe claim

Aevelum Passport is a public Canton/Daml foundation for private regulated-market readiness credentials. Collateral capacity is the first credential family.

## Unsafe claims

Passport must not claim to be a venue, exchange, ATS, SEF, MTF, regulated market, matching engine, order book, custodian, clearinghouse, settlement system, collateral-transfer system, asset-transfer system, token issuer, optimizer, credit decision engine, legal-title system, legal-compliance engine, licensing authority, participant registry, ZK proof system, wallet, production identity system, or live external integration.

Passport does not grant licenses or legal permissions. Passport does not admit participants to a venue. Passport does not execute the downstream trade. Passport does not custody, transfer, settle, clear, or move collateral or assets.
