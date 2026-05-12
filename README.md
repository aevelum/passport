# Aevelum Passport Foundation

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
  06_cdm_mapping_draft.md
  07_non_goals.md
scripts/
  gates.mjs
  daml-coverage-gate.mjs
  export-demo-transcript.mjs
  export-cdm-mapping.mjs
  run-daml-tests.sh
  ci.sh
  package.mjs
artifacts/
  demo_transcript.json
  cdm_mapping_draft.json
  gate_report.json
```

## Local gates

```bash
npm run ci
```

This generates demo and CDM artifacts, runs structural gates, builds both DPM packages, runs Daml Script tests, and requires 100% coverage for Passport templates and domain choices. Generated `Archive` choices are excluded from the coverage threshold.

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
