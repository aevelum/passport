import { readJson, validateMap, writeJson } from './lib.mjs';

const mapPath = process.argv[2] ?? 'hardening/maps/passport.invariants.json';
const map = readJson(mapPath);
const result = validateMap(map);

writeJson('artifacts/hardening_map_report.json', {
  artifact: 'hardening_map_report',
  status: result.fail.length ? 'failed' : 'passed',
  mapPath,
  pass: result.pass,
  warn: result.warn,
  fail: result.fail
});

if (result.fail.length) {
  console.error(`hardening map failed: ${result.fail.length} issue(s)`);
  for (const item of result.fail) console.error(` - ${item}`);
  process.exit(1);
}

console.log(`hardening map passed: ${result.pass.length} checks`);
