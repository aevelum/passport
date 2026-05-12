import { cdmPlugin } from './plugins/cdm/index.js';

export const adapterRegistry = Object.freeze([
  cdmPlugin
]);

export function listAdapters() {
  return adapterRegistry.map(plugin => Object.freeze({
    id: plugin.id,
    framework: plugin.framework,
    frameworkVersion: plugin.frameworkVersion,
    outputFormat: plugin.outputFormat,
    artifactTypes: [...plugin.artifactTypes]
  }));
}
