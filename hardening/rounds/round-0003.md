# round-0003: Adapter Readiness Claim-Control

## Objective

Add Adapter Readiness Levels as an evidence-gated control so Passport cannot document, report, or market framework adapter maturity above committed proof.

## Selected Surfaces

- `inv.interop.adapter-readiness-claims`
- `prop.interop.adapter-level-evidence-bound`
- `prop.interop.no-live-integration-overclaim`
- `prop.interop.readiness-reported`

## Current Classification

CDM adapter: Level 2 — Artifact Conformance.

## Kill Gates

- `npm run hardening:gate` fails on missing readiness metadata.
- `npm run hardening:gate` fails on Level 2 overclaim language.
- `artifacts/interop/report.json` exposes readiness evidence, claims, non-claims, and promotion criteria.
- Generated CDM payload purity still holds: readiness and Passport provenance stay outside payload JSON files.

## Evidence

- `npm run interop:validate`
- `npm run hardening:map`
- `npm run hardening:frontier`
- `npm run hardening:gate`
- `npm run ci`

## Next Frontier

- Level 3 requires executable CDM, Rosetta, canonical-engine, API, simulator, or round-trip conformance test evidence.
- Level 4 requires sandbox auth, environment, operational handling, monitoring or logging, and sandbox tests.
- Level 5 requires production partner, security review, operational runbook, release control, SLA, and incident evidence.
