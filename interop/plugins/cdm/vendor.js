import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const cdmVersion = '6.0';
export const schemaSource = `https://cdm.finos.org/schemas/${cdmVersion}/`;
export const rootSchemas = Object.freeze([
  'cdm-product-collateral-EligibleCollateralSpecification.schema.json',
  'cdm-product-collateral-EligibilityQuery.schema.json',
  'cdm-product-collateral-CheckEligibilityResult.schema.json'
]);

const pluginRoot = path.dirname(new URL(import.meta.url).pathname);
export const schemaDir = path.join(pluginRoot, 'assets', 'schemas', cdmVersion);
export const manifestPath = path.join(schemaDir, 'manifest.json');

export async function vendorCdmSchemas() {
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

  writeSourceFile();
  writeSchemaManifest();
  console.log(`vendored ${seen.size} CDM ${cdmVersion} schema files into ${path.relative(process.cwd(), schemaDir)}`);
}

export function writeSchemaManifest() {
  const files = walkSchemaFiles(schemaDir).map(abs => {
    const rel = path.relative(schemaDir, abs);
    return {
      path: rel,
      sha256: sha256(fs.readFileSync(abs))
    };
  });

  const manifest = {
    artifact: 'cdm_schema_manifest',
    framework: 'cdm',
    frameworkVersion: cdmVersion,
    schemaSource,
    rootSchemas,
    schemaCount: files.length,
    schemaSetDigest: digestSchemaSet(files),
    generatedAt: new Date().toISOString(),
    files
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

export function verifySchemaManifest() {
  return verifySchemaManifestAt(schemaDir);
}

export function verifySchemaManifestAt(targetSchemaDir) {
  const targetManifestPath = path.join(targetSchemaDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(targetManifestPath, 'utf8'));
  const expectedFiles = new Map(manifest.files.map(file => [file.path, file.sha256]));
  const actualFiles = walkSchemaFiles(targetSchemaDir).map(abs => path.relative(targetSchemaDir, abs));

  if (manifest.framework !== 'cdm') throw new Error('CDM schema manifest has wrong framework');
  if (manifest.frameworkVersion !== cdmVersion) throw new Error('CDM schema manifest has wrong version');
  if (manifest.schemaSource !== schemaSource) throw new Error('CDM schema manifest has wrong source');
  if (manifest.schemaCount !== actualFiles.length) throw new Error('CDM schema manifest schemaCount mismatch');
  if (manifest.schemaSetDigest !== digestSchemaSet(manifest.files)) throw new Error('CDM schema manifest set digest mismatch');

  for (const rel of actualFiles) {
    const expected = expectedFiles.get(rel);
    if (!expected) throw new Error(`CDM schema manifest missing file: ${rel}`);
    const actual = sha256(fs.readFileSync(path.join(targetSchemaDir, rel)));
    if (actual !== expected) throw new Error(`CDM schema hash mismatch: ${rel}`);
  }
  for (const rel of expectedFiles.keys()) {
    if (!actualFiles.includes(rel)) throw new Error(`CDM schema manifest references missing file: ${rel}`);
  }

  return manifest;
}

export function walkSchemaFiles(dir = schemaDir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) walkSchemaFiles(abs, acc);
    else if (ent.name.endsWith('.schema.json')) acc.push(abs);
  }
  return acc.sort();
}

function writeSourceFile() {
  const source = `# FINOS CDM ${cdmVersion} Schema Subset

This directory vendors the JSON Schema closure required by the Aevelum Passport CDM adapter plugin.

- Source index: ${schemaSource}
- Root schemas:
${rootSchemas.map(name => `  - ${name}`).join('\n')}
- Refresh command: \`npm run interop:vendor:cdm\`
- Schema format: JSON Schema draft-04

These files come from the FINOS Common Domain Model schema publication and are used here only for local generated-artifact validation.
`;

  fs.writeFileSync(path.join(schemaDir, 'SOURCE.md'), source);
}

async function fetchSchema(name) {
  const url = `${schemaSource}${name}`;
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

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function digestSchemaSet(files) {
  const lines = [...files]
    .sort((a, b) => a.path.localeCompare(b.path))
    .map(file => `${file.path} ${file.sha256}`)
    .join('\n');
  return `sha256:${sha256(Buffer.from(`${lines}\n`, 'utf8'))}`;
}
