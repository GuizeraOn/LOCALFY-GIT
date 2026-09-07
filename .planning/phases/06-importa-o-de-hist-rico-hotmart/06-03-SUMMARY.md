---
phase: "06"
plan: "03"
subsystem: "dashboard-ui"
tags: ["hotmart", "import", "pagination", "progress-bar", "client-component"]
dependency_graph:
  requires: ["06-02"]
  provides: ["hotmart-import-ui"]
  affects: ["src/components/DashboardHeader.tsx"]
tech_stack:
  added: []
  patterns: ["client-driven pagination loop", "nextPageToken cursor", "progress bar via inline style"]
key_files:
  modified:
    - "src/components/DashboardHeader.tsx"
decisions:
  - "Client owns the pagination loop (not server-side) so genuine imported/total progress is possible"
  - "MAX_IMPORT_PAGES=200 hard cap prevents infinite loops from malformed nextPageToken"
  - "Wrapped outer div restructured so progress bar can sit below the header row without doubled spacing"
metrics:
  duration: "~10 minutes"
  completed: "2026-09-07"
  tasks_completed: 1
  tasks_total: 2
  files_modified: 1
---

# Phase 06 Plan 03: Add Importar Histórico Button Summary

Adds the "Importar Histórico" button to the dashboard header with a client-driven pagination loop, real progress bar, and error/success feedback.

## What Was Built

- **"Importar Histórico" button** (emerald-600, Download icon) rendered after the existing "Sync Facebook" button
- **`MAX_IMPORT_PAGES = 200`** module-level constant as a hard loop bound
- **Client pagination loop** in `handleImportHistory`: POSTs to `/api/sync/hotmart` with `pageToken`, accumulates `imported` count, updates `importTotal` from `totalResults`, breaks when `nextPageToken === null`
- **Progress bar** (`h-2`, `bg-emerald-500`) with `style={{ width: \`${progressPercent}%\` }}` — animates-pulse when total is unknown
- **Live counter**: button label shows `Importando... N/M` during import
- **Error display**: red `text-xs text-red-400` line when import fails
- **Success display**: green `text-xs text-emerald-400` line reading "Importação concluída: N vendas"
- **Concurrency guard**: `disabled={isImporting}` + early return in `handleImportHistory`
- **Pre-mount guard**: returns immediately if `startDate` or `endDate` is empty

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add Importar Histórico button and paginated import loop | ed46692 | src/components/DashboardHeader.tsx |
| 2 | Browser verification | pending (checkpoint) | — |

## Deviations from Plan

### Pre-existing Lint Errors (Out of Scope)

`npm run lint` exits 1 due to pre-existing errors in files NOT modified by this plan:
- `src/app/page.tsx:19` — `react-hooks/set-state-in-effect`
- `src/components/CampaignTable.tsx:2` — `@typescript-eslint/no-explicit-any`
- `src/lib/metrics.ts:3,23` — `@typescript-eslint/no-explicit-any`
- `src/components/DateRangePicker.tsx:3-4` — unused imports warnings

`DashboardHeader.tsx` itself is lint-clean (no errors in that file). These are pre-existing issues documented in `deferred-items.md`.

`npx tsc --noEmit` exits 0 (clean).

## Known Stubs

None — the implementation is fully wired.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. All T-06-14 through T-06-SC mitigations are implemented:
- T-06-14: `MAX_IMPORT_PAGES = 200` loop cap present
- T-06-15: `disabled={isImporting}` + early return in `handleImportHistory`
- T-06-16: Only fixed error strings from the HTTP contract rendered
- T-06-17: All text as React children (auto-escaped), no `dangerouslySetInnerHTML`
- T-06-18: No `process.env.HOTMART_ACCESS_TOKEN` in client component

## Human Verification (Task 2)

Awaiting developer confirmation:
- Progress bar visible during import
- Metrics refresh on completion without page reload
- `public.sales` row count unchanged after second import run (idempotency)
- `created_at` values match original sale dates, not import timestamp
- `public.sale_utms` has rows for transactions with tracking data

## Self-Check: PASSED

- `src/components/DashboardHeader.tsx` exists and is modified
- Commit `ed46692` exists in git log
- All grep acceptance criteria verified (Importar Histórico: 1, MAX_IMPORT_PAGES: 2, nextPageToken: 2, Download: 2, onSync(): 2, disabled={isImporting}: 1, style={{ width:: 1, : any: 0)
