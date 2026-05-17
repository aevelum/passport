import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Ajv from 'ajv-draft-04';
import { defineAdapterPlugin, pluginIdentity } from '../../core/adapter.js';
import { CDM_READINESS } from './readiness.js';
import { cdmVersion, rootSchemas, schemaDir, verifySchemaManifest, verifySchemaManifestAt, walkSchemaFiles } from './vendor.js';

const adapterVersion = '0.1.0';
const decisionMirrorWarning = 'CheckEligibilityResult mirrors the Passport sample decision; no CDM eligibility engine is executed.';
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
  readiness: CDM_READINESS,
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

async function validateNegativeCases(context, input) {
  const invalidQuery = {
    maturity: 7,
    assetCountryOfOrigin: 'US',
    denominatedCurrency: 'USD'
  };
  const validatePayload = createValidator('eligibility-query');
  const actualValid = validatePayload(invalidQuery);
  const semanticRejectedInput = {
    ...input,
    collateral: {
      ...input.collateral,
      denominatedCurrency: 'EUR'
    },
    eligibilityDecision: {
      isEligible: false
    }
  };
  const semanticRejected = (await generate(semanticRejectedInput, context))
    .find(result => result.artifactType === 'check-eligibility-result');
  const semanticRejectedValidated = await validate(semanticRejected);

  return [{
    name: 'negative-invalid-eligibility-query',
    expectedValid: false,
    actualValid,
    pass: actualValid === false,
    errors: validatePayload.errors ?? []
  }, {
    name: 'negative-passport-decision-rejected-without-cdm-engine',
    expectedValid: true,
    actualValid: semanticRejectedValidated.validation.valid,
    expectedEligible: false,
    actualEligible: semanticRejectedValidated.payload.isEligible,
    pass: semanticRejectedValidated.validation.valid
      && semanticRejectedValidated.payload.isEligible === false
      && semanticRejectedValidated.payload.matchingEligibleCriteria.length === 0,
    warnings: semanticRejectedValidated.warnings,
    assertion: 'A Passport sample decision can be mirrored as rejected without executing a CDM eligibility engine.',
    errors: semanticRejectedValidated.validation.errors ?? []
  }, schemaManifestTamperNegativeCase()];
}

function schemaManifestTamperNegativeCase() {
  const tmpParent = fs.mkdtempSync(path.join(os.tmpdir(), 'passport-cdm-schema-tamper-'));
  const tmpSchemaDir = path.join(tmpParent, cdmVersion);
  try {
    fs.cpSync(schemaDir, tmpSchemaDir, { recursive: true });
    const targetSchema = path.join(tmpSchemaDir, rootSchemas[0]);
    fs.appendFileSync(targetSchema, '\n');
    verifySchemaManifestAt(tmpSchemaDir);
    return {
      name: 'negative-cdm-schema-manifest-tamper',
      expectedValid: false,
      actualValid: true,
      pass: false,
      assertion: 'A vendored CDM schema edit without a manifest update must be rejected before AJV schema registration.',
      errors: []
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const pass = message.includes('CDM schema hash mismatch');
    return {
      name: 'negative-cdm-schema-manifest-tamper',
      expectedValid: false,
      actualValid: false,
      pass,
      assertion: 'A vendored CDM schema edit without a manifest update is rejected before AJV schema registration.',
      errors: [message]
    };
  } finally {
    fs.rmSync(tmpParent, { recursive: true, force: true });
  }
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
    warnings: artifactType === 'check-eligibility-result' ? [decisionMirrorWarning] : []
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
