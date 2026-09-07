---
phase: "06"
plan: "02"
subsystem: "hotmart-sync"
tags: ["api", "hotmart", "sync", "mapping", "pagination", "upsert"]
dependency_graph:
  requires:
    - "Phase 1 schema (sales, sale_utms tables with transaction_id PK)"
    - "src/lib/supabase-server.ts (supabaseServerClient)"
    - "src/lib/hotmart.ts (mapping layer — created in this plan)"
  provides:
    - "POST /api/sync/hotmart (paginated, one page per request)"
    - "src/lib/hotmart.ts (pure mapping module)"
    - ".env.example (documented env contract)"
    - "scripts/check-hotmart-mapping.mjs (offline verification harness)"
  affects:
    - "sales table (upserted with historical created_at)"
    - "sale_utms table (upserted idempotently)"
tech_stack:
  added: []
  patterns:
    - "Pure dependency-free mapping module (no imports)"
    - "Client-driven pagination via nextPageToken"
    - "Bearer token in Authorization header only (never in URL)"
    - "UPSERT idempotency on transaction_id"
    - "Offline assertion harness via Node built-ins"
key_files:
  created:
    - src/lib/hotmart.ts
    - scripts/check-hotmart-mapping.mjs
    - .env.example
  modified:
    - src/app/api/sync/hotmart/route.ts
    - README.md
    - .gitignore
decisions:
  - "Pure module with zero imports — makes offline verification possible and avoids import cycles"
  - "Client-driven pagination — one page per HTTP request prevents serverless timeout on large histories"
  - "Bearer token sent only in Authorization header — never in URL query string (prevents proxy logging)"
  - "Omit created_at key entirely when null — lets Postgres keep DEFAULT/existing value"
  - "UTM upsert errors logged but do not fail request — mirrors Phase 1 webhook behaviour"
metrics:
  duration: "~25 minutes"
  completed: "2026-09-07"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 3
---

# Phase 06 Plan 02: POST /api/sync/hotmart — Paginated History Import Summary

## One-liner

Hotmart sales-history import via paginated REST API with pure mapping module, offline verification harness, Bearer-token-only auth, and idempotent upsert on transaction_id.

## What Was Built

This plan executed as a wave-2 continuation after wave-1 deviated from the plan and built an
incorrect route (server-side pagination loop, wrong response shape, no mapping module). This plan
delivered the complete correct implementation.

### Task 1: Hotmart mapping module + offline harness (`be2ad2b`)

**`src/lib/hotmart.ts`** — pure mapping layer with zero imports:
- `HOTMART_SALES_HISTORY_URL` constant
- `mapHotmartItem(item: unknown): MappedHotmartSale | null` — field-by-field safe mapping with
  epoch-ms, epoch-s, and ISO date normalisation; UTM recovery from query-string, pipe-delimited,
  and bare-source formats; status uppercased; price NaN-guarded to 0
- `dedupeMappedSales(items)` — collapses duplicate transaction_ids keeping last occurrence,
  preserving first-seen order (required by Postgres ON CONFLICT DO UPDATE)
- `extractPageInfo(payload)` — reads `page_info.next_page_token` / `total_results` with fallbacks
- `buildSalesHistoryUrl(params)` — URL built with URLSearchParams (no query injection surface)
- `parseUtmString(raw)` — exported helper for the three UTM encoding formats
- TypeScript strict mode; no `any`; no `@ts-ignore`

**`scripts/check-hotmart-mapping.mjs`** — 12-group offline assertion harness (Node built-ins only):
- Epoch ms and epoch seconds date conversion
- Date fallback chain (order_date → approved_date → date → record fallbacks)
- Query-string UTMs, pipe-delimited UTMs, bare source + external_code
- No tracking → utms null
- Missing transaction_id → null
- Price coercion (string, missing, non-numeric → never NaN)
- dedupeMappedSales ordering and last-write-wins
- buildSalesHistoryUrl host, pathname, params, page_token presence/absence
- extractPageInfo with nested page_info and empty payload

**`.gitignore`** — added `.tmp-verify` (compilation artifacts) and `!.env.example` (negation).

