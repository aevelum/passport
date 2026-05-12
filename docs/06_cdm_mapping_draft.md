# 06 CDM Mapping Draft

This is a CDM-aligned mapping draft, not a formal conformance statement.

Passport aims to map Canton-native credential objects to market concepts used in repo, securities lending, margin, and collateral-management workflows.

| Passport object | Market/CDM-aligned concept |
|---|---|
| `PassportAccount` | Party/account role. |
| `CollateralPolicy` | Eligibility schedule, collateral terms, haircut and concentration references. |
| `CredentialRequest` | Request for collateral-capacity evaluation. |
| `CapacityCredential` | Eligible collateral capacity representation. |
| `CredentialPresentation` | Scoped counterparty disclosure of capacity. |
| `CapacityReservation` | Allocation, lock, or pre-settlement reservation. |
| `CredentialRevocation` | Lifecycle event, correction, revocation, or supersession. |
| `AuditDisclosureGrant` | Permissioned evidence and audit trail. |
| `haircutScheduleRef` | Valuation/haircut reference. |
| `evidenceManifestHash` | Evidence provenance reference. |
| `calculationMethodHash` | Calculation provenance reference. |

## Committee-facing statement

Passport does not invent a new market standard. It proposes a Daml-native credential implementation that can be mapped to existing collateral lifecycle concepts.
