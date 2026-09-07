---
phase: 1
plan: 02
subsystem: Webhook Endpoint
tags:
  - nextjs
  - api
  - hotmart
affects:
  - webhook/hotmart
tech-stack.added:
  - nextjs app router
key-files.created:
  - src/lib/supabase-server.ts
  - src/app/api/webhook/hotmart/route.ts
key-decisions:
  - Created a Next.js App Router POST endpoint that extracts transaction details and UTMs from Hotmart webhook payload.
  - Using Supabase Service Role client to bypass RLS for server-side inserts.
  - Both tables (`sales` and `sale_utms`) use `upsert` on `transaction_id` for idempotency.
requirements-completed:
  - HOT-01
  - HOT-02
  - HOT-03
duration: 2 min
completed: 2026-09-07T16:15:39Z
---

# Phase 1 Plan 02: Hotmart Webhook Endpoint Summary

Implemented the Next.js API route to receive Hotmart webhooks and save the sales and UTM data to Supabase idempotently.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED
