# Phase 1: Setup & Hotmart Webhooks - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-07
**Phase:** 1-Setup & Hotmart Webhooks
**Areas discussed:** Modelagem (UTMs), Idempotência

---

## Modelagem (UTMs)

### Formato de Armazenamento
| Option | Description | Selected |
|--------|-------------|----------|
| Colunas na tabela de vendas (mais simples) | Salvar os UTMs diretamente como colunas na tabela de vendas | |
| Tabela separada (mais organizado) | Criar uma tabela própria (ex: `sale_utms`) referenciando a tabela de vendas | ✓ |

**User's choice:** Tabela separada (mais organizado)

### Conteúdo do utm_campaign
| Option | Description | Selected |
|--------|-------------|----------|
| Envio o ID da campanha no utm_campaign | Apenas o ID | |
| Envio o NOME da campanha no utm_campaign | Apenas o Nome | ✓ |
| Envio ambos (ex: ID no utm_id e nome no utm_campaign) | Ambos os valores | |

**User's choice:** Envio o NOME da campanha no utm_campaign

---

## Idempotência

### Requisições Duplicadas
| Option | Description | Selected |
|--------|-------------|----------|
| Ignorar e retornar 200 | Silenciosamente não fazer nada | |
| Atualizar o registro | Útil se o status mudar, ex: APPROVED para REFUNDED | ✓ |

**User's choice:** Atualizar o registro (útil se o status mudar, ex: APPROVED para REFUNDED)

---

## the agent's Discretion

- Detalhes de infraestrutura da tabela (tipos, schemas).
- Autenticação e segurança do endpoint.

## Deferred Ideas

(None)
