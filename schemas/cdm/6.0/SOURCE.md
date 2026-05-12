# FINOS CDM 6.0 Schema Subset

This directory vendors the JSON Schema closure required to validate the Aevelum Passport CDM collateral eligibility fixtures offline.

- Source index: https://cdm.finos.org/schemas/6.0/
- Root schemas:
  - cdm-product-collateral-EligibleCollateralSpecification.schema.json
  - cdm-product-collateral-EligibilityQuery.schema.json
  - cdm-product-collateral-CheckEligibilityResult.schema.json
- Refresh command: `npm run cdm:vendor-schemas`
- Schema format: JSON Schema draft-04

These files come from the FINOS Common Domain Model schema publication and are used here only for local fixture validation.
