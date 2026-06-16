# 14 Passport Markets Boundary

Passport records readiness attestations. Markets governs workflows and venues.

External legal, regulatory, licensing, custody, settlement, and clearing systems remain external.

## Passport Owns

- readiness account and policy records;
- credential request, issuance, presentation, binding, revocation, and audit disclosure;
- venue-readiness evidence wrappers over readiness bindings, with validation against the referenced binding;
- collateral-capacity credential and reservation demo objects;
- bounded interop artifacts and adapter readiness reports.

`VenueReadinessEvidence` is a wrapper around a `ReadinessBinding`. Consumers must validate or cross-check the underlying `ReadinessBinding` before relying on `VenueReadinessEvidence`. Markets Phase C must not trust string readiness refs or copied wrapper fields alone. `VenueReadinessUse` must match the `ReadinessBindingPurpose`.

The verifier can exercise Passport's venue-readiness validation path independently. Markets Phase C should also reject revoked, stale, or expired readiness evidence by fetching or cross-checking the binding's `ReadinessCredentialActiveStatus` and checking `credentialFreshUntilTime` and `credentialValidUntilTime`.

## Markets Owns

- venue workflow orchestration;
- participant admission decisions;
- venue rulebook enforcement;
- order flow, matching, or session control if a Markets venue later exists;
- downstream settlement, clearing, custody, token, wallet, or external integrations if separately built outside Passport and out of scope for Passport.

## Non-Goals

Passport does not operate a venue, exchange, ATS, SEF, MTF, regulated market, matching engine, order book, clearinghouse, custodian, settlement system, wallet, token issuer, legal-title oracle, credit engine, legal-compliance engine, licensing authority, production identity system, or live external integration.

Passport still does not admit participants, operate venues, grant licenses, determine compliance, execute trades, form trades, settle, clear, custody, transfer assets, issue tokens, or operate wallets.
