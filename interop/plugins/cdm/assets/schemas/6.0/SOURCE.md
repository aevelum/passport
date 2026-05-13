# FINOS CDM 6.0 Schema Subset

This directory vendors the JSON Schema closure required by the Aevelum Passport CDM adapter plugin.

- Source index: https://cdm.finos.org/schemas/6.0/
- Root schemas:
  - cdm-product-collateral-EligibleCollateralSpecification.schema.json
  - cdm-product-collateral-EligibilityQuery.schema.json
  - cdm-product-collateral-CheckEligibilityResult.schema.json
- Refresh command: `npm run interop:vendor:cdm`
- Schema format: JSON Schema draft-04

These files come from the FINOS Common Domain Model schema publication and are used here only for local generated-artifact validation. The committed manifest checks local file integrity and provides a schema-set digest for review; it is not upstream authenticity if schema files and the manifest are changed together.
