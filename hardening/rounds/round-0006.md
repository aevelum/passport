# round-0006: Bounded Formal Daml Ledger Core

## Objective

Start a bounded formal specification and proof-obligation layer for the Daml ledger core, then use it to drive one small semantic hardening change in reservation release lineage.

## Selected Surfaces

- Daml ledger templates and choices.
- Reservation, residual, handoff, release, audit, and authorization obligations.
- Invariant map and hardening frontier.
- Formal checker command and CI order.

## Formal Boundary

The formal layer is intentionally bounded. It provides stable proof obligations, a TLA-style state-machine specification, a small executable reference model, source assertions, and invariant-map evidence checks.

The current result status is `bounded-pass`. This means the committed checker found no counterexample within the declared finite bounds and source assertions. It is not an unbounded theorem result.

## Semantic Change

`CapacityReservation` now carries the original `policyPublisher` from `CredentialPresentation`.

`ReleaseReservation` now creates the released `CapacityCredential` with that original `policyPublisher`, rather than reconstructing the field from `verifier`.

## Kill Gates

- `npm run hardening:formal` fails if proof obligations lose required ladder sections, valid result statuses, mapped invariant properties, active evidence tests, source snippets, or bounded model coverage.
- `npm run daml:test` fails if reservation release does not preserve policy publisher when policy publisher and verifier are distinct.
- `npm run hardening:gate` fails if CI does not run `npm run hardening:formal` before the architecture gate and Daml/Canton checks.
- `npm run ci` fails if regenerated hardening maps, frontiers, or artifacts drift from committed output.

## Evidence

- `npm run hardening:formal`
- `npm run hardening:map`
- `npm run hardening:frontier`
- `npm run hardening:gate`
- `npm run gate`
- `npm run daml:test`
- `npm run ci`

## Next Frontier

- Add typed time validity obligations before claiming expiry or freshness ordering.
- Add policy-contract binding obligations if issuance starts fetching or enforcing active `CollateralPolicy` contracts directly.
- Decide whether the TLA-style model should be run through Apalache or remain a reviewable formal-spec artifact behind the JavaScript bounded checker.
