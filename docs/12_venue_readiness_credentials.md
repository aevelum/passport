# 12 Venue Readiness Credentials

Venue readiness in Passport means evidence that a holder, product, capability, or venue profile has readiness attested by an external party for a future Markets workflow.

`VenueReadinessEvidence` is a semantic wrapper over `ReadinessBinding`. It lets Markets fetch readiness evidence using venue terms without making Passport a venue.

`VenueReadinessEvidence` is a wrapper around a `ReadinessBinding`. Consumers must validate or cross-check the underlying `ReadinessBinding` before relying on `VenueReadinessEvidence`. Markets Phase C must not trust string readiness refs or copied wrapper fields alone. `VenueReadinessUse` must match the `ReadinessBindingPurpose`.

## Intended Use

- participant admission readiness evidence;
- product admission readiness evidence;
- session access readiness evidence;
- trading-interest submission readiness evidence;
- surveillance audit readiness evidence;
- reporting readiness evidence.

These records are references and attestations only. Passport does not admit participants to a venue, operate a venue, create trades, match orders, execute trades, clear, settle, custody, transfer assets, issue tokens, or operate wallets.

The Daml validation path fetches the referenced `ReadinessBinding`, fetches the binding's `ReadinessCredentialActiveStatus`, and checks holder, attester, verifier, binding id, credential kind, subject, evidence hash, venue profile, and the `VenueReadinessUse` to `ReadinessBindingPurpose` mapping. Markets Phase C should mirror that rule when it consumes Passport readiness evidence.

The verifier can exercise `ValidateVenueReadinessEvidence` independently before relying on the wrapper. Validation also checks ledger time against the live active-status witness and the binding's typed `credentialValidUntilTime` and `credentialFreshUntilTime`, so revoked, stale, or expired readiness evidence does not validate.

## Visibility

`VenueReadinessEvidence` is signed by holder, attester, and verifier. Unauthorized parties see nothing unless another contract explicitly observes them.
