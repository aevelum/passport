# round-0007: CDM Schema Tamper Falsifier and Hardening Process

## Objective

Close the top non-theatre frontier item by adding an executable CDM schema tamper falsifier, then update the repo-local hardening skill so future hardening work stays evidence-bearing.

## Selected Surfaces

- CDM schema manifest verification.
- CDM validation negative cases and interop report output.
- Hardening gate report checks.
- Repo-local Passport hardening skill and project guidance.
- Invariant map and hardening frontier.

## Non-Theatre Boundary

This round does not add a stronger formal claim. It adds a falsifier.

The negative case copies the committed CDM schema set to a temporary directory, mutates a vendored schema file without updating `manifest.json`, and requires `verifySchemaManifestAt` to reject the schema set before AJV registration.

The hardening process now requires future formal artifacts, ADRs, or policy text to map to executable evidence such as a Daml Script test, interop negative case, tamper falsifier, static gate, or bounded formal checker with explicit assumptions.

## Kill Gates

- `npm run interop:validate` fails if `negative-cdm-schema-manifest-tamper` is missing or does not pass.
- `npm run hardening:gate` fails if the interop report omits the schema tamper negative case.
- `npm run gate` fails if the generated interop report omits the schema tamper negative case.
- `npm run hardening:map` fails if hardening-sensitive skill, map, round, script, or interop files are not inventoried.
- `npm run ci` fails if regenerated artifacts, hardening maps, or hardening frontiers drift from committed output.

## Evidence

- `npm run interop:validate`
- `npm run hardening:map`
- `npm run hardening:frontier`
- `npm run hardening:formal`
- `npm run hardening:gate`
- `npm run gate`
- `npm run ci`

## Next Frontier

- Re-evaluate whether policy-contract binding should become a ledger semantic change.
- Add typed time validity obligations before making stronger expiry or freshness claims.
- Keep Apalache or other formal tool integration out until it can be pinned, run reliably, and add evidence beyond the bounded checker.
