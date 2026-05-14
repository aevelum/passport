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

const REQUIRED_EVIDENCE = Object.freeze([
  Object.freeze({
    level: 1,
    anyOf: Object.freeze([
      Object.freeze(['adapter-contract']),
      Object.freeze(['static-registry']),
      Object.freeze(['policy-boundary'])
    ])
  }),
  Object.freeze({
    level: 2,
    anyOf: Object.freeze([
      Object.freeze(['offline-artifact-generation']),
      Object.freeze(['committed-schema-validation']),
      Object.freeze(['ci-evidence']),
      Object.freeze(['negative-case'])
    ])
  }),
  Object.freeze({
    level: 3,
    anyOf: Object.freeze([
      Object.freeze(['canonical-engine-execution', 'external-api-execution', 'simulator-execution', 'round-trip-execution'])
    ])
  }),
  Object.freeze({
    level: 4,
    anyOf: Object.freeze([
      Object.freeze(['sandbox-auth']),
      Object.freeze(['sandbox-environment']),
      Object.freeze(['operational-error-handling']),
      Object.freeze(['monitoring-logging']),
      Object.freeze(['sandbox-test'])
    ])
  }),
  Object.freeze({
    level: 5,
    anyOf: Object.freeze([
      Object.freeze(['production-partner-evidence', 'live-network-evidence']),
      Object.freeze(['security-review']),
      Object.freeze(['operational-runbook']),
      Object.freeze(['release-control']),
      Object.freeze(['sla-incident-evidence'])
    ])
  })
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
  for (const requirement of REQUIRED_EVIDENCE) {
    if (readiness.level < requirement.level) continue;
    for (const group of requirement.anyOf) {
      if (!group.some(category => categories.has(category))) {
        throw new Error(`adapter readiness Level ${readiness.level} missing evidence category: ${group.join(' or ')}`);
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
