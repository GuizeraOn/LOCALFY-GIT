---
phase: 8
plan: 03
subsystem: Métricas
tags:
  - api
  - metrics
affects:
  - src/lib/metrics.ts
  - src/app/api/metrics/route.ts
---

# Phase 8: Conversão de Moedas (Dashboard)

## Goal
Buscar taxas de câmbio atualizadas na API `open.er-api.com` e usá-las para converter as moedas locais das vendas para a moeda base (BRL) ao calcular as métricas.

## Context
Como temos vendas em moedas variadas (ex: 19000 CLP, 300 MXN, 700 UYU) no banco, não podemos mais somar a coluna `price` diretamente para calcular o Faturamento e Lucro. 
Na rota `GET /api/metrics`, antes de passar as vendas para a função `calculateMetrics`, faremos uma chamada HTTP para uma API pública (e gratuita, sem chave de API) que nos dá as cotações em relação à nossa moeda base.

A API é: `https://open.er-api.com/v6/latest/BRL`
O JSON de resposta tem a propriedade `rates`, por exemplo:
```json
{
  "rates": {
    "BRL": 1,
    "CLP": 182.12,
    "MXN": 3.29,
    "USD": 0.19
  }
}
```
Isso significa que 1 BRL = 182.12 CLP. 
Então, para converter um valor de CLP para BRL: `valorBRL = valorCLP / rateCLP`.

## Proposed Changes

### src/app/api/metrics/route.ts
<task type="execute" autonomous="true">
<read_first>
- `src/app/api/metrics/route.ts`
</read_first>

<action>
Logo antes de chamar `calculateMetrics(sales || [], adSpends || [], expenses || [])`, adicione o fetch das taxas de câmbio com cache (revalidate 3600):

```typescript
let rates: Record<string, number> = { BRL: 1 };
try {
  const erRes = await fetch('https://open.er-api.com/v6/latest/BRL', { next: { revalidate: 3600 } });
  if (erRes.ok) {
    const erData = await erRes.json();
    if (erData && erData.rates) {
      rates = erData.rates;
    }
  }
} catch (e) {
  console.error('Falha ao buscar taxas de câmbio', e);
}
```
E então passe esse objeto de taxas de câmbio para a função `calculateMetrics`:
```typescript
const metrics = calculateMetrics(sales || [], adSpends || [], expenses || [], rates);
```
</action>

<acceptance_criteria>
- A rota faz o fetch de `https://open.er-api.com/v6/latest/BRL`.
- Um bloco try/catch existe para não falhar a API inteira caso o serviço de câmbio caia (faz fallback usando BRL=1 e omitindo as outras, ou podemos ignorar).
- A chamada passa `rates` como o quarto parâmetro para `calculateMetrics`.
</acceptance_criteria>
</task>

### src/lib/metrics.ts
<task type="execute" autonomous="true">
<read_first>
- `src/lib/metrics.ts`
</read_first>

<action>
Na assinatura de `calculateMetrics`, adicione o parâmetro de taxas:
```typescript
export function calculateMetrics(
  sales: any[], 
  adSpends: any[], 
  expenses: any[], 
  rates: Record<string, number> = { BRL: 1 }
)
```

No cálculo do `grossRevenue` e `campaignStats`, atualmente há `Number(sale.price)`. Altere para converter o valor para a moeda base.
Crie uma função auxiliar local dentro do arquivo ou use inline:
```typescript
function getPriceInBRL(sale: any, rates: Record<string, number>) {
  const price = Number(sale.price);
  const currency = sale.currency || 'BRL';
  const rate = rates[currency];
  // Se a taxa não for encontrada, assumimos que é 1 (mesma moeda).
  if (rate && rate > 0) {
    return price / rate;
  }
  return price;
}
```

E altere o `grossRevenue`:
```typescript
const grossRevenue = approvedSales.reduce((acc, sale) => acc + getPriceInBRL(sale, rates), 0);
```

E também dentro do map do `campaignStats`:
```typescript
approvedSales.forEach(sale => {
  const cid = sale.sale_utms?.utm_campaign;
  if (cid && campaignStats[cid]) {
    campaignStats[cid].salesCount += 1;
    campaignStats[cid].grossRevenue += getPriceInBRL(sale, rates);
  }
});
```
</action>

<acceptance_criteria>
- A função `calculateMetrics` aceita o quarto parâmetro `rates`.
- A propriedade `currency` de cada `sale` é levada em conta usando o objeto `rates` para normalizar o preço (`price / rates[currency]`).
- Faturamento não sofre mais a inflação das moedas locais.
</acceptance_criteria>
</task>
