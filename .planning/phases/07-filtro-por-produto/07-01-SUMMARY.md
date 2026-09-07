---
phase: "07"
plan: "01"
subsystem: "data-layer"
tags: ["supabase", "migration", "hotmart", "product-filter", "typescript"]
dependency_graph:
  requires: []
  provides: ["sales.product_id", "sales.product_name", "HotmartSaleRow.product_id", "HotmartSaleRow.product_name"]
  affects: ["src/lib/hotmart.ts", "supabase/migrations/0003_sales_product.sql"]
tech_stack:
  added: []
  patterns: ["nullable-columns", "idempotent-migrations", "pure-function-extraction"]
key_files:
  created:
    - supabase/migrations/0003_sales_product.sql
  modified:
    - src/lib/hotmart.ts
    - scripts/check-hotmart-mapping.mjs
decisions:
  - "product_id and product_name are nullable — no backfill required; existing rows stay NULL"
  - "extractProduct resolves product.id > product.ucode > record.product_id, product.name > record.product_name"
  - "All migration statements use IF NOT EXISTS for idempotency"
metrics:
  duration: "~15 minutes"
  completed: "2026-09-07"
  tasks_completed: 2
  tasks_total: 3
  files_created: 1
  files_modified: 2
---

# Phase 07 Plan 01: Camada de Dados para Filtro por Produto — Summary

## One-liner

Migração SQL idempotente adiciona `product_id`/`product_name` à tabela `sales` e `mapHotmartItem` agora extrai produto de qualquer payload Hotmart via helper `extractProduct`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Migração 0003 — colunas de produto em sales | 6abdb80 | supabase/migrations/0003_sales_product.sql |
| 2 | Extrair produto em mapHotmartItem + assertions no harness | ab15623 | src/lib/hotmart.ts, scripts/check-hotmart-mapping.mjs |

## Task 3 — Checkpoint (awaiting human)

Task 3 (`checkpoint:human-action`) requires the operator to confirm/apply migration 0003 in Supabase. This plan is paused pending that confirmation.

## What Was Built

### Migration 0003 (`supabase/migrations/0003_sales_product.sql`)

- `ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS product_id TEXT`
- `ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS product_name TEXT`
- `CREATE INDEX IF NOT EXISTS sales_product_id_idx ON public.sales (product_id)`
- `CREATE INDEX IF NOT EXISTS sales_product_id_created_at_idx ON public.sales (product_id, created_at)`

All four statements are idempotent (IF NOT EXISTS). Columns are nullable; existing rows remain NULL until backfill via "Importar Histórico" (plan 07-05).

Automatic `npx supabase db push` failed (project not linked) — manual application required via Supabase SQL Editor.

### Hotmart Mapper (`src/lib/hotmart.ts`)

Extended `HotmartSaleRow` with:
```typescript
product_id: string | null;
product_name: string | null;
```

Added internal `extractProduct(record, purchase)`:
- Resolves `product.id > product.ucode > record.product_id` for `product_id`
- Resolves `product.name > record.product_name` for `product_name`
- Uses existing `asRecord` and `toCleanString` helpers (safe: numbers coerced to string, objects/arrays → null)

`mapHotmartItem` now calls `extractProduct` and includes both fields on every returned sale object.

### Assertion Harness (`scripts/check-hotmart-mapping.mjs`)

Added Tests 13–16:
- Test 13: `product` at top-level of item (`product.id: 123` → `"123"`)
- Test 14: `product` nested inside `purchase`
- Test 15: fallback by `product.ucode`; name trimmed
- Test 16: no product → both null, sale object not null

All 16 assertions pass; `npx tsc --noEmit` exits clean.

## Deviations from Plan

### Merge required (worktree divergence)

The worktree branch was based on commit `468c2a7` (Phase 5), before Phase 6 commits added `hotmart.ts` and `check-hotmart-mapping.mjs`. A `git merge master` was performed before Task 2 to bring those files into scope. This is infrastructure deviation, not a logic deviation — no plan content was altered.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or RLS changes introduced. `product_id`/`product_name` are commercial product names, not PII.

## Self-Check: PASSED

- [x] `supabase/migrations/0003_sales_product.sql` exists in worktree
- [x] Commit `6abdb80` exists
- [x] Commit `ab15623` exists
- [x] `grep -c product_id` in migration >= 3: PASS
- [x] `grep -c IF NOT EXISTS` in migration >= 4: PASS
- [x] `node scripts/check-hotmart-mapping.mjs` → ALL HOTMART MAPPING CHECKS PASSED
- [x] `npx tsc --noEmit` → no errors
