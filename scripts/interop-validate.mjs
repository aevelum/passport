import { generateInteropArtifacts } from '../interop/runner.js';

const report = await generateInteropArtifacts({ validate: true });
console.log(`interop validation passed: ${report.results.length} artifact(s), ${report.negativeResults.length} negative case(s)`);
