# 09 Adapter Readiness Levels

Adapter Readiness Levels prevent framework adapter maturity from being claimed ahead of committed evidence. They apply to adapter metadata, docs, generated interop reports, hardening gates, and release language.

| Level | Name | Evidence required before claiming the level |
|---:|---|---|
| 0 | Concept | Adapter idea documented; no registered implementation. |
| 1 | Interface | Adapter contract, static registry, and policy boundary evidence. |
| 2 | Artifact Conformance | Offline artifact generation, committed schema validation, CI evidence, and negative cases. |
| 3 | Executable Conformance | Execution against a canonical external engine, API, or simulator, with round-trip or execution tests. |
| 4 | Sandbox Integration | Authenticated sandbox environment, operational error handling, environment config, monitoring or logging, and sandbox tests. |
| 5 | Production Integration | Live partner or network use, security review, operational runbooks, release controls, SLA, and incident evidence. |

Level 0 applies to future adapter candidates only. Registered plugins must declare Level 1 through Level 5 readiness metadata.

## Current CDM Classification

The current FINOS CDM adapter is Level 2 — Artifact Conformance. It generates and validates offline CDM 6.0 JSON collateral eligibility artifacts in CI.

It is not FINOS certification, Rosetta Engine execution, CDM eligibility-engine execution, repo execution, custody, settlement, live external integration, Canton Token Standard integration, or production partner integration.

Promotion above Level 2 requires new evidence before docs, reports, or release language can make the higher claim. Level 3 requires executable CDM, Rosetta, canonical-engine, API, simulator, or round-trip conformance tests. Level 4 requires authenticated sandbox configuration and operational sandbox tests. Level 5 requires live partner or network evidence, security review, operational runbooks, release controls, and SLA or incident evidence.
