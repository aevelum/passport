# 03 Collateral Capacity Credential

The `CapacityCredential` is the primary product object.

It states:

> Holder H has at least X eligible collateral capacity under Policy P, attested by Attester A, valid until typed time T.

The credential is not a token balance and does not custody an asset. It is a private, signed capacity statement represented as Daml state.

## Required parties

- `holder`: collateral capacity owner.
- `attester`: party standing behind the capacity statement.
- `policyPublisher`: party whose policy was evaluated.

## Core fields

| Field | Meaning |
|---|---|
| `credentialId` | Logical credential identifier. |
| `policyId` / `policyVersion` | Exact policy evaluated. |
| `capacityAmount` | Full capacity amount known to holder and attester. |
| `capacityBand` | Privacy-preserving amount representation for presentation. |
| `evidenceManifestHash` | Hash reference to supporting evidence. |
| `calculationMethodHash` | Hash reference to calculation method. |
| `reservableAmount` | Maximum amount that can be reserved from the credential. |
| `valuationTime` | Authoritative Daml `Time` for the valuation used by freshness checks. |
| `validFromTime` / `validUntilTime` | Authoritative Daml `Time` validity window. |
| `freshnessWindowHours` / `freshUntilTime` | Policy freshness window carried on the credential so consumers can compare ledger time without parsing text. |
| `valuationTimestamp`, `validFrom`, `validUntil` | ISO timestamp text metadata for display and interop only. |

## Policy time

`CollateralPolicy` now carries `validFromTime` and `validUntilTime`. The template requires `validUntilTime > validFromTime`, keeps `status == PolicyActive`, and exposes `ValidatePolicyActiveAtLedgerTime`, a nonconsuming helper choice that uses ledger `getTime`.

Downstream Markets should treat `validFromTime` and `validUntilTime` as authoritative. The text fields `validFrom` and `validUntil` remain migration/display metadata.

## Presentation

The verifier should not receive raw inventory or full account structure. The verifier receives a `CredentialPresentation` containing:

- credential ID;
- holder;
- attester;
- policy ID/version;
- capacity band;
- currency;
- validity window;
- `presentedAtTime`;
- typed credential valuation, validity, and freshness fields;
- `presentationValidUntilTime`;
- reservation availability;
- evidence and calculation hashes.

## Reservation

A verifier can reserve capacity only through a multi-party `ReserveFromPresentation` choice. The choice consumes the source credential and reissues residual capacity where applicable.

`ReserveFromPresentation` uses ledger time to reject expired presentations, requires typed `reservationValidUntilTime` to be after ledger reservation time, and prevents reservations from outliving `presentationValidUntilTime`. `CapacityReservation` carries `reservedAtTime`, typed `validUntilTime`, and the source credential typed validity/freshness fields so release does not refresh a stale attestation.

The reservation can also produce a nonconsuming `ReservationHandoffInstruction`. This handoff records readiness metadata for a downstream system. It does not execute, settle, transfer, custody, or move collateral.
