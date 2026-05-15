import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { getGeneratedAt } from '../../scripts/generated-time.mjs';
import { assertPluginShape } from '../../interop/core/adapter.js';
import { adapterRegistry, listAdapters } from '../../interop/registry.js';
import {
  ADAPTER_READINESS_LEVELS,
  assertReadinessEvidenceBound,
  assertReadinessEvidenceReferences,
  readinessSummary,
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
        for (const [index, needle] of (rule.forbidden ?? []).entries()) {
          ok(!text.includes(needle), `${rule.id} ${file} excludes forbidden pattern ${index + 1}`);
        }
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
  const forbiddenKey = /^(passport|sourceRef|sourceType|sourceId|provenance|generatedAt|adapterVersion|readiness|adapterReadiness|readinessLevel|readinessName|readinessSummary|promotionCriteria|lastVerifiedBy)$/i;
  // These are generic English words, so this check is intentionally scoped to
  // generated CDM payloads where they would only appear as leaked readiness
  // report metadata, not as expected CDM collateral artifact fields.
  const cdmReadinessMetadataKey = /^(evidence|claims|nonClaims)$/i;
  const artifactRoot = 'artifacts/interop/cdm/6.0';
  for (const rel of walkFiles(artifactRoot, { extensions: ['.json'] })) {
    const payload = readJson(rel);
    const hits = [];
    visit(payload, key => {
      if (forbiddenKey.test(key) || cdmReadinessMetadataKey.test(key)) hits.push(key);
    });
    ok(hits.length === 0, `${rel} has no Passport provenance or readiness metadata keys in payload`);
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

    try {
      assertReadinessEvidenceReferences(plugin.readiness, { root: abs('.') });
      pass.push(`${plugin.id} readiness evidence references existing repo artifacts`);
    } catch (error) {
      fail.push(`${plugin.id} readiness evidence references invalid: ${error.message}`);
    }

    ok(knownLevels.has(plugin.readiness.level), `${plugin.id} readiness level is in 0-5`);
    ok(plugin.readiness.level >= 1, `${plugin.id} registered adapter readiness level is 1-5`);
    const expected = ADAPTER_READINESS_LEVELS[plugin.readiness.level];
    ok(plugin.readiness.name === expected?.name, `${plugin.id} readiness level/name match`);
  }

  const cdm = adapterRegistry.find(plugin => plugin.id === 'cdm-collateral-eligibility');
  ok(Boolean(cdm), 'CDM adapter is registered');
  if (cdm?.readiness) {
    ok(cdm.readiness.level === 2, 'CDM adapter readiness is Level 2');
    ok(cdm.readiness.name === 'Artifact Conformance', 'CDM adapter readiness name is Artifact Conformance');
    for (const nonClaim of cdm.readiness.nonClaims) {
      ok(cdm.readiness.nonClaims.includes(nonClaim), `CDM readiness non-claim includes ${nonClaim}`);
    }
  }

  for (const adapter of listAdapters()) {
    for (const field of adapterReadinessFields()) {
      ok(Object.hasOwn(adapter, field), `registry adapter ${adapter.id} exposes ${field}`);
    }
  }

  checkReadinessNegativeCases();
  checkReadinessPositiveCases();
}

