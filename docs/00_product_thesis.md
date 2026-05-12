# 00 Product Thesis

Aevelum Passport is a Canton-native collateral credential account.

The product lets institutions issue, hold, present, reserve, revoke, and audit verified collateral-capacity credentials before repo, securities-lending, margin, or secured-credit execution.

## One-sentence UVP

Passport lets institutions present and reserve verified collateral capacity on Canton without exposing underlying collateral inventory or opening a diligence room.

## Wedge

Passport occupies the pre-execution collateral-capacity credential layer:

```text
private collateral state
+ verifier policy
+ trusted attester authorization
  -> CapacityCredential
  -> CredentialPresentation
  -> CapacityReservation
  -> Revocation / audit disclosure
  -> downstream execution workflow
```

## Participants

| Participant | Role |
|---|---|
| Holder | Institution whose collateral capacity is represented. |
| Attester | Custodian, CSD, fund admin, tokenized fund issuer, tri-party agent, calculation agent, or Canton app operator standing behind the capacity statement. |
| Verifier | Dealer, repo desk, prime broker, margin desk, credit desk, or securities lender relying on the credential. |
| Policy Publisher | Party defining acceptable collateral rules. Usually the verifier. |
| Auditor | Party receiving scoped disclosure only through explicit audit grants. |
| Execution Rail | Downstream venue, credit rail, custodian workflow, or collateral mobility app. |

## Design boundary

Passport does not execute repo, settle transactions, custody assets, optimize collateral, make credit decisions, or prove legal title. It makes collateral capacity credentialed, presentable, reservable, revocable, and auditable on Canton.
