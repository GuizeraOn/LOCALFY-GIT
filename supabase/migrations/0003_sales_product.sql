-- Phase 07 / UI-05: Add product_id and product_name columns to sales table
-- Both columns are nullable: existing rows (imported in Phase 6) and webhook sales
-- without product data will remain NULL until backfill via "Importar Histórico".

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS product_id TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS product_name TEXT;

CREATE INDEX IF NOT EXISTS sales_product_id_idx ON public.sales (product_id);
CREATE INDEX IF NOT EXISTS sales_product_id_created_at_idx ON public.sales (product_id, created_at);
