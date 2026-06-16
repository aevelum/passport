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

Passport is now a regulated-market readiness credential foundation. The Daml templates record externally attested readiness and scoped evidence; they do not grant licenses, determine legal compliance, admit participants to a venue, operate a venue, form trades, match orders, clear, settle, custody, transfer assets, issue tokens, or operate wallets.

## Current Daml contract set

```text
PassportAccount
CollateralPolicy
PolicyLifecycleEvent
CredentialRequest
CapacityCredential
CredentialPresentation
CapacityReservation
ReservationHandoffInstruction
ReservationDispute
CredentialRevocation
AuditDisclosureGrant
ReadinessAccount
ReadinessPolicy
ReadinessPolicyLifecycleEvent
ReadinessCredentialRequest
ReadinessCredentialActiveStatus
ReadinessCredential
ReadinessPresentation
ReadinessBinding
ReadinessRevocation
ReadinessAuditDisclosureGrant
VenueReadinessEvidence
```

`CapacityCredential` is the primary object for the collateral-capacity credential family. `ReadinessCredential` is the primary object for generic regulated-market readiness credentials. `ReadinessCredentialActiveStatus` is a minimal liveness witness visible to the holder, attester, and approved verifiers; it is not a raw credential, venue right, license, registration, or legal-compliance determination.

Venue-readiness validation uses the referenced `ReadinessBinding` and its live `ReadinessCredentialActiveStatus` to reject revoked, stale, or expired evidence before a consumer relies on a `VenueReadinessEvidence` wrapper.

## Privacy model at the spec layer

The model uses signatories and observers to control visibility:

- Holder and attester see the full `CapacityCredential`.
- Verifier sees only `CredentialPresentation` and `CapacityReservation`.
- Auditor sees only `AuditDisclosureGrant` unless separately authorized.
- Holder and attester see the full `ReadinessCredential`.
- Approved verifiers see scoped `ReadinessPresentation`, `ReadinessBinding`, `VenueReadinessEvidence`, and the minimal `ReadinessCredentialActiveStatus` liveness witness.
- Auditor sees only `ReadinessAuditDisclosureGrant` unless separately authorized.
- Outsider sees nothing.

## No hidden product behavior

No service may create business state outside the Daml templates. Future APIs should be command wrappers and query views only.