function checkInteropReportReadiness() {
  const report = readJson('artifacts/interop/report.json');
  ok(Array.isArray(report.adapterReadiness), 'interop report includes top-level adapterReadiness');

  const registered = listAdapters();
  const registeredIds = registered.map(adapter => adapter.id).sort();
  const reportAdapterIds = (report.adapters ?? []).map(adapter => adapter.id).sort();
  const reportReadinessIds = (report.adapterReadiness ?? []).map(adapter => adapter.id).sort();
  ok(stableStringify(reportAdapterIds) === stableStringify(registeredIds), 'interop report adapters exactly match registered adapter IDs');
  ok(stableStringify(reportReadinessIds) === stableStringify(registeredIds), 'interop report adapterReadiness exactly matches registered adapter IDs');

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

  for (const registeredAdapter of registered) {
    const adapterEntry = (report.adapters ?? []).find(adapter => adapter.id === registeredAdapter.id);
    const readinessEntry = (report.adapterReadiness ?? []).find(adapter => adapter.id === registeredAdapter.id);
    ok(stableStringify(adapterEntry) === stableStringify(registeredAdapter), `interop report adapter ${registeredAdapter.id} deeply equals registry summary`);
    ok(stableStringify(readinessEntry) === stableStringify(registeredAdapter), `adapterReadiness ${registeredAdapter.id} deeply equals registry summary`);
    ok(stableStringify(readinessEntry) === stableStringify(adapterEntry), `interop report adapter ${registeredAdapter.id} readiness sections are deeply equal`);
  }

  const cdm = (report.adapterReadiness ?? []).find(adapter => adapter.id === 'cdm-collateral-eligibility');
  const registeredCdm = adapterRegistry.find(plugin => plugin.id === 'cdm-collateral-eligibility');
  ok(Boolean(cdm), 'interop report adapterReadiness includes CDM adapter');
  if (cdm) {
    ok(cdm.readinessLevel === 2, 'interop report CDM readiness level is 2');
    ok(cdm.readinessName === 'Artifact Conformance', 'interop report CDM readiness name is Artifact Conformance');
    ok(Array.isArray(cdm.evidence) && cdm.evidence.length > 0, 'interop report CDM readiness evidence is non-empty');
    ok(Array.isArray(cdm.promotionCriteria) && cdm.promotionCriteria.length > 0, 'interop report CDM promotion criteria is non-empty');
    ok(stableStringify(cdm) === stableStringify({ ...pluginIdentityFields(registeredCdm), artifactTypes: [...registeredCdm.artifactTypes], ...readinessSummary(registeredCdm.readiness) }), 'interop report CDM readiness equals registered plugin readiness summary');
    for (const nonClaim of registeredCdm?.readiness?.nonClaims ?? []) {
      ok(cdm.nonClaims?.includes(nonClaim), `interop report CDM non-claim includes ${nonClaim}`);
    }
  }

  for (const name of [
    'negative-invalid-eligibility-query',
    'negative-passport-decision-rejected-without-cdm-engine',
    'negative-cdm-schema-manifest-tamper'
  ]) {
    const negative = (report.negativeResults ?? []).find(result => result.name === name);
    ok(Boolean(negative), `interop report includes ${name}`);
    ok(negative?.pass === true, `interop report ${name} passes`);
  }
}

function checkCdmReadinessDocs() {
  const cdm = adapterRegistry.find(plugin => plugin.id === 'cdm-collateral-eligibility');
  if (!cdm?.readiness) {
    fail.push('cannot check CDM readiness docs without registered CDM readiness metadata');
    return;
  }
  const expectedNonClaimSentence = `It is not ${joinWithFinalOr(cdm.readiness.nonClaims)}.`;
  const doc = readText('docs/06_interop_adapters.md');
  const readinessDoc = readText('docs/09_adapter_readiness_levels.md');
  const exactLevel = 'The current FINOS CDM adapter is Level 2 — Artifact Conformance.';
  ok(doc.includes('## Adapter Readiness Levels'), 'interop docs include Adapter Readiness Levels section');
  ok(doc.includes(exactLevel), 'interop docs state current CDM Level 2 readiness');
  ok(doc.includes(expectedNonClaimSentence), 'interop docs include explicit Level 2 CDM non-claims in plugin order');
  ok(readinessDoc.includes(expectedNonClaimSentence), 'readiness docs include explicit Level 2 CDM non-claims in plugin order');
  for (const nonClaim of cdm.readiness.nonClaims) {
    ok(doc.includes(nonClaim), `interop docs include non-claim ${nonClaim}`);
    ok(readinessDoc.includes(nonClaim), `readiness docs include non-claim ${nonClaim}`);
  }
  checkCdmOverclaimLanguage();
}

