# round-0005: Passport Scope Boundary Alignment

## Objective

Align Passport main branch with the canonical public-core scope by replacing borderline execution terminology with non-executing reservation handoff terminology and enforcing the boundary in docs, Daml, gates, and generated artifacts.

This round also removes dormant reservation-level observer and status surfaces so the public core has one visibility path per disclosure object.

## Selected Surfaces

- Daml domain boundary.
- Repo pre-trade workflow boundary.
- Interop adapter boundary.
- Non-goal and scope documentation.
- Structural gates.

## Canonical Scope

Aevelum Passport is the public Canton/Daml foundation for private collateral-readiness credentials. It models collateral-capacity accounts, collateral policies, credential requests, credential issuance, counterparty-scoped presentation, bounded reservation, residual capacity, revocation, expiry, dispute metadata, reservation handoff metadata, and scoped audit disclosure. Passport may emit bounded interop artifacts and adapter-readiness reports.

Passport records readiness. Passport may record a reservation handoff notice. Passport does not execute the downstream trade. Passport does not custody, transfer, settle, or move collateral.

`CapacityReservation` is visible to holder, attester, and verifier. Handoff visibility is isolated to `ReservationHandoffInstruction`. Auditor visibility is isolated to `AuditDisclosureGrant`.

## Kill Gates

- Hardening gate fails if Passport-owned Daml contains execution, custody, settlement, wallet, optimizer, credit-decision, or proof-system implementation language.
- Hardening gate fails if Passport-owned Daml contains reservation-level handoff observers, reservation-level optional auditors, or a handoff status variant.
- Structural gate fails if README or docs lose the canonical scope or non-goal language.
- Tests fail if reservation handoff metadata is not covered or if the handoff recipient sees the reservation through a reservation-level observer.
- Generated artifacts must be current.
- CDM remains Level 2 — Artifact Conformance and does not overclaim.

## Cleanup Notes

- Reservation-level optional handoff and auditor observers were removed.
- Handoff visibility is isolated to `ReservationHandoffInstruction`.
- Auditor visibility is isolated to `AuditDisclosureGrant`.
- The handoff status variant was removed because handoff is nonconsuming metadata, not a reservation-state transition.

## Evidence

- `npm run demo`
- `npm run interop:generate`
- `npm run interop:validate`
- `npm run hardening:map`
- `npm run hardening:frontier`
- `npm run hardening:select`
- `npm run hardening:gate`
- `npm run gate`
- `npm run daml:test`
- `npm run canton:smoke`
- `npm run ci`
- `npm run package`

## Next Frontier

- Keep future adapters documented only as candidates unless evidence, implementation, and gates support promotion.
- Keep downstream trade, custody, settlement, transfer, wallet, venue, optimizer, credit, legal-title, proof-system, production-identity, and live-integration behavior outside this public core.
