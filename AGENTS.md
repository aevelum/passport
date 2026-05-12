# Passport Agent Instructions

## Repo-Local Skills

- Use the repo skill at `.agents/skills/passport-hardening-loop/SKILL.md` for changes that touch Daml templates, Daml tests, interop adapters, CDM plugin behavior, CI, packaging, release artifacts, security boundaries, or architecture decisions.
- Keep repo skills under `.agents/skills` so Codex CLI, IDE extension, and app agents can discover them from the repository root.
- If a hardening-sensitive change modifies behavior, update `hardening/maps/passport.invariants.json`, regenerate `hardening/frontiers/passport.frontier.json`, and record the result in `hardening/change-log.md` or `hardening/rounds/`.

## Required Checks

- Run `npm run hardening:frontier` and `npm run hardening:gate` after hardening-sensitive changes.
- Run `npm run ci` before handoff when code, generated artifacts, Daml, CI, package scripts, or hardening policy changes.

## Architecture Boundaries

- Keep Daml templates as the Canton ledger schema unless an explicit ADR and invariant-map update justify a change.
- Keep interop framework-neutral: CDM is one static plugin, not repo-global special-case code.
- Default CI must not fetch from the network.
- Do not add dynamic plugin loading, eval-style execution, arbitrary plugin path resolution, or Passport provenance inside generated CDM payloads.
