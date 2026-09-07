# Phase 3: Core Metrics Engine - Context

**Gathered:** 2026-09-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Processamento de eventos de vendas (Hotmart) e gastos (Facebook Ads) para calcular as métricas analíticas (Faturamento Bruto/Líquido, Lucro, ROAS, ROI, CPA, Margem), agregando dados de despesas extras manuais.

</domain>

<decisions>
## Implementation Decisions

### Taxas da Plataforma (Faturamento Líquido)
- **D-01:** As taxas da Hotmart não serão extraídas diretamente do payload. O banco armazenará o Faturamento Bruto e a engine abaterá uma porcentagem fixa aproximada (ex: 10% - a ser configurado/definido) na hora de calcular as métricas para chegar ao Faturamento Líquido.

### Despesas Extras (Cálculo de Lucro)
- **D-02 (Scope Update):** Para abater os custos e calcular o lucro, será utilizada uma tabela/registro de custos manuais (adicionados futuramente via tela no dashboard na Phase 4). A engine de métricas desta fase deve consultar essa tabela/entidade `expenses` (que deverá ser criada) para agregar aos cálculos de Lucro Líquido Global.

### Atribuição UTM x Campanha
- **D-03:** Vendas sem UTM rastreável serão contabilizadas normalmente para os totais de Faturamento e Lucro **Global**. No entanto, ao detalhar as métricas quebradas por campanha (ROAS/CPA por campanha), essas vendas orgânicas/desconhecidas serão **ignoradas** e não aparecerão na listagem/tabela detalhada.

### the agent's Discretion
- A estrutura exata da tabela `expenses` (ex: `id, description, amount, date`).
- A organização do código de cálculo (pode ser functions no banco via RPC, Views no Supabase, ou lógica no backend Node.js). Sugere-se SQL Views ou funções backend consolidadas.
- O valor padrão inicial da taxa da Hotmart se não configurado.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Tabelas `sales`, `sale_utms`, e `ad_spend` previamente criadas nas fases 1 e 2.
- Conexão do Supabase configurada no backend.

### Established Patterns
- As integrações e consultas estão sendo feitas no App Router (ex: `src/app/api`).

### Integration Points
- A engine deve consolidar os dados destas três tabelas (e da futura tabela `expenses`).
- Preparar a API (ex: `src/app/api/metrics/route.ts` ou funções utilitárias) para ser consumida pelo frontend na Phase 4.

</code_context>

<specifics>
## Specific Ideas

- Faturamento Bruto = Soma de `sales.price` onde `status = 'APPROVED'`.
- Faturamento Líquido = Bruto * (1 - taxa_plataforma).
- Gasto Ads = Soma de `ad_spend.spend`.
- Lucro Real = Faturamento Líquido - Gasto Ads - Soma de `expenses.amount`.

</specifics>

<deferred>
## Deferred Ideas

None

</deferred>

---

*Phase: 3-Core Metrics Engine*
*Context gathered: 2026-09-07*
