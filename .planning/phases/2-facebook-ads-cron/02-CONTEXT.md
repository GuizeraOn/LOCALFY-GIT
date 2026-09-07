# Phase 2: Facebook Ads & Cron - Context

**Gathered:** 2026-09-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Recuperação de custos e métricas de anúncios da API do Facebook Ads e persistência na tabela `ad_spend`. A lógica foi adaptada de um cron job em background para uma atualização sob demanda guiada pela navegação do usuário.

</domain>

<decisions>
## Implementation Decisions

### Infraestrutura de Atualização
- **D-01 (Mudança de arquitetura):** Não haverá um cron job rodando em background (descarta FB-03 como job assíncrono). A atualização será feita sob demanda (On-Demand) quando o usuário entrar na interface do dashboard ou disparar a ação.

### Janela de Busca
- **D-02:** A janela de datas que será buscada na API do Facebook será definida dinamicamente pelo filtro de datas selecionado na UI do dashboard. O endpoint de sync deverá receber esse período (Data Inicial e Data Final).

### Agrupamento e Idempotência
- **D-03:** Os dados retornados do Facebook devem ser persistidos no Supabase na tabela `ad_spend`.
- **D-04:** A inserção deve ser idempotente (UPSERT), utilizando a combinação de `date` e `campaign_id` como chave única. (O planner precisará garantir que a constraint correspondente exista no banco de dados).

### the agent's Discretion
- Autenticação e armazenamento do token de longa duração do Facebook Ads (System User Token).
- Estrutura exata da API Next.js que fará o trigger da sincronização.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Cliente do Supabase em `src/lib/supabase-server.ts`.

### Established Patterns
- Padrão de uso de UPSERT para garantir idempotência, já aplicado na Phase 1.

### Integration Points
- API Route a ser criada para orquestrar a chamada ao Facebook e o UPSERT no Supabase.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None

</deferred>

---

*Phase: 2-Facebook Ads & Cron*
*Context gathered: 2026-09-07*
