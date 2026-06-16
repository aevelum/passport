# 05 Privacy Model

Passport privacy is modeled through Daml signatories, observers, and choices.

Passport records readiness attestations and scoped evidence only. ReadinessCredential is visible to holder and attester. ReadinessCredentialActiveStatus is visible to holder, attester, and approved verifiers as a minimal revocation liveness witness, not as a raw credential. ReadinessPresentation and ReadinessBinding are visible to holder, attester, and verifier. ReadinessAuditDisclosureGrant is visible to the auditor. VenueReadinessEvidence is visible to holder, attester, and verifier. CapacityReservation is visible to holder, attester, and verifier. ReservationHandoffInstruction is visible to the handoff recipient. AuditDisclosureGrant is visible to the auditor.

## Visibility by object

| Object | Signatories | Observers | Purpose |
|---|---|---|---|
| `PassportAccount` | Holder | Optional operator | Holder account root. |
| `CollateralPolicy` | Policy publisher | Approved holders and attesters | Policy disclosure. |
| `CapacityCredential` | Holder, attester | None by default | Private capacity statement. |
| `CredentialPresentation` | Holder | Verifier, attester | Scoped verifier-facing result. |
| `CapacityReservation` | Holder, attester, verifier | None beyond signatories | Reserved capacity state visible to holder, attester, and verifier. |
| `ReservationHandoffInstruction` | Holder, attester, verifier | Handoff recipient | Metadata-only readiness notice for a downstream system. |
| `CredentialRevocation` | Attester | Holder and prior verifiers | Revocation notice. |
| `AuditDisclosureGrant` | Holder, attester | Auditor | Scoped audit metadata. |
| `ReadinessAccount` | Holder | Optional operator | Generic readiness account root. |
| `ReadinessPolicy` | Policy publisher | Approved holders, attesters, and verifiers | Readiness policy disclosure. |
| `ReadinessCredential` | Holder, attester | None by default | Private readiness statement. |
| `ReadinessCredentialActiveStatus` | Holder, attester | Approved verifiers | Minimal active-status witness consumed on revocation. |
| `ReadinessPresentation` | Holder | Verifier, attester | Scoped verifier-facing readiness result. |
| `ReadinessBinding` | Holder, attester, verifier | None beyond signatories | Non-executing evidence binding to workflow or venue-profile context. |
| `ReadinessRevocation` | Attester | Holder and prior verifiers | Readiness revocation notice. |
| `ReadinessAuditDisclosureGrant` | Holder, attester | Auditor | Scoped readiness audit metadata. |
| `VenueReadinessEvidence` | Holder, attester, verifier | None beyond signatories | Markets-facing evidence wrapper over a readiness binding. |

## Privacy invariants

1. Verifier must not see raw collateral inventory by default.
2. Presentation must use threshold/band semantics, not full portfolio details.
3. Outsider sees no credential, presentation, reservation, or audit grant.
4. Audit grants reveal only named metadata fields.
5. Raw evidence remains outside the verifier-facing payload.
6. Reservation handoff records readiness metadata only; it does not execute, settle, transfer, custody, or move collateral.
7. Handoff visibility is isolated to `ReservationHandoffInstruction`; audit visibility is isolated to `AuditDisclosureGrant`.
8. License or registration credentials expose attestation metadata only and must not expose a legal grant, permission, venue admission, or compliance decision.
9. Readiness bindings are evidence-only context records; they do not form trades, match orders, clear, settle, custody, or transfer assets.
10. Active-status witnesses prove revocation liveness only; they do not expose raw credentials or grant venue rights.
