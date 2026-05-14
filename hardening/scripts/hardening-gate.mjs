import fs from 'node:fs';
import path from 'node:path';
import { getGeneratedAt } from '../../scripts/generated-time.mjs';
import { adapterRegistry, listAdapters } from '../../interop/registry.js';
import {
  ADAPTER_READINESS_LEVELS,
  assertReadinessEvidenceBound,
  assertReadinessShape
} from '../../interop/core/readiness.js';
import {
  abs,
  readJson,
  readText,
  validateFrontier,
  validateMap,
  walkFiles,
  writeJson
} from './lib.mjs';

const pass = [];
const fail = [];

function ok(condition, message) {
  (condition ? pass : fail).push(message);
}

function relExists(rel) {
  ok(fs.existsSync(abs(rel)), `exists: ${rel}`);
}

function evaluateRules(policy) {
  for (const rule of policy.rules ?? []) {
    if (rule.type === 'required-substrings') {
      for (const file of rule.files ?? []) {
        const text = readText(file);
        for (const needle of rule.contains ?? []) ok(text.includes(needle), `${rule.id} ${file} contains ${needle}`);
      }
      continue;
    }
    if (rule.type === 'forbidden-patterns') {
      for (const file of filesForRule(rule)) {
        const text = readText(file);
        for (const needle of rule.forbidden ?? []) ok(!text.includes(needle), `${rule.id} ${file} excludes ${needle}`);
      }
      continue;
    }
    if (rule.type === 'allow-pattern-only') {
      const allowed = new Set(rule.allowed_files ?? []);
      for (const file of filesForRule(rule)) {
        const text = readText(file);
        if (text.includes(rule.pattern)) ok(allowed.has(file), `${rule.id} ${file} allowed to contain ${rule.pattern}`);
        else pass.push(`${rule.id} ${file} does not contain ${rule.pattern}`);
      }
      continue;
    }
    if (rule.type === 'absent-paths') {
      for (const rel of rule.paths ?? []) ok(!fs.existsSync(abs(rel)), `${rule.id} absent path ${rel}`);
      continue;
    }
    if (rule.type === 'required-paths') {
      for (const rel of rule.paths ?? []) ok(fs.existsSync(abs(rel)), `${rule.id} required path ${rel}`);
      continue;
    }
    fail.push(`unknown architecture rule type ${rule.type} for ${rule.id}`);
  }
}

function filesForRule(rule) {
  const explicit = rule.files ?? [];
  const recursive = (rule.paths ?? []).flatMap(rel => walkFiles(rel, { extensions: rule.extensions ?? null }));
  return [...new Set([...explicit, ...recursive])].sort();
}

function checkCdmPayloadPurity() {
  const forbiddenKey = /^(passport|sourceRef|sourceType|sourceId|provenance|generatedAt|adapterVersion|readiness|adapterReadiness|readinessLevel|readinessName|readinessSummary|evidence|claims|nonClaims|promotionCriteria|lastVerifiedBy)$/i;
  const artifactRoot = 'artifacts/interop/cdm/6.0';
  for (const rel of walkFiles(artifactRoot, { extensions: ['.json'] })) {
    const payload = readJson(rel);
    const hits = [];
    visit(payload, key => {
      if (forbiddenKey.test(key)) hits.push(key);
    });
    ok(hits.length === 0, `${rel} has no Passport provenance keys in payload`);
  }
}

