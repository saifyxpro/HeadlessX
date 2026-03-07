# 2026-03-07 Logs Page Design

## Goal
Add a first-class `/logs` dashboard page that exposes request logs and summary stats using the existing backend endpoints.

## Scope
- Reuse existing `/api/logs` and `/api/logs/stats` endpoints
- Add a dashboard page at `apps/web/src/app/logs/page.tsx`
- Include summary cards, client-side filtering, paginated table, and row detail panel
- Preserve the current flat bordered dashboard visual language

## Data Flow
- Fetch summary metrics from `/api/logs/stats`
- Fetch paginated logs from `/api/logs?page=&limit=`
- Apply search/status filters client-side for the current page of results
- Show row details inline without requiring backend changes

## UX
- Use `PageHeader` for consistency
- Show top summary cards for total requests, success rate, failures, and avg latency
- Provide search + status filter + page size controls
- Show a clear empty state and loading skeletons
- Use colored status chips and a details drawer/panel inside the page

## Constraints
- No backend schema or route changes in this pass
- No build run unless explicitly requested by the user

## Risks
- Filters operate on the current page of results only until server-side filtering is added
- The current logs API does not expose richer filtering or full-text search