function checkPassportScopeBoundary() {
  const coreFoundation = readText('packages/passport-core/daml/Aevelum/Passport/Foundation.daml');
  for (const token of [
    'ReservationHandoffInstruction',
    'CreateReservationHandoff',
    'handoffRecipient'
  ]) {
    ok(coreFoundation.includes(token), `Daml foundation contains ${token}`);
  }

  for (const rel of [
    ...walkFiles('packages/passport-core/daml', { extensions: ['.daml'] }),
    ...walkFiles('packages/passport-tests/daml', { extensions: ['.daml'] })
  ]) {
    const text = readText(rel);
    for (const [index, token] of [
      'ExecutionInstruction',
      'ConvertToExecutionInstruction',
      'executionRailParty',
      'executionRail',
      'instructionId',
      'instructionPurpose',
      'instructionCreatedAt',
      'handoffObserver',
      'ReservationHandedOff',
      'auditor : Optional Party',
      'SettlementFinality',
      'CustodyWallet',
      'CollateralOptimizer',
      'CreditApproval',
      'CreditDecision',
      'ZKProof',
      'ZeroKnowledge'
    ].entries()) {
      ok(!text.includes(token), `${rel} excludes Passport out-of-scope Daml token ${index + 1}`);
    }
  }

  const requiredScopeStatements = [
    'Aevelum Passport is the public Canton/Daml foundation for private collateral-readiness credentials.',
    'Passport records readiness.',
    'Passport may record a reservation handoff notice.',
    'Passport does not execute the downstream trade.',
    'Passport does not custody, transfer, settle, or move collateral.'
  ];
  for (const rel of ['README.md', 'docs/02_foundation_release_scope.md']) {
    const text = readText(rel);
    for (const statement of requiredScopeStatements) {
      ok(text.includes(statement), `${rel} includes canonical scope statement ${statement}`);
    }
  }

  const nonGoalDoc = readText('docs/07_non_goals.md');
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
    ok(nonGoalDoc.includes(required), `docs/07_non_goals.md includes non-goal ${required}`);
  }

  for (const rel of [
    'README.md',
    'docs/02_foundation_release_scope.md',
    'docs/05_privacy_model.md',
    'docs/07_non_goals.md',
    'artifacts/demo_transcript.json'
  ]) {
    const text = readText(rel).toLowerCase();
    for (const needle of [
      'capacityreservation is visible',
      'holder',
      'attester',
      'verifier',
      'reservationhandoffinstruction',
      'handoff recipient',
      'auditdisclosuregrant',
      'auditor'
    ]) {
      ok(text.includes(needle), `${rel} includes dedicated visibility language`);
    }
  }

  for (const rel of passportScopeDocs()) {
    const text = readText(rel).toLowerCase();
    for (const forbidden of [
      'capacityreservation is visible only to holder, attester, verifier, and optional scoped observers',
      'optional scoped observers',
      'optional handoff observer and auditor',
      'optional handoff observer',
      'reservation-level auditor'
    ]) {
      ok(!text.includes(forbidden), `${rel} excludes stale reservation observer language`);
    }
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

  for (const rel of passportScopeDocs()) {
    for (const unit of claimUnits(readText(rel))) {
      for (const { label, pattern } of unsafePatterns) {
        if (!pattern.test(unit.text)) continue;
        ok(isSafeScopeBoundaryClaim(unit.text), `${rel}:${unit.line} bounds Passport scope claim ${label}`);
      }
    }
  }
}

function passportScopeDocs() {
  const files = new Set([
    'README.md',
    'AGENTS.md',
    ...walkFiles('docs', { extensions: ['.md'] }),
    ...walkFiles('design', { extensions: ['.md'] }),
    ...walkFiles('hardening', { extensions: ['.md'] }),
    ...walkFiles('.agents/skills', { extensions: ['.md'] }),
    'artifacts/demo_transcript.json'
  ]);
  return [...files].filter(file => fs.existsSync(abs(file))).sort();
}

