import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv-draft-04';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cdmVersion = '6.0';
const schemaDir = path.join(root, 'schemas', 'cdm', cdmVersion);
const fixtureDir = path.join(root, 'fixtures', 'cdm', cdmVersion);
const artifactsDir = path.join(root, 'artifacts');

const cases = [
  {
    name: 'eligible-collateral-specification',
    schema: 'cdm-product-collateral-EligibleCollateralSpecification.schema.json',
    fixture: 'eligible-collateral-specification.us-treasury.json',
    expectValid: true
  },
  {
    name: 'eligibility-query',
    schema: 'cdm-product-collateral-EligibilityQuery.schema.json',
    fixture: 'eligibility-query.us-treasury.json',
    expectValid: true
  },
  {
    name: 'check-eligibility-result',
    schema: 'cdm-product-collateral-CheckEligibilityResult.schema.json',
    fixture: 'check-eligibility-result.us-treasury.json',
    expectValid: true
  },
  {
    name: 'negative-invalid-eligibility-query',
    schema: 'cdm-product-collateral-EligibilityQuery.schema.json',
    fixture: 'negative/invalid-eligibility-query.missing-required.json',
    expectValid: false
  }
];

function readJson(abs) {
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}

function walkJsonSchemas(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) walkJsonSchemas(abs, acc);
    else if (ent.name.endsWith('.schema.json')) acc.push(abs);
  }
  return acc.sort();
}

if (!fs.existsSync(schemaDir)) {
  throw new Error(`missing vendored CDM schemas at ${path.relative(root, schemaDir)}; run npm run cdm:vendor-schemas`);
}

const ajv = new Ajv({
  allErrors: true,
  strict: false,
  validateSchema: false
});

const schemaFiles = walkJsonSchemas(schemaDir);
for (const abs of schemaFiles) {
  const schema = readJson(abs);
  ajv.addSchema(schema, path.basename(abs));
}

const results = [];
let failed = false;

for (const item of cases) {
  const fixturePath = path.join(fixtureDir, item.fixture);
  const validate = ajv.getSchema(item.schema);
  if (!validate) throw new Error(`schema not registered: ${item.schema}`);
  const data = readJson(fixturePath);
  const valid = validate(data);
  const passed = valid === item.expectValid;
  if (!passed) failed = true;
  results.push({
    name: item.name,
    fixture: path.relative(root, fixturePath),
    schema: item.schema,
    expectedValid: item.expectValid,
    actualValid: valid,
    pass: passed,
    errors: validate.errors ?? []
  });
}

const report = {
  artifact: 'cdm_conformance_report',
  package: 'aevelum-passport-foundation',
  version: '0.1.0',
  status: failed ? 'failed' : 'passed',
  generatedAt: new Date().toISOString(),
  cdmVersion,
  schemaSource: `https://cdm.finos.org/schemas/${cdmVersion}/`,
  validator: 'ajv-draft-04',
  schemaFiles: schemaFiles.length,
  claim: 'formal FINOS CDM 6.0 JSON-schema conformance for Passport collateral eligibility fixtures',
  results
};

fs.mkdirSync(artifactsDir, { recursive: true });
const out = path.join(artifactsDir, 'cdm_conformance_report.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');

if (failed) {
  console.error(`CDM conformance failed; wrote ${out}`);
  for (const result of results.filter(r => !r.pass)) {
    console.error(` - ${result.name}: expected ${result.expectedValid}, got ${result.actualValid}`);
  }
  process.exit(1);
}

console.log(`CDM conformance passed: ${cases.length} fixture checks against ${schemaFiles.length} schema files`);
