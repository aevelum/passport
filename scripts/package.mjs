import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(root, '..', 'aevelum-passport-foundation.zip');
const requiredGeneratedFiles = [
  'packages/passport-core/.daml/dist/aevelum-passport-core-0.3.0.dar'
];

for (const file of requiredGeneratedFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    throw new Error(`missing generated release artifact: ${file}; run npm run daml:build before packaging`);
  }
}

try { fs.rmSync(out, { force: true }); } catch {}
const files = execFileSync('git', ['ls-files', '-z'], { cwd: root })
  .toString('utf8')
  .split('\0')
  .filter(Boolean)
  .filter(file => file !== 'artifacts/daml_test_coverage.txt');
for (const file of requiredGeneratedFiles) files.push(file);

const result = spawnSync('zip', ['-q', out, '-@'], {
  cwd: root,
  input: files.join('\n') + '\n',
  stdio: ['pipe', 'inherit', 'inherit']
});
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`wrote ${out}`);
