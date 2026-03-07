# Logs UX Redesign

Date: 2026-03-07

## Context

The `/logs` page works functionally, but the UX has three structural problems:
- the persistent right-side `Log Details` panel compresses the request table and breaks the dashboard width rhythm
- the search and filter controls feel visually weaker than the rest of the dashboard shell
- spacing and typography are inconsistent with the flattened `apps/web` design system

## Goals

- keep the page flat and border-led with no shadow-based depth
- make the request table the primary surface and give it the full available width
- move request inspection into a temporary overlay so users can inspect a row without sacrificing scan density
- improve control alignment, spacing, and type hierarchy in the filter/search area
- keep the backend API unchanged

## Chosen Approach

Use a centered overlay dialog for log inspection and convert the page body into a two-stage layout:
1. top stats row
2. full-width logs workspace card with integrated filter toolbar and table

This replaces the split table/details layout with a denser, more balanced operator view.

## Interaction Model

- clicking a table row opens a modal overlay with that row's metadata
- closing the overlay returns the user to the same table state
- search remains client-side for the currently loaded page
- filter and page-size controls stay inline with the search surface
- a small summary row communicates visible counts and current page context

## Visual System

- borders only, no shadows
- white primary cards on the soft slate dashboard background
- pale slate nested surfaces for fields and metadata groups
- smaller, consistent uppercase field labels
- stronger primary text for URLs and values, lighter metadata copy
- standardized `px-5/py-4` to `px-6/py-5` spacing cadence

## Component Changes

### `apps/web/src/app/logs/page.tsx`
- remove the permanent right details card
- make the request stream card span the full content width
- redesign the filter card into a flatter toolbar with better control alignment
- add a dialog-based `Log Details` overlay using the existing shared dialog primitives
- tighten row spacing and supporting text hierarchy
- add inline visible-count and pagination context chips

### Shared primitives
- reuse the existing shared `Dialog` component
- keep styling local to the logs page unless a shared primitive is clearly out of line

## Constraints

- no backend changes
- no build run in this pass
- no shadow-based elevation

## Validation

- table and filters align with the shared dashboard shell width
- details are accessible only as an overlay, not a permanent side column
- search and dropdown controls share a consistent height and spacing rhythm
- the page remains functional with the current logs API
