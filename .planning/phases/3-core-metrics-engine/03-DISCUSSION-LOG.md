# Phase 3: Core Metrics Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-07
**Phase:** 3-Core Metrics Engine
**Areas discussed:** Taxas da Plataforma (Faturamento Líquido), Despesas Extras (Cálculo de Lucro), Atribuição UTM x Campanha

---

## Taxas da Plataforma (Faturamento Líquido)

| Option | Description | Selected |
|--------|-------------|----------|
| Pegar do Webhook | A Hotmart envia a comissão exata, salvamos no Faturamento Líquido real direto. | |
| Porcentagem Fixa | O banco guarda só o Bruto, e o código abate uma % aproximada (ex: 10%) sempre que for calcular. | ✓ |

**User's choice:** Porcentagem Fixa: O banco guarda só o Bruto, e o código abate uma % aproximada (ex: 10%) sempre que for calcular as métricas.

---

## Despesas Extras (Cálculo de Lucro)

| Option | Description | Selected |
|--------|-------------|----------|
| Variável/Configuração (Imposto % + Fixo) | Definimos no .env ou tabela uma % de imposto e um custo fixo. | |
| Não incluir na v1 | O Lucro será apenas o Faturamento Líquido menos os Gastos em Ads. | |
| Tela de Input (Na UI) | O dashboard terá uma página separada para você lançar custos manualmente. | ✓ |

**User's choice:** Tela de Input (Na UI): O dashboard terá uma página separada para você lançar custos manualmente (adiciona complexidade na v1).

---

## Atribuição UTM x Campanha

| Option | Description | Selected |
|--------|-------------|----------|
| Agrupar em "Orgânico / Desconhecido" | Vendas sem UTM aparecem numa linha separada com custo R$ 0,00. | |
| Ignorar nos Cálculos por Campanha | Elas contam para o Faturamento Global, mas não aparecem na quebra por campanha. | ✓ |

**User's choice:** Ignorar nos Cálculos por Campanha: Elas contam para o Faturamento Global, mas não aparecem na quebra por campanha.

---

## the agent's Discretion

- Estrutura da tabela `expenses` a ser criada.
- Arquitetura de consolidação de dados (SQL views, RPCs ou lógica na API em Node.js).
- Valor padrão para a taxa da Hotmart (ex: 10%).

## Deferred Ideas

(None)
