import fs from 'node:fs';
import path from 'node:path';
import { getGeneratedAt } from '../../scripts/generated-time.mjs';
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
  const forbiddenKey = /^(passport|sourceRef|sourceType|sourceId|provenance|generatedAt|adapterVersion)$/i;
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
checkCdmPayloadPurity();
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
