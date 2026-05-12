# 06 Interop Adapters

Passport keeps its Daml templates as the Canton ledger schema and emits external standards artifacts through a small framework-neutral adapter surface.

The adapter surface is deliberately narrow:

- static plugin registry only;
- no dynamic plugin loading;
- no `eval`;
- no network access in default CI;
- generated standards payloads remain clean;
- Passport provenance is reported beside payloads, not embedded into them.

## Adapter contract

Each plugin declares:

- `id`
- `framework`
- `frameworkVersion`
- `outputFormat`
- `artifactTypes`
- `generate(input, context)`
- `validate(result, context)`

The initial registry contains one plugin:

| Framework | Version | Output | Artifact types |
|---|---:|---|---|
| FINOS CDM | `6.0` | JSON | `eligible-collateral-specification`, `eligibility-query`, `check-eligibility-result` |

Future candidates include ISO 20022, FIX, FpML, W3C Verifiable Credentials, and Canton Token Standard adapters, but this release intentionally ships no stubs for them.

## CDM plugin

The CDM plugin generates collateral eligibility artifacts from `interop/samples/repo-pretrade-passport-input.json`.

It validates generated artifacts offline against the plugin-scoped FINOS CDM 6.0 JSON Schema subset in `interop/plugins/cdm/assets/schemas/6.0/`.

Schema refresh is explicit:

```bash
npm run interop:vendor:cdm
```

Default CI does not fetch schemas. Validation first verifies the schema manifest and SHA-256 hashes, then registers the schemas with AJV draft-04.

## Local commands

```bash
npm run interop:generate
npm run interop:validate
```

Generated CDM payloads are written to `artifacts/interop/cdm/6.0/`. Adapter metadata, provenance, validation status, and negative-case results are written to `artifacts/interop/report.json`.

This is schema conformance for generated Passport collateral eligibility artifacts. It is not FINOS certification, Rosetta Engine execution, repo execution, custody, settlement, or a live external integration.
