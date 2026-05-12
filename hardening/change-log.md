# Hardening Change Log

## 2026-05-12 - round-0001

- Added a repo-local Passport hardening loop with an invariant/property map, scored frontier, bounded round record, and architecture policy gate.
- Moved the Passport hardening skill into Codex's repo discovery path at `.agents/skills/passport-hardening-loop/SKILL.md` and added root `AGENTS.md` instructions so future agents know when to use it.
- Locked CDM into the framework-neutral adapter plugin boundary for hardening purposes: static registry, no dynamic execution, no network fetches in default CI, and no Passport provenance keys inside generated CDM payloads.
- Added hardening scripts and CI wiring so architecture invariants are checked alongside generated interop artifacts, repository gates, Daml tests, and Canton smoke.
- Verification recorded: `npm run ci`, `npm run package`, `npm audit --json`, and package inspection passed after the hardening lane was added.
