import { generateInteropArtifacts } from '../interop/runner.js';

const report = await generateInteropArtifacts({ validate: false });
console.log(`generated ${report.results.length} interop artifact(s)`);
