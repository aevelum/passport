# Daml Ledger Core Formal Ladder

- target: Passport Daml ledger core
- pinned_source: git:HEAD
- scope_gate: public Canton/Daml collateral-readiness foundation only
- severity_gate: high and critical Daml properties
- surface: cmp.daml.ledger-schema
- property_id: prop.daml.release-preserves-policy-publisher
- checker: npm run hardening:formal
- result_status: bounded-pass

## S0. Security Objective

Passport ledger transitions must preserve the parties, amounts, visibility boundaries, and policy lineage carried by a capacity credential. A reservation may consume presented reservable capacity and create a residual credential, but it must not inflate capacity, widen visibility, mutate a handoff into execution behavior, or replace the policy publisher when capacity is released.

## S1. Formal Specification

### State

- `Credential(holder, attester, policyPublisher, reservableAmount, status)`
- `Presentation(holder, attester, verifier, policyPublisher, presentedReservableAmount)`
- `Reservation(holder, attester, verifier, policyPublisher, reservedAmount, active)`
- `ResidualCredential(holder, attester, policyPublisher, reservableAmount)`
- `Handoff(reservationId, holder, attester, verifier, handoffRecipient)`
- `AuditGrant(holder, attester, auditor, allowedFields)`

### Actors

- Holder controls account-root requests and presentations.
- Holder and attester jointly issue, expire, supersede, and audit-disclose credential state where the Daml choice requires both.
- Holder, attester, and verifier jointly reserve, release, expire, hand off, or dispute a reservation.
- Outsider is never in any signatory or observer set for credential, presentation, reservation, handoff, or audit-grant state.

### Transitions

- `Present`: copies holder, attester, verifier, policy publisher, capacity band, and reservable amount from an active credential into a scoped presentation.
- `Reserve`: allowed only when reservation is enabled, `reservedAmount > 0`, and `reservedAmount <= presentedReservableAmount`; it archives the source credential, creates one active reservation, and creates a residual credential only when the reserved amount is less than the presented reservable amount.
- `Release`: consumes an active reservation and creates a credential for the reserved amount using the reservation's original policy publisher.
- `Handoff`: creates a metadata-only handoff record without consuming or mutating the reservation.
- `AuditGrant`: creates a scoped grant with a nonempty allowed-field list and no full credential observer path.

### Invariants

- Reservation amount is positive and bounded by the presented reservable amount.
- Residual credential amount equals `presentedReservableAmount - reservedAmount` when residual capacity exists.
- Released credential policy publisher equals the policy publisher recorded on the reservation.
- Handoff visibility is isolated to the handoff record and does not add the handoff recipient to the reservation.
- Audit visibility is isolated to the audit grant and does not expose the full credential.
- Each externally relevant choice is controlled by the role set named in the Daml template.

### Forbidden States

- A reservation exists with `reservedAmount <= 0`.
- A reservation exists with `reservedAmount > presentedReservableAmount`.
- A residual credential exists with any amount other than `presentedReservableAmount - reservedAmount`.
- A released credential uses verifier as policy publisher when the original policy publisher differs.
- A handoff recipient can query the reservation solely because a handoff exists.
- An audit grant with empty allowed fields exists.

## S2. Executable Reference Model

- model_path: hardening/formal/daml-ledger-core/reference-model.mjs
- model_status: bounded-pass

The executable model enumerates small reservation amounts and distinct actor roles. It checks the conservation, lineage, handoff-isolation, visibility, and authorization obligations against bounded states. This is a bounded falsifier for the specification, not an unbounded theorem result.

## S3. Implementation Mapping