function checkAdapterReadiness() {
  const knownLevels = new Set(Object.keys(ADAPTER_READINESS_LEVELS).map(Number));
  for (const plugin of adapterRegistry) {
    ok(Boolean(plugin.readiness), `${plugin.id} declares readiness metadata`);
    if (!plugin.readiness) continue;

    try {
      assertReadinessShape(plugin.readiness);
      pass.push(`${plugin.id} readiness shape is valid`);
    } catch (error) {
      fail.push(`${plugin.id} readiness shape invalid: ${error.message}`);
    }

    try {
      assertReadinessEvidenceBound(plugin.readiness);
      pass.push(`${plugin.id} readiness evidence is bound to claimed level`);
    } catch (error) {
      fail.push(`${plugin.id} readiness evidence invalid: ${error.message}`);
    }

    ok(knownLevels.has(plugin.readiness.level), `${plugin.id} readiness level is in 0-5`);
    const expected = ADAPTER_READINESS_LEVELS[plugin.readiness.level];
    ok(plugin.readiness.name === expected?.name, `${plugin.id} readiness level/name match`);
  }

  const cdm = adapterRegistry.find(plugin => plugin.id === 'cdm-collateral-eligibility');
  ok(Boolean(cdm), 'CDM adapter is registered');
  if (cdm?.readiness) {
    ok(cdm.readiness.level === 2, 'CDM adapter readiness is Level 2');
    ok(cdm.readiness.name === 'Artifact Conformance', 'CDM adapter readiness name is Artifact Conformance');
    for (const nonClaim of requiredCdmNonClaims()) {
      ok(cdm.readiness.nonClaims.includes(nonClaim), `CDM readiness non-claim includes ${nonClaim}`);
    }
  }

  for (const adapter of listAdapters()) {
    for (const field of adapterReadinessFields()) {
      ok(Object.hasOwn(adapter, field), `registry adapter ${adapter.id} exposes ${field}`);
    }
  }
}

function checkInteropReportReadiness() {
  const report = readJson('artifacts/interop/report.json');
  ok(Array.isArray(report.adapterReadiness), 'interop report includes top-level adapterReadiness');

  for (const adapter of report.adapters ?? []) {
    for (const field of adapterReadinessFields()) {
      ok(Object.hasOwn(adapter, field), `interop report adapter ${adapter.id} includes ${field}`);
    }
  }

  for (const adapter of report.adapterReadiness ?? []) {
    for (const field of adapterReadinessFields()) {
      ok(Object.hasOwn(adapter, field), `adapterReadiness entry ${adapter.id} includes ${field}`);
    }
  }

  const cdm = (report.adapterReadiness ?? []).find(adapter => adapter.id === 'cdm-collateral-eligibility');
  ok(Boolean(cdm), 'interop report adapterReadiness includes CDM adapter');
  if (cdm) {
    ok(cdm.readinessLevel === 2, 'interop report CDM readiness level is 2');
    ok(cdm.readinessName === 'Artifact Conformance', 'interop report CDM readiness name is Artifact Conformance');
    ok(Array.isArray(cdm.evidence) && cdm.evidence.length > 0, 'interop report CDM readiness evidence is non-empty');
    ok(Array.isArray(cdm.promotionCriteria) && cdm.promotionCriteria.length > 0, 'interop report CDM promotion criteria is non-empty');
    for (const nonClaim of requiredCdmNonClaims()) {
      ok(cdm.nonClaims?.includes(nonClaim), `interop report CDM non-claim includes ${nonClaim}`);
    }
  }
}

function checkCdmReadinessDocs() {
  const doc = readText('docs/06_interop_adapters.md');
  const exactLevel = 'The current FINOS CDM adapter is Level 2 — Artifact Conformance.';
  const exactNonClaims = 'It is not FINOS certification, Rosetta Engine execution, CDM eligibility-engine execution, repo execution, custody, settlement, live external integration, Canton Token Standard integration, or production partner integration.';
  ok(doc.includes('## Adapter Readiness Levels'), 'interop docs include Adapter Readiness Levels section');
  ok(doc.includes(exactLevel), 'interop docs state current CDM Level 2 readiness');
  ok(doc.includes(exactNonClaims), 'interop docs include explicit Level 2 CDM non-claims');
  for (const nonClaim of requiredCdmNonClaims()) {
    ok(doc.includes(nonClaim), `interop docs include non-claim ${nonClaim}`);
  }
  checkCdmOverclaimLanguage();
}

function visit(value, onKey) {
  if (Array.isArray(value)) {
    for (const item of value) visit(item, onKey);
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    onKey(key);
    visit(child, onKey);
  }
}

function checkCiOrder() {
  const ci = readText('scripts/ci.sh');
  const order = [
    'npm run demo',
    'npm run interop:validate',
    'npm run hardening:map',
    'npm run hardening:frontier',
    'npm run hardening:gate',
    'npm run gate',
    'npm run daml:test',
    'npm run canton:smoke'
  ];
  let last = -1;
  for (const command of order) {
    const idx = ci.indexOf(command);
    ok(idx > last, `scripts/ci.sh orders ${command}`);
    last = idx;
  }
}

