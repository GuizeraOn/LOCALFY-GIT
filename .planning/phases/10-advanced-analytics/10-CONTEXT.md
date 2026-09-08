# Phase 10: Advanced Analytics & Funnel - Context

**Gathered:** 2026-09-08
**Status:** Ready for planning
**Source:** PRD Express Path (User Prompt)

<domain>
## Phase Boundary

Expandir o dashboard de métricas atual para englobar visualizações analíticas avançadas (gráficos), cálculo de impostos, saúde do negócio (pagamentos, reembolsos, chargebacks) e funil de conversão integrando tráfego.
</domain>

<decisions>
## Implementation Decisions

### Imposto Total
- Exibir imposto sobre o faturamento, incluindo impostos específicos de plataformas.

### Funil de Conversão (Métricas de Tráfego)
- Cliques no link/anúncio (via Facebook Ads).
- Visualizações de Página / Pageviews (via Pixel ou API do Facebook Ads se disponível, ou omitir se não houver track).
- ICs (Initiate Checkouts).
- Vendas Iniciadas (Total de pedidos gerados, incluindo boletos/pix não pagos).
- Vendas Aprovadas (Pedidos efetivamente pagos).
- CPA (Gasto / Vendas Aprovadas).

### Saúde do Negócio
- Vendas Pendentes (Valor aguardando pagamento).
- Taxa de Aprovação por Método (Cartão, Pix, Boleto).
- Reembolso (Refund): Valor devolvido e Taxa de reembolso (%).
- Chargeback (Contestação): Valor e Taxa.
- Unidades Vendidas.

### Gráficos Analíticos
- Vendas por Produto.
- Vendas por Horário do dia e Dia da Semana.
- Lucro por Hora (para os últimos 31 dias).
- Comparação Acumulativa (Evolução de Faturamento, Investimento, Lucro ao longo do dia).
- Vendas por Tipo de Pagamento.
- Vendas por País.
- Rastreamento UTM (Vendas por source, src, posicionamento).

### the agent's Discretion
- Extração de Pageviews e ICs: Se o app não tem Pixel próprio, usar métricas do Facebook Ads (`outbound_clicks`, `landing_page_views`).
- Schema DB: A tabela `sales` vai precisar de novas colunas: `payment_type` (cartão, pix, boleto), `country`, `src` (track da Hotmart).
- Status de Chargeback e Refund precisarão ser mapeados corretamente do webhook (ex: `CHARGEBACK`, `REFUNDED`).
</decisions>
