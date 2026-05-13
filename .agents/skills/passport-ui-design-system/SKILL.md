---
name: passport-ui-design-system
description: Use inside the Passport repo for frontend, UX, UI, brand, icon, logo, Open Graph, or visual asset work. It requires agents to use the institutional finance palette and design tokens instead of inventing colors or consumer-fintech styling.
---

# Passport UI Design System

## Use When

Use this skill for changes to:

- frontend screens or components
- UX/UI flows
- SVG or PNG brand assets
- Open Graph images
- README visual headers
- color, typography, spacing, or visual tone

## Source Of Truth

- Color tokens: `design/tokens/colors.json`
- Design guidance: `docs/08_brand_ui_system.md`
- Project instructions: `AGENTS.md`

## Rules

- Use the institutional finance palette from `design/tokens/colors.json`.
- Keep navy, slate, and off-white dominant.
- Use blue for trust and global infrastructure.
- Use muted teal for credentials, positive collateral capacity, and selected states.
- Use gold only as a restrained official/seal accent.
- Use red only for risk, rejection, warning, or loss.
- Do not introduce bright cyan, neon green, large decorative gradients, or consumer-fintech color treatments.
- Preserve legibility and contrast before visual novelty.
- For generated PNG assets, edit SVG first and render PNG from the SVG.

## Validation

After visual asset changes:

```bash
python3 - <<'PY'
from pathlib import Path
from xml.etree import ElementTree as ET
for path in sorted(Path('assets').glob('*.svg')):
    ET.parse(path)
    print(f'xml ok {path}')
PY
```

Run the relevant repo checks before handoff:

```bash
npm run gate
```