for (const rel of [
  'AGENTS.md',
  '.agents/skills/passport-hardening-loop/SKILL.md',
  '.agents/skills/passport-hardening-loop/agents/openai.yaml',
  'hardening/maps/passport.invariants.json',
  'hardening/frontiers/passport.frontier.json',
  'hardening/policies/architecture-rules.json',
  'hardening/rounds/round-0001.md',
  'hardening/change-log.md'
]) relExists(rel);

const map = readJson('hardening/maps/passport.invariants.json');
const mapResult = validateMap(map);
pass.push(...mapResult.pass.map(item => `map: ${item}`));
fail.push(...mapResult.fail.map(item => `map: ${item}`));

const frontier = readJson('hardening/frontiers/passport.frontier.json');
const frontierResult = validateFrontier(frontier, map);
pass.push(...frontierResult.pass.map(item => `frontier: ${item}`));
fail.push(...frontierResult.fail.map(item => `frontier: ${item}`));

evaluateRules(readJson('hardening/policies/architecture-rules.json'));
checkDefaultCiNetworkPolicy();
checkAjvDynamicExecutionDependencyException();
checkAdapterReadiness();
checkInteropReportReadiness();
checkCdmPayloadPurity();
checkCdmReadinessDocs();
checkCiOrder();

const packageScript = readText('scripts/package.mjs');
ok(packageScript.includes("file !== 'artifacts/daml_test_coverage.txt'"), 'package excludes Daml coverage artifact');

const report = {
  artifact: 'hardening_report',
  package: 'aevelum-passport-foundation',
  version: '0.1.0',
  generatedAt: getGeneratedAt(),
  status: fail.length ? 'failed' : 'passed',
  mapPath: 'hardening/maps/passport.invariants.json',
  frontierPath: 'hardening/frontiers/passport.frontier.json',
  policyPath: 'hardening/policies/architecture-rules.json',
  pass,
  fail
};

writeJson('artifacts/hardening_report.json', report);

if (fail.length) {
  console.error(`hardening gate failed: ${fail.length} issue(s)`);
  for (const item of fail) console.error(` - ${item}`);
  process.exit(1);
}

console.log(`hardening gate passed: ${pass.length} checks`);

function checkDefaultCiNetworkPolicy() {
  const allowedNetworkFiles = new Set(['interop/plugins/cdm/vendor.js']);
  const files = [
    ...walkFiles('.github/workflows', { extensions: ['.yml', '.yaml'] }),
    ...walkFiles('scripts', { extensions: ['.mjs', '.js', '.sh'] }),
    ...walkFiles('hardening/scripts', { extensions: ['.mjs', '.js'] }),
    ...walkFiles('interop', { extensions: ['.js', '.mjs'] })
  ];

  for (const rel of files) {
    if (allowedNetworkFiles.has(rel)) {
      pass.push(`default CI network scan allows explicit vendor module ${rel}`);
      continue;
    }
    checkNetworkFreeText(rel, readText(rel));
  }

  const packageJson = readJson('package.json');
  for (const [name, script] of Object.entries(packageJson.scripts ?? {})) {
    checkNetworkFreeText(`package.json scripts.${name}`, script);
  }
}

