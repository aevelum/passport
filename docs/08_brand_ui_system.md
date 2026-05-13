# Brand And UI System

## Position

Aevelum Passport should read as institutional financial infrastructure: quiet, governed, reviewable, and precise. The visual system should support repeated operational use, not marketing spectacle.

## Color Rationale

The palette is based on common institutional-finance conventions:

- Deep navy and blue signal trust, stability, governance, and digital infrastructure.
- Slate and gray signal neutrality, seriousness, and data/reporting discipline.
- Muted teal supports credential, positive capacity, and interoperability states without making the product feel consumer-fintech.
- Gold is reserved for official endorsement or seal-like accents.
- Red is reserved for risk, rejection, loss, or warning states.

Machine-readable tokens live in `design/tokens/colors.json`. Agents and frontend implementations should import or copy from those tokens rather than inventing nearby colors.

## Core Palette

| Token | Hex | Use |
|---|---:|---|
| `ink.900` | `#07111A` | Primary dark background and deep brand ink |
| `ink.800` | `#0B1F3A` | Institutional navy surface |
| `blue.700` | `#005F9E` | Global infrastructure and globe accent |
| `blue.600` | `#1D4ED8` | Interactive trust blue |
| `teal.700` | `#00818F` | Credential and positive collateral capacity accent |
| `slate.700` | `#343741` | Institutional neutral text |
| `slate.300` | `#CBD5E1` | Borders and quiet dividers |
| `surface.50` | `#F8FAFC` | Off-white app surface |
| `gold.600` | `#BD9B6B` | Limited official accent |
| `risk.700` | `#872907` | Warning, rejection, loss, or risk only |

## Usage Rules

- Use navy/slate as the dominant UI foundation.
- Use blue for global credential infrastructure, links, and primary actions.
- Use teal for credential status, positive collateral capacity, and selected states.
- Use gold sparingly for official seal or endorsement moments.
- Use red only for negative or risk states.
- Avoid bright cyan, neon green, large gradients, and one-note teal/blue surfaces.
- Keep operational screens dense, restrained, and readable.

## Agent Workflow

For frontend, UX, UI, brand, or asset work:

1. Read `.agents/skills/passport-ui-design-system/SKILL.md`.
2. Use `design/tokens/colors.json` as the color source of truth.
3. Update this document only when the design rule changes, not for one-off usage.
4. Validate SVG/XML assets and regenerate PNG derivatives from SVG sources.
