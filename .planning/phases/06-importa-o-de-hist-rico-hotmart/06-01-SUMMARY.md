---
phase: "06"
plan: "01"
subsystem: "hotmart-sync"
tags: ["api", "hotmart", "sync", "dashboard"]
dependency_graph:
  requires: ["Phase 1 webhook schema (sales, sale_utms tables)"]
  provides: ["POST /api/sync/hotmart", "Sync Hotmart button in DashboardHeader"]
  affects: ["DashboardHeader", "sales table", "sale_utms table"]
tech_stack:
  added: []
  patterns: ["UPSERT idempotency", "pagination via page_token", "Bearer token auth"]
key_files:
  created:
    - src/app/api/sync/hotmart/route.ts
  modified:
    - src/components/DashboardHeader.tsx
decisions:
  - "Used HOTMART_ACCESS_TOKEN (Personal Access Token) for simplicity — avoids OAuth client credentials flow"
  - "Paginated Hotmart API responses using page_token to handle large date ranges"
  - "Mapped tracking.source/source_sck/external_code to utm_source/utm_campaign/utm_content for UTM storage"
  - "Placed Sync Hotmart button (orange) before Sync Facebook for visual distinction"
metrics:
  duration: "~8 minutes"
  completed: "2026-09-07"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 1
---

# Phase 06 Plan 01: Importacao de Historico Hotmart Summary

## One-liner

Hotmart sales history sync via REST API with pagination, UPSERT idempotency, and a manual trigger button in the dashboard.

## What Was Built

### Task 1: Hotmart Sync API Route (`ee70e20`)
Created `src/app/api/sync/hotmart/route.ts` — a `POST /api/sync/hotmart` endpoint that:
- Accepts `startDate` and `endDate` in the request body
- Authenticates to Hotmart API using `HOTMART_ACCESS_TOKEN` (Bearer token)
- Converts dates to millisecond timestamps as required by the Hotmart API
- Paginates through all results using `page_token` to handle large date ranges
- UPSERTs each sale into the `sales` table (idempotent on `transaction_id`)
- UPSERTs UTM tracking data from `item.tracking` into `sale_utms` table
- Returns `{ success, upserted, fetched }` count on success
- Has `force-dynamic` to prevent build-time execution

### Task 2: Sync Hotmart Button (`c03d281`)
Modified `src/components/DashboardHeader.tsx` to:
- Add `isSyncingHotmart` state variable
- Add `handleHotmartSync` function calling `POST /api/sync/hotmart` with current `startDate`/`endDate`
- Add "Sync Hotmart" button (orange styling, distinct from gray Facebook button) placed before the Facebook sync button
- Triggers `onSync()` callback on success to refresh dashboard metrics

## Verification

- POST `/api/sync/hotmart` with valid dates fetches Hotmart history and upserts to DB
- Running multiple times for the same date range does not duplicate records (UPSERT on `transaction_id`)
- DashboardHeader shows "Sync Hotmart" button that spins during sync

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - the implementation is fully wired to the Hotmart API and Supabase.

## Threat Flags

None - new endpoint uses environment variable authentication (no user-supplied credentials exposed), and existing Supabase server client with service role key is used consistently with other sync routes.

## Self-Check: PASSED

- `src/app/api/sync/hotmart/route.ts` - FOUND
- `src/components/DashboardHeader.tsx` - FOUND (modified)
- Commit `ee70e20` - FOUND
- Commit `c03d281` - FOUND
