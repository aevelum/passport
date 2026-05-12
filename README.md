<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/banner-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/banner.svg">
  <img alt="Aevelum Passport Foundation - Canton-native collateral capacity credentials" src="assets/banner.svg">
</picture>

Aevelum Passport is a Daml/Canton-native collateral credential account.

It lets an institution issue, hold, present, reserve, revoke, and audit verified collateral-capacity credentials before repo, securities-lending, margin, or secured-credit execution.

The Foundation Release proves one narrow workflow:

```text
Dealer publishes collateral policy.
Holder creates Passport Account.
Holder requests capacity credential.
Attester issues CapacityCredential.
Holder presents CredentialPresentation to Dealer.
Dealer reserves part of the capacity.
Original capacity is consumed through the reservation flow.
Residual capacity is reissued.
Dealer releases the reservation.
Attester revokes stale credentials when needed.
Unauthorized parties see nothing.
Auditor receives only scoped audit metadata.
```

## What this is

- A Daml-as-spec package.
- A roomless collateral capacity credential account.
- A repo pre-trade capacity credential demo.
- A committee-facing foundation for Canton collateral workflows.

## What this is not

- Not a repo venue.
- Not a securities-lending venue.
- Not a custody provider.
- Not a settlement rail.
- Not a collateral optimizer.
- Not a credit decision engine.
- Not a ZK system.
- Not a legal-title oracle.
- Not a diligence room.

## Project layout

```text
multi-package.yaml
packages/
  passport-core/
    daml.yaml
    daml/Aevelum/Passport/Types.daml
    daml/Aevelum/Passport/Foundation.daml
  passport-tests/
    daml.yaml
    daml/Aevelum/Passport/Test/*.daml
docs/
  00_product_thesis.md
  01_daml_as_spec.md
  02_foundation_release_scope.md
  03_collateral_capacity_credential.md
  04_repo_pretrade_workflow.md
  05_privacy_model.md
  06_cdm_conformance.md
  07_non_goals.md
fixtures/
  cdm/6.0/*.json
schemas/
  cdm/6.0/*.schema.json
scripts/
  gates.mjs
  daml-coverage-gate.mjs
  export-demo-transcript.mjs
  vendor-cdm-schemas.mjs
  validate-cdm-conformance.mjs
  run-daml-tests.sh
  canton-smoke.sh
  ci.sh
  package.mjs
artifacts/
  demo_transcript.json
  cdm_conformance_report.json
  gate_report.json
```

## Local gates

```bash
npm run ci
```

This generates demo and CDM conformance artifacts, runs structural gates, builds both DPM packages, runs Daml Script tests, requires 100% coverage for Passport templates and domain choices, and loads the core DAR into a local Canton sandbox. Generated `Archive` choices are excluded from the coverage threshold.

The CDM conformance gate validates Passport collateral eligibility fixtures offline against the vendored FINOS CDM 6.0 JSON Schema subset:

```bash
npm run cdm:validate
```

To explicitly refresh the vendored schema subset from FINOS:

```bash
npm run cdm:vendor-schemas
```

To run only the local Canton sandbox smoke check:

```bash
npm run canton:smoke
```

To also create the review package:

```bash
npm run all
```

## Daml/Canton toolchain

This repo uses DPM, not the removed `daml` assistant. The package is pinned to SDK `3.5.1-rc3` because that is the active local DPM SDK in this workspace.

```bash
dpm version --active
dpm build --all
./scripts/run-daml-tests.sh
```

DPM install docs: <https://docs.digitalasset.com/build/3.5/dpm/dpm.html>
Canton app development docs: <https://docs.digitalasset.com/build/3.5/overview/introduction.html>
