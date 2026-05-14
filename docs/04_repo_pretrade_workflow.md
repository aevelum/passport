# 04 Repo Pre-Trade Workflow

The first pilot workflow is repo pre-trade collateral-capacity verification.

## Scenario

A dealer wants to know whether a holder has at least USD 50 million in eligible collateral capacity under the dealer's policy before quote or downstream trade workflow. Passport records readiness only; it does not execute the downstream trade.

## Flow

```text
1. Dealer publishes CollateralPolicy.
2. Holder creates PassportAccount.
3. Holder requests credential.
4. Attester evaluates capacity outside the verifier's view.
5. Holder and Attester issue CapacityCredential.
6. Holder presents CredentialPresentation to Dealer.
7. Dealer reserves USD 30 million.
8. Residual USD 20 million credential is reissued to Holder and Attester.
9. Dealer may create a non-executing ReservationHandoffInstruction for readiness metadata.
10. Dealer releases reservation.
11. Attester can revoke or expire stale credentials.
```

## Pass criteria

- Dealer sees presentation and reservation only.
- Dealer does not see raw inventory.
- Holder and Attester see credential.
- Outsider sees nothing.
- Over-reservation fails.
- Reservation handoff is metadata-only and nonconsuming.
- Revoked or expired credentials cannot be reused.
