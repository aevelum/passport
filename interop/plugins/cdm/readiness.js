export const CDM_READINESS = Object.freeze({
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
      summary: 'The default adapter context disables dynamic plugins, eval, and adapter network access during CI validation.',
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
    'Canton Token Standard integration',
    'production partner integration'
  ]),
  promotionCriteria: Object.freeze([
    'Level 3 requires executable CDM, Rosetta, canonical-engine, API, simulator, or round-trip conformance test evidence.',
    'Level 4 requires authenticated sandbox environment configuration, operational error handling, monitoring or logging, and sandbox tests.',
    'Level 5 requires live partner or network evidence, security review, operational runbooks, release controls, and SLA or incident evidence.'
  ]),
  lastVerifiedBy: 'npm run interop:validate; npm run hardening:gate; npm run ci'
});
