import fs from 'node:fs';
import path from 'node:path';

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
const damlSourceRoots = [
  'packages/passport-core/daml',
  'packages/passport-tests/daml'
];

const requiredFiles = [
  'multi-package.yaml',
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
  'interop/core/adapter.js',
  'interop/context.js',
  'interop/registry.js',
  'interop/runner.js',
  'interop/plugins/cdm/index.js',
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
  'scripts/interop-generate.mjs',
  'scripts/interop-validate.mjs',
  'scripts/interop-vendor-cdm.mjs',
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
  't020_convert_reservation_to_execution_instruction',
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
  'not FINOS certification'
]);

checkContains('interop/registry.js', [
  'adapterRegistry',
  'cdmPlugin'
]);

checkContains('interop/plugins/cdm/index.js', [
  'framework: \'cdm\'',
  'eligible-collateral-specification',
  'eligibility-query',
  'check-eligibility-result',
  'verifySchemaManifest'
]);

// Forbidden implementation concepts: these names should not appear in Daml code.
const damlFiles = damlSourceRoots.flatMap(dir => walk(dir)).filter(f => f.endsWith('.daml'));
const forbiddenDaml = [
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

// Terminology gate: do not use the retired custody-oriented account term anywhere in docs or source.
const textFiles = [...damlSourceRoots.flatMap(dir => walk(dir)), ...walk('docs'), 'README.md', 'package.json']
  .filter(f => !f.includes('artifacts/'));
for (const rel of textFiles) {
  const s = read(rel).toLowerCase();
  const retiredTerm = 'wal' + 'let';
  if (s.includes(retiredTerm)) fail.push(`${rel} contains retired account term`);
}
pass.push('retired terminology scan completed');

// Artifact shape checks.
try {
  const transcript = JSON.parse(read('artifacts/demo_transcript.json'));
  for (const key of ['policyId', 'credentialId', 'presentationId', 'reservationId', 'revocationId']) {
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
  const cdmAdapter = report.adapters?.find(adapter => adapter.framework === 'cdm' && adapter.frameworkVersion === '6.0');
  if (!cdmAdapter) fail.push('interop report missing CDM 6.0 adapter');
  else pass.push('interop report includes CDM 6.0 adapter');
  const results = new Map(report.results?.map(r => [r.artifactType, r]));
  for (const name of ['eligible-collateral-specification', 'eligibility-query', 'check-eligibility-result']) {
    const result = results.get(name);
    if (!result?.validation?.valid) fail.push(`interop report missing valid result ${name}`);
    else pass.push(`interop report validates ${name}`);
  }
  const negative = report.negativeResults?.find(result => result.name === 'negative-invalid-eligibility-query');
  if (!negative?.pass) fail.push('interop report missing passing negative-invalid-eligibility-query');
  else pass.push('interop report validates negative-invalid-eligibility-query');
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

const report = {
  artifact: 'gate_report',
  package: 'aevelum-passport-foundation',
  version: '0.1.0',
  generatedAt: new Date().toISOString(),
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