### Task 2: Route rewrite + documentation (`3a28957`, `d01f72a`)

**`src/app/api/sync/hotmart/route.ts`** — completely rewritten:
- First line: `export const dynamic = 'force-dynamic';`
- Imports all four helpers from `@/lib/hotmart`
- Defensive body parsing (empty body valid)
- Token guard: 500 `Server configuration error` with no token material in response
- Date validation: anchored regex `^\d{4}-\d{2}-\d{2}$`, NaN guard, start > end guard
- One page per request (maxResults: 50) — no server-side loop
- Token in `Authorization: Bearer` header only — never in URL query string
- Non-ok upstream: error body logged server-side only; client gets fixed strings
  (`Hotmart authentication failed` for 401/403, `Failed to fetch from Hotmart` otherwise)
- `created_at` written only when non-null (key omitted otherwise, preserving Postgres DEFAULT)
- Sales upserted first, UTMs second (FK order)
- UTM upsert errors logged but request still succeeds (mirrors webhook)
- Response: `{ success, count, total, skipped, nextPageToken, totalResults }`

**`.env.example`** — placeholder values for all eight runtime variables including
`HOTMART_WEBHOOK_TOKEN` and the new `HOTMART_ACCESS_TOKEN`; confirmed not git-ignored.

**`README.md`** — Portuguese section `## Importação de histórico da Hotmart` documenting
credential setup, request/response field tables, pagination example with curl, and idempotency.

## Deviations from Plan

### Wave-1 deviation (inherited, corrected here)

Wave-1 was supposed to create `src/lib/hotmart.ts` and `scripts/check-hotmart-mapping.mjs` but
instead built a working-but-incorrect route and a dashboard button. This plan (wave 2) was
scoped accordingly to deliver the missing mapping module and correct the route:

- `src/lib/hotmart.ts` — created fresh (wave-1 never created it)
- `scripts/check-hotmart-mapping.mjs` — created fresh (wave-1 never created it)
- `src/app/api/sync/hotmart/route.ts` — completely replaced (wave-1 version had wrong contract)
- `.gitignore` — `!.env.example` and `.tmp-verify` added here (wave-1 skipped)

### Build verification degraded (worktree limitation)

`npm run build` cannot run inside the git worktree because Turbopack requires `node_modules` to
be present at the workspace root. The worktree does not have `node_modules`. Mitigation:
- `npx tsc --noEmit` exits 0 (TypeScript compilation correct)
- `npm run lint` reports zero errors in the files created/modified by this plan
- Offline harness passes all 12 assertion groups

Pre-existing lint errors in `page.tsx`, `CampaignTable.tsx`, `DateRangePicker.tsx`, and
`metrics.ts` are out of scope and not introduced by this plan.

## Known Stubs

None — the mapping module is fully implemented, the route is complete, and documentation is
accurate.

## Threat Flags

No new threat surface beyond what is modelled in the plan's `<threat_model>`. All mitigations
applied:
- T-06-06: Token in Authorization header only, never in URL, never echoed
- T-06-07: Upstream error body logged server-side, client receives fixed strings
- T-06-08: .env.example has placeholder values only; confirmed no real credentials
- T-06-09: Date params validated with anchored regex, URL built with URLSearchParams
- T-06-10: Allow-listed field mapping, dedup before upsert, supabase-js parameterises values
- T-06-11: One page per request, no server-side loop, bounded memory and runtime
- T-06-SC: No npm packages installed

## Self-Check: PASSED

Checking files created/modified:
- `src/lib/hotmart.ts` — FOUND
- `scripts/check-hotmart-mapping.mjs` — FOUND
- `.env.example` — FOUND (not git-ignored)
- `src/app/api/sync/hotmart/route.ts` — FOUND (rewritten)
- `README.md` — FOUND (has Hotmart section)
- `.gitignore` — FOUND (has .tmp-verify and !.env.example)

Checking commits:
- `be2ad2b` — feat(06-01): add hotmart mapping module and offline verification harness
- `3a28957` — feat(06-02): rewrite POST /api/sync/hotmart with correct HTTP contract
- `d01f72a` — docs(06-02): add .env.example and Hotmart import section in README
