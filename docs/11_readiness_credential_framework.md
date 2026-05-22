# 11 Readiness Credential Framework

Aevelum Passport is the public Canton/Daml foundation for private regulated-market readiness credentials. Collateral capacity is the first credential family.

The generic readiness model covers:

- participant eligibility;
- license or registration attestation;
- venue access readiness;
- product eligibility;
- operational capability;
- disclosure consent;
- settlement or clearing readiness evidence;
- collateral capacity readiness.

Passport records attested readiness and scoped evidence only. External legal, regulatory, licensing, custody, settlement, and clearing systems remain external.

## Ledger Spine

```text
ReadinessAccount
ReadinessPolicy
ReadinessCredentialRequest
ReadinessCredential
ReadinessPresentation
ReadinessBinding
ReadinessRevocation
ReadinessAuditDisclosureGrant
```

`ReadinessPolicy` controls approved holders, attesters, verifiers, credential kinds, jurisdictions, activity refs, policy validity, and freshness. `ReadinessCredentialRequest` captures the holder request. `ReadinessCredential` records the attester-backed result. `ReadinessPresentation` scopes fields to a verifier. `ReadinessBinding` ties a presentation to workflow, venue-profile, or rulebook context without executing that workflow.

## Boundary

Passport does not grant licenses, register participants, approve legal compliance, admit participants to a venue, operate a venue, form trades, match orders, clear, settle, custody, transfer assets, issue tokens, operate wallets, decide credit, or determine legal title.
