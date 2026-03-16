## Dashboard Hover Consistency Design

### Goal

Apply the `/playground/website` and Google SERP interaction language across the main dashboard surfaces so the product feels like one system instead of mixed generations of UI.

### Scope

- `Settings`
- `Logs`
- `API Keys`
- `Overview`
- shared list and card surfaces
- playground engine cards on `/playground`

### Interaction Direction

- Use a restrained hover system, not flashy animation.
- Prefer subtle border tightening, softer background shifts, and a light vertical lift.
- Keep text mostly stable on hover. The page should feel cleaner, not more colorful.
- Use the same large-radius shell language already present in the website workbench.

### Shared Surface Rules

- Interactive cards should move from a flat white shell to a slightly brighter white with a stronger slate border.
- Hoverable rows should use the same background and border shift without changing layout density.
- Outline and ghost buttons should feel more tactile, with the same border and white-surface response used by the playground.
- Static information panels should stay calm unless they are clearly actionable.

### Page-Level Changes

#### Settings

- Make the left navigation tabs feel like selectable tool options instead of plain sidebar links.
- Promote config rows into hoverable control blocks so toggles and inputs feel grouped.
- Keep the save action visually aligned with the stronger website-style controls.

#### Logs

- Normalize stat cards, filter shell, mobile log cards, and desktop table rows to the same hover system.
- Preserve status color meaning while keeping the row hover neutral.

#### API Keys

- Make the stacked list shell, rows, and destructive actions feel consistent with the rest of the dashboard.
- Keep revoke and delete actions readable without aggressive red hover states.

#### Overview

- Give stat cards and quick actions the same interactive depth as playground surfaces.
- Keep the system status panel calmer than the quick-action area.

#### Playground Index

- Refine the engine cards so their hover depth matches the improved dashboard language.
- Keep the current visual hierarchy, only tighten the shell and hover behavior.

### Verification

- Validate the web app with TypeScript after the styling pass.
- Avoid touching unrelated API, queue, or Docker behavior during this UI-only change.
