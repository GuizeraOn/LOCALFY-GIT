---
phase: 10
plan: 01
subsystem: Database
tags:
  - sql
  - migration
affects:
  - supabase/migrations/
---

# Phase 10: Advanced Analytics (Schema)

## Goal
Adicionar as colunas necessárias na tabela `sales` para comportar as novas quebras analíticas (país, tipo de pagamento, parâmetros de rastreio).

## Context
Para visualizar Vendas por País, Tipo de Pagamento (Cartão, Pix, Boleto) e rastreamento extra (`src`), precisamos persistir esses dados. O status de Refund e Chargeback já são cobertos pela coluna `status` (que recebe os eventos do webhook como `REFUNDED` e `CHARGEBACK`), mas precisamos salvar as novas colunas no upsert.

## Proposed Changes

### supabase/migrations/0005_add_analytics_columns.sql
<task type="execute" autonomous="true">
<read_first>
- `supabase/migrations/0000_initial_schema.sql`
</read_first>

<action>
Crie o arquivo `supabase/migrations/0005_add_analytics_columns.sql` contendo:
```sql
ALTER TABLE public.sales 
  ADD COLUMN IF NOT EXISTS payment_type TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS hsrc TEXT;
```
</action>

<acceptance_criteria>
- O arquivo `supabase/migrations/0005_add_analytics_columns.sql` existe com o SQL correto.
</acceptance_criteria>
</task>

<schema_push_requirement>
**[BLOCKING] Schema Push Required**

O usuário precisa rodar essa migration manualmente.
</schema_push_requirement>

<task type="execute" autonomous="false">
<read_first>
- `supabase/migrations/0005_add_analytics_columns.sql`
</read_first>

<action>
Peça para o usuário rodar o SQL do arquivo `0005_add_analytics_columns.sql` no painel web do Supabase.
</action>
<acceptance_criteria>
- O usuário confirmou.
</acceptance_criteria>
</task>
