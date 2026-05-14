---
name: passport-hardening-loop
description: Use inside the Passport repo while developing to keep invariants, architecture decisions, tests, and gates synchronized. It refreshes the repo-local invariant map, scores the hardening frontier, selects one bounded round, and records the decision before or after code changes.
---

# Passport Hardening Loop

## Purpose

Use this skill when changing Passport code, Daml templates, interop adapters, release scripts, CI, or docs that affect security or architectural invariants.

Passport scope is collateral-readiness credentialing: readiness, eligibility, presentation, reservation, reservation handoff metadata, revocation, expiry, audit, evidence, bounded interop artifacts, and adapter readiness reports. Passport does not execute downstream trades, custody assets, transfer collateral, settle transactions, operate a wallet or venue, optimize collateral, decide credit, determine legal title, implement ZK proofs, provide production identity, or provide live external integration.

Adapter readiness changes are hardening-sensitive. If a change touches adapter behavior, adapter docs, interop reports, framework claims, partner/sandbox/production language, or readiness level, keep readiness metadata, the invariant map, frontier, hardening round or change log, generated interop report, and hardening gate in sync.

The loop keeps development hardening evidence in the repo:

- `hardening/maps/passport.invariants.json` is the invariant/property source of truth.
- `hardening/frontiers/passport.frontier.json` ranks what to widen, deepen, kill, or package.
- `hardening/rounds/` records bounded hardening rounds.
- `hardening/change-log.md` records hardening-relevant changes.
- `npm run hardening:gate` enforces non-negotiable architecture rules.

## Workflow

1. Scope the change.

Identify changed files and decide which component, invariant, property, or breakdown they touch. Do not expand the hardening scope silently; record uncertainty in the map.

2. Refresh the invariant map.

Update `hardening/maps/passport.invariants.json` when a change alters a trust boundary, enforcement function, generated artifact, test command, or architectural decision.

3. Score the frontier.

```bash
npm run hardening:frontier
```

Use the top candidate to decide whether the next bounded round should widen coverage, deepen one path, kill a spurious concern, or package a finding.

4. Select a bounded round.

```bash
npm run hardening:select
```

The selected target must have a kill gate, evidence needs, fastest falsifier, and writeback path.

5. Implement the smallest useful hardening change.

Prefer executable controls over prose:

- Daml Script negative tests for ledger authorization and state transitions
- interop validation for generated framework artifacts
- static gates for architectural boundaries
- package inspection for release integrity
- ADRs when an invariant intentionally changes

6. Validate.

```bash
npm run hardening:gate
npm run ci
```

7. Record the round.

Update `hardening/rounds/` and `hardening/change-log.md` with the decision, evidence, and next frontier state.

## Decision Rules

Default to `widen` when a touched file is not assigned to a component, a component is below `semantics`, or a new trust boundary appears.

Default to `deepen` when a coherent breakdown has code-local evidence but needs stronger tests, static gates, or negative cases.

Default to `kill` when the fastest falsifier closes the path or an existing gate makes the candidate non-actionable.

Default to `package` only when the frontier state is already a clean, evidence-backed finding.

## Hard Requirements

- Do not add dynamic plugin loading, `eval`, remote code, arbitrary path resolution, or network fetches to default PR or local CI after GitHub platform checkout; dependency/toolchain/bootstrap material must come from the pre-baked offline runner and offline npm cache.
- Keep CDM as a plugin under the framework-neutral adapter surface.
- Keep Passport provenance outside generated CDM payloads.
- Keep Daml templates as the Canton ledger schema unless an explicit architectural decision updates the map.
- Keep hardening changes executable: every high or critical property must map to tests or gates.
