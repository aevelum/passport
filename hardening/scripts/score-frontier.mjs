import { buildFrontier, readJson, validateMap, writeJson } from './lib.mjs';

const mapPath = 'hardening/maps/passport.invariants.json';
const map = readJson(mapPath);
const validation = validateMap(map);
if (validation.fail.length) {
  console.error(`cannot score hardening frontier; map has ${validation.fail.length} issue(s)`);
  for (const item of validation.fail) console.error(` - ${item}`);
  process.exit(1);
}

const frontier = buildFrontier(map);
writeJson('hardening/frontiers/passport.frontier.json', frontier);
console.log(`hardening frontier scored: ${frontier.summary.candidates} candidate(s), top=${frontier.summary.top_candidate}`);
