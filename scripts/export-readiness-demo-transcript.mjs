import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const artifacts = path.join(root, 'artifacts');
fs.mkdirSync(artifacts, { recursive: true });

const readinessTranscript = {
  artifact: 'readiness_demo_transcript',
  package: 'aevelum-passport-foundation',
  version: '0.3.0',
  workflow: 'regulated-market-readiness-credential',
  parties: {
    holder: 'ReadinessDemoHolder',
    policyPublisher: 'ReadinessPolicyPublisher',
    attester: 'ReadinessAttester',
    verifier: 'MarketsReadinessVerifier',
    auditor: 'ReadinessAuditor',
    outsider: 'ReadinessOutsider'
  },
  ids: {
    accountId: 'readiness-account-001',
    policyId: 'readiness-policy-001',
    policyVersion: 'v1',
    requestId: 'readiness-request-001',
    credentialId: 'license-attestation-credential-001',
    presentationId: 'readiness-presentation-001',
    bindingId: 'readiness-binding-001',
    auditGrantId: 'readiness-audit-grant-001'
  },
  credentialKind: 'LicenseOrRegistrationAttestation',
  licenseScope: {
    jurisdiction: 'US-NY',
    externalAuthorityRef: 'external-authority:ny-registry',
    registrationRef: 'registration:holder-001',
    licensedActivityRefs: ['broker-dealer-readiness'],
    attestationOnly: true
  },
  typedTimeValidation: {
    policy: {
      validFromTime: '2026-05-10T00:00:00Z',
      validUntilTime: '2026-05-12T00:00:00Z'
    },
    credential: {
      issuedAtTime: '2026-05-10T00:02:00Z',
      validFromTime: '2026-05-10T00:02:00Z',
      validUntilTime: '2026-05-12T00:02:00Z',
      freshUntilTime: '2026-05-11T00:02:00Z'
    },
    presentation: {
      presentedAtTime: '2026-05-10T00:03:00Z',
      presentationValidUntilTime: '2026-05-11T00:02:00Z'
    },
    binding: {
      boundAtTime: '2026-05-10T00:04:00Z',
      credentialFreshUntilTime: '2026-05-11T00:02:00Z'
    },
    auditGrant: {
      validFromTime: '2026-05-10T00:05:00Z',
      validUntilTime: '2026-05-12T00:00:00Z'
    },
    textTimestampFields: 'display-and-interop metadata only'
  },
  steps: [
    'Holder creates ReadinessAccount',
    'Policy publisher creates ReadinessPolicy',
    'Holder requests LicenseOrRegistrationAttestation',
    'Attester issues ReadinessCredential',
    'Holder presents ReadinessPresentation to Markets verifier',
    'Holder, Attester, and Verifier bind ReadinessBinding to workflow and venue-profile context',
    'Auditor receives scoped ReadinessAuditDisclosureGrant'
  ],
  privacyAssertions: [
    'Holder and Attester see the raw ReadinessCredential',
    'Verifier receives scoped ReadinessPresentation and ReadinessBinding',
    'Auditor receives ReadinessAuditDisclosureGrant only',
    'Outsider sees no readiness credential, presentation, binding, or audit grant'
  ],
  boundaryAssertions: [
    'attestation only',
    'not license grant',
    'not venue admission',
    'not legal compliance determination',
    'not trade formation',
    'not execution',
    'not clearing',
    'not settlement',
    'not custody',
    'not asset transfer',
    'not token issuance',
    'not wallet operation'
  ]
};

const venueTranscript = {
  artifact: 'venue_readiness_demo_transcript',
  package: 'aevelum-passport-foundation',
  version: '0.3.0',
  workflow: 'venue-readiness-evidence-wrapper',
  ids: {
    bindingId: 'readiness-binding-001',
    venueReadinessEvidenceId: 'venue-readiness-evidence-001',
    venueId: 'venue:demo-markets',
    venueProfileRef: 'venue-profile:demo'
  },
  use: 'VenueParticipantAdmissionUse',
  source: 'VenueReadinessEvidence references a valid ReadinessBinding',
  visibility: 'VenueReadinessEvidence is visible to holder, attester, and verifier',
  boundaryAssertions: [
    'readiness evidence only',
    'not venue operation',
    'not participant admission decision',
    'not order matching',
    'not trade formation',
    'not execution',
    'not clearing',
    'not settlement',
    'not custody',
    'not asset transfer'
  ]
};

for (const [name, payload] of [
  ['readiness_demo_transcript.json', readinessTranscript],
  ['venue_readiness_demo_transcript.json', venueTranscript]
]) {
  const out = path.join(artifacts, name);
  fs.writeFileSync(out, JSON.stringify(payload, null, 2) + '\n');
  console.log(`wrote ${out}`);
}
