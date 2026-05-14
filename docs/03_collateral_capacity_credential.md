# 03 Collateral Capacity Credential

The `CapacityCredential` is the primary product object.

It states:

> Holder H has at least X eligible collateral capacity under Policy P, attested by Attester A, valid until time T.

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
| `validUntil` | Last valid time. |

## Presentation

The verifier should not receive raw inventory or full account structure. The verifier receives a `CredentialPresentation` containing:

- credential ID;
- holder;
- attester;
- policy ID/version;
- capacity band;
- currency;
- validity window;
- reservation availability;
- evidence and calculation hashes.

## Reservation

A verifier can reserve capacity only through a multi-party `ReserveFromPresentation` choice. The choice consumes the source credential and reissues residual capacity where applicable.

The reservation can also produce a nonconsuming `ReservationHandoffInstruction`. This handoff records readiness metadata for a downstream system. It does not execute, settle, transfer, custody, or move collateral.
