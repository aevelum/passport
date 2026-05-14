import fs from 'node:fs';
import path from 'node:path';
import { getGeneratedAt } from './generated-time.mjs';
import { CDM_READINESS } from '../interop/plugins/cdm/readiness.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const fail = [];
const pass = [];

function exists(rel) {
  const ok = fs.existsSync(path.join(root, rel));
  (ok ? pass : fail).push(`${ok ? 'exists' : 'missing'}: ${rel}`);
  return ok;
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function checkContains(rel, needles) {
  const s = read(rel);
  for (const needle of needles) {
    if (!s.includes(needle)) fail.push(`${rel} missing ${needle}`);
    else pass.push(`${rel} contains ${needle}`);
  }
}

function joinWithFinalOr(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')}, or ${items[items.length - 1]}`;
}

function walk(dir, acc = []) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return acc;
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(rel, acc);
    else acc.push(rel);
  }
  return acc;
}

function checkPassportScopeBoundary() {
  const canonicalScope = 'Aevelum Passport is the public Canton/Daml foundation for private collateral-readiness credentials.';
  const requiredScopeStatements = [
    canonicalScope,
    'Passport records readiness.',
    'Passport may record a reservation handoff notice.',
    'Passport does not execute the downstream trade.',
    'Passport does not custody, transfer, settle, or move collateral.'
  ];
  for (const rel of ['README.md', 'docs/02_foundation_release_scope.md']) {
    const text = read(rel);
    for (const statement of requiredScopeStatements) {
      if (!text.includes(statement)) fail.push(`${rel} missing scope statement: ${statement}`);
      else pass.push(`${rel} includes scope statement: ${statement}`);
    }
  }

  const nonGoalDoc = read('docs/07_non_goals.md');
  for (const required of [
    'not repo execution',
    'not securities-lending execution',
    'not venue operation',
    'not a margin engine',
    'not asset custody',
    'not a wallet',
    'not settlement',
    'not collateral transfer',
    'not collateral optimization',
    'not credit decisioning',
    'not legal-title determination',
    'not ZK proofs',
    'not production identity integration',
    'not live external integration'
  ]) {
    if (!nonGoalDoc.includes(required)) fail.push(`docs/07_non_goals.md missing non-goal ${required}`);
    else pass.push(`docs/07_non_goals.md includes non-goal ${required}`);
  }

  const unsafePatterns = [
    { label: 'executing trades', pattern: /\b(?:passport|foundation release|public core|aevelum passport)\b[^.\n|;]{0,120}\b(?:executes?|executing|execute)\b[^.\n|;]{0,80}\b(?:trade|trades|repo|securities-lending|transaction|transactions)\b/i },
    { label: 'moving collateral', pattern: /\b(?:passport|foundation release|public core|aevelum passport)\b[^.\n|;]{0,120}\b(?:moves?|moving|move|transfers?|transferring|transfer)\b[^.\n|;]{0,80}\bcollateral\b/i },
    { label: 'custodying assets', pattern: /\b(?:passport|foundation release|public core|aevelum passport)\b[^.\n|;]{0,120}\b(?:custodies|custodying|custody|custodian)\b[^.\n|;]{0,80}\b(?:asset|assets|collateral)\b/i },
    { label: 'settling transactions', pattern: /\b(?:passport|foundation release|public core|aevelum passport)\b[^.\n|;]{0,120}\b(?:settles?|settling|settlement)\b[^.\n|;]{0,80}\b(?:transaction|transactions|trade|trades|repo)\b/i },
    { label: 'operating a wallet', pattern: /\b(?:passport|foundation release|public core|aevelum passport)\b[^.\n|;]{0,120}\b(?:operates?|operating|provides?|providing|implements?|implementing)\b[^.\n|;]{0,80}\bwallet\b/i },
    { label: 'operating a venue', pattern: /\b(?:passport|foundation release|public core|aevelum passport)\b[^.\n|;]{0,120}\b(?:operates?|operating|provides?|providing|implements?|implementing)\b[^.\n|;]{0,80}\bvenue\b/i },
    { label: 'live external integration', pattern: /\b(?:passport|foundation release|public core|aevelum passport)\b[^.\n|;]{0,120}\b(?:has|provides?|providing|is)\b[^.\n|;]{0,80}\blive external integration\b/i }
  ];

  for (const rel of docsScopeFiles) {
    const text = read(rel);
    for (const unit of claimUnits(text)) {
      for (const { label, pattern } of unsafePatterns) {
        if (!pattern.test(unit.text)) continue;
        if (!isSafeNegativeOrBoundary(unit.text)) fail.push(`${rel}:${unit.line} unsafe Passport scope claim: ${label}`);
        else pass.push(`${rel}:${unit.line} bounds Passport scope claim: ${label}`);
      }
    }
  }
}

