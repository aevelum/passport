import fs from 'node:fs';
import path from 'node:path';

export const ADAPTER_READINESS_LEVELS = Object.freeze({
  0: Object.freeze({
    level: 0,
    name: 'Concept',
    summary: 'Adapter idea documented; no implementation is registered.'
  }),
  1: Object.freeze({
    level: 1,
    name: 'Interface',
    summary: 'Adapter contract, static registry, and policy boundary are defined.'
  }),
  2: Object.freeze({
    level: 2,
    name: 'Artifact Conformance',
    summary: 'Offline artifact generation, schema validation, CI evidence, and negative cases are present.'
  }),
  3: Object.freeze({
    level: 3,
    name: 'Executable Conformance',
    summary: 'A canonical external engine, API, or simulator executes round-trip or conformance tests.'
  }),
  4: Object.freeze({
    level: 4,
    name: 'Sandbox Integration',
    summary: 'Authenticated sandbox integration includes environment config, operational handling, and sandbox tests.'
  }),
  5: Object.freeze({
    level: 5,
    name: 'Production Integration',
    summary: 'Live partner or network use is backed by security, runbook, release, SLA, and incident evidence.'
  })
});

const READINESS_EVIDENCE_REQUIREMENTS = Object.freeze([
  Object.freeze({
    level: 1,
    requiredCategories: Object.freeze([
      'adapter-contract',
      'static-registry',
      'policy-boundary'
    ]),
    anyCategoryGroups: Object.freeze([])
  }),
  Object.freeze({
    level: 2,
    requiredCategories: Object.freeze([
      'offline-artifact-generation',
      'committed-schema-validation',
      'ci-evidence',
      'negative-case'
    ]),
    anyCategoryGroups: Object.freeze([])
  }),
  // Schema validation is Level 2 evidence. Level 3+ requires executing a
  // canonical external engine, external API, simulator, or round-trip test.
  // A category string alone is not enough; gates also require an existing
  // referenced test, script, fixture, report, or artifact.
  Object.freeze({
    level: 3,
    requiredCategories: Object.freeze([]),
    anyCategoryGroups: Object.freeze([
      Object.freeze({
        label: 'executable external, canonical, simulator, or round-trip evidence',
        categories: Object.freeze(['canonical-engine-execution', 'external-api-execution', 'simulator-execution', 'round-trip-execution'])
      })
    ])
  }),
  Object.freeze({
    level: 4,
    requiredCategories: Object.freeze([
      'sandbox-auth',
      'sandbox-environment',
      'operational-error-handling',
      'monitoring-logging',
      'sandbox-test'
    ]),
    anyCategoryGroups: Object.freeze([])
  }),
  Object.freeze({
    level: 5,
    requiredCategories: Object.freeze([
      'security-review',
      'operational-runbook',
      'release-control',
      'sla-incident-evidence'
    ]),
    anyCategoryGroups: Object.freeze([
      Object.freeze({
        label: 'production partner or live network evidence',
        categories: Object.freeze(['production-partner-evidence', 'live-network-evidence'])
      })
    ])
  })
]);

const EXECUTABLE_EVIDENCE_CATEGORIES = Object.freeze([
  'canonical-engine-execution',
  'external-api-execution',
  'simulator-execution',
  'round-trip-execution'
]);

const SANDBOX_EVIDENCE_CATEGORIES = Object.freeze([
  'sandbox-auth',
  'sandbox-environment',
  'operational-error-handling',
  'monitoring-logging',
  'sandbox-test'
]);

const PRODUCTION_EVIDENCE_CATEGORIES = Object.freeze([
  'production-partner-evidence',
  'live-network-evidence',
  'security-review',
  'operational-runbook',
  'release-control',
  'sla-incident-evidence'
]);

