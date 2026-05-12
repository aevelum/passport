# 05 Privacy Model

Passport privacy is modeled through Daml signatories, observers, and choices.

## Visibility by object

| Object | Signatories | Observers | Purpose |
|---|---|---|---|
| `PassportAccount` | Holder | Optional operator | Holder account root. |
| `CollateralPolicy` | Policy publisher | Approved holders and attesters | Policy disclosure. |
| `CapacityCredential` | Holder, attester | None by default | Private capacity statement. |
| `CredentialPresentation` | Holder | Verifier, attester | Scoped verifier-facing result. |
| `CapacityReservation` | Holder, attester, verifier | Optional execution rail and auditor | Reserved capacity state. |
| `CredentialRevocation` | Attester | Holder and prior verifiers | Revocation notice. |
| `AuditDisclosureGrant` | Holder, attester | Auditor | Scoped audit metadata. |

## Privacy invariants

1. Verifier must not see raw collateral inventory by default.
2. Presentation must use threshold/band semantics, not full portfolio details.
3. Outsider sees no credential, presentation, reservation, or audit grant.
4. Audit grants reveal only named metadata fields.
5. Raw evidence remains outside the verifier-facing payload.