function checkNetworkFreeText(label, text) {
  const patterns = [
    ['cu' + 'rl', new RegExp('\\bcu' + 'rl\\b')],
    ['wg' + 'et', new RegExp('\\bwg' + 'et\\b')],
    ['dpm in' + 'stall', new RegExp('\\bdpm\\s+in' + 'stall\\b')],
    ['online npm ' + 'ci', new RegExp('\\bnpm\\s+ci\\b(?![^\\n]*\\s--offline\\b)')],
    ['npm in' + 'stall', new RegExp('\\bnpm\\s+(?:in' + 'stall|i)\\b')],
    ['np' + 'x', new RegExp('\\bnp' + 'x\\b')],
    ['fet' + 'ch(', new RegExp('\\bfet' + 'ch\\s*\\(')],
    ['node:ht' + 'tp(s)', new RegExp('node:(?:ht' + 'tp|ht' + 'tps)')],
    ['direct URL', /https?:\/\//],
    ['git cl' + 'one', new RegExp('\\bgit\\s+cl' + 'one\\b')],
    ['docker pu' + 'll', new RegExp('\\bdocker\\s+pu' + 'll\\b')]
  ];

  let clean = true;
  for (const [name, pattern] of patterns) {
    if (pattern.test(text)) {
      clean = false;
      fail.push(`${label} contains network primitive ${name}`);
    }
  }
  if (clean) pass.push(`${label} contains no default-CI network primitives`);
}

function checkAjvDynamicExecutionDependencyException() {
  const lock = readJson('package-lock.json');
  const rootPackage = lock.packages?.[''] ?? {};
  const rootDeps = {
    ...(rootPackage.dependencies ?? {}),
    ...(rootPackage.devDependencies ?? {})
  };
  ok(!Object.hasOwn(rootDeps, 'require-from-string'), 'root package does not directly depend on require-from-string');

  const rfs = lock.packages?.['node_modules/require-from-string'];
  ok(Boolean(rfs), 'package-lock includes AJV transitive require-from-string entry');
  ok(rfs?.version === '2.0.2', 'require-from-string exception is pinned to 2.0.2');
  ok(rfs?.integrity === 'sha512-Xf0nWe6RseziFMu+Ap9biiUbmplq6S9/p+7w7YXP/JBHhrUDDUhwa+vANyubuqfZWTveU//DYVGsDG7RKL/vEw==', 'require-from-string exception integrity is pinned');

  const ajv = lock.packages?.['node_modules/ajv'];
  ok(ajv?.version === '8.20.0', 'AJV validator dependency is pinned to 8.20.0');
  ok(ajv?.dependencies?.['require-from-string'] === '^2.0.2', 'require-from-string is present only as the expected AJV dependency edge');
}

function adapterReadinessFields() {
  return [
    'id',
    'framework',
    'frameworkVersion',
    'outputFormat',
    'artifactTypes',
    'readinessLevel',
    'readinessName',
    'readinessSummary',
    'evidence',
    'claims',
    'nonClaims',
    'promotionCriteria',
    'lastVerifiedBy'
  ];
}

function requiredCdmNonClaims() {
  return [
    'FINOS certification',
    'Rosetta Engine execution',
    'CDM eligibility-engine execution',
    'repo execution',
    'custody',
    'settlement',
    'live external integration',
    'production partner integration',
    'Canton Token Standard integration'
  ];
}

function checkCdmOverclaimLanguage() {
  const files = ['README.md', ...walkFiles('docs', { extensions: ['.md'] })];
  const patterns = [
    ['live external integration', /\blive external integration\b/i],
    ['live integration', /\blive integration\b/i],
    ['production integration', /\bproduction integration\b/i],
    ['production partner integration', /\bproduction partner integration\b/i],
    ['FINOS certification', /\bfinos certification\b/i],
    ['certified', /\bcertified\b/i],
    ['Rosetta Engine execution', /\brosetta engine execution\b/i],
    ['CDM eligibility-engine execution', /\bcdm eligibility[- ]engine execution\b/i],
    ['CDM engine execution', /\bcdm engine execution\b/i],
    ['custody', /\bcustody\b/i],
    ['settlement', /\bsettlement\b/i],
    ['Canton Token Standard integration', /\bcanton token standard integration\b/i],
    ['sandbox partner integration', /\bsandbox partner integration\b/i]
  ];

  for (const rel of files) {
    const lines = readText(rel).split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (!line || !mentionsCurrentCdmAdapter(line)) continue;
      for (const [label, pattern] of patterns) {
        if (!pattern.test(line)) continue;
        ok(isBoundedCdmNonClaim(line, lines, i), `${rel}:${i + 1} bounds CDM ${label} language`);
      }
    }
  }
}

function mentionsCurrentCdmAdapter(text) {
  return /\b(cdm|finos|rosetta|canton token standard|checkeligibilityresult|current adapter|current finos adapter)\b/i.test(text);
}

function isBoundedCdmNonClaim(text, lines, index) {
  const localContext = lines.slice(Math.max(0, index - 16), index + 1).join(' ');
  return /\b(not|no|without|does not|must not|non-claim|non-claims|non-goal|non-goals|excluded|out of scope|future|requires|promotion|next frontier)\b/i.test(`${localContext} ${text}`);
}
