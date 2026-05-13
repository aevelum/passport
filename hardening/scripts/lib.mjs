import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');

export const depthOrder = Object.freeze({
  inventory: 0,
  structure: 1,
  semantics: 2,
  breakdown: 3,
  exploit: 4,
  excluded: 99
});

export const severityScore = Object.freeze({
  low: 10,
  medium: 20,
  high: 35,
  critical: 50
});

export const attackerScore = Object.freeze({
  none: 0,
  indirect: 10,
  direct: 20
});

export function abs(rel) {
  return path.join(root, rel);
}

export function readText(rel) {
  return fs.readFileSync(abs(rel), 'utf8');
}

export function readJson(rel) {
  return JSON.parse(readText(rel));
}

export function writeJson(rel, value) {
  const target = abs(rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

export function walkFiles(rel, options = {}) {
  const { extensions = null, ignoredSegments = ['.git', 'node_modules', '.daml', 'log'] } = options;
  const start = abs(rel);
  if (!fs.existsSync(start)) return [];
  const out = [];
  const visit = current => {
    const stat = fs.statSync(current);
    if (stat.isDirectory()) {
      const name = path.basename(current);
      if (ignoredSegments.includes(name)) return;
      for (const entry of fs.readdirSync(current)) visit(path.join(current, entry));
      return;
    }
    const relative = path.relative(root, current);
    if (!extensions || extensions.includes(path.extname(relative))) out.push(relative);
  };
  visit(start);
  return out.sort();
}

export function collectMapIndex(map) {
  const index = {
    components: new Map(),
    functions: new Map(),
    invariants: new Map(),
    properties: new Map(),
    tests: new Map(),
    breakdowns: new Map(),
    exploitPaths: new Map(),
    trustBoundaries: new Map(),
    ids: new Map()
  };

  const add = (kind, item) => {
    if (!item?.id) return;
    if (index.ids.has(item.id)) index.ids.set(item.id, `${index.ids.get(item.id)},${kind}`);
    else index.ids.set(item.id, kind);
    index[kind].set(item.id, item);
  };

  for (const asset of map.tree?.assets ?? []) {
    for (const component of asset.components ?? []) {
      add('components', component);
      for (const fn of component.functions ?? []) add('functions', fn);
      for (const invariant of component.invariants ?? []) {
        add('invariants', invariant);
        invariant.component_id = component.id;
        for (const property of invariant.properties ?? []) {
          property.invariant_id = invariant.id;
          property.component_id = component.id;
          add('properties', property);
        }
      }
    }
  }
  for (const test of map.catalog?.tests ?? []) add('tests', test);
  for (const breakdown of map.catalog?.breakdowns ?? []) add('breakdowns', breakdown);
  for (const exploitPath of map.catalog?.exploit_paths ?? []) add('exploitPaths', exploitPath);
  for (const boundary of map.catalog?.trust_boundaries ?? []) add('trustBoundaries', boundary);
  return index;
}

export function validateMap(map) {
  const pass = [];
  const fail = [];
  const warn = [];
  const index = collectMapIndex(map);
  const statuses = new Set(Object.keys(depthOrder));
  const propertyTypes = new Set(['assumption', 'guarantee', 'derived']);
  const severities = new Set(Object.keys(severityScore));
  const attackerControls = new Set(Object.keys(attackerScore));
  const breakdownStatuses = new Set(['candidate', 'covered', 'guarded', 'killed', 'package']);

  const ok = (condition, message) => {
    (condition ? pass : fail).push(message);
  };

  ok(map.artifact === 'passport_invariant_property_map', 'map artifact is passport_invariant_property_map');
  ok(map.schemaVersion === '0.1.0', 'map schemaVersion is 0.1.0');
  ok(Boolean(map.scope?.source_root), 'map has source_root');
  ok(Array.isArray(map.scope?.source_inventory) && map.scope.source_inventory.length > 0, 'map has source inventory');

  const inventoryPaths = new Set((map.scope?.source_inventory ?? []).map(item => item.path));
  for (const rel of hardeningSensitiveFiles()) {
    ok(inventoryPaths.has(rel), `source inventory covers hardening-sensitive file ${rel}`);
  }

  for (const [id, kinds] of index.ids.entries()) {
    if (kinds.includes(',')) fail.push(`duplicate id ${id} appears as ${kinds}`);
  }

  for (const item of map.scope?.source_inventory ?? []) {
    ok(Boolean(item.path), `source inventory entry has path ${item.path ?? '<missing>'}`);
    ok(statuses.has(item.status), `${item.path} has valid status ${item.status}`);
    if (item.status !== 'excluded' && item.status !== 'inventory') {
      ok(Boolean(item.primary_component_id), `${item.path} has primary_component_id`);
      ok(index.components.has(item.primary_component_id), `${item.path} primary component exists`);
    }
    ok(fs.existsSync(abs(item.path)), `${item.path} exists`);
  }

  for (const component of index.components.values()) {
    ok(statuses.has(component.mapping_depth), `${component.id} has valid mapping_depth`);
    ok(depthOrder[component.mapping_depth] >= depthOrder.structure, `${component.id} is at least structure depth`);
    ok(Array.isArray(component.source_files) && component.source_files.length > 0, `${component.id} has source files`);
    for (const source of component.source_files ?? []) ok(fs.existsSync(abs(source)), `${component.id} source exists ${source}`);
    ok(Array.isArray(component.invariants) && component.invariants.length > 0, `${component.id} has invariants`);
  }

  for (const invariant of index.invariants.values()) {
    ok(Array.isArray(invariant.properties) && invariant.properties.length > 0, `${invariant.id} has properties`);
  }

  for (const property of index.properties.values()) {
    ok(propertyTypes.has(property.type), `${property.id} has valid property type ${property.type}`);
    ok(severities.has(property.severity), `${property.id} has valid severity ${property.severity}`);
    for (const fnId of property.enforcing_functions ?? []) ok(index.functions.has(fnId), `${property.id} enforcing function exists ${fnId}`);
    if (property.severity === 'high' || property.severity === 'critical') {
      const covered = [...index.tests.values()].some(test => (test.covers ?? []).includes(property.id) || (test.covers ?? []).includes(property.invariant_id));
      ok(covered, `${property.id} high/critical property has executable coverage`);
    }
  }

  for (const test of index.tests.values()) {
    ok(Boolean(test.command), `${test.id} has command`);
    ok(test.status === 'active', `${test.id} is active`);
    for (const ref of test.covers ?? []) {
      const exists = index.invariants.has(ref) || index.properties.has(ref) || index.breakdowns.has(ref);
      ok(exists, `${test.id} coverage reference exists ${ref}`);
    }
  }

  for (const breakdown of index.breakdowns.values()) {
    ok(index.components.has(breakdown.component_id), `${breakdown.id} component exists`);
    ok(index.properties.has(breakdown.property_id), `${breakdown.id} property exists`);
    ok(severities.has(breakdown.severity), `${breakdown.id} has valid severity ${breakdown.severity}`);
    ok(attackerControls.has(breakdown.attacker_control), `${breakdown.id} has valid attacker_control ${breakdown.attacker_control}`);
    ok(breakdownStatuses.has(breakdown.status), `${breakdown.id} has valid status ${breakdown.status}`);
    ok(Boolean(breakdown.kill_gate), `${breakdown.id} has kill_gate`);
    for (const testId of breakdown.evidence ?? []) ok(index.tests.has(testId), `${breakdown.id} evidence test exists ${testId}`);
    for (const xpId of breakdown.exploit_path_ids ?? []) ok(index.exploitPaths.has(xpId), `${breakdown.id} exploit path exists ${xpId}`);
    if ((breakdown.severity === 'high' || breakdown.severity === 'critical') && !breakdown.evidence?.length) {
      fail.push(`${breakdown.id} high/critical breakdown lacks evidence`);
    }
  }

  for (const exploitPath of index.exploitPaths.values()) {
    ok(index.breakdowns.has(exploitPath.breakdown_id), `${exploitPath.id} breakdown exists`);
    ok(Boolean(exploitPath.impact), `${exploitPath.id} has impact`);
  }

  for (const boundary of index.trustBoundaries.values()) {
    for (const componentId of boundary.component_ids ?? []) ok(index.components.has(componentId), `${boundary.id} component exists ${componentId}`);
  }

  for (const surface of map.frontier?.selected_surfaces ?? []) {
    const exists = index.invariants.has(surface) || index.properties.has(surface) || index.breakdowns.has(surface) || index.components.has(surface);
    ok(exists, `frontier selected surface exists ${surface}`);
  }
  ok(Array.isArray(map.frontier?.kill_gates) && map.frontier.kill_gates.length > 0, 'map frontier has kill gates');

  return { pass, fail, warn, index };
}

function hardeningSensitiveFiles() {
  let files = [];
  try {
    files = execFileSync('git', ['ls-files', '-z'], { cwd: root })
      .toString('utf8')
      .split('\0')
      .filter(Boolean);
  } catch {
    files = [
      ...walkFiles('.github/workflows', { extensions: ['.yml', '.yaml'] }),
      ...walkFiles('scripts', { extensions: ['.mjs', '.js', '.sh'] }),
      ...walkFiles('hardening/scripts', { extensions: ['.mjs', '.js'] }),
      ...walkFiles('hardening/policies', { extensions: ['.json'] }),
      ...walkFiles('interop', { extensions: ['.js', '.mjs'] })
    ];
  }

  return files
    .filter(file => {
      if (file === 'AGENTS.md') return true;
      if (file === 'package.json' || file === 'package-lock.json' || file === 'multi-package.yaml') return true;
      if (/^\.github\/workflows\/[^/]+\.ya?ml$/.test(file)) return true;
      if (/^\.agents\/skills\/[^/]+\/(SKILL\.md|agents\/openai\.yaml)$/.test(file)) return true;
      if (/^packages\/[^/]+\/daml\.yaml$/.test(file)) return true;
      if (/^packages\/[^/]+\/daml\/.*\.daml$/.test(file)) return true;
      if (/^interop\/.*\.(js|mjs)$/.test(file)) return true;
      if (/^scripts\/.*\.(mjs|js|sh)$/.test(file)) return true;
      if (/^hardening\/(scripts|policies)\/.*\.(mjs|js|json)$/.test(file)) return true;
      if (/^hardening\/(maps|frontiers)\/.*\.json$/.test(file)) return true;
      if (/^hardening\/rounds\/.*\.md$/.test(file)) return true;
      if (file === 'hardening/change-log.md') return true;
      return false;
    })
    .sort();
}

export function buildFrontier(map) {
  const { index } = validateMap(map);
  const candidates = [];

  for (const component of index.components.values()) {
    if (depthOrder[component.mapping_depth] < depthOrder.semantics) {
      const scoreBreakdown = {
        severity: 20,
        attacker_control: 0,
        missing_tests: 10,
        architecture_drift: 10,
        status: 10
      };
      candidates.push({
        id: `widen.${component.id}`,
        source_id: component.id,
        component_id: component.id,
        action: 'widen',
        status: 'shallow',
        priority_score: sumScore(scoreBreakdown),
        score_breakdown: scoreBreakdown,
        kill_gate: 'Component reaches semantics depth with source files, invariants, properties, and coverage references.',
        evidence_needed: ['Map component semantics and tests.'],
        fastest_falsifier: 'Run npm run hardening:map and inspect component mapping_depth.',
        last_round: null
      });
    }
  }

  for (const breakdown of index.breakdowns.values()) {
    const property = index.properties.get(breakdown.property_id);
    const tests = [...index.tests.values()].filter(test => (test.covers ?? []).includes(breakdown.property_id) || (test.covers ?? []).includes(property?.invariant_id) || (breakdown.evidence ?? []).includes(test.id));
    const scoreBreakdown = {
      severity: severityScore[breakdown.severity] ?? 0,
      attacker_control: attackerScore[breakdown.attacker_control] ?? 0,
      missing_tests: tests.length ? 0 : 20,
      architecture_drift: breakdown.status === 'guarded' ? 15 : 5,
      status: breakdown.status === 'candidate' ? 20 : breakdown.status === 'guarded' ? 10 : 0
    };
    candidates.push({
      id: breakdown.id,
      source_id: breakdown.id,
      component_id: breakdown.component_id,
      property_id: breakdown.property_id,
      action: actionForBreakdown(breakdown),
      status: breakdown.status,
      priority_score: sumScore(scoreBreakdown),
      score_breakdown: scoreBreakdown,
      kill_gate: breakdown.kill_gate,
      evidence_needed: evidenceNeeded(breakdown, tests),
      fastest_falsifier: fastestFalsifier(breakdown),
      last_round: map.frontier?.round_id ?? null
    });
  }

  candidates.sort((a, b) => b.priority_score - a.priority_score || a.id.localeCompare(b.id));
  return {
    artifact: 'passport_hardening_frontier',
    schemaVersion: '0.1.0',
    map_path: 'hardening/maps/passport.invariants.json',
    generatedFrom: {
      package: map.package,
      pinned_version: map.scope?.pinned_version,
      round_id: map.frontier?.round_id
    },
    summary: {
      candidates: candidates.length,
      widen: candidates.filter(c => c.action === 'widen').length,
      deepen: candidates.filter(c => c.action === 'deepen').length,
      kill: candidates.filter(c => c.action === 'kill').length,
      package: candidates.filter(c => c.action === 'package').length,
      top_candidate: candidates[0]?.id ?? null
    },
    candidates
  };
}

export function validateFrontier(frontier, map) {
  const pass = [];
  const fail = [];
  const { index } = validateMap(map);
  const actions = new Set(['widen', 'deepen', 'kill', 'package']);

  const ok = (condition, message) => {
    (condition ? pass : fail).push(message);
  };

  ok(frontier.artifact === 'passport_hardening_frontier', 'frontier artifact is passport_hardening_frontier');
  ok(frontier.schemaVersion === '0.1.0', 'frontier schemaVersion is 0.1.0');
  ok(Array.isArray(frontier.candidates), 'frontier candidates is an array');
  ok(frontier.summary?.candidates === frontier.candidates?.length, 'frontier summary candidate count matches');

  for (const candidate of frontier.candidates ?? []) {
    ok(actions.has(candidate.action), `${candidate.id} has valid action ${candidate.action}`);
    ok(index.components.has(candidate.component_id), `${candidate.id} component exists`);
    if (candidate.property_id) ok(index.properties.has(candidate.property_id), `${candidate.id} property exists`);
    ok(Boolean(candidate.kill_gate), `${candidate.id} has kill_gate`);
    ok(candidate.priority_score === sumScore(candidate.score_breakdown ?? {}), `${candidate.id} score breakdown sums to priority_score`);
  }

  const expected = buildFrontier(map);
  ok(JSON.stringify(frontier, null, 2) === JSON.stringify(expected, null, 2), 'frontier is current with invariant map');
  return { pass, fail };
}

export function sumScore(scoreBreakdown) {
  return Object.values(scoreBreakdown).reduce((acc, value) => acc + Number(value || 0), 0);
}

function actionForBreakdown(breakdown) {
  if (breakdown.status === 'killed') return 'kill';
  if (breakdown.status === 'package') return 'package';
  return 'deepen';
}

function evidenceNeeded(breakdown, tests) {
  const needs = [];
  if (!tests.length) needs.push('Add executable coverage for the linked property.');
  if (!breakdown.evidence?.length) needs.push('Record test, gate, or artifact evidence.');
  if (breakdown.status === 'guarded') needs.push('Keep the guard executable and fail-closed in CI.');
  return needs.length ? needs : ['No new evidence needed unless the linked source changes.'];
}

function fastestFalsifier(breakdown) {
  if (breakdown.id.includes('dynamic-plugin')) return 'Add import( to interop/registry.js and confirm npm run hardening:gate fails.';
  if (breakdown.id.includes('schema')) return 'Modify a vendored CDM schema without updating manifest.json and confirm npm run interop:validate fails.';
  if (breakdown.id.includes('payload')) return 'Add a provenance key to a generated CDM payload and confirm npm run hardening:gate fails.';
  if (breakdown.id.includes('network')) return 'Add interop:vendor:cdm to scripts/ci.sh and confirm npm run hardening:gate fails.';
  return 'Run the linked test command and confirm it fails on a minimal invariant violation.';
}
