import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv-draft-04';
import { defineAdapterPlugin, pluginIdentity } from '../../core/adapter.js';
import { cdmVersion, rootSchemas, schemaDir, verifySchemaManifest, walkSchemaFiles } from './vendor.js';

const adapterVersion = '0.1.0';
const artifactSchemas = Object.freeze({
  'eligible-collateral-specification': rootSchemas[0],
  'eligibility-query': rootSchemas[1],
  'check-eligibility-result': rootSchemas[2]
});

export const cdmPlugin = defineAdapterPlugin({
  id: 'cdm-collateral-eligibility',
  framework: 'cdm',
  frameworkVersion: cdmVersion,
  outputFormat: 'json',
  artifactTypes: Object.freeze(Object.keys(artifactSchemas)),
  generate,
  validate,
  validateNegativeCases
});

async function generate(input, context) {
  const criteria = buildEligibleCollateralCriteria(input, context);
  const specification = { criteria: [criteria] };
  const query = buildEligibilityQuery(input);
  const result = {
    isEligible: Boolean(input.eligibilityDecision?.isEligible),
    matchingEligibleCriteria: input.eligibilityDecision?.isEligible ? [criteria] : [],
    eligibilityQuery: query,
    specification
  };

  return [
    buildResult('eligible-collateral-specification', specification, input, context),
    buildResult('eligibility-query', query, input, context),
    buildResult('check-eligibility-result', result, input, context)
  ];
}

async function validate(result) {
  const validatePayload = createValidator(result.artifactType);
  const valid = validatePayload(result.payload);
  return {
    ...result,
    validation: {
      valid,
      errors: validatePayload.errors ?? []
    }
  };
}

async function validateNegativeCases() {
  const invalidQuery = {
    maturity: 7,
    assetCountryOfOrigin: 'US',
    denominatedCurrency: 'USD'
  };
  const validatePayload = createValidator('eligibility-query');
  const actualValid = validatePayload(invalidQuery);
  return [{
    name: 'negative-invalid-eligibility-query',
    expectedValid: false,
    actualValid,
    pass: actualValid === false,
    errors: validatePayload.errors ?? []
  }];
}

function buildResult(artifactType, payload, input, context) {
  return {
    plugin: pluginIdentity(cdmPlugin),
    artifactType,
    payload,
    validation: {
      valid: false,
      errors: []
    },
    provenance: {
      sourceRef: context.sourceRef,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      adapterVersion,
      generatedAt: context.now
    },
    warnings: []
  };
}

function buildEligibleCollateralCriteria(input, context) {
  const collateral = requireObject(input.collateral, 'collateral');
  const policy = requireObject(input.policy, 'policy');
  const haircut = context.resolvers.resolveHaircutSchedule(policy.haircutScheduleRef);
  const concentrationLimit = context.resolvers.resolveConcentrationLimit(policy.concentrationLimitRef);

  const treatment = {
    valuationTreatment: {
      haircutPercentage: haircut.haircutPercentage
    },
    isIncluded: true
  };
  if (concentrationLimit.length > 0) treatment.concentrationLimit = concentrationLimit;

  return {
    collateralCriteria: {
      AllCriteria: {
        allCriteria: [
          {
            AssetType: {
              assetType: collateral.assetType,
              securityType: collateral.securityType
            }
          },
          {
            CollateralIssuerType: {
              issuerType: collateral.issuerType
            }
          },
          {
            AssetCountryOfOrigin: {
              assetCountryOfOrigin: collateral.assetCountryOfOrigin
            }
          },
          {
            CurrencyCodeEnum: collateral.denominatedCurrency
          }
        ]
      }
    },
    treatment
  };
}

function buildEligibilityQuery(input) {
  const collateral = requireObject(input.collateral, 'collateral');
  return {
    maturity: collateral.maturityYears,
    collateralAssetType: {
      assetType: collateral.assetType,
      securityType: collateral.securityType
    },
    assetCountryOfOrigin: collateral.assetCountryOfOrigin,
    denominatedCurrency: collateral.denominatedCurrency,
    agencyRating: {
      creditNotation: {
        agency: collateral.rating.agency,
        notation: {
          value: collateral.rating.notation
        }
      },
      boundary: collateral.rating.boundary
    },
    issuerType: {
      issuerType: collateral.issuerType
    },
    issuerName: {
      name: {
        value: collateral.issuerName
      }
    }
  };
}

function createValidator(artifactType) {
  const schemaFile = artifactSchemas[artifactType];
  if (!schemaFile) throw new Error(`CDM plugin cannot validate unknown artifact type: ${artifactType}`);
  verifySchemaManifest();

  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    validateSchema: false
  });
  for (const abs of walkSchemaFiles(schemaDir)) {
    ajv.addSchema(JSON.parse(fs.readFileSync(abs, 'utf8')), path.basename(abs));
  }
  const validatePayload = ajv.getSchema(schemaFile);
  if (!validatePayload) throw new Error(`CDM schema not registered: ${schemaFile}`);
  return validatePayload;
}

function requireObject(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`missing Passport ${name} input`);
  }
  return value;
}
