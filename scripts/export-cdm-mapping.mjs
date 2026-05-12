import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const artifacts = path.join(root, 'artifacts');
fs.mkdirSync(artifacts, { recursive: true });

const mapping = {
  artifact: 'cdm_mapping_draft',
  package: 'aevelum-passport-foundation',
  version: '0.1.0',
  status: 'draft_alignment_not_formal_conformance',
  mappings: [
    { passportObject: 'PassportAccount', marketConcept: 'Party/account role' },
    { passportObject: 'CollateralPolicy', marketConcept: 'Eligibility schedule / collateral terms' },
    { passportObject: 'CredentialRequest', marketConcept: 'Request for collateral capacity evaluation' },
    { passportObject: 'CapacityCredential', marketConcept: 'Eligible collateral capacity representation' },
    { passportObject: 'CredentialPresentation', marketConcept: 'Scoped counterparty disclosure' },
    { passportObject: 'CapacityReservation', marketConcept: 'Allocation / lock / pre-settlement reservation' },
    { passportObject: 'CredentialRevocation', marketConcept: 'Lifecycle event / correction / revocation / supersession' },
    { passportObject: 'AuditDisclosureGrant', marketConcept: 'Audit permission / evidence trail' },
    { passportObject: 'haircutScheduleRef', marketConcept: 'Valuation / haircut reference' },
    { passportObject: 'evidenceManifestHash', marketConcept: 'Evidence provenance reference' },
    { passportObject: 'calculationMethodHash', marketConcept: 'Calculation provenance reference' }
  ]
};

const out = path.join(artifacts, 'cdm_mapping_draft.json');
fs.writeFileSync(out, JSON.stringify(mapping, null, 2) + '\n');
console.log(`wrote ${out}`);