const CLAIM_BOUNDARIES = Object.freeze([
  Object.freeze({
    maxLevel: 2,
    label: 'external engine/API/simulator execution',
    patterns: Object.freeze([
      /\brosetta engine execution\b/i,
      /\bcdm eligibility[- ]engine execution\b/i,
      /\bexternal engine execution\b/i,
      /\bexternal api execution\b/i,
      /\bcanonical external engine\b/i,
      /\bsimulator execution\b/i,
      /\bround[- ]trip execution\b/i
    ])
  }),
  Object.freeze({
    maxLevel: 3,
    label: 'sandbox integration',
    patterns: Object.freeze([
      /\bsandbox integration\b/i,
      /\bauthenticated sandbox\b/i,
      /\bsandbox partner integration\b/i
    ])
  }),
  Object.freeze({
    maxLevel: 4,
    label: 'production, partner, certification, custody, settlement, or Canton Token Standard integration',
    patterns: Object.freeze([
      /\blive external integration\b/i,
      /\blive partner\b/i,
      /\bproduction integration\b/i,
      /\bproduction partner integration\b/i,
      /\bfinos certification\b/i,
      /\bcertified\b/i,
      /\bcustody\b/i,
      /\bsettlement\b/i,
      /\bcanton token standard integration\b/i
    ])
  })
]);

/**
 * @param {unknown} readiness
 */
export function assertReadinessShape(readiness) {
  if (!readiness || typeof readiness !== 'object' || Array.isArray(readiness)) {
    throw new Error('adapter plugin missing readiness object');
  }

  if (!Number.isInteger(readiness.level) || !ADAPTER_READINESS_LEVELS[readiness.level]) {
    throw new Error(`adapter readiness uses unknown level: ${readiness.level}`);
  }

  const expected = ADAPTER_READINESS_LEVELS[readiness.level];
  if (readiness.name !== expected.name) {
    throw new Error(`adapter readiness level/name mismatch: level ${readiness.level} must be ${expected.name}`);
  }

  for (const key of ['summary', 'lastVerifiedBy']) {
    if (typeof readiness[key] !== 'string' || readiness[key].length === 0) {
      throw new Error(`adapter readiness missing string field: ${key}`);
    }
  }

  for (const key of ['evidence', 'claims', 'nonClaims', 'promotionCriteria']) {
    if (!Array.isArray(readiness[key]) || readiness[key].length === 0) {
      throw new Error(`adapter readiness missing non-empty array field: ${key}`);
    }
  }

  readiness.evidence.forEach(assertEvidenceEntry);
  for (const key of ['claims', 'nonClaims', 'promotionCriteria']) {
    readiness[key].forEach((item, index) => {
      if (typeof item !== 'string' || item.length === 0) {
        throw new Error(`adapter readiness ${key}[${index}] must be a non-empty string`);
      }
    });
  }
}

/**
 * @param {object} readiness
 * @returns {{ readinessLevel: number, readinessName: string, readinessSummary: string, evidence: object[], claims: string[], nonClaims: string[], promotionCriteria: string[], lastVerifiedBy: string }}
 */
export function readinessSummary(readiness) {
  assertReadinessShape(readiness);
  return {
    readinessLevel: readiness.level,
    readinessName: readiness.name,
    readinessSummary: readiness.summary,
    evidence: readiness.evidence.map(item => ({
      id: item.id,
      category: item.category,
      summary: item.summary,
      references: item.references ? [...item.references] : []
    })),
    claims: [...readiness.claims],
    nonClaims: [...readiness.nonClaims],
    promotionCriteria: [...readiness.promotionCriteria],
    lastVerifiedBy: readiness.lastVerifiedBy
  };
}

/**
 * @param {object} readiness
 */
export function assertReadinessEvidenceBound(readiness) {
  assertReadinessShape(readiness);

  const categories = evidenceCategories(readiness);
  for (const requirement of READINESS_EVIDENCE_REQUIREMENTS) {
    if (readiness.level < requirement.level) continue;
    for (const category of requirement.requiredCategories) {
      if (!categories.has(category)) {
        throw new Error(`adapter readiness Level ${readiness.level} missing required evidence category: ${category}`);
      }
    }
    for (const group of requirement.anyCategoryGroups) {
      if (!group.categories.some(category => categories.has(category))) {
        throw new Error(`adapter readiness Level ${readiness.level} missing ${group.label}: ${group.categories.join(' or ')}`);
      }
    }
  }

  const claimText = normalizeClaimText([readiness.summary, ...readiness.claims].join(' '));
  for (const boundary of CLAIM_BOUNDARIES) {
    if (readiness.level > boundary.maxLevel) continue;
    for (const pattern of boundary.patterns) {
      if (pattern.test(claimText)) {
        throw new Error(`adapter readiness Level ${readiness.level} overclaims ${boundary.label}`);
      }
    }
  }
}

/**
 * @param {object} readiness
 * @param {{ root?: string, explicitShellCommands?: string[] }=} options
 */
