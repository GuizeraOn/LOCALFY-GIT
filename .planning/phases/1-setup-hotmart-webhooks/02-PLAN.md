---
wave: 2
depends_on:
  - 01-PLAN.md
files_modified:
  - "src/app/api/webhook/hotmart/route.ts"
  - "src/lib/supabase-server.ts"
autonomous: true
requirements_addressed:
  - HOT-01
  - HOT-02
  - HOT-03
---

# Plan 02: Hotmart Webhook Endpoint

## Objective
Criar a rota Next.js App Router (backend) para receber o webhook da Hotmart, processar os eventos e salvar no Supabase fazendo UPSERT para garantir idempotência.

## Context & Rationale
- O sistema usará Node.js (Next.js App Router `route.ts`).
- **HOT-01, HOT-02**: Eventos `PURCHASE_APPROVED`, `PURCHASE_REFUNDED`, `PURCHASE_CANCELED` devem ser manipulados.
- **HOT-03, D-01, D-02**: Parâmetros UTM devem ser extraídos e salvos na tabela `sale_utms`.
- **D-03, D-04**: Devemos garantir idempotência através de UPSERT (usando `transaction_id`).

## Tasks

<task>
  <description>Criar cliente Supabase para o backend</description>
  <action>
    Criar o arquivo `src/lib/supabase-server.ts` que exporta uma função para instanciar o cliente do Supabase usando a service_role key, permitindo ignorar RLS no backend (já que é um webhook do servidor).
    Importar de `@supabase/supabase-js`.
  </action>
  <read_first>
    - .env.example
  </read_first>
  <acceptance_criteria>
    - `cat src/lib/supabase-server.ts` contém `createClient`
  </acceptance_criteria>
</task>

<task>
  <description>Criar endpoint do Webhook</description>
  <action>
    Criar `src/app/api/webhook/hotmart/route.ts`.
    Implementar o método `POST`.
    1. Validar o `htoken` no header (se configurado na env).
    2. Fazer o parse do body JSON.
    3. Tratar o UPSERT na tabela `sales`: `{ transaction_id, status, price: data.price, updated_at: now }`.
    4. Tratar o UPSERT na tabela `sale_utms`: `{ transaction_id, utm_source, utm_campaign, utm_medium, utm_content }`.
    5. Retornar HTTP 200 independente do evento processado ou ignorado.
  </action>
  <read_first>
    - src/lib/supabase-server.ts
  </read_first>
  <acceptance_criteria>
    - `cat src/app/api/webhook/hotmart/route.ts` contém `export async function POST`
    - `grep -q upsert src/app/api/webhook/hotmart/route.ts` tem saída 0 (indica uso de upsert)
  </acceptance_criteria>
</task>

## Verification

**must_haves:**
- A rota deve responder HTTP 200.
- A rota deve processar corretamente as transições de status da Hotmart usando a chave primária `transaction_id`.

**verification_steps:**
- Escrever um pequeno script ou usar curl para simular um POST no webhook.
- Checar no Supabase se o registro foi criado corretamente.
