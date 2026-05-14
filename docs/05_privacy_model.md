# 05 Privacy Model

Passport privacy is modeled through Daml signatories, observers, and choices.

## Visibility by object

| Object | Signatories | Observers | Purpose |
|---|---|---|---|
| `PassportAccount` | Holder | Optional operator | Holder account root. |
| `CollateralPolicy` | Policy publisher | Approved holders and attesters | Policy disclosure. |
| `CapacityCredential` | Holder, attester | None by default | Private capacity statement. |
| `CredentialPresentation` | Holder | Verifier, attester | Scoped verifier-facing result. |
| `CapacityReservation` | Holder, attester, verifier | Optional handoff observer and auditor | Reserved capacity state. |
| `ReservationHandoffInstruction` | Holder, attester, verifier | Handoff recipient | Metadata-only readiness notice for a downstream system. |
| `CredentialRevocation` | Attester | Holder and prior verifiers | Revocation notice. |
| `AuditDisclosureGrant` | Holder, attester | Auditor | Scoped audit metadata. |

## Privacy invariants

1. Verifier must not see raw collateral inventory by default.
2. Presentation must use threshold/band semantics, not full portfolio details.
3. Outsider sees no credential, presentation, reservation, or audit grant.
4. Audit grants reveal only named metadata fields.
5. Raw evidence remains outside the verifier-facing payload.
6. Reservation handoff records readiness metadata only; it does not execute, settle, transfer, custody, or move collateral.
