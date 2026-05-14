# round-0004: Adapter Readiness Negative Gates and Evidence Normalization

## Objective

Tighten Adapter Readiness Levels so registered plugin claims cannot bypass evidence requirements, report consistency, prose boundaries, or generated-payload purity.

## Selected Surfaces

- `inv.interop.adapter-readiness-claims`
- `prop.interop.adapter-level-evidence-bound`
- `prop.interop.no-live-integration-overclaim`
- `prop.interop.readiness-reported`

## Current Classification

CDM adapter: Level 2 — Artifact Conformance.

## Kill Gates

- Registered plugins cannot be Level 0; Level 0 is concept-only for future candidates.
- Level 3+ cannot be self-attested by category names alone; proof categories require existing references in accepted proof-bearing paths, and the gate rejects generic existing files such as `package.json`, README, and generic docs for Level 3+ evidence.
- Overclaim detection is sentence-level and backed by positive and negative prose fixtures.
- Interop report readiness is deeply consistent with registered plugin readiness.
- Generated payloads stay clean without overbroad generic-key bans.

## Evidence

- `npm run interop:validate`
- `npm run hardening:map`
- `npm run hardening:frontier`
- `npm run hardening:gate`
- `npm run gate`
- `npm run ci`

## Next Frontier

- Level 3 still requires executable CDM, Rosetta, canonical-engine, API, simulator, or round-trip conformance test evidence.
- Level 4 still requires sandbox auth, environment, operational handling, monitoring or logging, and sandbox tests.
- Level 5 still requires production partner or live-network evidence, security review, operational runbooks, release controls, and SLA or incident evidence.
