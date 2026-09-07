# Phase 1: Setup & Hotmart Webhooks - Context

**Gathered:** 2026-09-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Configuração da infraestrutura de webhooks para receber e processar eventos da Hotmart e persistir no banco de dados de forma confiável (Supabase).

</domain>

<decisions>
## Implementation Decisions

### Modelagem (UTMs)
- **D-01:** Salvar parâmetros UTM em uma tabela separada (ex: `sale_utms`) referenciando a tabela de vendas. Isso manterá o banco mais organizado e facilitará cruzamentos analíticos com gastos.
- **D-02:** O campo `utm_campaign` contém o NOME da campanha (para futuro matching com a API do Facebook Ads na Fase 3).

### Idempotência
- **D-03:** O `transaction_id` da Hotmart será usado como identificador único (Primary Key ou Unique constraint).
- **D-04:** Requisições repetidas devem fazer "upsert" (atualizar o registro). Isso é fundamental para lidar com transições de status (ex: de APPROVED para REFUNDED).

### the agent's Discretion
- Detalhes específicos de autenticação e validação do webhook (ex: checar `htoken` no header).
- Estrutura exata das colunas das tabelas, desde que cumpra D-01 e D-02.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- (Greenfield project - none yet)

### Established Patterns
- (Greenfield project - none yet)

### Integration Points
- (Greenfield project - the endpoint `/webhook/hotmart` bi-directionally communicates with Supabase)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 1-Setup & Hotmart Webhooks*
*Context gathered: 2026-09-07*
