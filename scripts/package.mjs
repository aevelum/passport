import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(root, '..', 'aevelum-passport-foundation.zip');
try { fs.rmSync(out, { force: true }); } catch {}
execFileSync('zip', [
  '-qr',
  out,
  '.',
  '-x',
  '.git/*',
  '.daml/*',
  '*/.daml/*',
  'node_modules/*',
  'artifacts/daml_test_coverage.txt',
  '*.zip'
], { cwd: root, stdio: 'inherit' });
console.log(`wrote ${out}`);
