import fs from 'node:fs';
import path from 'node:path';
import { adapterRegistry, listAdapters } from './registry.js';
import { createDefaultAdapterContext } from './context.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const samplePath = path.join(root, 'interop', 'samples', 'repo-pretrade-passport-input.json');
const artifactsRoot = path.join(root, 'artifacts', 'interop');
const packageManifest = readJson(path.join(root, 'package.json'));
const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export async function generateInteropArtifacts({ validate = false } = {}) {
  const input = readJson(samplePath);
  const context = createDefaultAdapterContext({
    sourceRef: path.relative(root, samplePath)
  });

  const results = [];
  const negativeResults = [];
  const adapters = listAdapters();

  for (const plugin of adapterRegistry) {
    const generated = await plugin.generate(input, context);
    for (const result of generated) {
      assertAdapterResult(plugin, result);
      const finalResult = validate ? await plugin.validate(result, context) : result;
      assertAdapterResult(plugin, finalResult);
      writePayload(finalResult);
      results.push(resultForReport(finalResult));
    }
    if (validate && plugin.validateNegativeCases) {
      negativeResults.push(...await plugin.validateNegativeCases(context, input));
    }
  }

  const failed = validate && (
    results.some(result => !result.validation.valid)
    || negativeResults.some(result => !result.pass)
  );
  const report = {
    artifact: 'interop_report',
    package: packageManifest.name,
    version: packageManifest.version,
    status: validate ? (failed ? 'failed' : 'passed') : 'generated',
    generatedAt: context.now,
    sourceRef: context.sourceRef,
    securityPolicy: context.securityPolicy,
    adapters,
    adapterReadiness: adapters,
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
  const target = path.resolve(root, artifactPath(result));
  if (!target.startsWith(`${artifactsRoot}${path.sep}`)) {
    throw new Error(`interop artifact path escapes artifacts root: ${artifactPath(result)}`);
  }
  writeJson(target, result.payload);
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

function assertAdapterResult(plugin, result) {
  if (!result || typeof result !== 'object') throw new Error(`adapter ${plugin.id} returned a non-object result`);
  if (!plugin.artifactTypes.includes(result.artifactType)) {
    throw new Error(`adapter ${plugin.id} returned undeclared artifact type: ${result.artifactType}`);
  }
  assertSafeSegment(result.artifactType, `adapter ${plugin.id} artifact type`);

  for (const key of ['id', 'framework', 'frameworkVersion', 'outputFormat']) {
    if (result.plugin?.[key] !== plugin[key]) {
      throw new Error(`adapter ${plugin.id} result plugin.${key} does not match registered plugin`);
    }
    assertSafeSegment(result.plugin[key], `adapter ${plugin.id} result plugin.${key}`);
  }
}

function assertSafeSegment(value, label) {
  if (typeof value !== 'string' || !SAFE_SEGMENT.test(value)) {
    throw new Error(`${label} must be a safe path segment`);
  }
}
