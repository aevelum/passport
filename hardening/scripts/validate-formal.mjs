import fs from 'node:fs';
import path from 'node:path';
import { runBoundedReservationModel } from '../formal/daml-ledger-core/reference-model.mjs';
import { abs, collectMapIndex, readJson, readText } from './lib.mjs';

const pass = [];
const fail = [];
const validStatuses = new Set(['verified', 'bounded-pass', 'counterexample', 'inconclusive', 'not-run', 'out-of-scope']);
const requiredSections = [
  '## S0. Security Objective',
  '## S1. Formal Specification',
  '## S2. Executable Reference Model',
  '## S3. Implementation Mapping',
  '## S4. Proof Obligations',
  '## S5. Machine-Check Layer',
  '## S6. Assumption Register'
];

function ok(condition, message) {
  (condition ? pass : fail).push(message);
}

function existingFile(rel) {
  const exists = fs.existsSync(abs(rel));
  ok(exists, `exists: ${rel}`);
  return exists;
}

function sourceRefPath(sourceRef) {
  const match = sourceRef.match(/^(.+?)(?::(\d+))?$/);
  return {
    rel: match?.[1] ?? sourceRef,
    line: match?.[2] ? Number(match[2]) : null
  };
}

function validateSourceRef(sourceRef) {
  const { rel, line } = sourceRefPath(sourceRef);
  if (!existingFile(rel)) return;
  if (line === null) return;
  const lineCount = readText(rel).split('\n').length;
  ok(line > 0 && line <= lineCount, `${sourceRef} line exists`);
}

function validateNpmCommand(command, packageJson) {
  const match = command.match(/^npm run ([A-Za-z0-9:_-]+)$/);
  ok(Boolean(match), `${command} is an npm run command`);
  if (!match) return;
  ok(Object.hasOwn(packageJson.scripts ?? {}, match[1]), `${command} script exists`);
}

const ladderPath = 'hardening/formal/daml-ledger-core/FORMAL_LADDER.md';
const obligationsPath = 'hardening/formal/daml-ledger-core/obligations.json';
const tlaPath = 'hardening/formal/daml-ledger-core/reservation-core.tla';
const mapPath = 'hardening/maps/passport.invariants.json';
const packageJson = readJson('package.json');

for (const rel of [ladderPath, obligationsPath, tlaPath, mapPath]) existingFile(rel);

const ladder = readText(ladderPath);
for (const section of requiredSections) ok(ladder.includes(section), `${ladderPath} includes ${section}`);
ok(/result_status:\s*bounded-pass/.test(ladder), `${ladderPath} records bounded-pass result status`);
ok(/command:\s*npm run hardening:formal/.test(ladder), `${ladderPath} records hardening:formal command`);
ok(!/\bTODO\b/.test(ladder), `${ladderPath} has no TODO markers`);

const obligations = readJson(obligationsPath);
ok(obligations.artifact === 'passport_formal_obligations', `${obligationsPath} artifact is passport_formal_obligations`);
ok(obligations.schemaVersion === '0.1.0', `${obligationsPath} schemaVersion is 0.1.0`);
ok(validStatuses.has(obligations.result_status), `${obligationsPath} result_status is valid`);
ok(obligations.result_status === 'bounded-pass', `${obligationsPath} result_status is bounded-pass`);
ok(obligations.model?.path === 'hardening/formal/daml-ledger-core/reference-model.mjs', `${obligationsPath} model path is pinned`);
ok(obligations.model?.status === 'bounded-pass', `${obligationsPath} model status is bounded-pass`);

const map = readJson(mapPath);
const index = collectMapIndex(map);
ok(index.components.has(obligations.surface), `${obligationsPath} surface exists in invariant map`);
validateNpmCommand(obligations.checker, packageJson);

const proofObligations = obligations.proof_obligations ?? [];
ok(Array.isArray(proofObligations) && proofObligations.length > 0, `${obligationsPath} has proof obligations`);
const obligationIds = proofObligations.map(obligation => obligation.id);
ok(new Set(obligationIds).size === obligationIds.length, `${obligationsPath} proof obligation IDs are unique`);

for (const obligation of proofObligations) {
  ok(/^PO-DAML-\d{3}$/.test(obligation.id), `${obligation.id} has stable PO-DAML ID`);
  ok(validStatuses.has(obligation.status), `${obligation.id} status is valid`);
  ok(obligation.status === 'bounded-pass', `${obligation.id} status is bounded-pass`);

  for (const invariantId of obligation.maps_to?.invariants ?? []) {
    ok(index.invariants.has(invariantId), `${obligation.id} invariant exists ${invariantId}`);
  }
  for (const propertyId of obligation.maps_to?.properties ?? []) {
    ok(index.properties.has(propertyId), `${obligation.id} property exists ${propertyId}`);
  }

  for (const testId of obligation.evidence?.test_ids ?? []) {
    const test = index.tests.get(testId);
    ok(Boolean(test), `${obligation.id} evidence test exists ${testId}`);
    ok(test?.status === 'active', `${obligation.id} evidence test is active ${testId}`);
  }
  for (const command of obligation.evidence?.commands ?? []) validateNpmCommand(command, packageJson);
  for (const sourceRef of obligation.evidence?.source_refs ?? []) validateSourceRef(sourceRef);

  for (const assertion of obligation.source_assertions ?? []) {
    if (!existingFile(assertion.file)) continue;
    const text = readText(assertion.file);
    for (const needle of assertion.contains ?? []) {
      ok(text.includes(needle), `${obligation.id} ${assertion.file} contains ${needle}`);
    }
    for (const needle of assertion.excludes ?? []) {
      ok(!text.includes(needle), `${obligation.id} ${assertion.file} excludes ${needle}`);
    }
  }
}

const modelResult = runBoundedReservationModel();
ok(modelResult.result_status === 'bounded-pass', 'bounded reservation reference model passes');
for (const failure of modelResult.failures ?? []) fail.push(`model counterexample: ${failure}`);
const modelIds = new Set((modelResult.checks ?? []).map(check => check.id));
for (const obligation of proofObligations.filter(item => item.id !== 'PO-DAML-006')) {
  ok(modelIds.has(obligation.id), `${obligation.id} has bounded model coverage`);
}

if (fail.length) {
  console.error(`formal ledger core validation failed: ${fail.length} issue(s)`);
  for (const item of fail) console.error(` - ${item}`);
  process.exit(1);
}

console.log(`formal ledger core validation passed: ${proofObligations.length} obligations, ${modelResult.checks.length} bounded checks, ${pass.length} assertions`);
