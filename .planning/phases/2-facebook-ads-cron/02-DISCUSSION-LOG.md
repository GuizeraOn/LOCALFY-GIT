# Phase 2: Facebook Ads & Cron - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-07
**Phase:** 2-Facebook Ads & Cron
**Areas discussed:** Infraestrutura do Cron, Janela de busca, Agrupamento / Idempotência

---

## Infraestrutura do Cron

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Actions | Um workflow roda a cada 15 min | |
| Vercel Cron | Roda apenas 1 vez por dia no plano grátis | |
| On Demand | Atualizar apenas quando entrar na interface | ✓ |

**User's choice:** "Na verdade nem precisa rodar a ccada 15m , so preccisa atualizar quando eu entrar na interface, nao preccisa atualizar eunqunato eu nao estiver vendo"

---

## Janela de busca (Time Window)

| Option | Description | Selected |
|--------|-------------|----------|
| Últimos 3 dias ou 7 dias | Valor fixo na API a cada visita | |
| Apenas "Hoje" | Valor fixo na API a cada visita | |
| Selecionável na UI | O dashboard terá um filtro de datas, e a API vai buscar no Facebook exatamente o período selecionado | ✓ |

**User's choice:** Selecionável na UI: O dashboard terá um filtro de datas, e a API vai buscar no Facebook exatamente o período que você selecionar na tela.

---

## Agrupamento / Idempotência

| Option | Description | Selected |
|--------|-------------|----------|
| Salvar no banco com UPSERT | Atualiza a tabela ad_spend usando date + campaign_id como chave | ✓ |
| Não salvar no banco | Apenas cruzar em memória na hora de exibir | |

**User's choice:** (Recommended) Salvar no banco com UPSERT

---

## the agent's Discretion

- Detalhes de autenticação do Facebook Graph API.
- Assinatura e rota específica no Next.js.

## Deferred Ideas

(None)
