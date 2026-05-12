import fs from 'node:fs';
import path from 'node:path';
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
checkCdmPayloadPurity();
checkCiOrder();

const packageScript = readText('scripts/package.mjs');
ok(packageScript.includes("file !== 'artifacts/daml_test_coverage.txt'"), 'package excludes Daml coverage artifact');

const report = {
  artifact: 'hardening_report',
  package: 'aevelum-passport-foundation',
  version: '0.1.0',
  generatedAt: new Date().toISOString(),
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
