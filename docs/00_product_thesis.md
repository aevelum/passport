# 00 Product Thesis

Aevelum Passport is the public Canton/Daml foundation for private collateral-readiness credentials.

The product lets institutions issue, hold, present, reserve, revoke, and audit verified collateral-capacity credentials for repo pre-trade, securities-lending pre-trade, margin capacity check, and secured-credit pre-clearance readiness purposes.

## One-sentence UVP

Passport lets institutions present and reserve verified collateral capacity on Canton without exposing underlying collateral inventory or opening a diligence room.

## Wedge

Passport occupies the pre-trade collateral-capacity readiness layer:

```text
private collateral state
+ verifier policy
+ trusted attester authorization
  -> CapacityCredential
  -> CredentialPresentation
  -> CapacityReservation
  -> ReservationHandoffInstruction
  -> Revocation / expiry / dispute / audit disclosure
  -> downstream system receives readiness metadata
```

## Participants

| Participant | Role |
|---|---|
| Holder | Institution whose collateral capacity is represented. |
| Attester | Custodian, CSD, fund admin, tokenized fund issuer, tri-party agent, calculation agent, or Canton app operator standing behind the capacity statement. |
| Verifier | Dealer, repo desk, prime broker, margin desk, credit desk, or securities lender relying on the credential. |
| Policy Publisher | Party defining acceptable collateral rules. Usually the verifier. |
| Auditor | Party receiving scoped disclosure only through explicit audit grants. |
| Handoff Recipient | Downstream system or party that receives readiness metadata only. |

## Design boundary

Passport records readiness and may record a reservation handoff notice. Passport does not execute repo, execute securities-lending trades, operate a venue, run a margin engine, settle transactions, custody assets, transfer collateral, move collateral, optimize collateral, make credit decisions, operate a wallet, integrate production identity, provide live external integration, implement ZK proofs, or prove legal title. It makes collateral capacity credentialed, presentable, reservable, revocable, expirable, disputable, and auditable on Canton.
