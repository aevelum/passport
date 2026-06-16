# 00 Product Thesis

Aevelum Passport is the public Canton/Daml foundation for private regulated-market readiness credentials. Collateral capacity is the first credential family.

The product lets institutions issue, hold, present, bind, revoke, and audit readiness-attested credentials backed by external evidence for regulated-market workflows. Supported readiness families include participant eligibility, license or registration attestations, venue access readiness, product eligibility, operational capability, disclosure consent, settlement or clearing readiness evidence, and collateral capacity readiness.

## One-sentence UVP

Passport lets institutions present readiness attestations on Canton without exposing underlying evidence, legal files, operational files, or collateral inventory.

## Wedge

Passport occupies the readiness-attested layer:

```text
external legal, regulatory, operational, custody, settlement, clearing, or collateral evidence
+ readiness policy
+ trusted attester authorization
  -> ReadinessCredential
  -> ReadinessPresentation
  -> ReadinessBinding
  -> VenueReadinessEvidence
  -> Revocation / expiry-by-validity / audit disclosure
  -> Markets receives readiness metadata
```

## Participants

| Participant | Role |
|---|---|
| Holder | Institution whose readiness is represented. |
| Attester | External evidence holder, regulated entity, custodian, CSD, fund admin, tokenized fund issuer, tri-party agent, calculation agent, or Canton app operator standing behind the readiness statement. |
| Verifier | Markets workflow operator, dealer, repo desk, prime broker, margin desk, credit desk, securities lender, or audit party relying on the credential. |
| Policy Publisher | Party defining acceptable readiness rules. |
| Auditor | Party receiving scoped disclosure only through explicit audit grants. |
| Handoff Recipient | Downstream system or party that receives readiness metadata only. |

## Design boundary

Passport records readiness attestations and scoped evidence only. Passport does not grant licenses, register participants, approve legal compliance, admit participants to a venue, execute repo, execute securities-lending trades, form trades, match orders, operate a venue, run a margin engine, settle transactions, clear transactions, custody assets, transfer collateral, transfer assets, issue tokens, optimize collateral, make credit decisions, operate a wallet, integrate production identity, provide live external integration, implement ZK proofs, or prove legal title.
