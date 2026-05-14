import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv-draft-04';
import { defineAdapterPlugin, pluginIdentity } from '../../core/adapter.js';
import { cdmVersion, rootSchemas, schemaDir, verifySchemaManifest, walkSchemaFiles } from './vendor.js';

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
  readiness: {
    level: 2,
    name: 'Artifact Conformance',
    summary: 'Generates and validates offline FINOS CDM 6.0 JSON collateral eligibility artifacts from Passport sample input.',
    evidence: Object.freeze([
      Object.freeze({
        id: 'evidence.cdm.adapter-contract',
        category: 'adapter-contract',
        summary: 'CDM is declared through the shared adapter plugin contract.',
        references: Object.freeze(['interop/core/adapter.js', 'interop/plugins/cdm/index.js'])
      }),
      Object.freeze({
        id: 'evidence.cdm.static-plugin-registry',
        category: 'static-registry',
        summary: 'CDM is registered through the committed static adapter registry.',
        references: Object.freeze(['interop/registry.js'])
      }),
      Object.freeze({
        id: 'evidence.cdm.framework-neutral-policy-boundary',
        category: 'policy-boundary',
        summary: 'The default adapter context disables dynamic plugins, eval, and network access in CI.',
        references: Object.freeze(['interop/context.js'])
      }),
      Object.freeze({
        id: 'evidence.cdm.offline-artifact-generation',
        category: 'offline-artifact-generation',
        summary: 'The plugin generates CDM JSON artifacts from the committed Passport repo pre-trade sample.',
        references: Object.freeze(['interop/plugins/cdm/index.js', 'interop/samples/repo-pretrade-passport-input.json'])
      }),
      Object.freeze({
        id: 'evidence.cdm.committed-schema-validation',
        category: 'committed-schema-validation',
        summary: 'Generated artifacts are validated against committed plugin-scoped FINOS CDM 6.0 JSON schemas.',
        references: Object.freeze(['interop/plugins/cdm/index.js', 'interop/plugins/cdm/assets/schemas/6.0'])
      }),
      Object.freeze({
        id: 'evidence.cdm.schema-manifest-verification',
        category: 'schema-manifest-verification',
        summary: 'Validation verifies the committed schema manifest before registering schemas.',
        references: Object.freeze(['interop/plugins/cdm/vendor.js', 'interop/plugins/cdm/assets/schemas/6.0/manifest.json'])
      }),
      Object.freeze({
        id: 'evidence.cdm.negative-invalid-payload-case',
        category: 'negative-case',
        summary: 'The validation lane includes a malformed eligibility query negative case.',
        references: Object.freeze(['interop/plugins/cdm/index.js', 'artifacts/interop/report.json'])
      }),
      Object.freeze({
        id: 'evidence.cdm.passport-decision-mirror-warning',
        category: 'claim-boundary-warning',
        summary: 'CheckEligibilityResult reports warn that the Passport sample decision is mirrored without CDM engine execution.',
        references: Object.freeze(['interop/plugins/cdm/index.js', 'artifacts/interop/report.json'])
      }),
      Object.freeze({
        id: 'evidence.cdm.interop-report',
        category: 'interop-report',
        summary: 'The interop report publishes adapter metadata, validation results, warnings, and negative cases.',
        references: Object.freeze(['interop/runner.js', 'artifacts/interop/report.json'])
      }),
      Object.freeze({
        id: 'evidence.cdm.default-ci-hardening-gate',
        category: 'ci-evidence',
        summary: 'Default CI and the hardening gate validate interop output and readiness claim controls.',
        references: Object.freeze(['scripts/ci.sh', 'hardening/scripts/hardening-gate.mjs'])
      })
    ]),
    claims: Object.freeze([
      'FINOS CDM 6.0 JSON artifact generation',
      'offline JSON schema validation',
      'generated collateral eligibility artifacts'
    ]),
    nonClaims: Object.freeze([
      'FINOS certification',
      'Rosetta Engine execution',
      'CDM eligibility-engine execution',
      'repo execution',
      'custody',
      'settlement',
      'live external integration',
      'production partner integration',
      'Canton Token Standard integration'
    ]),
    promotionCriteria: Object.freeze([
      'Level 3 requires executable CDM, Rosetta, canonical-engine, API, simulator, or round-trip conformance test evidence.',
      'Level 4 requires authenticated sandbox environment configuration, operational error handling, monitoring or logging, and sandbox tests.',
      'Level 5 requires live partner or network evidence, security review, operational runbooks, release controls, and SLA or incident evidence.'
    ]),
    lastVerifiedBy: 'npm run interop:validate; npm run hardening:gate; npm run ci'
  },
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
