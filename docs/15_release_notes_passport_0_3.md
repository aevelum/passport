# 15 Release Notes Passport 0.3

Passport 0.3.0 introduces generic regulated-market readiness credentials while preserving the existing collateral-capacity family.

## Added

- `Aevelum.Passport.Readiness.Types`
- `Aevelum.Passport.Readiness.Foundation`
- `Aevelum.Passport.VenueReadiness.Types`
- `Aevelum.Passport.VenueReadiness.Foundation`
- `readinessUseMatchesBindingPurpose`
- `ValidateVenueReadinessEvidence`
- `ReadinessCredentialActiveStatus`
- Daml Script tests `t100` through `t131`, including `t129_reject_binding_after_readiness_credential_revocation`, `t130_reject_venue_readiness_evidence_after_credential_revocation`, and `t131_active_status_visibility_is_liveness_only`
- readiness demo transcripts
- static readiness claim gate
- ADR `0002-readiness-credential-expansion`

## Venue Readiness Evidence

VenueReadinessEvidence is a wrapper around a ReadinessBinding. Consumers must validate or cross-check the underlying ReadinessBinding before relying on VenueReadinessEvidence. Markets Phase C must not trust string readiness refs or copied wrapper fields alone. VenueReadinessUse must match ReadinessBindingPurpose.

`ValidateVenueReadinessEvidence` is verifier-exercisable and rejects revoked, stale, or expired evidence by fetching the binding's `ReadinessCredentialActiveStatus` and checking typed credential validity and freshness fields.

## Preserved

Collateral-capacity templates and tests remain in place. Existing repo pre-trade credential, presentation, reservation, residual capacity, handoff, revocation, expiry, dispute, and audit disclosure behavior continues to pass Daml coverage.

## Boundary

Passport records readiness attestations and scoped evidence only. It does not grant licenses, determine legal compliance, admit participants to a venue, operate a venue, execute trades, form trades, match orders, clear, settle, custody, transfer assets, issue tokens, operate wallets, decide credit, determine legal title, provide production identity, or provide live external integration.
