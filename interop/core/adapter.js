import {
  assertReadinessEvidenceBound,
  assertReadinessShape
} from './readiness.js';

/**
 * @typedef {Object} AdapterPlugin
 * @property {string} id
 * @property {string} framework
 * @property {string} frameworkVersion
 * @property {string} outputFormat
 * @property {readonly string[]} artifactTypes
 * @property {AdapterReadiness} readiness
 * @property {(input: object, context: AdapterContext) => Promise<AdapterResult[]>} generate
 * @property {(result: AdapterResult, context: AdapterContext) => Promise<AdapterResult>} validate
 * @property {((context: AdapterContext, input: object) => Promise<AdapterValidationResult[]>)=} validateNegativeCases
 */

/**
 * @typedef {Object} AdapterReadiness
 * @property {number} level
 * @property {string} name
 * @property {string} summary
 * @property {{ id: string, category: string, summary: string, references?: string[] }[]} evidence
 * @property {string[]} claims
 * @property {string[]} nonClaims
 * @property {string[]} promotionCriteria
 * @property {string} lastVerifiedBy
 */

/**
 * @typedef {Object} AdapterContext
 * @property {string} now
 * @property {string} sourceRef
 * @property {Readonly<Record<string, boolean>>} securityPolicy
 * @property {Readonly<Record<string, Function>>} resolvers
 */

/**
 * @typedef {Object} AdapterValidationResult
 * @property {string} name
 * @property {boolean} expectedValid
 * @property {boolean} actualValid
 * @property {boolean} pass
 * @property {unknown[]} errors
 */

/**
 * @typedef {Object} AdapterResult
 * @property {{ id: string, framework: string, frameworkVersion: string, outputFormat: string }} plugin
 * @property {string} artifactType
 * @property {object} payload
 * @property {{ valid: boolean, errors: unknown[] }} validation
 * @property {{ sourceRef: string, sourceType: string, sourceId: string, adapterVersion: string, generatedAt: string }} provenance
 * @property {string[]} warnings
 */

/**
 * @param {AdapterPlugin} plugin
 * @returns {AdapterPlugin}
 */
export function defineAdapterPlugin(plugin) {
  assertPluginShape(plugin);
  return Object.freeze({
    ...plugin,
    artifactTypes: Object.freeze([...plugin.artifactTypes]),
    readiness: freezeReadiness(plugin.readiness)
  });
}

/**
 * @param {AdapterPlugin} plugin
 */
export function assertPluginShape(plugin) {
  if (!plugin || typeof plugin !== 'object') throw new Error('adapter plugin must be an object');
  for (const key of ['id', 'framework', 'frameworkVersion', 'outputFormat']) {
    if (typeof plugin[key] !== 'string' || plugin[key].length === 0) {
      throw new Error(`adapter plugin missing string field: ${key}`);
    }
  }
  if (!Array.isArray(plugin.artifactTypes) || plugin.artifactTypes.length === 0) {
    throw new Error(`adapter plugin ${plugin.id} must declare artifactTypes`);
  }
  assertReadinessShape(plugin.readiness);
  if (plugin.readiness.level === 0) {
    throw new Error(`adapter plugin ${plugin.id} readiness level 0 is concept-only; registered adapters must be Level 1-5`);
  }
  assertReadinessEvidenceBound(plugin.readiness);
  if (typeof plugin.generate !== 'function') throw new Error(`adapter plugin ${plugin.id} missing generate`);
  if (typeof plugin.validate !== 'function') throw new Error(`adapter plugin ${plugin.id} missing validate`);
}

/**
 * @param {AdapterPlugin} plugin
 * @returns {{ id: string, framework: string, frameworkVersion: string, outputFormat: string }}
 */
export function pluginIdentity(plugin) {
  return {
    id: plugin.id,
    framework: plugin.framework,
    frameworkVersion: plugin.frameworkVersion,
    outputFormat: plugin.outputFormat
  };
}

function freezeReadiness(readiness) {
  return Object.freeze({
    ...readiness,
    evidence: Object.freeze(readiness.evidence.map(item => Object.freeze({
      ...item,
      references: Object.freeze([...(item.references ?? [])])
    }))),
    claims: Object.freeze([...readiness.claims]),
    nonClaims: Object.freeze([...readiness.nonClaims]),
    promotionCriteria: Object.freeze([...readiness.promotionCriteria])
  });
}
