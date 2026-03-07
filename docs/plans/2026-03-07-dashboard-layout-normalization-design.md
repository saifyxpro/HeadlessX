# 2026-03-07 Dashboard Layout Normalization Design

## Goal
Normalize the entire `apps/web` dashboard so every page uses the same content width, header scale, spacing rhythm, and card surface treatment.

## Problem
The current dashboard mixes shell-level layout with per-page wrappers. Several pages add their own `max-w-*`, `px-*`, `min-h-screen`, oversized headers, and custom card radii/backgrounds. This creates visible width drift, inconsistent header weight, and poor UX when switching pages.

## Decision
Adopt a strict shell normalization approach across all dashboard pages.

## Layout Rules
- `app/layout.tsx` is the only source of truth for dashboard width and outer page padding.
- Standard content width is shared across all pages.
- Pages should not add their own `max-w-*`, `mx-auto`, or redundant shell padding unless the page genuinely requires a special full-bleed layout.
- Normal dashboard pages should not use `min-h-screen` inside the content area.

## Header Rules
- `PageHeader` becomes the standard header block for all dashboard pages.
- Header scale is reduced from the current oversized style.
- Header padding, border, radius, title sizing, description sizing, and action slot treatment are consistent on every page.
- Pages should not wrap `PageHeader` in extra hero-like containers.

## Surface Rules
- Standard card shape: `rounded-2xl`.
- Standard card border: visible slate border.
- Standard card background: solid/near-solid white aligned with the flat dashboard language.
- Remove inconsistent use of `rounded-3xl`, `rounded-[32px]`, translucent white overlays, and page-specific surface styling where it is not intentionally required.

## Pages in Scope
- `apps/web/src/components/dashboard/Overview.tsx`
- `apps/web/src/app/profiles/page.tsx`
- `apps/web/src/app/api-keys/page.tsx`
- `apps/web/src/app/settings/page.tsx`
- `apps/web/src/app/playground/page.tsx`
- `apps/web/src/app/playground/website/page.tsx`
- `apps/web/src/app/playground/google-serp/page.tsx`
- `apps/web/src/app/logs/page.tsx`
- shared shell/header primitives affecting these pages

## Implementation Plan
1. Normalize root shell spacing in `app/layout.tsx` and supporting global CSS.
2. Refactor `PageHeader` to the new standard scale.
3. Normalize shared card/surface usage where possible through shared primitives.
4. Remove page-level duplicate width/padding wrappers.
5. Align Overview, Settings, Profiles, API Keys, Playground, Website Scraper, Google SERP, and Logs to the same content rhythm.
6. Leave true feature-specific inner layouts intact while normalizing only shell-level inconsistencies.

## Risks
- Some pages currently rely on local padding to compensate for inconsistent child components.
- Playground pages have more complex two-column layouts; they should keep their functional grid while adopting the normalized outer shell.

## Success Criteria
- All dashboard pages align to the same outer width.
- Page headers have a consistent visual scale and spacing.
- Cards feel like one system instead of page-specific variants.
- Navigation between pages feels stable and intentional.
