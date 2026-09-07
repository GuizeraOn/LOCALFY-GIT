---
wave: 2
depends_on: [01-PLAN.md]
files_modified:
  - "src/lib/metrics.ts"
  - "src/app/api/metrics/route.ts"
autonomous: true
requirements_addressed:
  - CALC-01
  - CALC-02
  - CALC-03
  - CALC-04
---

# Plan 02: Core Metrics API

## Objective
Criar o endpoint da API e os cálculos para retornar as métricas globais e por campanha consolidadas.

## Context & Rationale
- **CALC-01 a CALC-04**: Faturamento Bruto, Faturamento Líquido, Lucro, ROAS, ROI, CPA.
- **D-01**: Faturamento Líquido abate uma % fixa (configurável via env var, default 10%).
- **D-02**: Custos extras são lidos da tabela `expenses` e abatidos do lucro global.
- **D-03**: Vendas sem UTM de campanha são contabilizadas apenas no Global. Na tabela por campanha, apenas vendas rastreadas são calculadas contra os gastos de ads daquela campanha.

## Tasks

<task>
  <description>Criar lógica de cálculo em src/lib/metrics.ts</description>
  <action>
    Criar `src/lib/metrics.ts`. 
    Definir funções utilitárias ou uma função principal `calculateMetrics(sales, adSpends, expenses)`:
    - `sales` deve fazer um join com `sale_utms` (para ter a `utm_campaign`).
    - **Global**: 
      - Faturamento Bruto = soma de `sales.price` onde `status == 'APPROVED'`
      - Faturamento Líquido = Bruto * (1 - FEE_PERCENTAGE)
      - Gastos de Ads = soma de `adSpends.spend`
      - Despesas Extras = soma de `expenses.amount`
      - Lucro = Faturamento Líquido - Gastos de Ads - Despesas Extras
      - ROAS = Faturamento Líquido / (Gastos de Ads > 0 ? Gastos de Ads : 1)
      - ROI = (Lucro / (Gastos de Ads + Despesas Extras)) * 100
      - CPA = (Gastos de Ads) / (Qtd vendas aprovadas)
    - **Por Campanha**:
      - Agrupar `adSpends` por `campaign_id` / `campaign_name`.
      - Agrupar `sales` por `utm_campaign` (só aprovadas).
      - Calcular métricas isoladas por campanha ignorando despesas extras (que são globais).
  </action>
  <read_first>
    - src/lib/supabase-server.ts
  </read_first>
  <acceptance_criteria>
    - `cat src/lib/metrics.ts` exporta as funções de agregação
  </acceptance_criteria>
</task>

<task>
  <description>Criar Endpoint de Métricas</description>
  <action>
    Criar `src/app/api/metrics/route.ts` (GET):
    1. Recebe `startDate` e `endDate` por query string.
    2. Busca `sales` filtrando por `created_at` no intervalo (fazendo join com `sale_utms`).
    3. Busca `ad_spend` filtrando por `date` no intervalo.
    4. Busca `expenses` filtrando por `date` no intervalo.
    5. Passa os dados para a função do `metrics.ts`.
    6. Retorna `{ global: {...}, campaigns: [...] }`.
  </action>
  <read_first>
    - src/lib/metrics.ts
  </read_first>
  <acceptance_criteria>
    - `grep -q calculateMetrics src/app/api/metrics/route.ts` tem saída 0
  </acceptance_criteria>
</task>

## Verification
- Chamar o endpoint passando datas válidas e garantir que os cálculos batem e a estrutura do payload retornado separa corretamente Global e Campaigns.
