# Requirements: Dashboard de Métricas e Vendas

**Defined:** 2026-09-07
**Core Value:** Visibilidade em tempo real e de forma consolidada do lucro real e do ROAS, permitindo cruzar vendas da Hotmart (com rastreamento UTM) com os gastos do Facebook Ads.

## v1 Requirements

### Integração Hotmart

- [x] **HOT-01**: Criar endpoint de webhook seguro para receber notificações da Hotmart.
- [x] **HOT-02**: Processar eventos de `PURCHASE_APPROVED`, `PURCHASE_REFUNDED`, `PURCHASE_CANCELED`.
- [x] **HOT-03**: Extrair e armazenar parâmetros UTM dos metadados/src da venda na Hotmart.
- [ ] **HOT-04**: Criar endpoint REST para importar vendas passadas do Hotmart (Histórico).

### Integração Facebook Ads

- [x] **FB-01**: Autenticar usando System User Token ou token de longa duração com a Graph API.
- [x] **FB-02**: Buscar gastos de campanhas (insights, spend, clicks, impressions) por `ad_account_id`.
- [x] **FB-03**: Executar sincronização de gastos via cron job (ex: a cada 15 minutos).

### Cálculos Financeiros

- [x] **CALC-01**: Calcular Faturamento Bruto (soma de vendas aprovadas).
- [x] **CALC-02**: Calcular Faturamento Líquido (Bruto - taxas da plataforma/afiliados).
- [x] **CALC-03**: Calcular Lucro (Líquido - Gasto em Ads - Despesas extras).
- [x] **CALC-04**: Calcular ROAS, ROI, CPA e Margem.
- [x] **CALC-05**: Converter vendas em múltiplas moedas para a moeda base do projeto (BRL) usando taxas de câmbio.
- [x] **CALC-06**: Extrair e salvar a comissão real ou descontar `hotmart_fee` do preço bruto para calcular Faturamento Líquido preciso.

### Advanced Analytics (Métricas e Saúde)

- [ ] **MET-01**: Adicionar cards de Funil de Conversão (Cliques, Vendas Iniciadas, Vendas Aprovadas, CPA).
- [ ] **MET-02**: Adicionar cards de Saúde do Negócio (Vendas Pendentes, Taxa de Aprovação por Método, Refunds, Chargebacks, Unidades).
- [ ] **MET-03**: Salvar e mapear tipo de pagamento (Pix, Cartão, Boleto) e país da venda no banco.

### Gráficos Analíticos

- [ ] **CHART-01**: Visualizações de Tempo (Faturamento por Dia/Hora, Lucro por Hora, Comparativo Acumulado).
- [ ] **CHART-02**: Visualizações de Quebra (Por Produto, País, Tipo de Pagamento, UTMs).

### Banco de Dados

- [x] **DB-01**: Definir schema para armazenar eventos de vendas.
- [x] **DB-02**: Definir schema para armazenar logs e histórico de gastos por campanha/conta de anúncios.
- [x] **DB-03**: Consolidar dados relacionais para consultas analíticas rápidas.

### Frontend Dashboard & UI

- [x] **UI-01**: Criar tela principal (Dashboard) para exibir Faturamento, Lucro, ROAS e CPA geral.
- [x] **UI-02**: Exibir tabela de desempenho com detalhamento por Campanha.
- [x] **UI-03**: Interface com botão "Atualizar Agora" que dispara a busca no Facebook e recarrega os dados.
- [x] **UI-04**: Adicionar Date Range Picker avançado (tipo Facebook).
- [ ] **UI-05**: Adicionar filtro de produto ao dashboard.

## v2 Requirements

### Analytics Avançado

- **ANL-01**: Agrupamento avançado de UTMs e atribuição de multi-touch.
- **ANL-02**: Alertas via Telegram/WhatsApp de ROAS negativo.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Gestão de anúncios | O sistema é de leitura apenas. Nenhuma alteração nas campanhas pelo dashboard. |
| Integração Kiwify/Google Ads | Restrito à Hotmart e Facebook Ads na v1 para manter a simplicidade e foco na proposta principal. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| HOT-01 | Phase 1 | Complete |
| HOT-02 | Phase 1 | Complete |
| HOT-03 | Phase 1 | Complete |
| DB-01 | Phase 1 | Complete |
| DB-02 | Phase 1 | Complete |
| DB-03 | Phase 1 | Complete |
| FB-01 | Phase 2 | Complete |
| FB-02 | Phase 2 | Complete |
| FB-03 | Phase 2 | Complete |
| CALC-01 | Phase 3 | Complete |
| CALC-02 | Phase 3 | Complete |
| CALC-03 | Phase 3 | Complete |
| CALC-04 | Phase 3 | Complete |
| UI-01 | Phase 4 | Complete |
| UI-02 | Phase 4 | Complete |
| UI-03 | Phase 4 | Complete |
| UI-04 | Phase 5 | Complete |
| HOT-04 | Phase 6 | Pending |
| UI-05 | Phase 7 | Pending |
| CALC-05 | Phase 8 | Complete |
| CALC-06 | Phase 9 | Complete |
| MET-01 | Phase 10 | Pending |
| MET-02 | Phase 10 | Pending |
| MET-03 | Phase 10 | Pending |
| CHART-01 | Phase 10 | Pending |
| CHART-02 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0 ✓

---
*Requirements defined: 2026-09-07*
*Last updated: 2026-09-07 after initial definition*
