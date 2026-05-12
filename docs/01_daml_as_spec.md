# 01 Daml as Specification

The Daml package is the normative product specification.

Product behavior must be traceable to one of:

1. a Daml template;
2. a Daml field;
3. a Daml signatory or observer rule;
4. a Daml choice;
5. a Daml Script test.

Markdown docs explain the model. They do not define behavior independently of the Daml model.

## Core rule

```text
Daml spec -> Daml Script tests -> committee demo -> thin service wrapper -> UI
```

The initial build contains no API, database, web dashboard, or external integration. Those can wrap ledger commands after the Daml model is accepted.

## Normative object spine

```text
PassportAccount
CollateralPolicy
CredentialRequest
CapacityCredential
CredentialPresentation
CapacityReservation
CredentialRevocation
AuditDisclosureGrant
```

## Privacy model at the spec layer

The model uses signatories and observers to control visibility:

- Holder and attester see the full `CapacityCredential`.
- Verifier sees only `CredentialPresentation` and `CapacityReservation`.
- Auditor sees only `AuditDisclosureGrant` unless separately authorized.
- Outsider sees nothing.

## No hidden product behavior

No service may create business state outside the Daml templates. Future APIs should be command wrappers and query views only.
