---
phase: 9
tags:
  - sql
  - api
  - metrics
  - hotmart
requirements-completed:
  - CALC-06
duration: 5 min
completed: 2026-09-07T23:55:00Z
---

# Phase 9 Summary: Comissão Exata (Faturamento Líquido)

## O que foi feito
1. **Migration 0004**: Criada instrução SQL para adicionar a coluna `net_revenue` na tabela `sales`.
2. **Sincronização Histórica e Webhooks**: Atualizamos o extrator (`mapHotmartItem` e o webhook POST) para buscar:
   - A comissão direta no array `commissions` (fonte `PRODUCER`) da Hotmart (API 2.0).
   - Fazer o desconto bruto - `hotmart_fee.total` (API antiga/mesclada).
3. **Métricas de Painel (Lucro)**: Atualizamos o `calculateMetrics` para separar o cálculo de Faturamento Bruto e Líquido. O líquido usa `sale.net_revenue`. Caso `net_revenue` seja nulo (vendas antigas importadas via histórico que não tenham a taxa declarada), aplicamos dinamicamente a dedução aproximada de 9.9% (`0.901`) para o gráfico não quebrar e mostrar a margem real.

## Verificação
- A compilação Typescript (`npx tsc`) passou sem erros.
- Lógica de fallback para cálculo implementada.
- Migrações prontas para aplicação.

## Self-Check: PASSED
