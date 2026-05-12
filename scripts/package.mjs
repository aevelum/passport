import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(root, '..', 'aevelum-passport-foundation.zip');
try { fs.rmSync(out, { force: true }); } catch {}
const files = execFileSync('git', ['ls-files', '-z'], { cwd: root })
  .toString('utf8')
  .split('\0')
  .filter(Boolean)
  .filter(file => file !== 'artifacts/daml_test_coverage.txt');

const result = spawnSync('zip', ['-q', out, '-@'], {
  cwd: root,
  input: files.join('\n') + '\n',
  stdio: ['pipe', 'inherit', 'inherit']
});
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`wrote ${out}`);
