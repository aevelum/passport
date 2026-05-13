# round-0001: Framework-Neutral Interop Hardening

## Target

Selected surfaces:

- `inv.interop.static-plugin-boundary`
- `inv.agent.repo-local-skill-discovery`
- `inv.cdm.schema-reproducibility`
- `inv.release.reviewable-archive`

## Decision

Deepen the agent-discovery, interop, and release architecture controls. The v0.2 adapter cleanup moved CDM into a plugin boundary, so the first hardening round makes that boundary executable through a repo-local invariant map, scored frontier, discoverable repo skill, and CI gate.

## Evidence Added

- `hardening/maps/passport.invariants.json`
- `hardening/frontiers/passport.frontier.json`
- `hardening/policies/architecture-rules.json`
- `hardening/scripts/hardening-gate.mjs`
- `.agents/skills/passport-hardening-loop/SKILL.md`
- `AGENTS.md`
- `npm run hardening:gate`

## Kill Gates

- Reject dynamic plugin loading, eval-style execution, and remote code execution in interop paths.
- Reject repo hardening skills that are not stored under `.agents/skills`.
- Reject network fetches outside the explicit CDM schema vendor module.
- Reject default CI if it calls the vendor refresh path.
- Reject generated CDM payloads that contain Passport provenance keys.
- Reject stale hardening frontier output.

## Result

Current status: guarded. The architecture is not considered permanently solved; future interop or Daml changes must update the invariant map and pass `npm run hardening:gate`.
