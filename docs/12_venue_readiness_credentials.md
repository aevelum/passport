# 12 Venue Readiness Credentials

Venue readiness in Passport means evidence that a holder, product, capability, or venue profile has externally attested readiness for a future Markets workflow.

`VenueReadinessEvidence` is a semantic wrapper over `ReadinessBinding`. It lets Markets fetch readiness evidence using venue terms without making Passport a venue.

## Intended Use

- participant admission readiness evidence;
- product admission readiness evidence;
- session access readiness evidence;
- trading-interest submission readiness evidence;
- surveillance audit readiness evidence;
- reporting readiness evidence.

These records are references and attestations only. Passport does not admit participants to a venue, operate a venue, create trades, match orders, execute trades, clear, settle, custody, transfer assets, issue tokens, or operate wallets.

## Visibility

`VenueReadinessEvidence` is signed by holder, attester, and verifier. Unauthorized parties see nothing unless another contract explicitly observes them.
