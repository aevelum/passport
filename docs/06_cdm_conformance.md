# 06 CDM Conformance

Passport uses its Daml templates as the Canton ledger schema and uses FINOS CDM as the external collateral eligibility interchange model.

This release makes the following bounded claim:

> Formal FINOS CDM 6.0 JSON-schema conformance for Passport collateral eligibility fixtures.

## Pinned CDM scope

- CDM schema family: `6.0`
- Source index: <https://cdm.finos.org/schemas/6.0/>
- Vendored subset: `schemas/cdm/6.0/`
- Fixture root types:
  - `EligibleCollateralSpecification`
  - `EligibilityQuery`
  - `CheckEligibilityResult`

The fixture set models a U.S. Treasury, USD, sovereign-debt repo pre-trade eligibility check. It is intentionally scoped to collateral eligibility and capacity evidence. It does not model repo execution, settlement, custody, optimization, full `TradeState`, or Rosetta Engine function execution.

## Local validation

```bash
npm run cdm:validate
```

The validator runs offline against the vendored FINOS CDM schema closure and writes `artifacts/cdm_conformance_report.json`.

To refresh the schema subset explicitly:

```bash
npm run cdm:vendor-schemas
```

Schema refresh is not part of default CI because conformance must be reproducible from committed files.

## Passport mapping

| Passport object | CDM collateral role |
|---|---|
| `CollateralPolicy` | `EligibleCollateralSpecification` and `EligibleCollateralCriteria` |
| `CapacityCredential` | Evidence-backed capacity representation derived from eligible collateral criteria |
| `CredentialPresentation` | Scoped disclosure of eligibility and available reservable capacity |
| `CapacityReservation` | Pre-execution allocation against presented eligible capacity |
| `CredentialRevocation` | Local lifecycle event for stale, corrected, expired, or superseded eligibility evidence |
| `AuditDisclosureGrant` | Permissioned evidence and validation metadata disclosure |

This is schema conformance, not FINOS certification. Certification, Rosetta function execution, and broader lifecycle modeling are future work.
