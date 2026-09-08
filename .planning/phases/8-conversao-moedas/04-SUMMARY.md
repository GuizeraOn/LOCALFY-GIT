---
phase: 8
tags:
  - sql
  - api
  - metrics
  - hotmart
requirements-completed:
  - CALC-05
duration: 5 min
completed: 2026-09-07T23:38:00Z
---

# Phase 8 Summary: Conversão de Moedas

## O que foi feito
1. **Migration 0003**: Criado o SQL para adicionar a coluna `currency` na tabela `sales`.
2. **Sincronização Histórica e Webhooks**: Atualizamos o extrator do webhook e a função `mapHotmartItem` para pegar a `currency_code` (ou equivalente) da transação e gravar na base, fazendo fallback para `BRL` se não vier.
3. **Conversão Dinâmica**: Alteramos a rota `GET /api/metrics` para bater na API `https://open.er-api.com/v6/latest/BRL` que fornece taxas de câmbio gratuitas atualizadas em relação ao BRL.
4. **Cálculos Reais**: Atualizamos a lógica interna em `calculateMetrics` para cruzar a moeda de cada venda com a cotação do dia, somando tudo no faturamento bruto e lucro em valor real (BRL), não mais valores astronômicos nominais (ex: CLP).

## Verificação
- A compilação Typescript (`npx tsc`) passou sem erros.
- A API pública de câmbio foi testada com sucesso e a conversão matemática está correta (`BRL = Price / ExchangeRate`).

## Self-Check: PASSED
