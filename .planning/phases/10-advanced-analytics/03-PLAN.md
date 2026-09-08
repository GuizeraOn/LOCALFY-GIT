---
phase: 10
plan: 03
subsystem: Métricas
tags:
  - typescript
  - calc
affects:
  - src/lib/metrics.ts
---

# Phase 10: Cálculos de Funil e Saúde (Metrics Engine)

## Goal
Expandir o motor de métricas para retornar todos os KPIs de tráfego, reembolsos e saúde solicitados no PRD.

## Proposed Changes

### src/lib/metrics.ts
<task type="execute" autonomous="true">
<read_first>
- `src/lib/metrics.ts`
</read_first>

<action>
1. Atualize o retorno da função `calculateMetrics` para incluir novas métricas globais:
```typescript
const globalMetrics = {
  // Já existentes: grossRevenue, netRevenue, totalAdSpend, profit, roas, roi, cpa, margin...
  
  // Funil de Tráfego (FB Ads)
  clicks: adSpends.reduce((acc, ad) => acc + Number(ad.clicks), 0),
  impressions: adSpends.reduce((acc, ad) => acc + Number(ad.impressions), 0),
  pageviews: adSpends.reduce((acc, ad) => acc + Number(ad.pageviews || 0), 0),
  initiateCheckouts: adSpends.reduce((acc, ad) => acc + Number(ad.initiate_checkouts || 0), 0),
  vendasIniciadas: sales.length, // Todas as transações recebidas (incluindo BILLET_PRINTED)
  vendasAprovadas: approvedSales.length, // Apenas APPROVED/COMPLETED
  
  // Saúde do Negócio
  vendasPendentes: sales.filter(s => s.status === 'BILLET_PRINTED' || s.status === 'WAITING_PAYMENT').length,
  refundsValue: sales.filter(s => s.status === 'REFUNDED').reduce((acc, s) => acc + getPriceInBRL(s), 0),
  refundsCount: sales.filter(s => s.status === 'REFUNDED').length,
  chargebacksValue: sales.filter(s => s.status === 'CHARGEBACK').reduce((acc, s) => acc + getPriceInBRL(s), 0),
  chargebacksCount: sales.filter(s => s.status === 'CHARGEBACK').length,
  unitsSold: approvedSales.length,
};
globalMetrics.refundRate = globalMetrics.vendasAprovadas > 0 ? (globalMetrics.refundsCount / globalMetrics.vendasAprovadas) * 100 : 0;
globalMetrics.chargebackRate = globalMetrics.vendasAprovadas > 0 ? (globalMetrics.chargebacksCount / globalMetrics.vendasAprovadas) * 100 : 0;
```

2. Gráficos (Quebras). Crie e retorne os seguintes agrupamentos processando `approvedSales`:
- `salesByProduct`: agrupar soma de faturamento (grossRevenue) por `product_name`.
- `salesByPaymentType`: agrupar soma de faturamento por `payment_type` (seja criativo mapeando null para 'Desconhecido').
- `salesByCountry`: agrupar soma de faturamento por `country`.
- `salesByDayOfWeek`: iterar `created_at` (usando Date) e agrupar faturamento por `getDay()`.
- `salesByHour`: iterar `created_at` e agrupar faturamento por `getHours()`.
- `approvalRateByMethod`: agrupar vendas totais (`sales`) por `payment_type` e calcular a porcentagem de status = 'APPROVED'.

3. Retorne tudo isso num objeto unificado no final da função:
```typescript
return {
  global: globalMetrics,
  campaigns,
  charts: {
    salesByProduct,
    salesByPaymentType,
    salesByCountry,
    salesByDayOfWeek,
    salesByHour,
    approvalRateByMethod
  }
};
```
Você precisará adequar os tipos do retorno.
</action>

<acceptance_criteria>
- A função retorna a estrutura `global`, `campaigns` e `charts`.
- Todos os cálculos descritos na action estão mapeados.
</acceptance_criteria>
</task>
