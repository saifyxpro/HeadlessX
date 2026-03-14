## Flat Playground UI Design

### Goal

Remove the remaining lifted and shadowed interaction language from the dashboard and playground surfaces, and bring Google SERP onto the same visual system as the website workbench.

### Scope

- Shared card and button hover behavior
- Shared flat interaction helpers in `globals.css`
- `PageHeader`
- `/playground/website` high-visibility shadow classes
- `/playground/google-serp` header, configuration panel, and results panel

### Direction

- Keep the current spacing, radii, and typography.
- Remove hover lift, hover shadows, and decorative chrome.
- Preserve border and background changes for affordance.
- Keep the interface calm, dense, and tool-like.

### Shared Rules

- Cards stay flat on hover.
- Buttons keep color and border feedback but do not move.
- Inputs keep border emphasis without glowing depth.
- Result shells use the same rounded white panels with slate borders.

### Google SERP

- Rebuild the page to match the website workbench structure.
- Replace gradient icon blocks, faux terminal controls, and motion-heavy loading with flat panels and bordered step rows.
- Keep the existing SERP data modes:
  - visual summary
  - raw markdown
  - JSON

### Verification

- Run the web TypeScript check after the UI pass.