function claimUnits(text) {
  const units = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const clean = lines[i]
      .replace(/^\s*[-*]\s+/, '')
      .replace(/^\s*\|?/, '')
      .trim();
    if (!clean || /^```/.test(clean) || /^#/.test(clean)) continue;
    if (clean.includes('|')) {
      units.push({ text: clean.replace(/\|/g, ' '), line: i + 1 });
      continue;
    }
    for (const part of clean
      .split(/(?<=[.!?])\s+|;\s*/)
      .map(part => part.replace(/\|/g, ' ').trim())
      .filter(Boolean)) {
      units.push({ text: part, line: i + 1 });
    }
  }
  return units;
}

function isSafeNegativeOrBoundary(text) {
  return /\b(not|no|without|does not|must not|non-executing|metadata-only|readiness only|out of scope|excludes|excluded)\b/i.test(text);
}

const coreFoundation = 'packages/passport-core/daml/Aevelum/Passport/Foundation.daml';
const coreTypes = 'packages/passport-core/daml/Aevelum/Passport/Types.daml';
const testFoundation = 'packages/passport-tests/daml/Aevelum/Passport/Test/FoundationScenario.daml';
const testPrivacy = 'packages/passport-tests/daml/Aevelum/Passport/Test/PrivacyTests.daml';
const testReservation = 'packages/passport-tests/daml/Aevelum/Passport/Test/ReservationTests.daml';
const testRevocation = 'packages/passport-tests/daml/Aevelum/Passport/Test/RevocationTests.daml';
const interopDoc = 'docs/06_interop_adapters.md';
const interopSample = 'interop/samples/repo-pretrade-passport-input.json';
const cdmSchemaRoot = 'interop/plugins/cdm/assets/schemas/6.0';
const cdmArtifactRoot = 'artifacts/interop/cdm/6.0';
const docsScopeFiles = [
  'README.md',
  'AGENTS.md',
  '.agents/skills/passport-hardening-loop/SKILL.md',
  ...walk('docs').filter(file => file.endsWith('.md')),
  ...walk('design').filter(file => file.endsWith('.md')),
  ...walk('hardening').filter(file => file.endsWith('.md'))
];
const damlSourceRoots = [
  'packages/passport-core/daml',
  'packages/passport-tests/daml'
];

const requiredFiles = [
  'multi-package.yaml',
  '.github/workflows/ci.yml',
  'package.json',
  'package-lock.json',
  'packages/passport-core/daml.yaml',
  'packages/passport-tests/daml.yaml',
  coreTypes,
  coreFoundation,
  testFoundation,
  testPrivacy,
  testReservation,
  testRevocation,
  'docs/00_product_thesis.md',
  'docs/01_daml_as_spec.md',
  'docs/02_foundation_release_scope.md',
  'docs/03_collateral_capacity_credential.md',
  'docs/04_repo_pretrade_workflow.md',
  'docs/05_privacy_model.md',
  interopDoc,
  'docs/07_non_goals.md',
  'docs/08_brand_ui_system.md',
  'docs/09_adapter_readiness_levels.md',
  'design/tokens/colors.json',
  'design/change-log.md',
  'AGENTS.md',
  '.agents/skills/passport-hardening-loop/SKILL.md',
  '.agents/skills/passport-hardening-loop/agents/openai.yaml',
  '.agents/skills/passport-ui-design-system/SKILL.md',
  '.agents/skills/passport-ui-design-system/agents/openai.yaml',
  'interop/core/adapter.js',
  'interop/core/readiness.js',
  'interop/context.js',
  'interop/registry.js',
  'interop/runner.js',
  'interop/plugins/cdm/index.js',
  'interop/plugins/cdm/readiness.js',
  'interop/plugins/cdm/vendor.js',
  interopSample,
  `${cdmSchemaRoot}/SOURCE.md`,
  `${cdmSchemaRoot}/manifest.json`,
  `${cdmSchemaRoot}/cdm-product-collateral-EligibleCollateralSpecification.schema.json`,
  `${cdmSchemaRoot}/cdm-product-collateral-EligibilityQuery.schema.json`,
  `${cdmSchemaRoot}/cdm-product-collateral-CheckEligibilityResult.schema.json`,
  `${cdmArtifactRoot}/eligible-collateral-specification.json`,
  `${cdmArtifactRoot}/eligibility-query.json`,
  `${cdmArtifactRoot}/check-eligibility-result.json`,
  'artifacts/demo_transcript.json',
  'artifacts/interop/report.json',
  'artifacts/hardening_report.json',
  'artifacts/hardening_map_report.json',
  'hardening/maps/passport.invariants.json',
  'hardening/frontiers/passport.frontier.json',
  'hardening/policies/architecture-rules.json',
  'hardening/rounds/round-0001.md',
  'hardening/rounds/round-0002.md',
  'hardening/rounds/round-0003.md',
  'hardening/rounds/round-0004.md',
  'hardening/rounds/round-0005.md',
  'hardening/change-log.md',
  'hardening/scripts/lib.mjs',
  'hardening/scripts/validate-map.mjs',
  'hardening/scripts/score-frontier.mjs',
  'hardening/scripts/select-round.mjs',
  'hardening/scripts/hardening-gate.mjs',
  'scripts/generated-time.mjs',
  'scripts/interop-generate.mjs',
  'scripts/interop-validate.mjs',
  'scripts/interop-vendor-cdm.mjs',
  'scripts/run-daml-tests.sh',
  'scripts/daml-coverage-gate.mjs',
  'scripts/canton-smoke.sh'
];

for (const rel of requiredFiles) exists(rel);

checkContains(coreFoundation, [
  'template PassportAccount',
  'template CollateralPolicy',
  'template CredentialRequest',
  'template CapacityCredential',
  'template CredentialPresentation',
  'template CapacityReservation',
  'template CredentialRevocation',
  'template AuditDisclosureGrant',
  'PresentToVerifier',
  'ReserveFromPresentation',
  'ReleaseReservation',
  'CreateReservationHandoff',
  'ReservationHandoffInstruction',
  'handoffRecipient',
  'RevokeCredential',
  'GrantAuditDisclosureFromAccount'
]);

checkContains(testFoundation, [
  't001_create_passport_account',
  't002_publish_collateral_policy',
  't003_issue_capacity_credential',
  't004_present_credential_to_verifier',
  't015_full_repo_pretrade_happy_path',
  't016_amend_policy',
  't017_retire_policy',
  't018_close_passport_account'
]);

checkContains(testPrivacy, [
  't005_unauthorized_party_cannot_see_credential',
  't013_grant_scoped_audit_disclosure',
  't014_auditor_cannot_see_unscoped_fields'
]);

checkContains(testReservation, [
  't006_reserve_partial_capacity',
  't007_reject_over_reservation',
  't008_consume_and_reissue_residual_capacity',
  't009_release_reservation',
  't019_expire_reservation',
  't020_create_reservation_handoff',
  't021_dispute_reservation'
]);

checkContains(testRevocation, [
  't010_revoke_credential',
  't011_reject_revoked_credential_reservation',
  't012_reject_expired_credential',
  't022_supersede_credential'
]);

checkContains(interopDoc, [
  'framework-neutral adapter surface',
  'static plugin registry only',
  'FINOS CDM',
  'Adapter Readiness Levels',
  'The current FINOS CDM adapter is Level 2 — Artifact Conformance.',
  `It is not ${joinWithFinalOr(CDM_READINESS.nonClaims)}.`
]);

checkContains('AGENTS.md', [
  '.agents/skills/passport-hardening-loop/SKILL.md',
  '.agents/skills/passport-ui-design-system/SKILL.md',
  'design/tokens/colors.json',
  'npm run hardening:gate',
  'Default PR and local CI must not fetch from the network after GitHub platform checkout; dependency/toolchain/bootstrap material must come from the pre-baked offline runner and offline npm cache.'
]);

checkContains('.agents/skills/passport-hardening-loop/SKILL.md', [
  'Passport Hardening Loop',
  'hardening/maps/passport.invariants.json',
  'npm run hardening:gate'
]);

checkContains('.agents/skills/passport-ui-design-system/SKILL.md', [
  'Passport UI Design System',
  'design/tokens/colors.json',
  'institutional finance palette'
]);

checkContains('docs/08_brand_ui_system.md', [
  'institutional financial infrastructure',
  'design/tokens/colors.json',
  '#0B1F3A',
  '#BD9B6B',
  'Red is reserved for risk'
]);

checkContains('design/change-log.md', [
  'Institutional Finance Palette',
  'design/tokens/colors.json',
  '.agents/skills/passport-ui-design-system/SKILL.md'
]);

checkContains('scripts/ci.sh', [
  'npm run hardening:frontier',
  'npm run hardening:gate',
  'npm run package',
  'git diff --exit-code -- artifacts hardening/frontiers hardening/maps'
]);

checkContains('interop/registry.js', [
  'adapterRegistry',
  'cdmPlugin',
  'readinessSummary'
]);

checkContains('interop/plugins/cdm/index.js', [
  'framework: \'cdm\'',
  'CDM_READINESS',
  'eligible-collateral-specification',
  'eligibility-query',
  'check-eligibility-result',
  'verifySchemaManifest'
]);

checkContains('interop/plugins/cdm/readiness.js', [
  'CDM_READINESS',
  'level: 2',
  'Artifact Conformance',
  'FINOS certification',
  'Canton Token Standard integration'
]);

checkContains('interop/core/readiness.js', [
  'ADAPTER_READINESS_LEVELS',
  'assertReadinessShape',
  'readinessSummary',
  'assertReadinessEvidenceBound',
  'assertReadinessEvidenceReferences'
]);

// Forbidden implementation concepts: these names should not appear in Daml code.
const damlFiles = damlSourceRoots.flatMap(dir => walk(dir)).filter(f => f.endsWith('.daml'));
const forbiddenDaml = [
  'ExecutionInstruction',
  'ConvertToExecutionInstruction',
  'executionRailParty',
  'executionRail',
  'instructionId',
  'instructionPurpose',
  'instructionCreatedAt',
  'CounterpartyRoom',
  'DataRoom',
  'ZKProof',
  'ZeroKnowledge',
  'CreditApproval',
  'CreditDecision',
  'SettlementFinality',
  'CustodyWallet',
  'CollateralOptimizer'
];
for (const rel of damlFiles) {
  const s = read(rel);
  for (const token of forbiddenDaml) {
    if (s.includes(token)) fail.push(`${rel} contains forbidden implementation token ${token}`);
  }
}
pass.push('forbidden Daml implementation token scan completed');

checkPassportScopeBoundary();

// Artifact shape checks.
try {
  const transcript = JSON.parse(read('artifacts/demo_transcript.json'));
  for (const key of ['policyId', 'credentialId', 'presentationId', 'reservationId', 'handoffId', 'revocationId']) {
    if (!transcript.ids?.[key]) fail.push(`demo_transcript missing ids.${key}`);
    else pass.push(`demo_transcript contains ids.${key}`);
  }
  if (!Array.isArray(transcript.privacyAssertions) || transcript.privacyAssertions.length < 5) fail.push('demo_transcript privacyAssertions incomplete');
  else pass.push('demo_transcript privacyAssertions complete');
} catch (e) {
  fail.push(`demo_transcript JSON parse failed: ${e.message}`);
}

try {
  const manifest = JSON.parse(read(`${cdmSchemaRoot}/manifest.json`));
  if (manifest.framework !== 'cdm') fail.push(`cdm schema manifest framework is ${manifest.framework}`);
  else pass.push('cdm schema manifest framework is cdm');
  if (manifest.frameworkVersion !== '6.0') fail.push(`cdm schema manifest frameworkVersion is ${manifest.frameworkVersion}`);
  else pass.push('cdm schema manifest pins CDM 6.0');
  if (!Array.isArray(manifest.files) || manifest.files.length !== manifest.schemaCount) fail.push('cdm schema manifest file count mismatch');
  else pass.push('cdm schema manifest file count matches');
  if (!manifest.schemaSetDigest?.startsWith('sha256:')) fail.push('cdm schema manifest missing schemaSetDigest');
  else pass.push('cdm schema manifest has schemaSetDigest review anchor');
  for (const rootSchema of ['cdm-product-collateral-EligibleCollateralSpecification.schema.json', 'cdm-product-collateral-EligibilityQuery.schema.json', 'cdm-product-collateral-CheckEligibilityResult.schema.json']) {
    if (!manifest.rootSchemas?.includes(rootSchema)) fail.push(`cdm schema manifest missing root schema ${rootSchema}`);
    else pass.push(`cdm schema manifest root schema ${rootSchema}`);
  }
} catch (e) {
  fail.push(`cdm schema manifest JSON parse failed: ${e.message}`);
}

try {
  const report = JSON.parse(read('artifacts/interop/report.json'));
  if (report.status !== 'passed') fail.push(`interop report status is ${report.status}`);
  else pass.push('interop report passed');
  if (!Array.isArray(report.adapterReadiness)) fail.push('interop report missing adapterReadiness');
  else pass.push('interop report includes adapterReadiness');
  const cdmAdapter = report.adapters?.find(adapter => adapter.framework === 'cdm' && adapter.frameworkVersion === '6.0');
  if (!cdmAdapter) fail.push('interop report missing CDM 6.0 adapter');
  else pass.push('interop report includes CDM 6.0 adapter');
  if (cdmAdapter?.readinessLevel !== 2) fail.push(`interop report CDM readiness level is ${cdmAdapter?.readinessLevel}`);
  else pass.push('interop report CDM readiness level is 2');
  if (cdmAdapter?.readinessName !== 'Artifact Conformance') fail.push(`interop report CDM readiness name is ${cdmAdapter?.readinessName}`);
  else pass.push('interop report CDM readiness name is Artifact Conformance');
  for (const nonClaim of CDM_READINESS.nonClaims) {
    if (!cdmAdapter?.nonClaims?.includes(nonClaim)) fail.push(`interop report CDM non-claim missing ${nonClaim}`);
    else pass.push(`interop report CDM non-claim includes ${nonClaim}`);
  }
  const results = new Map(report.results?.map(r => [r.artifactType, r]));
  for (const name of ['eligible-collateral-specification', 'eligibility-query', 'check-eligibility-result']) {
    const result = results.get(name);
    if (!result?.validation?.valid) fail.push(`interop report missing valid result ${name}`);
    else pass.push(`interop report validates ${name}`);
  }
  const negative = report.negativeResults?.find(result => result.name === 'negative-invalid-eligibility-query');
  if (!negative?.pass) fail.push('interop report missing passing negative-invalid-eligibility-query');
  else pass.push('interop report validates negative-invalid-eligibility-query');
  const semanticNegative = report.negativeResults?.find(result => result.name === 'negative-passport-decision-rejected-without-cdm-engine');
  if (!semanticNegative?.pass) fail.push('interop report missing passing negative-passport-decision-rejected-without-cdm-engine');
  else pass.push('interop report validates negative-passport-decision-rejected-without-cdm-engine');
  const checkEligibility = results.get('check-eligibility-result');
  const mirrorWarning = 'CheckEligibilityResult mirrors the Passport sample decision; no CDM eligibility engine is executed.';
  if (!checkEligibility?.warnings?.includes(mirrorWarning)) fail.push('interop report missing CDM decision mirror warning');
  else pass.push('interop report records CDM decision mirror warning');
} catch (e) {
  fail.push(`interop report JSON parse failed: ${e.message}`);
}

try {
  for (const artifact of ['eligible-collateral-specification', 'eligibility-query', 'check-eligibility-result']) {
    JSON.parse(read(`${cdmArtifactRoot}/${artifact}.json`));
    pass.push(`generated CDM artifact parses: ${artifact}`);
  }
} catch (e) {
  fail.push(`generated CDM artifact parse failed: ${e.message}`);
}

try {
  const hardeningMap = JSON.parse(read('hardening/maps/passport.invariants.json'));
  if (hardeningMap.artifact !== 'passport_invariant_property_map') fail.push(`hardening map artifact is ${hardeningMap.artifact}`);
  else pass.push('hardening map artifact is passport_invariant_property_map');
  const skillInventory = hardeningMap.scope?.source_inventory?.find(item => item.path === '.agents/skills/passport-hardening-loop/SKILL.md');
  if (!skillInventory) fail.push('hardening map missing repo-local skill source inventory');
  else pass.push('hardening map includes repo-local skill source inventory');
} catch (e) {
  fail.push(`hardening map JSON parse failed: ${e.message}`);
}

try {
  const frontier = JSON.parse(read('hardening/frontiers/passport.frontier.json'));
  if (frontier.artifact !== 'passport_hardening_frontier') fail.push(`hardening frontier artifact is ${frontier.artifact}`);
  else pass.push('hardening frontier artifact is passport_hardening_frontier');
  if (!frontier.summary?.top_candidate) fail.push('hardening frontier missing top candidate');
  else pass.push(`hardening frontier top candidate ${frontier.summary.top_candidate}`);
} catch (e) {
  fail.push(`hardening frontier JSON parse failed: ${e.message}`);
}

try {
  const hardeningReport = JSON.parse(read('artifacts/hardening_report.json'));
  if (hardeningReport.status !== 'passed') fail.push(`hardening report status is ${hardeningReport.status}`);
  else pass.push('hardening report passed');
} catch (e) {
  fail.push(`hardening report JSON parse failed: ${e.message}`);
}

try {
  const colorTokens = JSON.parse(read('design/tokens/colors.json'));
  if (colorTokens.artifact !== 'aevelum_passport_color_tokens') fail.push(`color token artifact is ${colorTokens.artifact}`);
  else pass.push('color token artifact is aevelum_passport_color_tokens');
  for (const tokenPath of ['ink.900', 'ink.800', 'blue.700', 'teal.700', 'slate.700', 'gold.600', 'risk.700']) {
    const token = tokenPath.split('.').reduce((obj, key) => obj?.[key], colorTokens.tokens);
    if (!token?.hex) fail.push(`color token missing ${tokenPath}`);
    else pass.push(`color token present ${tokenPath} ${token.hex}`);
  }
} catch (e) {
  fail.push(`color tokens JSON parse failed: ${e.message}`);
}

const report = {
  artifact: 'gate_report',
  package: 'aevelum-passport-foundation',
  version: '0.1.0',
  generatedAt: getGeneratedAt(),
  dpmSdk: '3.5.1-rc3',
  note: 'This local gate validates repository structure and generated artifacts. Run scripts/run-daml-tests.sh for DPM compile, Daml Script, and coverage gates.',
  pass,
  fail
};

fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts/gate_report.json'), JSON.stringify(report, null, 2) + '\n');

if (fail.length) {
  console.error(`gate failed: ${fail.length} issue(s)`);
  for (const item of fail) console.error(` - ${item}`);
  process.exit(1);
}
console.log(`gate passed: ${pass.length} checks`);
