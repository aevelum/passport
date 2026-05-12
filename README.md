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
AGENTS.md
.agents/
  skills/passport-hardening-loop/SKILL.md
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
  06_interop_adapters.md
  07_non_goals.md
interop/
  core/adapter.js
  registry.js
  runner.js
  samples/repo-pretrade-passport-input.json
  plugins/cdm/
hardening/
  maps/passport.invariants.json
  frontiers/passport.frontier.json
  policies/architecture-rules.json
  rounds/round-0001.md
  change-log.md
  scripts/*.mjs
scripts/
  gates.mjs
  daml-coverage-gate.mjs
  export-demo-transcript.mjs
  interop-generate.mjs
  interop-validate.mjs
  interop-vendor-cdm.mjs
  run-daml-tests.sh
  canton-smoke.sh
  ci.sh
  package.mjs
artifacts/
  demo_transcript.json
  interop/report.json
  hardening_report.json
  hardening_map_report.json
  gate_report.json
```

## Local gates

```bash
npm run ci
```

This generates demo and interop artifacts, refreshes the hardening frontier, runs architecture and structural gates, builds both DPM packages, runs Daml Script tests, requires 100% coverage for Passport templates and domain choices, and loads the core DAR into a local Canton sandbox. Generated `Archive` choices are excluded from the coverage threshold.

The repo-local hardening loop is discoverable to Codex agents through `.agents/skills/passport-hardening-loop/SKILL.md` and root `AGENTS.md`. To run only that lane:

```bash
npm run hardening:map
npm run hardening:frontier
npm run hardening:gate
```

The interop adapter gate generates CDM collateral eligibility artifacts from a Passport sample input and validates them offline against the plugin-scoped FINOS CDM 6.0 JSON Schema subset:

```bash
npm run interop:validate
```

To explicitly refresh the CDM plugin's vendored schema subset from FINOS:

```bash
npm run interop:vendor:cdm
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
