# ADR 0002: Readiness Credential Expansion

## Status

Accepted for Passport 0.3.0.

## Context

Passport 0.2.0 modeled collateral-capacity readiness only. Future Markets workflows need a common readiness credential foundation for participant eligibility, license or registration attestation, venue access readiness, product eligibility, operational capability, disclosure consent, settlement or clearing readiness evidence, and collateral capacity readiness.

## Decision

Keep the Phase A expansion inside `passport-core` and bump the package to `0.3.0`. Add generic readiness modules and venue-readiness wrappers while preserving the existing collateral-capacity templates and tests.

License or registration credentials are attestation-only. The model requires `LicenseAttestationScope.attestationOnly = True`.

VenueReadinessEvidence is a wrapper around a ReadinessBinding. Consumers must validate or cross-check the underlying ReadinessBinding before relying on VenueReadinessEvidence. Markets Phase C must not trust string readiness refs or copied wrapper fields alone. VenueReadinessUse must match ReadinessBindingPurpose.

## Consequences

Markets can vendor one Passport DAR and read generic readiness evidence without Passport becoming a venue or licensing authority.

Passport must maintain gates and tests proving it does not grant licenses, register participants, determine legal compliance, admit participants to a venue, operate venues, execute trades, match orders, clear, settle, custody, transfer assets, issue tokens, operate wallets, decide credit, or determine legal title.

Passport still does not admit participants, operate venues, grant licenses, determine compliance, execute trades, form trades, settle, clear, custody, transfer assets, issue tokens, or operate wallets.