| Spec entity | Implementation entity | Evidence |
| --- | --- | --- |
| `Credential` | `CapacityCredential` | `packages/passport-core/daml/Aevelum/Passport/Foundation.daml` |
| `Presentation` | `CredentialPresentation` | `packages/passport-core/daml/Aevelum/Passport/Foundation.daml` |
| `Reservation` | `CapacityReservation` | `packages/passport-core/daml/Aevelum/Passport/Foundation.daml` |
| `Reserve` | `ReserveFromPresentation` | `packages/passport-core/daml/Aevelum/Passport/Foundation.daml` |
| `Release` | `ReleaseReservation` | `packages/passport-core/daml/Aevelum/Passport/Foundation.daml` |
| `Handoff` | `CreateReservationHandoff` and `ReservationHandoffInstruction` | `packages/passport-core/daml/Aevelum/Passport/Foundation.daml` |
| `AuditGrant` | `GrantAuditDisclosureFromAccount` and `AuditDisclosureGrant` | `packages/passport-core/daml/Aevelum/Passport/Foundation.daml` |
| Bounded checker | `validate-formal.mjs` and `reference-model.mjs` | `npm run hardening:formal` |

## S4. Proof Obligations

| ID | Obligation | Status | Checked by | Notes |
| --- | --- | --- | --- | --- |
| PO-DAML-001 | Reservations are positive and cannot exceed the presented reservable amount. | bounded-pass | `npm run hardening:formal`; `npm run daml:test` | Bound covers invalid zero, negative, and over-limit amounts. |
| PO-DAML-002 | Residual capacity is subtractive and cannot create more capacity than the presentation supplied. | bounded-pass | `npm run hardening:formal`; `npm run daml:test` | Bound covers partial and full reservations. |
| PO-DAML-003 | Handoff records are metadata-only, nonconsuming, and do not widen reservation visibility. | bounded-pass | `npm run hardening:formal`; `npm run daml:test` | Bound keeps reservation active and excludes handoff recipient from reservation visibility. |
| PO-DAML-004 | Released credentials preserve reservation policy publisher even when publisher and verifier differ. | bounded-pass | `npm run hardening:formal`; `npm run daml:test` | Regression test uses distinct policy publisher and verifier parties. |
| PO-DAML-005 | Externally relevant Daml choices remain controlled by holder, attester, verifier, or publisher role sets. | bounded-pass | `npm run hardening:formal`; `npm run daml:test` | Source assertions cover controller sets and mapped choices. |
| PO-DAML-006 | Formal obligations are mapped to invariant properties, implementation references, and active evidence commands. | bounded-pass | `npm run hardening:formal` | Validator fails on missing map properties, stale source snippets, or inactive tests. |

## S5. Machine-Check Layer

- checker: bounded reference model plus source and invariant-map validator
- artifact_path: hardening/formal/daml-ledger-core
- command: npm run hardening:formal
- expected_pass_condition: all proof obligations map to active invariant-map properties, bounded model checks pass, and required Daml/test snippets are present
- result_status: bounded-pass
- evidence_path: hardening/formal/daml-ledger-core/obligations.json

## S6. Assumption Register

| ID | Assumption | Type | Risk if false |
| --- | --- | --- | --- |
| A-1 | Daml signatory, observer, and controller semantics are enforced by Canton/Daml as specified by the SDK used in CI. | platform | The model would overstate authorization or visibility guarantees. |
| A-2 | `IsoTimestamp` remains an opaque text value in this milestone and is not used for ordered-time proof obligations. | scope | Expiry or freshness proofs would need a typed time model before stronger claims. |
| A-3 | Text identifiers are logical aliases, not uniqueness keys, unless a future Daml key design is added. | scope | Duplicate logical IDs remain outside this bounded layer. |
| A-4 | The bounded reference model intentionally checks small finite amount sets and distinct actor roles. | checker-bound | It can catch mapped regressions but does not exhaust all decimal values or all party graphs. |

## Handoff Notes

- invariant_map_update: add formal Daml ledger core component, release lineage property, and formal validator evidence.
- followup_round: deepen typed time validity and policy-contract binding after the release lineage fix is guarded.
- poc_needed: no.
- duplicate_check_needed: no.
- report_packaging_needed: no.
