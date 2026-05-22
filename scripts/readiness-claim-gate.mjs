import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const fail = [];
const pass = [];

const claimPatterns = [
  ['license grant', /\bPassport\b[^.\n|;]{0,120}\bgrants?\b[^.\n|;]{0,80}\blicen[sc]es?\b/i],
  ['license issue', /\bPassport\b[^.\n|;]{0,120}\bissues?\b[^.\n|;]{0,80}\blicen[sc]es?\b/i],
  ['participant registration', /\bPassport\b[^.\n|;]{0,120}\bregisters?\b[^.\n|;]{0,80}\bparticipants?\b/i],
  ['legal compliance approval', /\bPassport\b[^.\n|;]{0,120}\bapproves?\b[^.\n|;]{0,80}\blegal compliance\b/i],
  ['venue admission', /\bPassport\b[^.\n|;]{0,120}\badmits?\b[^.\n|;]{0,80}\bparticipants?\b[^.\n|;]{0,80}\bvenue\b/i],
  ['venue operation', /\bPassport\b[^.\n|;]{0,120}\boperates?\b[^.\n|;]{0,80}\bvenue\b/i],
  ['trade execution', /\bPassport\b[^.\n|;]{0,120}\bexecutes?\b[^.\n|;]{0,80}\btrades?\b/i],
  ['trade formation', /\bPassport\b[^.\n|;]{0,120}\bforms?\b[^.\n|;]{0,80}\btrades?\b/i],
  ['settlement', /\bPassport\b[^.\n|;]{0,120}\bsettles?\b/i],
  ['clearing', /\bPassport\b[^.\n|;]{0,120}\bclears?\b/i],
  ['custody', /\bPassport\b[^.\n|;]{0,120}\bcustodies\b/i],
  ['asset transfer', /\bPassport\b[^.\n|;]{0,120}\btransfers?\b[^.\n|;]{0,80}\bassets?\b/i],
  ['token issuance', /\bPassport\b[^.\n|;]{0,120}\bissues?\b[^.\n|;]{0,80}\btokens?\b/i],
  ['wallet operation', /\bPassport\b[^.\n|;]{0,120}\boperates?\b[^.\n|;]{0,80}\bwallets?\b/i]
];

const claimArtifactFiles = [
  'artifacts/demo_transcript.json',
  'artifacts/readiness_demo_transcript.json',
  'artifacts/venue_readiness_demo_transcript.json'
];

const files = [
  'README.md',
  'AGENTS.md',
  '.agents/skills/passport-hardening-loop/SKILL.md',
  ...walk('docs').filter(file => file.endsWith('.md')),
  ...walk('hardening/rounds').filter(file => file.endsWith('.md')),
  'hardening/change-log.md',
  ...claimArtifactFiles
].filter(file => fs.existsSync(path.join(root, file)));

for (const rel of files) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  for (const unit of claimUnits(text)) {
    for (const [label, pattern] of claimPatterns) {
      if (!pattern.test(unit.text)) continue;
      if (isSafeBoundaryClaim(unit.text)) {
        pass.push(`${rel}:${unit.line} bounds ${label}`);
      } else {
        fail.push(`${rel}:${unit.line} unsafe readiness claim: ${label}`);
      }
    }
  }
}

const report = {
  artifact: 'readiness_claim_gate_report',
  status: fail.length ? 'failed' : 'passed',
  scannedFiles: files.length,
  pass,
  fail
};

fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts/readiness_claim_gate_report.json'), JSON.stringify(report, null, 2) + '\n');

if (fail.length) {
  console.error(`readiness claim gate failed: ${fail.length} issue(s)`);
  for (const item of fail) console.error(` - ${item}`);
  process.exit(1);
}

console.log(`readiness claim gate passed: ${pass.length} bounded claim(s), ${files.length} file(s) scanned`);

function walk(dir, acc = []) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return acc;
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (['.git', 'node_modules', '.daml', 'log'].includes(ent.name)) continue;
      walk(rel, acc);
    } else {
      acc.push(rel);
    }
  }
  return acc;
}

function claimUnits(text) {
  const units = [];
  const lines = text.split('\n');
  let inFence = false;
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    if (/^\s*```/.test(raw)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const clean = raw
      .replace(/^\s*[-*]\s+/, '')
      .replace(/^\s*\d+\.\s+/, '')
      .replace(/^\s*\|?/, '')
      .trim();
    if (!clean || /^#/.test(clean)) continue;
    for (const part of clean
      .split(/(?<=[.!?])\s+|;\s*/)
      .map(part => part.replace(/\|/g, ' ').trim())
      .filter(Boolean)) {
      units.push({ text: part, line: i + 1 });
    }
  }
  return units;
}

function isSafeBoundaryClaim(text) {
  return /\b(not|no|without|does not|must not|non-executing|evidence only|attestation only|out of scope|excludes|excluded|reject|rejects|rejected|fail|fails|rewritten|external systems remain external)\b/i.test(text);
}
