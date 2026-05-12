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
  'docs/06_cdm_mapping_draft.md',
  'docs/07_non_goals.md',
  'artifacts/demo_transcript.json',
  'artifacts/cdm_mapping_draft.json'
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
  const cdm = JSON.parse(read('artifacts/cdm_mapping_draft.json'));
  const names = new Set(cdm.mappings?.map(m => m.passportObject));
  for (const obj of ['CollateralPolicy', 'CapacityCredential', 'CredentialPresentation', 'CapacityReservation', 'CredentialRevocation', 'AuditDisclosureGrant']) {
    if (!names.has(obj)) fail.push(`cdm_mapping_draft missing ${obj}`);
    else pass.push(`cdm_mapping_draft maps ${obj}`);
  }
} catch (e) {
  fail.push(`cdm_mapping JSON parse failed: ${e.message}`);
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
