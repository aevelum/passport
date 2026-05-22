# Passport Agent Instructions

## Repo-Local Skills

- Use the repo skill at `.agents/skills/passport-hardening-loop/SKILL.md` for changes that touch Daml templates, Daml tests, interop adapters, CDM plugin behavior, CI, packaging, release artifacts, security boundaries, or architecture decisions.
- Use the repo skill at `.agents/skills/passport-ui-design-system/SKILL.md` for frontend, UX, UI, icon, logo, Open Graph, README visual header, or brand/color changes.
- Keep repo skills under `.agents/skills` so Codex CLI, IDE extension, and app agents can discover them from the repository root.
- Adapter behavior, adapter docs, interop reports, framework claims, partner/sandbox/production language, or readiness level changes are hardening-sensitive.
- If a hardening-sensitive change modifies behavior or claims, update readiness metadata as needed, update `hardening/maps/passport.invariants.json`, regenerate `hardening/frontiers/passport.frontier.json`, and record the result in `hardening/change-log.md` or `hardening/rounds/`.
- Prefer executable hardening over ceremony: new formal artifacts, ADRs, or policy text should map to a negative test, tamper falsifier, Daml Script check, interop validation case, static gate, or bounded formal checker with explicit assumptions.

## Required Checks

- Run `npm run hardening:frontier`, `npm run hardening:formal`, and `npm run hardening:gate` after hardening-sensitive changes.
- Run `npm run ci` before handoff when code, generated artifacts, Daml, CI, package scripts, or hardening policy changes.
- For visual asset changes, validate SVG XML and regenerate PNG derivatives from SVG sources.

## Architecture Boundaries

- Aevelum Passport is the public Canton/Daml foundation for private regulated-market readiness credentials. Collateral capacity is the first credential family. Passport records attested readiness and scoped evidence only, and may record reservation handoff notices.
- Keep Daml templates as the Canton ledger schema unless an explicit ADR and invariant-map update justify a change.
- Keep interop framework-neutral: CDM is one static plugin, not repo-global special-case code.
- Default PR CI should use standard GitHub-hosted runners with explicit Node, Java, DPM, and npm setup. Repo-authored validation and generation paths must not fetch schemas, plugin code, or mutable runtime inputs except through explicit vendoring commands.
- Do not add dynamic plugin loading, eval-style execution, arbitrary plugin path resolution, or Passport provenance inside generated CDM payloads.
- Do not add custody, wallet, settlement, clearing, collateral transfer, asset transfer, token issuance, venue operation, order matching, margin engine, optimizer, credit decision, legal-title, ZK, production identity, legal-compliance determination, license granting, venue admission, or live external integration code.

## Readiness Credential Expansion

Passport may now model generic regulated-market readiness credentials in addition to collateral-capacity credentials. Credential families may include participant eligibility, license or registration attestations, venue access readiness, product eligibility, operational capability, disclosure consent, and settlement or clearing readiness evidence.

These are evidence and readiness credentials only. Passport must not grant legal licenses, determine legal compliance, admit participants to a venue, operate a venue, create trades, match orders, clear, settle, custody, transfer assets, issue tokens, or operate wallets.

Any new credential family must include:

- typed Daml `Time` validity / freshness checks;
- scoped presentation;
- revocation / expiry;
- privacy tests;
- audit disclosure tests;
- overclaim / boundary gate updates.

## Frontend And Brand

- Use `design/tokens/colors.json` and `docs/08_brand_ui_system.md` as the source of truth for colors.
- The visual tone is institutional finance: navy, slate, off-white, restrained blue, muted teal, limited gold, and red only for risk.
- Do not introduce bright cyan, neon green, decorative gradients, or consumer-fintech color treatments.
