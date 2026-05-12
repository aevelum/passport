import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cdmVersion = '6.0';
const baseUrl = `https://cdm.finos.org/schemas/${cdmVersion}`;
const schemaDir = path.join(root, 'schemas', 'cdm', cdmVersion);
const rootSchemas = [
  'cdm-product-collateral-EligibleCollateralSpecification.schema.json',
  'cdm-product-collateral-EligibilityQuery.schema.json',
  'cdm-product-collateral-CheckEligibilityResult.schema.json'
];

function collectRefs(value, refs = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectRefs(item, refs);
    return refs;
  }
  if (!value || typeof value !== 'object') return refs;
  for (const [key, item] of Object.entries(value)) {
    if (key === '$ref' && typeof item === 'string') {
      const ref = item.split('#')[0];
      if (ref && !ref.startsWith('http://') && !ref.startsWith('https://')) refs.add(ref);
    } else {
      collectRefs(item, refs);
    }
  }
  return refs;
}

async function fetchSchema(name) {
  const url = `${baseUrl}/${name}`;
  const response = await fetch(url, {
    headers: { accept: 'application/schema+json, application/json' }
  });
  if (!response.ok) throw new Error(`failed to fetch ${url}: ${response.status} ${response.statusText}`);
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return JSON.parse(escapeControlCharactersInStrings(text));
  }
}

function escapeControlCharactersInStrings(text) {
  let out = '';
  let inString = false;
  let escaping = false;

  for (const ch of text) {
    if (inString && !escaping && ch === '\n') {
      out += '\\n';
      continue;
    }
    if (inString && !escaping && ch === '\r') {
      out += '\\r';
      continue;
    }

    out += ch;

    if (escaping) {
      escaping = false;
    } else if (ch === '\\') {
      escaping = true;
    } else if (ch === '"') {
      inString = !inString;
    }
  }

  return out;
}

fs.rmSync(schemaDir, { recursive: true, force: true });
fs.mkdirSync(schemaDir, { recursive: true });

const queue = [...rootSchemas];
const seen = new Set();

while (queue.length > 0) {
  const name = queue.shift();
  if (seen.has(name)) continue;
  seen.add(name);

  const schema = await fetchSchema(name);
  fs.writeFileSync(path.join(schemaDir, name), JSON.stringify(schema, null, 2) + '\n');

  for (const ref of collectRefs(schema)) {
    if (!seen.has(ref) && !queue.includes(ref)) queue.push(ref);
  }
}

const source = `# FINOS CDM ${cdmVersion} Schema Subset

This directory vendors the JSON Schema closure required to validate the Aevelum Passport CDM collateral eligibility fixtures offline.

- Source index: ${baseUrl}/
- Root schemas:
${rootSchemas.map(name => `  - ${name}`).join('\n')}
- Refresh command: \`npm run cdm:vendor-schemas\`
- Schema format: JSON Schema draft-04

These files come from the FINOS Common Domain Model schema publication and are used here only for local fixture validation.
`;

fs.writeFileSync(path.join(schemaDir, 'SOURCE.md'), source);
console.log(`vendored ${seen.size} CDM ${cdmVersion} schema files into ${path.relative(root, schemaDir)}`);
