import { readJson, validateFrontier } from './lib.mjs';

const actionArg = process.argv.find(arg => arg.startsWith('--action='));
const requestedAction = actionArg ? actionArg.split('=')[1] : null;

const map = readJson('hardening/maps/passport.invariants.json');
const frontier = readJson('hardening/frontiers/passport.frontier.json');
const validation = validateFrontier(frontier, map);
if (validation.fail.length) {
  console.error(`cannot select hardening round; frontier has ${validation.fail.length} issue(s)`);
  for (const item of validation.fail) console.error(` - ${item}`);
  process.exit(1);
}

const candidate = frontier.candidates.find(item => !requestedAction || item.action === requestedAction);
if (!candidate) {
  console.error(`no hardening candidate found${requestedAction ? ` for action ${requestedAction}` : ''}`);
  process.exit(1);
}

console.log(JSON.stringify({
  selected: candidate.id,
  action: candidate.action,
  priority_score: candidate.priority_score,
  component_id: candidate.component_id,
  property_id: candidate.property_id ?? null,
  kill_gate: candidate.kill_gate,
  evidence_needed: candidate.evidence_needed,
  fastest_falsifier: candidate.fastest_falsifier,
  writeback: 'Update hardening/rounds/ and hardening/change-log.md after the bounded round closes.'
}, null, 2));
