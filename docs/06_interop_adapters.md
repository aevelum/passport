# 06 Interop Adapters

Passport keeps its Daml templates as the Canton ledger schema and emits external standards artifacts through a small framework-neutral adapter surface.

The adapter surface is deliberately narrow:

- static plugin registry only;
- no dynamic plugin loading;
- no `eval`;
- no network access in default PR or local CI after GitHub platform checkout;
- generated standards payloads remain clean;
- Passport provenance is reported beside payloads, not embedded into them.

## Adapter contract

Each plugin declares:

- `id`
- `framework`
- `frameworkVersion`
- `outputFormat`
- `artifactTypes`
- `readiness`
- `generate(input, context)`
- `validate(result, context)`

The initial registry contains one plugin:

| Framework | Version | Output | Artifact types |
|---|---:|---|---|
| FINOS CDM | `6.0` | JSON | `eligible-collateral-specification`, `eligibility-query`, `check-eligibility-result` |

Future candidates include ISO 20022, FIX, FpML, W3C Verifiable Credentials, and Canton Token Standard adapters, but this release intentionally ships no stubs for them.

## Adapter Readiness Levels

Passport uses Adapter Readiness Levels to keep framework and partner claims evidence-bound. The full ladder is maintained in [09 Adapter Readiness Levels](09_adapter_readiness_levels.md).

| Level | Name | Evidence boundary |
|---:|---|---|
| 0 | Concept | Adapter idea documented, no implementation. |
| 1 | Interface | Adapter contract, static registry, and policy boundary. |
| 2 | Artifact Conformance | Offline generation, committed schema validation, CI evidence, and negative cases. |
| 3 | Executable Conformance | Canonical external engine, API, or simulator execution with round-trip or execution tests. |
| 4 | Sandbox Integration | Authenticated sandbox environment, operational handling, environment config, monitoring or logging, and sandbox tests. |
| 5 | Production Integration | Live partner or network use with security review, operational runbooks, release controls, SLA, and incident evidence. |

The current FINOS CDM adapter is Level 2 — Artifact Conformance. It generates and validates offline CDM 6.0 JSON collateral eligibility artifacts in CI.

It is not FINOS certification, Rosetta Engine execution, CDM eligibility-engine execution, repo execution, custody, settlement, live external integration, Canton Token Standard integration, or production partner integration.

## CDM plugin

The CDM plugin generates collateral eligibility artifacts from `interop/samples/repo-pretrade-passport-input.json`.
`CheckEligibilityResult` mirrors the Passport sample decision; no CDM eligibility engine is executed.

It validates generated artifacts offline against the plugin-scoped FINOS CDM 6.0 JSON Schema subset in `interop/plugins/cdm/assets/schemas/6.0/`.

Schema refresh is explicit:

```bash
npm run interop:vendor:cdm
```

Default CI does not fetch schemas or bootstrap dependencies from the network. Validation first verifies the committed schema manifest, schema-set digest, and SHA-256 hashes, then registers the schemas with AJV draft-04. This is committed local schema integrity for reviewed files, not upstream authenticity if schema files and the manifest are changed together.

## Local commands

```bash
npm run interop:generate
npm run interop:validate
```

Generated CDM payloads are written to `artifacts/interop/cdm/6.0/`. Adapter metadata, provenance, validation status, warnings, and negative-case results are written to `artifacts/interop/report.json`.

This is Level 2 artifact conformance for generated Passport collateral eligibility artifacts. Readiness metadata, evidence, claims, non-claims, promotion criteria, and provenance stay in `artifacts/interop/report.json`; they are not embedded in generated CDM payloads.
