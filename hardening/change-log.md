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

## 2026-05-14 - round-0004

- Tightened registered adapter validation so Level 0 remains concept-only and plugins must declare Level 1 through Level 5.
- Normalized readiness evidence requirements, added repo-path and verification-command reference checks, and proved fake Level 3, Level 4, and Level 5 self-attestation cases fail.
- Strengthened Level 3+ proof-reference validation so generic existing files such as `package.json`, README, and generic docs cannot satisfy executable, sandbox, or production proof categories by themselves.
- Replaced broad prose-context overclaim scanning with sentence-level claim units and explicit positive and negative fixtures.
- Added deep interop report consistency checks so `adapters`, `adapterReadiness`, and registered plugin readiness cannot drift.
- Moved CDM readiness metadata into a dedicated module and kept generated CDM payload purity checks focused on provenance and readiness metadata.

## 2026-05-14 - round-0005

- Renamed Passport-owned downstream metadata into reservation handoff terminology in Daml, tests, docs, and generated demo output.
- Added canonical scope and explicit non-goal language to README and scope docs: Passport records readiness and may record reservation handoff notices, but does not execute downstream trades, custody assets, transfer collateral, settle transactions, operate a wallet or venue, optimize collateral, decide credit, determine legal title, implement proof systems, provide production identity, or provide live external integration.
- Strengthened structural and hardening gates so Daml source must use `ReservationHandoffInstruction`, `CreateReservationHandoff`, and `handoffRecipient`, and must exclude out-of-scope implementation terminology.
- Preserved the CDM adapter at Level 2 — Artifact Conformance with the existing non-claims for certification, engine execution, repo execution, custody, settlement, live external integration, Canton Token Standard integration, and production partner integration.
- Added round-0005 hardening evidence for the Daml domain boundary, repo pre-trade workflow boundary, interop adapter boundary, non-goal documentation, and structural gates.
