---
phase: 9
plan: 03
subsystem: Métricas
tags:
  - api
  - metrics
affects:
  - src/lib/metrics.ts
---

# Phase 9: Cálculo de Faturamento Líquido (Dashboard)

## Goal
Usar o `net_revenue` da tabela `sales` (se disponível) para o cálculo final do `netRevenue`. Se não estiver disponível (ex: importações do histórico passadas ou API de histórico que não proveu), aplicar o desconto aproximado de 9.9%.

## Context
Atualmente, no dashboard, `netRevenue = grossRevenue`.
Com a fase 9, o `netRevenue` deve ser a soma dos valores líquidos.

## Proposed Changes

### src/lib/metrics.ts
<task type="execute" autonomous="true">
<read_first>
- `src/lib/metrics.ts`
</read_first>

<action>
Altere a função `calculateMetrics` para calcular o `netRevenue` corretamente.

1. Altere `getPriceInBRL` ou crie uma função `getNetPriceInBRL`:
```typescript
  function getNetPriceInBRL(sale: any) {
    let net = sale.net_revenue !== null && sale.net_revenue !== undefined 
      ? Number(sale.net_revenue) 
      : Number(sale.price) * 0.901; // Fallback de 9.9% de taxa

    const currency = sale.currency || 'BRL';
    const rate = rates[currency];
    if (rate && rate > 0) {
      return net / rate;
    }
    return net;
  }
```

2. Atualize o cálculo das variáveis globais. O `grossRevenue` continua usando `getPriceInBRL` (com o preço bruto para manter a métrica de "Faturamento Total"), mas o `netRevenue` agora deve somar usando `getNetPriceInBRL`:
```typescript
  const netRevenue = approvedSales.reduce((acc, sale) => acc + getNetPriceInBRL(sale), 0);
```

3. No `campaignStats`, vamos gravar o `netRevenue` e usar o lucro em cima do netRevenue.
```typescript
  // Adicione a tipagem ou inicialização do netRevenue no stats
  if (!campaignStats[cid]) {
    campaignStats[cid] = {
      spend: 0,
      impressions: 0,
      clicks: 0,
      salesCount: 0,
      grossRevenue: 0,
      netRevenue: 0, // NEW
    };
  }
  
  // Dentro do loop forEach das sales:
  campaignStats[cid].grossRevenue += getPriceInBRL(sale);
  campaignStats[cid].netRevenue += getNetPriceInBRL(sale); // NEW

  // No map final das campaigns:
  const campaigns = Object.values(campaignStats).map(c => {
    const cNetRevenue = c.netRevenue; // Usar o novo netRevenue
    const cProfit = cNetRevenue - c.spend;
    // ...
```
</action>

<acceptance_criteria>
- A função `calculateMetrics` possui a lógica de extrair `net_revenue` ou usar o fallback de 0.901.
- `netRevenue` global é calculado corretamente.
- `campaignStats` inclui e propaga `netRevenue` para seus cálculos de ROI, ROAS, Lucro por campanha.
</acceptance_criteria>
</task>
