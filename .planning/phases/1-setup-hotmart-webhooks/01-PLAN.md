---
wave: 1
depends_on: []
files_modified:
  - "supabase/migrations/0000_initial_schema.sql"
  - "supabase/config.toml"
autonomous: true
requirements_addressed:
  - DB-01
  - DB-02
  - DB-03
---

# Plan 01: Supabase Database Schema

## Objective
Configurar o schema inicial do banco de dados no Supabase para armazenar as vendas da Hotmart, gastos do Facebook Ads e a tabela separada para UTMs.

## Context & Rationale
- **DB-01, DB-02, DB-03**: Precisamos das tabelas para vendas, histórico de gastos e consolidação.
- **D-01**: Parâmetros UTM serão salvos em uma tabela separada (`sale_utms`) que referencia a tabela de vendas.
- **D-03, D-04**: O `transaction_id` será a chave primária de vendas, e o webhook deve realizar um `UPSERT`.

## Tasks

<task>
  <description>Criar o arquivo de migração inicial do Supabase</description>
  <action>
    Criar o arquivo `supabase/migrations/0000_initial_schema.sql` com as seguintes tabelas:
    - `sales`: `transaction_id` (PK, text), `status` (text), `price` (numeric), `created_at` (timestamp), `updated_at` (timestamp).
    - `sale_utms`: `transaction_id` (PK, text, FK para sales), `utm_source` (text), `utm_campaign` (text, armazena o nome da campanha conforme D-02), `utm_medium` (text), `utm_content` (text), `utm_term` (text).
    - `ad_spend`: `id` (PK, uuid), `date` (date), `campaign_id` (text), `campaign_name` (text), `spend` (numeric), `impressions` (integer), `clicks` (integer).
  </action>
  <read_first>
    - .planning/phases/1-setup-hotmart-webhooks/01-CONTEXT.md
  </read_first>
  <acceptance_criteria>
    - `cat supabase/migrations/0000_initial_schema.sql` contém `CREATE TABLE sales`
    - `cat supabase/migrations/0000_initial_schema.sql` contém `CREATE TABLE sale_utms`
  </acceptance_criteria>
</task>

<task>
  <description>[BLOCKING] Aplicar o schema no banco de dados local do Supabase</description>
  <action>
    Executar o push do schema no ambiente local.
    Isso é mandatório, pois o backend (webhook) necessita que o schema exista para gerar os tipos (caso use TypeScript) ou apenas para inserir os dados.
    Comando: `supabase start` para subir os containers locais (se ainda não iniciados), seguido de `supabase db push` (ou deixar as migrations rodarem sozinhas ao iniciar). Como não temos tty, certifique-se de que o comando de apply execute sem pedir input.
  </action>
  <read_first>
    - supabase/migrations/0000_initial_schema.sql
  </read_first>
  <acceptance_criteria>
    - `supabase status` (ou semelhante) mostra que o banco está rodando sem erros.
  </acceptance_criteria>
</task>

## Verification

**must_haves:**
- A tabela `sales` deve existir e usar `transaction_id` como chave.
- A tabela `sale_utms` deve existir referenciando `sales`.

**verification_steps:**
- Rodar query: `SELECT table_name FROM information_schema.tables WHERE table_schema='public';` e checar se contém `sales` e `sale_utms`.
