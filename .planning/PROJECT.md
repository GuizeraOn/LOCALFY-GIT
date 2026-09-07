# Dashboard de Métricas e Vendas

## What This Is

Um sistema de rastreamento de métricas financeiras e de marketing em tempo real, integrando as vendas da Hotmart via Webhook e os gastos do Facebook Ads via Marketing API. Ele consolida essas informações, calcula métricas de desempenho (como ROAS, ROI, Lucro e CPA) e exibe tudo em um dashboard Next.js focado na experiência do usuário.

## Core Value

Visibilidade em tempo real e de forma consolidada do lucro real e do ROAS, permitindo cruzar vendas da Hotmart (com rastreamento UTM) com os gastos do Facebook Ads.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **WEBHOOK-01**: Receber eventos de vendas (PURCHASE_APPROVED, etc) via webhook da Hotmart.
- [ ] **ADS-01**: Buscar gastos de campanhas via Facebook Marketing API periodicamente.
- [ ] **TRACK-01**: Capturar e processar parâmetros UTM (source, campaign, content) das vendas.
- [ ] **CALC-01**: Calcular métricas financeiras (Faturamento Bruto, Faturamento Líquido, Lucro, ROAS, ROI, CPA, Margem).
- [ ] **DB-01**: Armazenar os eventos, gastos e métricas no banco de dados.
- [ ] **FRONT-01**: Exibir dashboard com cards de métricas e gráficos atualizados (via polling ou websocket).

### Out of Scope

- Integração com outras plataformas de vendas (Kiwify, Eduzz, etc) — Foco inicial 100% na Hotmart.
- Integração com Google Ads/TikTok Ads — Foco inicial apenas no Facebook Ads.
- Gerenciamento de campanhas (criar/pausar anúncios pelo app) — O sistema é de leitura (read-only) para o Facebook Ads, apenas para métricas.

## Context

- O sistema simula tempo real: webhooks trazem vendas imediatamente, e um cron job puxa os dados do Facebook Ads (a cada 5-15 min) para compor as métricas.
- O cálculo das métricas deve seguir fórmulas exatas (ex: Lucro = Faturamento Líquido - Gasto com Anúncios - Despesas Extras).
- Foco em usar ferramentas no free tier inicialmente (Node.js/Python no Render/Railway, Supabase/Firebase, Next.js na Vercel).
- A UI será acelerada por IAs geradoras de frontend (v0.dev, Lovable, Cursor).

## Constraints

- **Tech Stack**: Backend em Node.js ou Python (hospedado no Render ou Railway). Banco de dados no Supabase (Postgres) ou Firebase. Frontend em Next.js (hospedado na Vercel). — Pedido do usuário para minimizar custos.
- **Budget**: Arquitetura 100% gratuita nos free tiers iniciais.
- **Automação**: Utilizar cron jobs nativos, do Vercel ou GitHub Actions para o fetch do Facebook.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + Vercel | Excelente free tier, integração fácil com frontend gerado por IA | — Pending |
| Supabase (Postgres) | Suporte robusto a relacionamentos para UTMs e cálculos complexos (views) e free tier generoso | — Pending |
| Cron Job de 15 min | Limitações de rate limit e free tier para o Facebook Ads API | — Pending |

---
*Last updated: 2026-09-07 after initialization*
## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
