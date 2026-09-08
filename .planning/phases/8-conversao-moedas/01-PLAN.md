---
phase: 8
plan: 01
subsystem: Database
tags:
  - sql
  - migration
affects:
  - supabase/migrations/
---

# Phase 8: Conversão de Moedas

## Goal
Adicionar a coluna `currency` na tabela `sales` para preparar o terreno para cálculos multimoeda.

## Context
Atualmente, a tabela `sales` só armazena o valor numérico (`price`), mas a Hotmart processa transações em várias moedas (ex: CLP, MXN, UYU, BRL). Precisamos de uma nova coluna para gravar qual foi a moeda de cada venda. O valor default será 'BRL' para as vendas já existentes.

## Proposed Changes

### supabase/migrations/0003_add_currency_to_sales.sql
Adicionar uma nova coluna `currency` com tipo texto.

<task type="execute" autonomous="true">
<read_first>
- `supabase/migrations/0000_initial_schema.sql` (para ver o schema da tabela sales)
</read_first>

<action>
Criar um novo arquivo `supabase/migrations/0003_add_currency_to_sales.sql` contendo o seguinte SQL:
```sql
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL';
```
</action>

<acceptance_criteria>
- O arquivo `supabase/migrations/0003_add_currency_to_sales.sql` existe.
- O arquivo contém o comando `ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL';`.
</acceptance_criteria>
</task>

<schema_push_requirement>
**[BLOCKING] Schema Push Required**

O usuário não tem o Supabase CLI configurado localmente. Esta migration deve ser aplicada manualmente pelo usuário no painel web do Supabase via SQL Editor.
A tarefa abaixo vai instruir o usuário.
</schema_push_requirement>

<task type="execute" autonomous="false">
<read_first>
- `supabase/migrations/0003_add_currency_to_sales.sql`
</read_first>

<action>
Pare e peça para o usuário rodar o SQL do arquivo `0003_add_currency_to_sales.sql` no painel web do Supabase (SQL Editor).
</action>

<acceptance_criteria>
- O usuário confirmou que aplicou a migration no painel do Supabase.
</acceptance_criteria>
</task>
