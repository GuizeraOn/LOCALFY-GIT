---
wave: 2
depends_on: [01-PLAN.md]
files_modified:
  - "src/app/page.tsx"
  - "src/components/MetricCards.tsx"
  - "src/components/MetricsChart.tsx"
  - "src/components/CampaignTable.tsx"
autonomous: true
requirements_addressed:
  - UI-01
  - UI-02
  - UI-03
---

# Plan 02: Dashboard Content & SWR Integration

## Objective
Implementar a exibição de dados chamando a API de métricas via SWR e preenchendo Cards, Gráficos e a Tabela de Campanhas.

## Context & Rationale
- **UI-01, UI-02, UI-03**: O dashboard principal deve exibir o status consolidado do negócio.
- Utilizaremos a biblioteca SWR para revalidação rápida quando as datas mudarem ou a sincronização com o FB ocorrer.
- Os componentes devem usar `bg-zinc-900` para cards conforme o UI-SPEC.

## Tasks

<task>
  <description>Criar página principal com fetching SWR</description>
  <action>
    Transformar `src/app/page.tsx` num Client Component (`"use client"`).
    1. Gerenciar o estado de `dateRange` (ex: últimos 7 dias por padrão).
    2. Usar o hook `useSWR(\`/api/metrics?startDate=\${start}&endDate=\${end}\`, fetcher)` para buscar os dados.
    3. Passar os dados para os componentes filhos (Cards, Chart, Table).
    4. Passar o método `mutate` do SWR para o Header, permitindo dar re-fetch automático logo após a sincronização do Facebook ser concluída.
  </action>
  <read_first>
    - src/app/page.tsx
  </read_first>
  <acceptance_criteria>
    - `grep -q "useSWR" src/app/page.tsx` tem saída 0.
  </acceptance_criteria>
</task>

<task>
  <description>Criar Componente de Cards de Métricas</description>
  <action>
    Criar `src/components/MetricCards.tsx`.
    Receber `metrics.global` como prop.
    Renderizar 6 cards lado a lado usando o grid responsivo (`grid-cols-1 md:grid-cols-3 lg:grid-cols-6`):
    - Faturamento Bruto
    - Faturamento Líquido
    - Gastos Ads
    - Lucro Líquido (Verde se > 0)
    - ROAS
    - ROI
    Usar formatação `Intl.NumberFormat` para reais (BRL).
  </action>
  <acceptance_criteria>
    - O arquivo exporta o componente e utiliza o `Card` do shadcn.
  </acceptance_criteria>
</task>

<task>
  <description>Criar Componente de Gráfico de Desempenho</description>
  <action>
    Criar `src/components/MetricsChart.tsx`.
    Como a nossa API retorna totais, podemos exibir um gráfico de barras comparando "Faturamento Líquido vs Gastos vs Lucro" consolidado, ou detalhado se a API tivesse array temporal. 
    Para a v1, use um BarChart do Recharts exibindo lado a lado as métricas globais.
  </action>
  <acceptance_criteria>
    - `grep -q "BarChart" src/components/MetricsChart.tsx` tem saída 0.
  </acceptance_criteria>
</task>

<task>
  <description>Criar Tabela de Campanhas</description>
  <action>
    Criar `src/components/CampaignTable.tsx`.
    Receber `metrics.campaigns` como prop.
    Exibir uma tabela (usando Table do shadcn) com as colunas: Campanha, Gastos, Vendas, Faturamento, Lucro, ROAS e CPA.
    Adicionar um empty state caso `campaigns.length === 0`.
  </action>
  <acceptance_criteria>
    - O arquivo usa os componentes `Table, TableHeader, TableRow, TableCell`.
  </acceptance_criteria>
</task>

## Verification
- Ao alterar as datas no date picker, a requisição SWR deve ser re-disparada e atualizar a UI.
- Ao clicar em "Sync", os dados recarregam automaticamente.
