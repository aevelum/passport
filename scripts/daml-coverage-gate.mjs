import fs from 'node:fs';
import path from 'node:path';

const coverageFile = process.argv[2] ?? path.join('artifacts', 'daml_test_coverage.txt');
const text = fs.readFileSync(coverageFile, 'utf8');

const checks = [
  {
    label: 'external templates',
    re: /- External templates\s+(\d+) defined\s+(\d+)\s+\(\s*100\.0%\) created in any tests[\s\S]*?external templates never created: 0/m
  },
  {
    label: 'external template choices',
    re: /- External template choices\s+(\d+) defined\s+(\d+)\s+\(\s*100\.0%\) exercised in any tests[\s\S]*?external template choices never exercised: 0/m
  }
];

const fail = [];

for (const check of checks) {
  const match = text.match(check.re);
  if (!match) {
    fail.push(`${check.label} are not at 100% coverage`);
    continue;
  }
  if (Number(match[1]) === 0) {
    fail.push(`${check.label} coverage did not include the core package`);
  }
}

if (fail.length) {
  console.error(`Daml coverage gate failed: ${fail.join('; ')}`);
  process.exit(1);
}

console.log('Daml coverage gate passed: external templates and domain choices are fully covered');
