# Hardening Change Log

## 2026-05-12 - round-0001

- Added a repo-local Passport hardening loop with an invariant/property map, scored frontier, bounded round record, and architecture policy gate.
- Moved the Passport hardening skill into Codex's repo discovery path at `.agents/skills/passport-hardening-loop/SKILL.md` and added root `AGENTS.md` instructions so future agents know when to use it.
- Locked CDM into the framework-neutral adapter plugin boundary for hardening purposes: static registry, no dynamic execution, no network fetches in default CI, and no Passport provenance keys inside generated CDM payloads.
- Added hardening scripts and CI wiring so architecture invariants are checked alongside generated interop artifacts, repository gates, Daml tests, and Canton smoke.
- Verification recorded: `npm run ci`, `npm run package`, `npm audit --json`, and package inspection passed after the hardening lane was added.

## 2026-05-13 - round-0002

- Tightened default PR CI to a strict offline runner contract with pinned checkout, offline npm cache use, and preinstalled DPM `3.5.1-rc3`.
- Added deterministic generated timestamps, package execution in `npm run ci`, and a final freshness diff over tracked artifacts, hardening maps, and hardening frontiers.
- Expanded the hardening source inventory and gates to cover workflow YAML, package/toolchain files, Daml/Canton scripts, interop wrappers, and hardening helper scripts.
- Clarified CDM output as schema-valid Passport decision mirroring, not CDM eligibility-engine execution, and documented the schema manifest as committed local integrity rather than upstream authenticity.

## 2026-05-13 - round-0003

- Added Adapter Readiness Levels as a first-class interop claim-control model with evidence-bound plugin validation and report output.
- Classified the current CDM adapter as Level 2 — Artifact Conformance with explicit claims, non-claims, promotion criteria, and CI evidence.
- Added hardening gate checks for readiness metadata, CDM Level 2 overclaim language, report readiness fields, and generated payload purity.
- Added readiness documentation, repo guidance, and the `inv.interop.adapter-readiness-claims` invariant with high and critical properties.
