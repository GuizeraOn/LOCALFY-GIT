---
phase: 10
plan: 04
subsystem: Dashboard UI
tags:
  - react
  - recharts
affects:
  - src/app/dashboard/page.tsx
---

# Phase 10: Interface Avançada (UI)

## Goal
Implementar os novos cards de saúde, funil e gráficos analíticos solicitados.

## Context
O usuário quer visualizar as métricas avançadas que preparamos no backend (Phase 10 Plan 3). Isso requer muitos novos cards na tela inicial. Devido à limitação do Tailwind v4 + Next 16 (incompatível com shadcn), construiremos os componentes manualmente usando html semântico e tailwind classes, ou usando Recharts para os gráficos.

## Proposed Changes

### src/app/dashboard/page.tsx
<task type="execute" autonomous="true">
<read_first>
- `src/app/dashboard/page.tsx`
- `src/components/MetricsChart.tsx`
</read_first>

<action>
1. Atualize a inferência de tipo do `data` para suportar o novo formato que o `metrics.ts` retorna (`data.global`, `data.charts`).
2. Adicione uma nova seção de "Funil de Tráfego" renderizando cards para `clicks`, `vendasIniciadas`, `vendasAprovadas` e `CPA`.
3. Adicione uma nova seção "Saúde do Negócio" renderizando `vendasPendentes`, `refundsValue`, `refundRate`, `chargebacksValue`, `chargebackRate`.
4. Renderize gráficos novos importando e configurando o `Recharts` (já instalado e usado em `MetricsChart.tsx`). Crie gráficos (ex: PieChart para `salesByPaymentType`, BarChart para `salesByProduct` e `salesByHour`). Você pode componentizar isso em `src/components/AdvancedCharts.tsx` para manter a página limpa.
</action>

<acceptance_criteria>
- A tela exibe as novas seções de Funil e Saúde do Negócio.
- Os gráficos de pizza/barras são renderizados.
</acceptance_criteria>
</task>
