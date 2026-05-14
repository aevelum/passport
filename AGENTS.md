# Passport Agent Instructions

## Repo-Local Skills

- Use the repo skill at `.agents/skills/passport-hardening-loop/SKILL.md` for changes that touch Daml templates, Daml tests, interop adapters, CDM plugin behavior, CI, packaging, release artifacts, security boundaries, or architecture decisions.
- Use the repo skill at `.agents/skills/passport-ui-design-system/SKILL.md` for frontend, UX, UI, icon, logo, Open Graph, README visual header, or brand/color changes.
- Keep repo skills under `.agents/skills` so Codex CLI, IDE extension, and app agents can discover them from the repository root.
- Adapter behavior, adapter docs, interop reports, framework claims, partner/sandbox/production language, or readiness level changes are hardening-sensitive.
- If a hardening-sensitive change modifies behavior or claims, update readiness metadata as needed, update `hardening/maps/passport.invariants.json`, regenerate `hardening/frontiers/passport.frontier.json`, and record the result in `hardening/change-log.md` or `hardening/rounds/`.

## Required Checks

- Run `npm run hardening:frontier` and `npm run hardening:gate` after hardening-sensitive changes.
- Run `npm run ci` before handoff when code, generated artifacts, Daml, CI, package scripts, or hardening policy changes.
- For visual asset changes, validate SVG XML and regenerate PNG derivatives from SVG sources.

## Architecture Boundaries

- Aevelum Passport is the public Canton/Daml foundation for private collateral-readiness credentials; it records readiness and may record reservation handoff notices.
- Keep Daml templates as the Canton ledger schema unless an explicit ADR and invariant-map update justify a change.
- Keep interop framework-neutral: CDM is one static plugin, not repo-global special-case code.
- Default PR and local CI must not fetch from the network after GitHub platform checkout; dependency/toolchain/bootstrap material must come from the pre-baked offline runner and offline npm cache.
- Do not add dynamic plugin loading, eval-style execution, arbitrary plugin path resolution, or Passport provenance inside generated CDM payloads.
- Do not add custody, wallet, settlement, collateral transfer, venue, margin engine, optimizer, credit decision, legal-title, ZK, production identity, or live external integration code.

## Frontend And Brand

- Use `design/tokens/colors.json` and `docs/08_brand_ui_system.md` as the source of truth for colors.
- The visual tone is institutional finance: navy, slate, off-white, restrained blue, muted teal, limited gold, and red only for risk.
- Do not introduce bright cyan, neon green, decorative gradients, or consumer-fintech color treatments.