function isSafeScopeBoundaryClaim(text) {
  return /\b(not|no|without|does not|must not|non-executing|metadata-only|readiness only|out of scope|excludes|excluded)\b/i.test(text);
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
    'npm run hardening:formal',
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

function checkDpmSdkPins() {
  const packageConfigFiles = [
    'packages/passport-core/daml.yaml',
    'packages/passport-tests/daml.yaml'
  ];
  const versions = packageConfigFiles.map(rel => {
    const match = readText(rel).match(/^sdk-version:\s*(\S+)\s*$/m);
    ok(Boolean(match), `${rel} declares sdk-version`);
    return match?.[1] ?? null;
  });
  const expected = versions[0];
  ok(Boolean(expected), 'DPM SDK pin is discoverable from package configs');
  ok(versions.every(version => version === expected), `DPM package sdk-version pins are consistent at ${expected}`);
  ok(!/(?:rc|snapshot)/i.test(expected ?? ''), `DPM SDK pin ${expected} is stable, not RC or snapshot`);

  const workflow = readText('.github/workflows/ci.yml');
  const readme = readText('README.md');
  const runDamlTests = readText('scripts/run-daml-tests.sh');
  const policy = readText('hardening/policies/architecture-rules.json');
  const gate = readText('scripts/gates.mjs');
  const docsMinor = (expected ?? '').split('.').slice(0, 2).join('.');
  const installNeedle = ['dpm', 'install', expected].join(' ');

  ok(workflow.includes(`dpm-${'${{ runner.os }}'}-${expected}`), `.github workflow cache key pins DPM SDK ${expected}`);
  ok(workflow.includes(installNeedle), `.github workflow installs DPM SDK ${expected}`);
  ok(workflow.includes(`expected DPM SDK ${expected}`), `.github workflow verifies DPM SDK ${expected}`);
  ok(readme.includes(`SDK \`${expected}\``), `README documents DPM SDK ${expected}`);
  ok(readme.includes(`/build/${docsMinor}/dpm/dpm.html`), `README links DPM docs for ${docsMinor}`);
  ok(runDamlTests.includes(`pin SDK ${expected}`), `run-daml-tests missing-DPM message pins ${expected}`);
  ok(runDamlTests.includes('cd "$ROOT/packages/passport-tests"'), 'run-daml-tests enters passport-tests package before dpm test');
  ok(!runDamlTests.includes('--package-root'), 'run-daml-tests avoids brittle dpm test --package-root invocation');
  ok(policy.includes(`dpm-${'${{ runner.os }}'}-${expected}`), `architecture policy cache key pins DPM SDK ${expected}`);
  ok(policy.includes(installNeedle), `architecture policy install command pins DPM SDK ${expected}`);
  ok(gate.includes(`dpmSdk: '${expected}'`), `gate report pins DPM SDK ${expected}`);
}

for (const rel of [
  'AGENTS.md',
  '.agents/skills/passport-hardening-loop/SKILL.md',
  '.agents/skills/passport-hardening-loop/agents/openai.yaml',
  'hardening/maps/passport.invariants.json',
  'hardening/frontiers/passport.frontier.json',
  'hardening/policies/architecture-rules.json',
  'hardening/formal/daml-ledger-core/FORMAL_LADDER.md',
  'hardening/formal/daml-ledger-core/obligations.json',
  'hardening/formal/daml-ledger-core/reference-model.mjs',
  'hardening/formal/daml-ledger-core/reservation-core.tla',
  'hardening/rounds/round-0001.md',
  'hardening/rounds/round-0005.md',
  'hardening/rounds/round-0006.md',
  'hardening/rounds/round-0007.md',
  'hardening/rounds/round-0008.md',
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
checkRepoAuthoredNetworkPolicy();
checkAjvDynamicExecutionDependencyException();
checkAdapterReadiness();
checkInteropReportReadiness();
checkCdmPayloadPurity();
checkCdmReadinessDocs();
checkPassportScopeBoundary();
checkCiOrder();
checkDpmSdkPins();

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

function checkRepoAuthoredNetworkPolicy() {
  const allowedNetworkFiles = new Set(['interop/plugins/cdm/vendor.js']);
  const files = [
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

function checkReadinessNegativeCases() {
  const cases = [
    {
      id: 'registered-plugin-level-0',
      run: () => assertPluginShape(fakePlugin({
        level: 0,
        name: 'Concept',
        evidence: baseEvidence(['adapter-contract'])
      }))
    },
    {
      id: 'missing-readiness-object',
      run: () => assertPluginShape({
        id: 'fake-missing-readiness',
        framework: 'fake',
        frameworkVersion: '0',
        outputFormat: 'json',
        artifactTypes: ['fake'],
        generate: async () => [],
        validate: async result => result
      })
    },
    {
      id: 'level-name-mismatch',
      run: () => assertPluginShape(fakePlugin({
        level: 2,
        name: 'Interface'
      }))
    },
    {
      id: 'level-2-missing-negative-case',
      run: () => assertPluginShape(fakePlugin({
        level: 2,
        name: 'Artifact Conformance',
        evidence: baseEvidence().filter(item => item.category !== 'negative-case')
      }))
    },
    {
      id: 'level-2-rosetta-execution-overclaim',
      run: () => assertPluginShape(fakePlugin({
        level: 2,
        name: 'Artifact Conformance',
        claims: ['Rosetta Engine execution']
      }))
    },
    {
      id: 'level-2-live-external-integration-overclaim',
      run: () => assertPluginShape(fakePlugin({
        level: 2,
        name: 'Artifact Conformance',
        claims: ['live external integration']
      }))
    },
    {
      id: 'level-3-missing-executable-evidence',
      run: () => assertPluginShape(fakePlugin({
        level: 3,
        name: 'Executable Conformance'
      }))
    },
    {
      id: 'level-3-category-without-proof-reference',
      run: () => {
        const readiness = fakeLevel3Readiness([]);
        assertReadinessEvidenceBound(readiness);
        assertReadinessEvidenceReferences(readiness, { root: abs('.') });
      }
    },
    {
      id: 'level-3-canonical-engine-package-json-only',
      run: () => {
        const readiness = fakeLevel3Readiness(['package.json']);
        assertReadinessEvidenceBound(readiness);
        assertReadinessEvidenceReferences(readiness, { root: abs('.') });
      }
    },
    {
      id: 'level-3-canonical-engine-readme-only',
      run: () => {
        const readiness = fakeLevel3Readiness(['README.md']);
        assertReadinessEvidenceBound(readiness);
        assertReadinessEvidenceReferences(readiness, { root: abs('.') });
      }
    },
    {
      id: 'level-3-canonical-engine-generic-doc-only',
      run: () => {
        const readiness = fakeLevel3Readiness(['docs/09_adapter_readiness_levels.md']);
        assertReadinessEvidenceBound(readiness);
        assertReadinessEvidenceReferences(readiness, { root: abs('.') });
      }
    },
    {
      id: 'level-4-missing-sandbox-evidence',
      run: () => assertPluginShape(fakePlugin({
        level: 4,
        name: 'Sandbox Integration',
        evidence: [
          ...baseEvidence(),
          evidence('fake.executable', 'canonical-engine-execution')
        ]
      }))
    },
    {
      id: 'level-4-sandbox-generic-doc-only',
      run: () => {
        const readiness = fakeLevel4Readiness(['docs/09_adapter_readiness_levels.md']);
        assertReadinessEvidenceBound(readiness);
        assertReadinessEvidenceReferences(readiness, { root: abs('.') });
      }
    },
    {
      id: 'level-5-missing-production-evidence',
      run: () => assertPluginShape(fakePlugin({
        level: 5,
        name: 'Production Integration',
        evidence: [
          ...baseEvidence(),
          evidence('fake.executable', 'canonical-engine-execution'),
          evidence('fake.sandbox-auth', 'sandbox-auth'),
          evidence('fake.sandbox-environment', 'sandbox-environment'),
          evidence('fake.operational-error-handling', 'operational-error-handling'),
          evidence('fake.monitoring-logging', 'monitoring-logging'),
          evidence('fake.sandbox-test', 'sandbox-test')
        ]
      }))
    },
    {
      id: 'level-5-production-generic-doc-only',
      run: () => {
        const readiness = fakeLevel5Readiness(['docs/09_adapter_readiness_levels.md']);
        assertReadinessEvidenceBound(readiness);
        assertReadinessEvidenceReferences(readiness, { root: abs('.') });
      }
    }
  ];

  for (const item of cases) {
    expectFailure(`readiness negative case ${item.id}`, item.run);
  }
}

function checkReadinessPositiveCases() {
  expectSuccess('readiness positive case level-3-executable-proof-bearing-reference', () => {
    const readiness = fakeLevel3Readiness(['package.json', 'scripts/interop-validate.mjs']);
    assertReadinessEvidenceBound(readiness);
    assertReadinessEvidenceReferences(readiness, { root: abs('.') });
  });
}

function expectFailure(label, fn) {
  try {
    fn();
    fail.push(`${label} did not fail`);
  } catch (error) {
    pass.push(`${label} failed as expected: ${error.message}`);
  }
}

function expectSuccess(label, fn) {
  try {
    fn();
    pass.push(`${label} passed`);
  } catch (error) {
    fail.push(`${label} failed unexpectedly: ${error.message}`);
  }
}

function fakePlugin(overrides = {}) {
  return {
    id: `fake-${overrides.level ?? 'readiness'}`,
    framework: 'fake',
    frameworkVersion: '0',
    outputFormat: 'json',
    artifactTypes: ['fake-artifact'],
    readiness: fakeReadiness(overrides),
    generate: async () => [],
    validate: async result => result
  };
}

function fakeReadiness(overrides = {}) {
  return {
    level: 2,
    name: 'Artifact Conformance',
    summary: 'Generates and validates offline fake artifacts for readiness gate testing.',
    evidence: baseEvidence(),
    claims: ['offline artifact generation'],
    nonClaims: ['live external integration'],
    promotionCriteria: ['Level 3 requires executable evidence.'],
    lastVerifiedBy: 'npm run gate',
    ...overrides
  };
}

function fakeLevel3Readiness(executableReferences) {
  return fakeReadiness({
    level: 3,
    name: 'Executable Conformance',
    evidence: [
      ...baseEvidence(),
      evidence('fake.executable', 'canonical-engine-execution', executableReferences)
    ]
  });
}

function fakeLevel4Readiness(sandboxReferences) {
  return fakeReadiness({
    level: 4,
    name: 'Sandbox Integration',
    evidence: [
      ...baseEvidence(),
      evidence('fake.executable', 'canonical-engine-execution', ['scripts/interop-validate.mjs']),
      ...sandboxEvidence(sandboxReferences)
    ]
  });
}

function fakeLevel5Readiness(productionReferences) {
  return fakeReadiness({
    level: 5,
    name: 'Production Integration',
    evidence: [
      ...baseEvidence(),
      evidence('fake.executable', 'canonical-engine-execution', ['scripts/interop-validate.mjs']),
      ...sandboxEvidence(['packages/passport-tests/daml.yaml']),
      evidence('fake.production-partner', 'production-partner-evidence', productionReferences),
      evidence('fake.security-review', 'security-review', productionReferences),
      evidence('fake.operational-runbook', 'operational-runbook', productionReferences),
      evidence('fake.release-control', 'release-control', productionReferences),
      evidence('fake.sla-incident', 'sla-incident-evidence', productionReferences)
    ]
  });
}

function sandboxEvidence(references) {
  return [
    evidence('fake.sandbox-auth', 'sandbox-auth', references),
    evidence('fake.sandbox-environment', 'sandbox-environment', references),
    evidence('fake.operational-error-handling', 'operational-error-handling', references),
    evidence('fake.monitoring-logging', 'monitoring-logging', references),
    evidence('fake.sandbox-test', 'sandbox-test', references)
  ];
}

function baseEvidence(categories = [
  'adapter-contract',
  'static-registry',
  'policy-boundary',
  'offline-artifact-generation',
  'committed-schema-validation',
  'ci-evidence',
  'negative-case'
]) {
  return categories.map(category => evidence(`fake.${category}`, category));
}

function evidence(id, category, references = ['package.json']) {
  return {
    id,
    category,
    summary: `Fake ${category} evidence for readiness gate testing.`,
    references
  };
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

function pluginIdentityFields(plugin) {
  return {
    id: plugin.id,
    framework: plugin.framework,
    frameworkVersion: plugin.frameworkVersion,
    outputFormat: plugin.outputFormat
  };
}

function joinWithFinalOr(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')}, or ${items[items.length - 1]}`;
}

function stableStringify(value) {
  return JSON.stringify(sortJson(value));
}

function sortJson(value) {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, child]) => [key, sortJson(child)]));
}

function checkCdmOverclaimLanguage() {
  const files = docsAndMarketingFiles();
  const patterns = [
    { label: 'live external integration', pattern: /\blive external integration\b/i },
    { label: 'live integration', pattern: /\blive integration\b/i },
    { label: 'production integration', pattern: /\bproduction integration\b/i },
    { label: 'production partner integration', pattern: /\bproduction partner integration\b/i },
    { label: 'FINOS certification', pattern: /\bfinos certification\b/i },
    { label: 'certified', pattern: /\bcertified\b/i },
    { label: 'Rosetta Engine execution', pattern: /\brosetta engine execution\b/i },
    { label: 'CDM eligibility-engine execution', pattern: /\bcdm eligibility[- ]engine execution\b/i },
    { label: 'CDM engine execution', pattern: /\bcdm engine execution\b/i },
    { label: 'Canton Token Standard integration', pattern: /\bcanton token standard integration\b/i },
    { label: 'sandbox partner integration', pattern: /\bsandbox partner integration\b/i },
    { label: 'custody', pattern: /\bcustody\b/i, requiresAdapterSubject: true },
    { label: 'settlement', pattern: /\bsettlement\b/i, requiresAdapterSubject: true }
  ];

  for (const rel of files) {
    for (const unit of claimUnits(readText(rel))) {
      for (const { label, pattern, requiresAdapterSubject = false } of patterns) {
        if (!pattern.test(unit.text)) continue;
        if (requiresAdapterSubject && !mentionsAdapterOrProduct(unit.text)) continue;
        ok(isBoundedReadinessClaim(unit.text), `${rel}:${unit.line} bounds Level 2 ${label} language`);
      }
    }
  }

  for (const fixture of overclaimPositiveFixtures()) {
    ok(isBoundedReadinessClaim(fixture), `positive overclaim fixture is bounded: ${fixture}`);
  }
  for (const fixture of overclaimNegativeFixtures()) {
    ok(!isBoundedReadinessClaim(fixture), `negative overclaim fixture is rejected: ${fixture}`);
  }
}

function docsAndMarketingFiles() {
  const files = new Set([
    'README.md',
    'AGENTS.md',
    ...walkFiles('docs', { extensions: ['.md'] }),
    ...walkFiles('.agents/skills', { extensions: ['.md'] })
  ]);

  for (const file of gitTrackedFiles()) {
    if (!file.endsWith('.md')) continue;
    if (/(^|\/)(release|package|packaging|review)[^/]*\.md$/i.test(file)) files.add(file);
  }

  return [...files].filter(file => fs.existsSync(abs(file))).sort();
}

function gitTrackedFiles() {
  try {
    return execFileSync('git', ['ls-files', '-z'], { cwd: abs('.') })
      .toString('utf8')
      .split('\0')
      .filter(Boolean);
  } catch {
    return [];
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
    const parts = clean
      .split(/(?<=[.!?])\s+|;\s*/)
      .map(part => part.replace(/\|/g, ' ').trim())
      .filter(Boolean);
    for (const part of parts) units.push({ text: part, line: i + 1 });
  }
  return units;
}

function mentionsAdapterOrProduct(text) {
  return /\b(adapter|passport|cdm|finos|foundation release|current)\b/i.test(text);
}

function isBoundedReadinessClaim(text) {
  return hasSameSentenceNegation(text) || hasSameSentencePromotionBoundary(text);
}

function hasSameSentenceNegation(text) {
  return /\b(not|no|without|does not|must not|non-claim|non-claims|excluded|out of scope|not shipped)\b/i.test(text);
}

function hasSameSentencePromotionBoundary(text) {
  return /\b(Level [3-5]|[3-5]\s+(?:Executable Conformance|Sandbox Integration|Production Integration)|future|candidate|requires|promotion|before promotion|next frontier)\b/i.test(text)
    && /\b(evidence|required|requires|future|candidate|not shipped|before promotion)\b/i.test(text);
}

function overclaimPositiveFixtures() {
  return [
    'It is not FINOS certification.',
    'Level 3 requires Rosetta Engine execution evidence.',
    'Canton Token Standard integration is a future adapter candidate, not shipped in this release.'
  ];
}

function overclaimNegativeFixtures() {
  return [
    'The CDM adapter provides Rosetta Engine execution.',
    'Passport has live external integration.',
    'The current CDM adapter is certified.',
    'The adapter supports custody and settlement.'
  ];
}