export function assertReadinessEvidenceReferences(readiness, options = {}) {
  assertReadinessShape(readiness);

  const root = options.root ?? process.cwd();
  for (const item of readiness.evidence) {
    for (const reference of item.references ?? []) {
      if (isPathLikeReference(reference) && !referenceExists(root, reference)) {
        throw new Error(`adapter readiness evidence ${item.id} references missing path: ${reference}`);
      }
    }
  }

  assertLastVerifiedBy(readiness.lastVerifiedBy, root, options.explicitShellCommands ?? []);

  if (readiness.level >= 3) {
    assertReferencedProofForAny(readiness, EXECUTABLE_EVIDENCE_CATEGORIES, root, 'Level 3 executable evidence');
  }
  if (readiness.level >= 4) {
    for (const category of SANDBOX_EVIDENCE_CATEGORIES) {
      assertReferencedProofForCategory(readiness, category, root, `Level 4 sandbox evidence ${category}`);
    }
  }
  if (readiness.level >= 5) {
    assertReferencedProofForAny(readiness, ['production-partner-evidence', 'live-network-evidence'], root, 'Level 5 production or live evidence');
    for (const category of ['security-review', 'operational-runbook', 'release-control', 'sla-incident-evidence']) {
      assertReferencedProofForCategory(readiness, category, root, `Level 5 production evidence ${category}`);
    }
  }
}

function assertEvidenceEntry(item, index) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new Error(`adapter readiness evidence[${index}] must be an object`);
  }
  for (const key of ['id', 'category', 'summary']) {
    if (typeof item[key] !== 'string' || item[key].length === 0) {
      throw new Error(`adapter readiness evidence[${index}] missing string field: ${key}`);
    }
  }
  if (item.references !== undefined) {
    if (!Array.isArray(item.references)) {
      throw new Error(`adapter readiness evidence[${index}].references must be an array`);
    }
    item.references.forEach((reference, referenceIndex) => {
      if (typeof reference !== 'string' || reference.length === 0) {
        throw new Error(`adapter readiness evidence[${index}].references[${referenceIndex}] must be a non-empty string`);
      }
    });
  }
}

function evidenceCategories(readiness) {
  return new Set(readiness.evidence.map(item => item.category));
}

function normalizeClaimText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function assertLastVerifiedBy(value, root, explicitShellCommands) {
  const commands = value.split(';').map(item => item.trim()).filter(Boolean);
  if (!commands.length) throw new Error('adapter readiness lastVerifiedBy must list at least one verification command');

  const packageJsonPath = path.join(root, 'package.json');
  const scripts = fs.existsSync(packageJsonPath)
    ? JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).scripts ?? {}
    : {};
  const explicit = new Set(explicitShellCommands);

  for (const command of commands) {
    const npmRun = command.match(/^npm run ([A-Za-z0-9:_-]+)$/);
    if (npmRun) {
      if (!Object.hasOwn(scripts, npmRun[1])) {
        throw new Error(`adapter readiness lastVerifiedBy references unknown npm script: ${command}`);
      }
      continue;
    }
    if (!explicit.has(command)) {
      throw new Error(`adapter readiness lastVerifiedBy references unknown verification command: ${command}`);
    }
  }
}

function assertReferencedProofForAny(readiness, categories, root, label) {
  const items = readiness.evidence.filter(item => categories.includes(item.category));
  if (!items.some(item => hasExistingProofReference(root, item))) {
    throw new Error(`${label} must reference an existing test, fixture, script, report, or artifact`);
  }
}

function assertReferencedProofForCategory(readiness, category, root, label) {
  const items = readiness.evidence.filter(item => item.category === category);
  if (!items.some(item => hasExistingProofReference(root, item))) {
    throw new Error(`${label} must reference an existing test, fixture, script, report, or artifact`);
  }
}

function hasExistingProofReference(root, item) {
  return (item.references ?? []).some(reference => referenceExists(root, reference));
}

function referenceExists(root, reference) {
  if (!isPathLikeReference(reference)) return false;
  return fs.existsSync(path.resolve(root, reference));
}

function isPathLikeReference(reference) {
  return /^\.{1,2}\//.test(reference)
    || reference.includes('/')
    || /\.(json|js|mjs|md|yaml|yml|sh|daml|dar|txt|csv|zip)$/i.test(reference);
}
