---
wave: 1
depends_on: []
files_modified:
  - "supabase/migrations/0002_expenses_table.sql"
autonomous: true
requirements_addressed:
  - DB-03
---

# Plan 01: Expenses Schema

## Objective
Criar a tabela `expenses` no banco de dados para armazenar custos fixos e despesas extras inseridas manualmente, o que permitirá calcular o lucro real.

## Context & Rationale
- **D-02**: Decidimos ter uma tela de input na UI futuramente para lançar custos. A engine de métricas precisa deduzir esses valores do lucro.
- A tabela armazenará as despesas associadas a uma data ou período para serem somadas.

## Tasks

<task>
  <description>Criar a tabela de despesas extras</description>
  <action>
    Criar a migration `supabase/migrations/0002_expenses_table.sql`.
    A tabela `public.expenses` deve conter:
    - `id` (UUID, primary key)
    - `date` (DATE, not null)
    - `description` (TEXT, not null)
    - `amount` (NUMERIC, not null)
    - `created_at` (TIMESTAMP)
  </action>
  <read_first>
    - supabase/migrations/0000_initial_schema.sql
  </read_first>
  <acceptance_criteria>
    - `cat supabase/migrations/0002_expenses_table.sql` contém `CREATE TABLE public.expenses`
  </acceptance_criteria>
</task>

<task>
  <description>[BLOCKING] Aplicar schema local (se Docker disponível)</description>
  <action>
    Se houver Docker, rodar `supabase db push` ou equivalente. Se não, marcar como concluído (ignorar no ambiente local atual).
  </action>
  <acceptance_criteria>
    - Task completada.
  </acceptance_criteria>
</task>

## Verification
- Garantir que o script SQL foi gerado corretamente.
