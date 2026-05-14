import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const artifacts = path.join(root, 'artifacts');
fs.mkdirSync(artifacts, { recursive: true });

const transcript = {
  artifact: 'demo_transcript',
  package: 'aevelum-passport-foundation',
  version: '0.1.0',
  workflow: 'repo-pretrade-collateral-capacity',
  parties: {
    holder: 'AevelumDemoHolder',
    verifier: 'AevelumDemoDealer',
    attester: 'AevelumDemoCustodianAttester',
    auditor: 'AevelumDemoAuditor',
    outsider: 'AevelumDemoOutsider'
  },
  ids: {
    accountId: 'acct-holder-001',
    policyId: 'repo-policy-001',
    policyVersion: 'v1',
    credentialId: 'credential-001',
    presentationId: 'presentation-001',
    reservationId: 'reservation-001',
    handoffId: 'reservation-handoff-001',
    residualCredentialId: 'credential-residual-001',
    revocationId: 'revocation-001',
    auditGrantId: 'audit-grant-001'
  },
  capacity: {
    currency: 'USD',
    originalReservableAmount: 50000000,
    reservedAmount: 30000000,
    residualAmount: 20000000,
    capacityBand: 'AtLeast 50000000'
  },
  evidenceManifestHash: 'sha256:evidence-demo-001',
  calculationMethodHash: 'sha256:calculation-demo-001',
  steps: [
    'Dealer publishes CollateralPolicy',
    'Holder creates PassportAccount',
    'Holder requests CapacityCredential',
    'Holder and Attester issue CapacityCredential',
    'Holder presents CredentialPresentation to Dealer',
    'Holder, Attester, and Dealer reserve partial capacity',
    'Source credential is consumed and residual credential is issued',
    'ReservationHandoffInstruction records readiness metadata for a downstream system',
    'Reservation is released',
    'Attester can revoke stale or incorrect credentials',
    'Auditor receives scoped AuditDisclosureGrant when authorized'
  ],
  privacyAssertions: [
    'Verifier receives CredentialPresentation, not raw collateral inventory',
    'CapacityCredential is visible to Holder and Attester by default',
    'CapacityReservation is visible only to Holder, Attester, Verifier, and optional scoped observers',
    'ReservationHandoffInstruction is metadata-only and nonconsuming',
    'AuditDisclosureGrant reveals only allowed metadata fields',
    'Outsider sees no Passport state'
  ],
  nonGoals: [
    'no custody',
    'no settlement',
    'no collateral transfer',
    'no venue operation',
    'no wallet',
    'no margin engine',
    'no credit decision',
    'no ZK system',
    'no production identity',
    'no live external integration',
    'no diligence workspace'
  ]
};

const out = path.join(artifacts, 'demo_transcript.json');
fs.writeFileSync(out, JSON.stringify(transcript, null, 2) + '\n');
console.log(`wrote ${out}`);
