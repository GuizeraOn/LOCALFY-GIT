---
phase: 10
plan: 02
subsystem: Backend Sincronização
tags:
  - typescript
  - api
affects:
  - src/lib/hotmart.ts
  - src/app/api/webhook/hotmart/route.ts
  - src/app/api/sync/hotmart/route.ts
---

# Phase 10: Extração de Dados Analíticos

## Goal
Extrair `payment_type`, `country` e `hsrc` da Hotmart e atualizar os webhooks de estorno e chargeback.

## Proposed Changes

### src/lib/hotmart.ts
<task type="execute" autonomous="true">
<read_first>
- `src/lib/hotmart.ts`
</read_first>

<action>
1. Em `HotmartSaleRow`, adicione `payment_type: string | null`, `country: string | null`, `hsrc: string | null`.
2. Em `mapHotmartItem`, extraia:
```typescript
const payment_type = toCleanString(purchase.payment_type) ?? toCleanString(purchase.payment_method?.type) ?? null;
const country = toCleanString(purchase.buyer?.country?.iso) ?? toCleanString(purchase.country) ?? null;
const hsrc = toCleanString(purchase.sck) ?? toCleanString(purchase.src) ?? toCleanString(record.src) ?? null;
```
3. Adicione no objeto retornado `sale: { ..., payment_type, country, hsrc }`.
</action>
<acceptance_criteria>
- `hotmart.ts` exporta as novas propriedades.
</acceptance_criteria>
</task>

### src/app/api/sync/hotmart/route.ts
<task type="execute" autonomous="true">
<read_first>
- `src/app/api/sync/hotmart/route.ts`
</read_first>

<action>
Em `SaleRow`, adicione as colunas, e no map `saleRows`, repasse `payment_type`, `country`, `hsrc`.
</action>
<acceptance_criteria>
- O upsert do history repassa as novas colunas.
</acceptance_criteria>
</task>

### src/app/api/webhook/hotmart/route.ts
<task type="execute" autonomous="true">
<read_first>
- `src/app/api/webhook/hotmart/route.ts`
</read_first>

<action>
No POST, extraia:
```typescript
const payment_type = payload.payment_type || payload.data?.payment?.type || null;
const country = payload.buyer_country || payload.data?.buyer?.country || null;
const hsrc = payload.sck || payload.src || payload.data?.purchase?.src || null;
```
E adicione no upsert do Supabase na tabela `sales`.
Observação: A Hotmart envia eventos como `CHARGEBACK`, `REFUNDED`, `CANCELED`. Como o upsert usa `onConflict: 'transaction_id'`, esses eventos irão atualizar o `status` da venda existente automaticamente, o que é perfeito para nossas métricas.
</action>
<acceptance_criteria>
- Webhook repassa novas colunas no upsert.
</acceptance_criteria>
</task>

### src/app/api/sync/facebook/route.ts
<task type="execute" autonomous="true">
<read_first>
- `src/app/api/sync/facebook/route.ts`
</read_first>

<action>
1. Atualize a URL do Graph API para incluir o campo `actions`:
```typescript
const fbUrl = `https://graph.facebook.com/v19.0/act_${FB_AD_ACCOUNT_ID}/insights?time_range={'since':'${startDate}','until':'${endDate}'}&level=campaign&fields=campaign_id,campaign_name,spend,impressions,clicks,actions&time_increment=1&access_token=${FB_ACCESS_TOKEN}`;
```
2. No loop de `insights`, extraia `landing_page_view` e `checkouts_initiated` (ou `onsite_conversion.messaging_first_reply` caso use lead, mas para vendas é `offsite_conversion.fb_pixel_initiate_checkout` ou só `checkouts_initiated` dependendo da action_type do array de actions). Exemplo de extração genérica:
```typescript
let pageviews = 0;
let initiate_checkouts = 0;
if (Array.isArray(item.actions)) {
  item.actions.forEach((a: any) => {
    if (a.action_type === 'landing_page_view') pageviews += Number(a.value || 0);
    if (a.action_type === 'offsite_conversion.fb_pixel_initiate_checkout' || a.action_type === 'checkouts_initiated') initiate_checkouts += Number(a.value || 0);
  });
}
```
3. Adicione as duas variáveis no `.upsert` de `ad_spend`.
</action>
<acceptance_criteria>
- A API do FB busca a propriedade `actions`.
- Extrai e salva pageviews e ICs no banco.
</acceptance_criteria>
</task>
