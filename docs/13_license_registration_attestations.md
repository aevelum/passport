# 13 License Registration Attestations

License or registration credentials in Passport are attestations of external evidence only.

`LicenseAttestationScope` records:

- jurisdiction;
- external authority reference;
- registration reference;
- licensed activity references;
- `attestationOnly`.

The Daml model requires `attestationOnly = True` for `LicenseOrRegistrationAttestation`.

## Required Semantics

Passport may record that an attester has seen or stands behind external license or registration evidence. Passport does not grant licenses, issue licenses, register participants, authorize legal permissions, legally certify a party, approve legal compliance, or admit participants to a venue.

Any new credential family that touches license, registration, authorization, or legal-compliance language must preserve this attestation-only boundary and must add negative tests or static gates for overclaims.
