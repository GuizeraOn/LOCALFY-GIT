---
wave: 1
depends_on: []
files_modified:
  - "src/app/api/sync/hotmart/route.ts"
  - "src/components/DashboardHeader.tsx"
autonomous: true
requirements_addressed:
  - HOT-04
---

# Plan 01: Importação de Histórico Hotmart

## Objective
Criar uma rota API para consultar o histórico de vendas via API REST da Hotmart e adicionar um botão no `DashboardHeader` para disparar essa sincronização manualmente.

## Context & Rationale
- O webhook (Phase 1) só captura vendas futuras. Para as métricas serem úteis imediatamente, precisamos puxar as vendas que já ocorreram.
- A Hotmart possui uma API REST (https://developers.hotmart.com) para listar transações.
- A sincronização usará `UPSERT` no banco (mesma lógica do webhook) baseado na transação, para garantir idempotência (rodar várias vezes não duplica).

## Component API (interface pública)
- Rota POST: `/api/sync/hotmart` (aceita startDate e endDate)
- Requisições externas para `https://developers.hotmart.com/payments/api/v1/sales/history` usando `HOTMART_CLIENT_ID`, `HOTMART_CLIENT_SECRET`, `HOTMART_BASIC_TOKEN` (ou Bearer Token gerado via `/security/oauth/token`).

## Tasks

<task>
  <description>Criar rota de sync da Hotmart</description>
  <action>
    Criar `src/app/api/sync/hotmart/route.ts` que:
    1. Lê `startDate` e `endDate` do body.
    2. Lê `process.env.HOTMART_ACCESS_TOKEN` (por simplicidade inicial, vamos usar um Personal Access Token gerado no painel da Hotmart, se aplicável, ou OAuth Client Credentials). Para facilitar, vamos assumir que o usuário vai configurar um Token de Autenticação (`HOTMART_ACCESS_TOKEN`) no `.env.local`.
    3. Faz fetch para a API de vendas da Hotmart passando `start_date` e `end_date` (formato timestamp em ms).
    4. Mapeia os dados retornados para o formato que nosso Supabase aceita.
    5. Insere os dados na tabela `sales` e os UTMs em `sale_utms` usando o `supabaseServerClient`.
  </action>
  <acceptance_criteria>
    - `src/app/api/sync/hotmart/route.ts` existe, tem `force-dynamic` e faz fetch na API da Hotmart.
  </acceptance_criteria>
</task>

<task>
  <description>Adicionar botão de Sync Hotmart no DashboardHeader</description>
  <action>
    Modificar `src/components/DashboardHeader.tsx`:
    - Adicionar um estado `isSyncingHotmart`.
    - Criar função `handleHotmartSync` que chama `POST /api/sync/hotmart` com as datas selecionadas.
    - Adicionar o botão "Sync Hotmart" ao lado do botão "Sync Facebook".
  </action>
  <read_first>
    - src/components/DashboardHeader.tsx
  </read_first>
  <acceptance_criteria>
    - O DashboardHeader possui um botão "Sync Hotmart".
  </acceptance_criteria>
</task>

## Verification
- Ao clicar no botão "Sync Hotmart", uma requisição é feita para `/api/sync/hotmart`.
- O banco de dados recebe as vendas passadas sem duplicar dados já existentes.
