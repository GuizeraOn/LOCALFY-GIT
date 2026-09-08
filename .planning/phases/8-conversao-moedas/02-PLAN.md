---
phase: 8
plan: 02
subsystem: Backend Sincronização
tags:
  - typescript
  - api
  - hotmart
affects:
  - src/lib/hotmart.ts
  - src/app/api/webhook/hotmart/route.ts
---

# Phase 8: Conversão de Moedas (Backend)

## Goal
Salvar a moeda correta no banco de dados tanto no Webhook quanto na importação de histórico.

## Context
Temos duas portas de entrada para dados da Hotmart: o webhook (`src/app/api/webhook/hotmart/route.ts`) e a sincronização do histórico (`src/app/api/sync/hotmart/route.ts` que usa `src/lib/hotmart.ts`). Ambas as rotas usam `upsert` na tabela `sales`. Agora precisamos incluir o `currency` nesse `upsert`.

## Proposed Changes

### src/lib/hotmart.ts
A função `mapHotmartItem` precisa extrair a moeda e a interface `SaleRow` no endpoint precisa incluir a nova propriedade.

<task type="execute" autonomous="true">
<read_first>
- `src/lib/hotmart.ts`
- `src/app/api/sync/hotmart/route.ts`
</read_first>

<action>
1. No arquivo `src/lib/hotmart.ts`:
Na função `mapHotmartItem`, extraia a moeda do campo `currency_code`:
```typescript
const currency = 
  toCleanString(asRecord(purchase.price).currency_code) ??
  toCleanString(asRecord(purchase.full_price).currency_code) ??
  toCleanString(purchase.currency) ??
  'BRL';
```
E adicione `currency` ao objeto retornado dentro de `sale`:
```typescript
return {
  sale: {
    transaction_id: transactionId,
    status,
    price,
    currency,
    created_at: createdAt ?? null,
    product_id,
    product_name,
  },
  utms,
};
```
Você precisará adicionar a propriedade `currency: string;` no retorno (tipo `MappedHotmartSale` ou nas interfaces equivalentes que estiverem no arquivo, se houver tipo explícito para `sale`).

2. No arquivo `src/app/api/sync/hotmart/route.ts`:
Na interface `SaleRow`, adicione `currency: string;`.
Na criação do array `saleRows`, extraia o `currency`:
```typescript
const saleRows: SaleRow[] = mapped.map((m) => ({
  transaction_id: m.sale.transaction_id,
  status: m.sale.status,
  price: m.sale.price,
  currency: m.sale.currency,
  updated_at: updatedAt,
  created_at: m.sale.created_at,
}));
```
</action>

<acceptance_criteria>
- O arquivo `src/lib/hotmart.ts` exporta e extrai corretamente o `currency`.
- O arquivo `src/app/api/sync/hotmart/route.ts` envia a propriedade `currency` no `upsert` do Supabase.
</acceptance_criteria>
</task>

### src/app/api/webhook/hotmart/route.ts
Atualizar o webhook para capturar `currency` do payload e salvar no banco.

<task type="execute" autonomous="true">
<read_first>
- `src/app/api/webhook/hotmart/route.ts`
</read_first>

<action>
Dentro de `POST`, extraia a moeda:
```typescript
const currency = payload.currency || payload.data?.currency || payload.purchase?.price?.currency_code || 'BRL';
```
E adicione ao objeto no `.upsert()` da tabela `sales`:
```typescript
const { error: saleError } = await supabaseServerClient
  .from('sales')
  .upsert({
    transaction_id: transaction,
    status: status || 'UNKNOWN',
    price: Number(price),
    currency: currency,
    updated_at: new Date().toISOString()
  }, { ... });
```
</action>

<acceptance_criteria>
- O arquivo `src/app/api/webhook/hotmart/route.ts` lê a moeda do payload.
- O upsert contém a coluna `currency`.
</acceptance_criteria>
</task>
