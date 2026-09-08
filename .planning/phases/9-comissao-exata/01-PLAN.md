---
phase: 9
plan: 01
subsystem: Database
tags:
  - sql
  - migration
affects:
  - supabase/migrations/
---

# Phase 9: Comissão Exata (Faturamento Líquido)

## Goal
Adicionar a coluna `net_revenue` na tabela `sales` para gravar a comissão exata recebida do produtor em cada venda.

## Context
Atualmente só gravamos o `price` (Faturamento Bruto, o que o cliente pagou). A Hotmart cobra taxas (geralmente em torno de 9.9% + fixo) que são devolvidas como comissão no payload (`hotmart_fee` ou `commission_as`).
Precisamos de um campo para gravar o valor líquido exato que cai no bolso do usuário.

## Proposed Changes

### supabase/migrations/0004_add_net_revenue_to_sales.sql
Adicionar uma nova coluna `net_revenue` com tipo NUMERIC que permite NULL.

<task type="execute" autonomous="true">
<read_first>
- `supabase/migrations/0000_initial_schema.sql` (para ver o schema da tabela sales)
</read_first>

<action>
Criar um novo arquivo `supabase/migrations/0004_add_net_revenue_to_sales.sql` contendo o seguinte SQL:
```sql
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS net_revenue NUMERIC;
```
</action>

<acceptance_criteria>
- O arquivo `supabase/migrations/0004_add_net_revenue_to_sales.sql` existe.
- O arquivo contém o comando `ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS net_revenue NUMERIC;`.
</acceptance_criteria>
</task>

<schema_push_requirement>
**[BLOCKING] Schema Push Required**

O usuário não tem o Supabase CLI configurado localmente. Esta migration deve ser aplicada manualmente pelo usuário no painel web do Supabase via SQL Editor.
</schema_push_requirement>

<task type="execute" autonomous="false">
<read_first>
- `supabase/migrations/0004_add_net_revenue_to_sales.sql`
</read_first>

<action>
Pare e peça para o usuário rodar o SQL do arquivo `0004_add_net_revenue_to_sales.sql` no painel web do Supabase (SQL Editor).
</action>

<acceptance_criteria>
- O usuário confirmou que aplicou a migration no painel do Supabase.
</acceptance_criteria>
</task>
