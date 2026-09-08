---
phase: 9
plan: 02
subsystem: Backend Sincronização
tags:
  - typescript
  - api
  - hotmart
affects:
  - src/lib/hotmart.ts
  - src/app/api/webhook/hotmart/route.ts
  - src/app/api/sync/hotmart/route.ts
---

# Phase 9: Extração de Comissão (Backend)

## Goal
Extrair o valor líquido da venda (price bruto - taxa da hotmart, ou o valor exato da comissão) e salvá-lo no banco de dados.

## Context
No webhook recebemos o objeto `hotmart_fee` (ex: `{"total":2.18,"base":16381.51...}`).
A comissão do produtor (valor líquido) é o `price.value - hotmart_fee.total`. 
Se por acaso recebemos um array `commissions` com `source === 'PRODUCER'`, pegamos diretamente o valor dele.
No Histórico, pode ser que esse dado falte, então faremos fallback: calcular um desconto padrão de 9.9% + fixo se não encontrarmos nada explícito no JSON, apenas para não quebrar a lógica, ou deixamos null para o frontend fazer o fallback aproximado. Neste caso, é mais seguro salvar NULL e deixar a UI calcular o fallback de ~9.9%.

## Proposed Changes

### src/lib/hotmart.ts
A função `mapHotmartItem` precisa extrair o `net_revenue` e a interface `SaleRow` no endpoint precisa incluir a nova propriedade.

<task type="execute" autonomous="true">
<read_first>
- `src/lib/hotmart.ts`
- `src/app/api/sync/hotmart/route.ts`
</read_first>

<action>
1. Em `src/lib/hotmart.ts`:
Na interface `HotmartSaleRow`, adicione `net_revenue: number | null;`.

Na função `mapHotmartItem`, tente extrair o `net_revenue`:
```typescript
  // Tentativas de pegar a comissão exata
  let netRevenue: number | null = null;
  
  // 1. Array de commissions (Webhook 2.0)
  if (Array.isArray(purchase.commissions)) {
    const prodCommission = purchase.commissions.find((c: any) => c.source === 'PRODUCER');
    if (prodCommission && prodCommission.value !== undefined) {
      netRevenue = Number(prodCommission.value);
    }
  }
  
  // 2. Cálculo usando hotmart_fee (Webhook antigo ou payload mesclado)
  if (netRevenue === null && record.hotmart_fee) {
    const fee = asRecord(record.hotmart_fee);
    if (fee.total !== undefined) {
      netRevenue = price - Number(fee.total);
    }
  }

  // 3. Em casos do History API que retorna só price, deixamos null (será calculado no metrics)
```
Adicione `net_revenue: netRevenue,` ao objeto retornado dentro de `sale`.

2. Em `src/app/api/sync/hotmart/route.ts`:
Na interface `SaleRow`, adicione `net_revenue: number | null;`.
Na criação do array `saleRows`, extraia o `net_revenue`:
```typescript
    const saleRows: SaleRow[] = mapped.map((m) => ({
      transaction_id: m.sale.transaction_id,
      status: m.sale.status,
      price: m.sale.price,
      currency: m.sale.currency,
      net_revenue: m.sale.net_revenue,
      updated_at: updatedAt,
      created_at: m.sale.created_at,
    }));
```
</action>

<acceptance_criteria>
- A interface e o map de `src/lib/hotmart.ts` exportam o `net_revenue`.
- `src/app/api/sync/hotmart/route.ts` envia a propriedade `net_revenue` no `upsert` do Supabase.
</acceptance_criteria>
</task>

### src/app/api/webhook/hotmart/route.ts
Atualizar o webhook para capturar `net_revenue`.

<task type="execute" autonomous="true">
<read_first>
- `src/app/api/webhook/hotmart/route.ts`
</read_first>

<action>
No `POST`, calcule o `net_revenue`:
```typescript
    let netRevenue: number | null = null;
    if (Array.isArray(payload.commissions)) {
      const prodCommission = payload.commissions.find((c: any) => c.source === 'PRODUCER');
      if (prodCommission && prodCommission.value !== undefined) {
        netRevenue = Number(prodCommission.value);
      }
    } else if (payload.hotmart_fee?.total !== undefined) {
      netRevenue = Number(price) - Number(payload.hotmart_fee.total);
    }
```
E adicione ao objeto no `.upsert()`:
```typescript
      .upsert({
        transaction_id: transaction,
        status: status || 'UNKNOWN',
        price: Number(price),
        currency,
        net_revenue: netRevenue,
        updated_at: new Date().toISOString()
      }, { ... });
```
</action>

<acceptance_criteria>
- O webhook tenta extrair `commissions` ou subtrair `hotmart_fee` do preço.
- O upsert envia a coluna `net_revenue`.
</acceptance_criteria>
</task>
