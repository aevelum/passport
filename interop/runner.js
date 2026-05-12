import fs from 'node:fs';
import path from 'node:path';
import { adapterRegistry, listAdapters } from './registry.js';
import { createDefaultAdapterContext } from './context.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const samplePath = path.join(root, 'interop', 'samples', 'repo-pretrade-passport-input.json');
const artifactsRoot = path.join(root, 'artifacts', 'interop');

export async function generateInteropArtifacts({ validate = false } = {}) {
  const input = readJson(samplePath);
  const context = createDefaultAdapterContext({
    sourceRef: path.relative(root, samplePath)
  });

  const results = [];
  const negativeResults = [];

  for (const plugin of adapterRegistry) {
    const generated = await plugin.generate(input, context);
    for (const result of generated) {
      const finalResult = validate ? await plugin.validate(result, context) : result;
      writePayload(finalResult);
      results.push(resultForReport(finalResult));
    }
    if (validate && plugin.validateNegativeCases) {
      negativeResults.push(...await plugin.validateNegativeCases(context));
    }
  }

  const failed = validate && (
    results.some(result => !result.validation.valid)
    || negativeResults.some(result => !result.pass)
  );
  const report = {
    artifact: 'interop_report',
    package: 'aevelum-passport-foundation',
    version: '0.1.0',
    status: validate ? (failed ? 'failed' : 'passed') : 'generated',
    generatedAt: context.now,
    sourceRef: context.sourceRef,
    securityPolicy: context.securityPolicy,
    adapters: listAdapters(),
    results,
    negativeResults
  };

  writeJson(path.join(artifactsRoot, 'report.json'), report);
  if (failed) {
    throw new Error('interop validation failed; see artifacts/interop/report.json');
  }
  return report;
}

function resultForReport(result) {
  return {
    plugin: result.plugin,
    artifactType: result.artifactType,
    artifactPath: artifactPath(result),
    validation: result.validation,
    provenance: result.provenance,
    warnings: result.warnings
  };
}

function writePayload(result) {
  writeJson(path.join(root, artifactPath(result)), result.payload);
}

function artifactPath(result) {
  return path.join(
    'artifacts',
    'interop',
    result.plugin.framework,
    result.plugin.frameworkVersion,
    `${result.artifactType}.json`
  );
}

function readJson(abs) {
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}

function writeJson(abs, value) {
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(value, null, 2) + '\n');
}
